const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
const PickupRequest = require('./models/PickupRequest');
const Collector = require('./models/Collector');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret';

function getSocketUser(socket) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer /, '');

    if (!token) {
      return null;
    }

    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

async function getCollectorForSocketUser(user) {
  if (!user || user.role !== 'collector') {
    return null;
  }

  const userIdFilter = Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : user.sub;

  const existingCollector = await Collector.findOne({
    $or: [{ userId: userIdFilter }, { email: user.email }, { phone: user.phone }],
  });

  if (existingCollector) {
    return existingCollector;
  }

  return Collector.create({
    userId: userIdFilter,
    name: user.name || 'Collector',
    company: user.company || null,
    email: user.email,
    phone: user.phone,
    passwordHash: null,
    location: { lat: null, lng: null },
    rating: 5.0,
    isAvailable: true,
    createdAt: new Date(),
  });
}

module.exports = function registerSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const user = getSocketUser(socket);

    if (user?.sub) {
      socket.join(`user:${user.sub}`);
    }

    if (user?.role === 'collector') {
      socket.join('collectors');

      void (async () => {
        try {
          const collector = await getCollectorForSocketUser(user);
          if (collector?._id) {
            socket.join(`collector:${collector._id.toString()}`);
          }
        } catch (error) {
          console.warn('[socket] unable to join collector room', error?.message || error);
        }
      })();
    }

    socket.on('pickup_location_update', async (payload) => {
      try {
        if (!user?.sub || user?.role !== 'collector') {
          return;
        }

        const requestId = payload?.requestId;
        const latitude = Number(payload?.latitude);
        const longitude = Number(payload?.longitude);

        if (!requestId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return;
        }

        const collector = await getCollectorForSocketUser(user);
        if (collector) {
          collector.location = { lat: latitude, lng: longitude };
          await collector.save();
        }

        const request = await PickupRequest.findById(requestId);
        if (!request || request.status !== 'accepted') {
          return;
        }
        if (!collector || request.collectorId?.toString() !== collector._id.toString()) {
          return;
        }

        request.collectorLocation = {
          latitude,
          longitude,
          updatedAt: new Date(),
        };
        await request.save();
        await request.populate('collectorId', 'name phone company rating location');

        let serverRoute = null;
        if (request.location && request.collectorLocation) {
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${request.collectorLocation.longitude},${request.collectorLocation.latitude};${request.location.lng},${request.location.lat}?overview=full&geometries=geojson`;
            const resp = await fetch(url);
            const data = await resp.json();
            const route = data?.routes?.[0] || null;

            if (route && Array.isArray(route.geometry?.coordinates) && route.geometry.coordinates.length > 0) {
              serverRoute = {
                coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
                duration: route.duration,
              };
            }
          } catch (err) {
            console.warn('[osrm] live route compute failed', err?.message || err);
          }
        }

        io.to(`user:${request.userId.toString()}`).emit('pickup_location_updated', {
          requestId: request._id.toString(),
          collectorLocation: request.collectorLocation,
          status: request.status,
          collectorLocationSource: 'live',
          collector: request.collectorId ? {
            id: request.collectorId._id.toString(),
            name: request.collectorId.name,
            phone: request.collectorId.phone,
            company: request.collectorId.company || 'EcoSathi Collector Team',
            rating: request.collectorId.rating,
            location: {
              latitude: request.collectorLocation.latitude,
              longitude: request.collectorLocation.longitude,
            },
          } : null,
          route: serverRoute?.coordinates || null,
          routeDuration: serverRoute?.duration || null,
        });
      } catch (error) {
        console.warn('[socket] pickup_location_update failed:', error?.message || error);
      }
    });

    socket.on('disconnect', () => {
      socket.removeAllListeners();
    });
  });

  return io;
};
