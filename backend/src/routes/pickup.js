const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const PickupRequest = require('../models/PickupRequest');
const Collector = require('../models/Collector');
const requireAuth = require('../middleware/auth');
const { getScrapPriceForCategory } = require('../utils/scrapPricing');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'pickups');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }

    cb(null, true);
  },
});

async function computeOsrmRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    const data = await resp.json();
    const route = data?.routes?.[0] || null;

    if (!route || !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length === 0) {
      return null;
    }

    const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    return { coordinates, duration: route.duration };
  } catch (error) {
    console.warn('[osrm] route compute failed', error?.message || error);
    return null;
  }
}

function requireRole(roleToCheck) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !roleToCheck.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

function isValidScrapType(scrapType) {
  return scrapType && typeof scrapType.category === 'string' && typeof scrapType.icon === 'string';
}

function normalizeScrapTypes(scrapTypes) {
  return Array.isArray(scrapTypes) ? scrapTypes.filter(isValidScrapType) : [];
}

function buildImageUrl(req, relativePath) {
  const host = req.get('host');

  if (!host) {
    return relativePath;
  }

  const protocol = req.secure ? 'https' : 'http';
  return `${protocol}://${host}${relativePath}`;
}

async function userHasActivePickup(userId) {
  return Boolean(await PickupRequest.exists({
    userId,
    status: { $in: ['pending', 'accepted'] },
  }));
}

async function getCollectorForUser(user) {
  if (!user || user.role !== 'collector') {
    return null;
  }

  const existingCollector = await Collector.findOne({
    $or: [{ userId: user._id }, { email: user.email }, { phone: user.phone }],
  });

  if (existingCollector) {
    return existingCollector;
  }

  return Collector.create({
    userId: user._id,
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

function buildOfferEstimate(pickup) {
  const weight = pickup?.estimatedWeight?.value;

  if (!Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  const rates = (pickup.scrapTypes || [])
    .map((item) => getScrapPriceForCategory(item.category)?.rate)
    .filter((rate) => Number.isFinite(rate) && rate > 0);

  if (rates.length === 0) {
    return null;
  }

  const averageRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

  return {
    amount: Math.round(averageRate * weight),
    ratePerKg: Math.round(averageRate),
    currency: 'NPR',
  };
}

function calculateKhaltiAmount(weightInput, weightUnit) {
  const parsedWeight = Number(weightInput);

  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
    return null;
  }

  const weightInKg = weightUnit === 'gram' ? parsedWeight / 1000 : parsedWeight;
  const finalAmount = Math.round(weightInKg * 20);

  return {
    weightInKg,
    finalAmount,
    finalAmountPaisa: finalAmount * 100,
  };
}

function serializePickup(pickup) {
  const plain = typeof pickup?.toObject === 'function' ? pickup.toObject() : pickup;
  const userDoc = plain.userId && typeof plain.userId === 'object' ? plain.userId : null;
  const collectorDoc = plain.collectorId && typeof plain.collectorId === 'object' ? plain.collectorId : null;
  const collectorLocation = plain.collectorLocation || (collectorDoc?.location ? {
    latitude: collectorDoc.location.lat,
    longitude: collectorDoc.location.lng,
    updatedAt: plain.collectorLocation?.updatedAt || null,
  } : null);

  return {
    ...plain,
    _id: plain._id?.toString?.() || plain._id,
    userId: userDoc?._id?.toString?.() || plain.userId?.toString?.() || plain.userId,
    userName: userDoc?.name || plain.userName || null,
    userPhone: userDoc?.phone || plain.userPhone || null,
    collectorId: collectorDoc?._id?.toString?.() || plain.collectorId?.toString?.() || plain.collectorId || null,
    collector: collectorDoc ? {
      id: collectorDoc._id?.toString?.() || collectorDoc._id || null,
      name: collectorDoc.name || null,
      phone: collectorDoc.phone || null,
      company: collectorDoc.company || 'EcoSathi Collector Team',
      rating: collectorDoc.rating ?? 5,
      location: collectorLocation || (collectorDoc.location ? {
        latitude: collectorDoc.location.lat,
        longitude: collectorDoc.location.lng,
      } : null),
    } : null,
    collectorName: collectorDoc?.name || plain.collectorName || null,
    collectorPhone: collectorDoc?.phone || plain.collectorPhone || null,
    collectorCompany: collectorDoc?.company || plain.collectorCompany || 'EcoSathi Collector Team',
    collectorLocation,
    weight: plain.weight ?? null,
    finalAmount: plain.finalAmount ?? null,
    finalAmountPaisa: plain.finalAmountPaisa ?? null,
    paymentMethod: plain.paymentMethod ?? null,
    paymentStatus: plain.paymentStatus ?? 'pending',
    offer: buildOfferEstimate(plain),
  };
}

function emitPickupUpdate(io, pickup) {
  if (!io || !pickup) {
    return;
  }

  const payload = serializePickup(pickup);

  io.to('collectors').emit('pickup_status_changed', payload);

  if (payload.userId) {
    io.to(`user:${payload.userId}`).emit('pickup_status_changed', payload);
  }
}

router.post('/upload-image', requireAuth, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || 'Unable to upload image' });
    }

    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'image is required' });
    }

    const relativePath = `/uploads/pickups/${req.file.filename}`;

    return res.status(201).json({
      imageUrl: buildImageUrl(req, relativePath),
      imagePath: relativePath,
    });
  } catch (error) {
    console.error('Error uploading pickup image:', error);
    return res.status(500).json({ message: 'Unable to upload image' });
  }
});

