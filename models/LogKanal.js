const mongoose = require('mongoose');

const LogKanalSchema = new mongoose.Schema({
  kampId: { type: mongoose.Schema.Types.ObjectId, ref: 'Kamp', required: true },
  logTuru: { 
    type: String, 
    enum: ['tam_yasak', 'oyun_yasak', 'rutbe', 'branş', 'hepsi'], 
    required: true 
  },
  kanalId: { type: String, required: true }
});

module.exports = mongoose.model('LogKanal', LogKanalSchema);