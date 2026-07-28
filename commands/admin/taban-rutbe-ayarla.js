const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taban-rutbe-ayarla')
    .setDescription('Ana kamp için taban rütbe seviyesini ayarlar (sadece owner)')
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addIntegerOption(opt => opt.setName('seviye').setDescription('Taban rütbe seviyesi').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const kampIsmi = interaction.options.getString('kamp-ismi');
    const seviye = interaction.options.getInteger('seviye');

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply({ content: '❌ Kamp bulunamadı.', ephemeral: true });

    kamp.tabanRutbe = seviye;
    await kamp.save();
    await interaction.reply(` **${kamp.isim}** kampı için ana taban rütbe **${seviye}** olarak ayarlandı.`);
  }
};
1