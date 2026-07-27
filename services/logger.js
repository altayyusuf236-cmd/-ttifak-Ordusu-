const Log = require('../models/Log');

async function logKanaliBul(sunucuId, tur = 'sistem') {
  const log = await Log.findOne({ sunucuId, tur });
  return log ? log.kanalId : null;
}

async function logIslem(interaction, tur, mesaj, detay = {}) {
  try {
    const kanalId = await logKanaliBul(interaction.guildId, tur);
    if (!kanalId) return;

    const kanal = await interaction.client.channels.fetch(kanalId);
    if (!kanal) return;

    const embed = {
      color: 0x00ff88,
      title: `📋 ${tur.toUpperCase()} Log`,
      description: mesaj,
      fields: Object.entries(detay).map(([k, v]) => ({ name: k, value: String(v), inline: true })),
      timestamp: new Date().toISOString(),
      footer: { text: `Yetkili: ${interaction.user.tag} (${interaction.user.id})` }
    };

    await kanal.send({ embeds: [embed] });
  } catch (e) {
    console.error('Log gönderilemedi:', e);
  }
}

module.exports = { logKanaliBul, logIslem };