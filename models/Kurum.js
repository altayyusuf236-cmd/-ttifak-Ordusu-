const mongoose = require('mongoose');

const kurumSchema = new mongoose.Schema({
  isim: { type: String, required: true },
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  discordSunucuId: { type: String, required: true },
  robloxGrupId: { type: String, required: false },
  tarih: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kurum', kurumSchema);