router.post('/create', requireAuth, async (req, res) => {
  try {
    const { scrapTypes, location, phone, estimatedWeight, note, imageUrl } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' });
    }

    if (!Array.isArray(scrapTypes) || scrapTypes.length === 0) {
      return res.status(400).json({ message: 'scrapTypes is required' });
    }

    const normalizedScrapTypes = normalizeScrapTypes(scrapTypes);

    if (normalizedScrapTypes.length === 0) {
      return res.status(400).json({ message: 'scrapTypes must include at least one valid item' });
    }

    if (!location || typeof location.address !== 'string' || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ message: 'location is required with address, lat and lng' });
    }

    if (typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ message: 'phone is required' });
    }

    if (!estimatedWeight || typeof estimatedWeight.value !== 'number' || Number.isNaN(estimatedWeight.value) || estimatedWeight.value <= 0) {
      return res.status(400).json({ message: 'estimatedWeight is required with a positive value' });
    }

    if (await userHasActivePickup(req.user._id)) {
      return res.status(409).json({ message: 'You already have an active pickup request. Please finish it before placing another order.' });
    }

    const pickup = await PickupRequest.create({
      userId: req.user._id,
      collectorId: null,
      imageUrl,
      scrapTypes: normalizedScrapTypes,
      location,
      phone: phone.trim(),
      estimatedWeight: {
        value: estimatedWeight.value,
        unit: typeof estimatedWeight.unit === 'string' && estimatedWeight.unit.trim().length > 0 ? estimatedWeight.unit : 'kg',
      },
      note: note || '',
      status: 'pending',
      createdAt: new Date(),
    });

    await pickup.populate('userId', 'name phone');

    const io = req.app.get('io');

    if (io) {
      io.to('collectors').emit('pickup_created', serializePickup(pickup));
    }

    return res.status(201).json({ pickup: serializePickup(pickup) });
  } catch (error) {
    console.error('Error creating pickup:', error);
    return res.status(500).json({ message: 'Unable to create pickup request' });
  }
});

router.get('/my-pickups', requireAuth, async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ userId: req.user._id })
      .populate('userId', 'name phone')
      .populate('collectorId', 'name phone company rating location')
      .sort({ createdAt: -1 });

    return res.json({ pickups: pickups.map(serializePickup) });
  } catch (error) {
    console.error('Error fetching pickups:', error);
    return res.status(500).json({ message: 'Unable to fetch pickups' });
  }
});

router.get('/pending-nearby', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ status: 'pending' })
      .populate('userId', 'name phone')
      .populate('collectorId', 'name phone company rating location')
      .sort({ createdAt: -1 });

    return res.json({ pickups: pickups.map(serializePickup) });
  } catch (error) {
    console.error('Error fetching pending pickups:', error);
    return res.status(500).json({ message: 'Unable to fetch pending pickups' });
  }
});

