const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  rating: { type: Number, default: 5.0 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Collector = mongoose.model('Collector', collectorSchema);

module.exports = Collector;