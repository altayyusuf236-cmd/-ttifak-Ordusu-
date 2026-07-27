const mongoose = require('mongoose');

const DuyuruYetkiliSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  yetkiTuru: { type: String, default: 'ittifak_ordusu' }
});

module.exports = mongoose.model('DuyuruYetkili', DuyuruYetkiliSchema);