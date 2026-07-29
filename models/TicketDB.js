const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  sunucuId: String,
  kanalId: String,
  sahipId: String,
  ustlenenId: { type: String, default: null },
  durum: { type: String, default: 'acik' },
  konuTuru: String,
  olusturmaTarihi: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicketDB', ticketSchema);
