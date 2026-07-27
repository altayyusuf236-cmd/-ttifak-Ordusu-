const mongoose = require('mongoose');

const KampSchema = new mongoose.Schema({
  isim: { type: String, required: true, unique: true },
  anaSunucuId: { type: String, required: true, unique: true },
  oyunGrubuId: { type: String, required: true },
  aktiflik: { type: Boolean, default: true },
  tabanRutbe: { type: Number, default: 1 } // YENİ: en düşük yetkili rütbe seviyesi
});

module.exports = mongoose.model('Kamp', KampSchema);