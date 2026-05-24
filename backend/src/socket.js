const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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

  const existingCollector = await Collector.findOne({
    $or: [{ userId: user.sub }, { email: user.email }, { phone: user.phone }],
  });

  if (existingCollector) {
    return existingCollector;
  }

  return Collector.create({
    userId: user.sub,
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
      socket.join(`collector:${user.sub}`);
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
