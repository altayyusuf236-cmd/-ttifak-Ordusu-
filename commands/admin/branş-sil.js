const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const BranşUyelik = require('../../models/BranşUyelik');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branş-sil')
    .setDescription('Branş siler (sadece bot sahibi)')
    .addStringOption(opt => opt.setName('isim').setDescription('Branş adı').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const isim = interaction.options.getString('isim');
    const branş = await Branş.findOne({ isim });
    if (!branş) return interaction.reply('❌ Branş bulunamadı.');

    await BranşUyelik.deleteMany({ branşId: branş._id });
    await Branş.deleteOne({ _id: branş._id });

    await interaction.reply(`✅ **${isim}** branşı silindi.`);
  }
};