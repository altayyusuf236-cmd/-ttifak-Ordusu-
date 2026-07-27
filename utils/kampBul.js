const Kamp = require('../models/Kamp');
const Branş = require('../models/Branş');

async function kampBulBySunucu(sunucuId) {
  let kamp = await Kamp.findOne({ anaSunucuId: sunucuId });
  if (kamp) return kamp;

  const branş = await Branş.findOne({ discordSunucuId: sunucuId });
  if (branş) {
    kamp = await Kamp.findById(branş.kampId);
    return kamp;
  }
  return null;
}

module.exports = kampBulBySunucu;