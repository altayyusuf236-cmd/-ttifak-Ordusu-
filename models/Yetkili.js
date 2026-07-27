const mongoose = require('mongoose');

const YetkiliSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  yetkiTuru: { type: String, enum: ['admin', 'tam_yasak', 'oyun_yasak', 'rutbe', 'branş', 'ittifak_ordusu'], required: true }
});

module.exports = mongoose.model('Yetkili', YetkiliSchema);