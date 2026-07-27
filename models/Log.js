const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  zaman: { type: Date, default: Date.now },
  kullanici: { type: String, required: true }, // Discord ID veya kullanıcı adı
  komut: { type: String, required: true },
  detay: { type: String, required: true },
  basarili: { type: Boolean, default: true },
  ekBilgi: { type: mongoose.Schema.Types.Mixed } // isteğe bağlı ek bilgiler
});

module.exports = mongoose.model('Log', LogSchema);