const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collector', default: null },
  imageUrl: { type: String, required: true },
  scrapTypes: [{
    category: { type: String, required: true },
    icon: { type: String, required: true },
  }],
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  phone: { type: String, default: '' },
  estimatedWeight: {
    value: { type: Number, default: null },
    unit: { type: String, default: 'kg' },
  },
  collectorLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
  },
  note: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled', 'declined'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);

module.exports = PickupRequest;
