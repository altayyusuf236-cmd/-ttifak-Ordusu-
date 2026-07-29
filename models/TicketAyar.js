const mongoose = require('mongoose');

const ticketAyarSchema = new mongoose.Schema({
  sunucuId: String,
  kategoriId: String,
  yetkiliRolId: String,
  logKanalId: String
});

module.exports = mongoose.model('TicketAyar', ticketAyarSchema);
