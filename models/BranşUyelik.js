const mongoose = require('mongoose');

const BranşUyelikSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  branşId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branş', required: true },
  rutbeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rutbe' }
});

module.exports = mongoose.model('BranşUyelik', BranşUyelikSchema);