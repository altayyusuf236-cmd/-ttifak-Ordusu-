const mongoose = require('mongoose');

const bransSchema = new mongoose.Schema({
  isim: { type: String, required: true },
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  discordSunucuId: { type: String, required: true },
  oyunGrubuId: { type: String },           // Branşın kendi Roblox grup ID'si (opsiyonel)
  tabanRutbe: { type: Number, default: 0 },  // Branşa özel taban rütbe seviyesi
  maxRutbe: { type: Number, default: 255 }   // Branşa özel max rütbe sınırı
});

module.exports = mongoose.model('Branş', bransSchema);