router.post('/accept/:requestId', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Pickup request is no longer pending' });
    }

    const collector = await getCollectorForUser(req.user);

    if (!collector) {
      return res.status(404).json({ message: 'Collector profile not found' });
    }

    if (!request.collectorLocation && Number.isFinite(collector.location?.lat) && Number.isFinite(collector.location?.lng)) {
      request.collectorLocation = {
        latitude: collector.location.lat,
        longitude: collector.location.lng,
        updatedAt: new Date(),
      };
    }

    request.collectorId = collector._id;
    request.status = 'accepted';
    await request.save();
    await request.populate('collectorId', 'name phone company rating location');
    await request.populate('userId', 'name phone');

    const io = req.app.get('io');

    if (io) {
      emitPickupUpdate(io, request);

      let serverRoute = null;
      if (request.collectorLocation && request.location) {
        serverRoute = await computeOsrmRoute(request.collectorLocation.latitude, request.collectorLocation.longitude, request.location.lat, request.location.lng);
      }

      io.to(`user:${request.userId.toString()}`).emit('pickup_accepted', {
        requestId: request._id.toString(),
        status: request.status,
        collectorId: request.collectorId.toString(),
        collectorLocation: request.collectorLocation ? {
          latitude: request.collectorLocation.latitude,
          longitude: request.collectorLocation.longitude,
          updatedAt: request.collectorLocation.updatedAt,
        } : request.collectorId?.location ? {
          latitude: request.collectorId.location.lat,
          longitude: request.collectorId.location.lng,
          updatedAt: null,
        } : null,
        collector: request.collectorId ? {
          id: request.collectorId._id.toString(),
          name: request.collectorId.name,
          phone: request.collectorId.phone,
          company: request.collectorId.company || 'EcoSathi Collector Team',
          rating: request.collectorId.rating,
          location: request.collectorLocation ? {
            latitude: request.collectorLocation.latitude,
            longitude: request.collectorLocation.longitude,
          } : request.collectorId.location ? {
            latitude: request.collectorId.location.lat,
            longitude: request.collectorId.location.lng,
          } : null,
        } : null,
        route: serverRoute?.coordinates || null,
        routeDuration: serverRoute?.duration || null,
      });
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error accepting pickup:', error);
    return res.status(500).json({ message: 'Unable to accept pickup request' });
  }
});

router.post('/decline/:requestId', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Pickup request is no longer pending' });
    }

    request.status = 'declined';
    await request.save();
    await request.populate('userId', 'name phone');

    const io = req.app.get('io');

    if (io) {
      emitPickupUpdate(io, request);
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error declining pickup:', error);
    return res.status(500).json({ message: 'Unable to decline pickup request' });
  }
});

router.post('/arrived/:requestId', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Pickup request must be accepted before it can be marked arrived' });
    }

    request.status = 'arrived';
    await request.save();
    await request.populate('userId', 'name phone khaltiNumber');
    await request.populate('collectorId', 'name phone company rating location');

    const io = req.app.get('io');

    if (io) {
      emitPickupUpdate(io, request);
      io.to(`user:${request.userId.toString()}`).emit('collector_arrived', {
        requestId: request._id.toString(),
        status: request.status,
      });
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error marking pickup arrived:', error);
    return res.status(500).json({ message: 'Unable to mark pickup as arrived' });
  }
});

