const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branş-ekle')
    .setDescription('Branş ekler (sadece bot sahibi)')
    .addStringOption(opt => opt.setName('isim').setDescription('Branş adı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Bağlı olduğu kamp').setRequired(true))
    .addStringOption(opt => opt.setName('sunucu-id').setDescription('Branş Discord sunucu ID').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const isim = interaction.options.getString('isim');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    const sunucuId = interaction.options.getString('sunucu-id');

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply('❌ Kamp bulunamadı.');

    try {
      const yeniBranş = new Branş({ isim, kampId: kamp._id, discordSunucuId: sunucuId });
      await yeniBranş.save();
      await interaction.reply(`✅ **${isim}** branşı **${kampIsmi}** kampına eklendi.`);
    } catch (err) {
      await interaction.reply('❌ Bu branş veya sunucu ID zaten kayıtlı.');
    }
  }
};