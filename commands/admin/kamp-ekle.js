const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kamp-ekle')
    .setDescription('Yeni kamp ekler (sadece bot sahibi)')
    .addStringOption(opt => opt.setName('isim').setDescription('Kamp adı').setRequired(true))
    .addStringOption(opt => opt.setName('sunucu-id').setDescription('Ana Discord sunucu ID').setRequired(true))
    .addStringOption(opt => opt.setName('grup-id').setDescription('Roblox grup ID').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const isim = interaction.options.getString('isim');
    const sunucuId = interaction.options.getString('sunucu-id');
    const grupId = interaction.options.getString('grup-id');

    try {
      const yeniKamp = new Kamp({ isim, anaSunucuId: sunucuId, oyunGrubuId: grupId });
      await yeniKamp.save();
      await interaction.reply(`✅ **${isim}** kampı eklendi.`);
    } catch (err) {
      await interaction.reply('❌ Bu isim veya sunucu ID zaten kullanılıyor.');
    }
  }
};