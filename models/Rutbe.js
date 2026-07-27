const mongoose = require('mongoose');

const RutbeSchema = new mongoose.Schema({
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  isim: { type: String, required: true },
  seviye: { type: Number, required: true }
});

module.exports = mongoose.model('Rutbe', RutbeSchema);