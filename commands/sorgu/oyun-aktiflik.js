const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { getGroupActivity } = require('../../services/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun-aktiflik')
    .setDescription('Belirtilen kampın oyun aktifliğini gösterir')
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true)),
  async execute(interaction) {
    const kampIsmi = interaction.options.getString('kamp-ismi');
    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply('❌ Kamp bulunamadı.');

    const aktif = await getGroupActivity(kamp.oyunGrubuId);
    const durum = aktif ? '🟢 Aktif' : '🔴 Pasif (son 7 gün içinde duvar mesajı yok)';
    await interaction.reply(`📊 **${kamp.isim}** oyun aktifliği: ${durum}`);
  }
};