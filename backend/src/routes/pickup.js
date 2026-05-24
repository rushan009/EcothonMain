const express = require('express');
const router = express.Router();
const PickupRequest = require('../models/PickupRequest');
const Collector = require('../models/Collector');
const requireAuth = require('../middleware/auth');

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

async function getCollectorForUser(user) {
  if (!user || user.role !== 'collector') {
    return null;
  }

  return Collector.findOne({
    $or: [{ email: user.email }, { phone: user.phone }],
  });
}

router.post('/create', requireAuth, async (req, res) => {
  try {
    const { scrapTypes, location, note } = req.body || {};

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

    const pickup = await PickupRequest.create({
      userId: req.user._id,
      collectorId: null,
      scrapTypes: normalizedScrapTypes,
      location,
      note: note || '',
      status: 'pending',
      createdAt: new Date(),
    });

    return res.status(201).json({ pickup });
  } catch (error) {
    console.error('Error creating pickup:', error);
    return res.status(500).json({ message: 'Unable to create pickup request' });
  }
});

router.get('/my-pickups', requireAuth, async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.json({ pickups });
  } catch (error) {
    console.error('Error fetching pickups:', error);
    return res.status(500).json({ message: 'Unable to fetch pickups' });
  }
});

router.get('/pending-nearby', requireAuth, requireRole(['collector']), async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ status: 'pending' }).sort({ createdAt: -1 });

    return res.json({ pickups });
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

    request.collectorId = collector._id;
    request.status = 'accepted';
    await request.save();

    const io = req.app.get('io');

    if (io) {
      io.to(`user:${request.userId.toString()}`).emit('pickup_accepted', {
        requestId: request._id.toString(),
        status: request.status,
        collectorId: request.collectorId.toString(),
      });
    }

    return res.json({ pickup: request });
  } catch (error) {
    console.error('Error accepting pickup:', error);
    return res.status(500).json({ message: 'Unable to accept pickup request' });
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

    return res.json({ pickup: request });
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

    return res.json({ pickup: request });
  } catch (error) {
    console.error('Error cancelling pickup:', error);
    return res.status(500).json({ message: 'Unable to cancel pickup request' });
  }
});

module.exports = router;
