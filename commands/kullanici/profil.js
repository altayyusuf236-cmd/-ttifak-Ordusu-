const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Profilinizi gösterir'),
  async execute(interaction) {
    const kullanici = await Kullanici.findOne({ discordId: interaction.user.id });
    if (!kullanici || !kullanici.dogrulandi) {
      return interaction.reply({ content: '❌ Henüz doğrulanmamışsınız.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle(`📋 ${interaction.user.username} Profili`)
      .addFields(
        { name: 'Roblox Adı', value: kullanici.robloxAdi || 'Belirtilmemiş', inline: true },
        { name: 'Roblox ID', value: kullanici.robloxId || 'Belirtilmemiş', inline: true },
        { name: 'Mevcut Rütbe', value: kullanici.mevcutRutbe ? kullanici.mevcutRutbe.toString() : 'Henüz güncellenmemiş', inline: true },
        { name: 'Son Güncelleme', value: kullanici.sonGuncelleme ? new Date(kullanici.sonGuncelleme).toLocaleString('tr-TR') : 'Hiç', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};