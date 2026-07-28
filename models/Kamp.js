const mongoose = require('mongoose');

const kampSchema = new mongoose.Schema({
  isim: { type: String, required: true, unique: true },
  anaSunucuId: { type: String, required: true },
  oyunGrubuId: { type: String, required: true },
  tabanRutbe: { type: Number, default: 0 }, // Ana kamp taban rütbe seviyesi
  maxRutbe: { type: Number, default: 255 }   // Ana kamp max rütbe sınırı
});

module.exports = mongoose.model('Kamp', kampSchema);
