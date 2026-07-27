const mongoose = require('mongoose');

const YasakSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  tur: { type: String, enum: ['tam', 'oyun', 'ittifak'], required: true },
  aktif: { type: Boolean, default: true }
});

module.exports = mongoose.model('Yasak', YasakSchema);