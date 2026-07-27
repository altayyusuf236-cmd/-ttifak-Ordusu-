const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { getGroupActivity } = require('../../services/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-aktiflik')
    .setDescription('Tüm ittifak kamplarının aktifliğini gösterir'),
  async execute(interaction) {
    const kamplar = await Kamp.find();
    if (!kamplar.length) return interaction.reply('❌ Hiç kamp yok.');

    let mesaj = '📊 **İttifak Aktiflik Durumu**\n';
    for (const kamp of kamplar) {
      const aktif = await getGroupActivity(kamp.oyunGrubuId);
      mesaj += `• ${kamp.isim}: ${aktif ? '🟢 Aktif' : '🔴 Pasif'}\n`;
    }
    await interaction.reply(mesaj);
  }
};