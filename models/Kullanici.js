const mongoose = require('mongoose');

const KullaniciSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  robloxId: { type: String },
  robloxAdi: { type: String },
  dogrulandi: { type: Boolean, default: false },
  dogrulamaTarihi: { type: Date },
  mevcutRutbe: { type: Number, default: 0 },        // YENİ: en son güncellenen rütbe
  sonGuncelleme: { type: Date }                     // YENİ: son rütbe güncelleme zamanı
});

module.exports = mongoose.model('Kullanici', KullaniciSchema);