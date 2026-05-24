const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle_type: String,
  rating: { type: Number, default: 0 },
  active_status: { type: Boolean, default: true },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

const Collector = mongoose.model('Collector', collectorSchema);

module.exports = Collector;