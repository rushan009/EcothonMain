const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true },
  company: { type: String, default: null },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, default: null },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  rating: { type: Number, default: 5.0 },
  isAvailable: { type: Boolean, default: true },
  totalEarnings: { type: Number, default: 0 },
  totalWeightCollected: { type: Number, default: 0 },
  paymentHistory: [{
    pickupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PickupRequest' },
    finalAmount: Number,
    weight: Number,
    paymentMethod: String,
    paidAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

const Collector = mongoose.model('Collector', collectorSchema);

module.exports = Collector;