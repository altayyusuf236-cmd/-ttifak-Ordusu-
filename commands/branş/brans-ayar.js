const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brans-ayar')
    .setDescription('Branşın Roblox grubunu ve rütbe sınırını ayarlar')
    .addStringOption(opt => opt.setName('brans-ismi').setDescription('Branş adı').setRequired(true))
    .addStringOption(opt => opt.setName('grup-id').setDescription('Branşın Roblox Grup ID\'si').setRequired(true))
    .addIntegerOption(opt => opt.setName('max-rutbe').setDescription('Verilebilecek en yüksek rütbe ID\'si').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.reply('⏳ **Ayarlar güncelleniyor...**');

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const bransIsmi = interaction.options.getString('brans-ismi');
    const grupId = interaction.options.getString('grup-id');
    const maxRutbe = interaction.options.getInteger('max-rutbe');

    const guncellenen = await Branş.findOneAndUpdate(
      { kampId: kamp._id, isim: bransIsmi },
      { oyunGrubuId: grupId, maxRutbe: maxRutbe },
      { new: true }
    );

    if (!guncellenen) return interaction.editReply('❌ Branş bulunamadı.');

    await interaction.editReply(`✅ **${bransIsmi}** branşı güncellendi.\n🎮 Grup ID: **${grupId}**\n📈 Max Rütbe Sınırı: **${maxRutbe}**`);
  }
};
