const mongoose = require('mongoose');

const BranşSchema = new mongoose.Schema({
  isim: { type: String, required: true },
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  discordSunucuId: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Branş', BranşSchema);