router.post('/set-weight/:requestId', requireAuth, async (req, res) => {
  try {
    const { weight, weightUnit } = req.body || {};
    const payment = calculateKhaltiAmount(weight, weightUnit);

    if (!payment) {
      return res.status(400).json({ message: 'weight and weightUnit are required' });
    }

    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own pickup weight' });
    }

    if (!['accepted', 'arrived'].includes(request.status)) {
      return res.status(400).json({ message: 'Pickup must be accepted before weight can be set' });
    }

    const user = await require('../models/User').findById(request.userId);
    const userKhaltiNumber = user?.khaltiNumber || user?.phone || '';
    const qrValue = `khalti://pay?to=${encodeURIComponent(userKhaltiNumber)}&amount=${payment.finalAmountPaisa}`;

    request.weight = payment.weightInKg;
    request.finalAmount = payment.finalAmount;
    request.finalAmountPaisa = payment.finalAmountPaisa;
    request.paymentMethod = 'khalti';
    request.paymentStatus = 'pending';
    request.status = 'arrived';
    await request.save();
    await request.populate('collectorId', 'name phone company rating location');

    const io = req.app.get('io');

    if (io && request.collectorId) {
      io.to(`collector:${request.collectorId.toString()}`).emit('weight_set', {
        requestId: request._id.toString(),
        weight: request.weight,
        finalAmount: request.finalAmount,
        finalAmountPaisa: request.finalAmountPaisa,
        qrValue,
      });
      emitPickupUpdate(io, request);
    }

    return res.json({
      weight: request.weight,
      finalAmount: request.finalAmount,
      finalAmountPaisa: request.finalAmountPaisa,
      qrValue,
    });
  } catch (error) {
    console.error('Error setting pickup weight:', error);
    return res.status(500).json({ message: 'Unable to set pickup weight' });
  }
});

router.post('/payment-complete/:requestId', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const { finalAmount } = req.body || {};
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (!['arrived', 'accepted'].includes(request.status)) {
      return res.status(400).json({ message: 'Pickup must be arrived before payment can be completed' });
    }

    if (!request.weight) {
      return res.status(400).json({ message: 'Weight must be set before payment can be completed' });
    }

    const paymentAmount = Number(finalAmount ?? request.finalAmount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'finalAmount is required' });
    }

    request.finalAmount = paymentAmount;
    request.finalAmountPaisa = paymentAmount * 100;
    request.paymentMethod = 'khalti';
    request.paymentStatus = 'completed';
    request.status = 'completed';
    await request.save();

    const user = await require('../models/User').findById(request.userId);
    const collector = await require('../models/Collector').findById(request.collectorId);

    if (user) {
      await user.updateOne({
        $inc: {
          totalEarnings: paymentAmount,
          totalWeightRecycled: request.weight,
          ecoPoints: Math.round(request.weight * 10),
        },
      });
    }

    if (collector) {
      await collector.updateOne({
        $inc: {
          totalEarnings: paymentAmount,
          totalWeightCollected: request.weight,
        },
        $push: {
          paymentHistory: {
            pickupId: request._id,
            finalAmount: paymentAmount,
            weight: request.weight,
            paymentMethod: 'khalti',
            paidAt: new Date(),
          },
        },
      });
    }

    await request.populate('userId', 'name phone khaltiNumber');
    await request.populate('collectorId', 'name phone company rating location');

    const io = req.app.get('io');
    if (io) {
      emitPickupUpdate(io, request);
      io.to(`user:${request.userId.toString()}`).emit('payment_completed', {
        requestId: request._id.toString(),
        finalAmount: paymentAmount,
        weight: request.weight,
        ecoPointsEarned: Math.round(request.weight * 10),
      });
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error completing pickup payment:', error);
    return res.status(500).json({ message: 'Unable to complete pickup payment' });
  }
});

router.post('/complete/:requestId', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Pickup request must be accepted before completion' });
    }

    request.status = 'completed';
    await request.save();

    await request.populate('userId', 'name phone');
    await request.populate('collectorId', 'name phone company rating location');

    const io = req.app.get('io');
    if (io) {
      emitPickupUpdate(io, request);
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error completing pickup:', error);
    return res.status(500).json({ message: 'Unable to complete pickup request' });
  }
});

router.post('/cancel/:requestId', requireAuth, async (req, res) => {
  try {
    const request = await PickupRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }

    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own pickup requests' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending pickup requests can be cancelled' });
    }

    request.status = 'cancelled';
    await request.save();

    const io = req.app.get('io');

    if (io) {
      emitPickupUpdate(io, request);
    }

    return res.json({ pickup: serializePickup(request) });
  } catch (error) {
    console.error('Error cancelling pickup:', error);
    return res.status(500).json({ message: 'Unable to cancel pickup request' });
  }
});

module.exports = router;
