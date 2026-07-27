const mongoose = require('mongoose');

const DogrulamaKoduSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  robloxId: { type: String, required: true },
  robloxAdi: { type: String, required: true },
  kod: { type: String, required: true },
  olusturulma: { type: Date, default: Date.now, expires: 120 } // 2 dakika sonra otomatik silinir
});

module.exports = mongoose.model('DogrulamaKodu', DogrulamaKoduSchema);