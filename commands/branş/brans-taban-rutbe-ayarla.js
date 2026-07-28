const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brans-taban-rutbe-ayarla')
    .setDescription('Belirli bir kampın belirli bir branşı için taban rütbe ayarlar (sadece owner)')
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addStringOption(opt => opt.setName('brans-ismi').setDescription('Branş adı').setRequired(true))
    .addIntegerOption(opt => opt.setName('seviye').setDescription('Taban rütbe seviyesi').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const kampIsmi = interaction.options.getString('kamp-ismi');
    const bransIsmi = interaction.options.getString('brans-ismi');
    const seviye = interaction.options.getInteger('seviye');

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply({ content: '❌ Kamp bulunamadı.', ephemeral: true });

    const brans = await Branş.findOne({ isim: bransIsmi, kampId: kamp._id });
    if (!brans) return interaction.reply({ content: `❌ **${kamp.isim}** kampına ait **${bransIsmi}** branşı bulunamadı.`, ephemeral: true });

    brans.tabanRutbe = seviye;
    await brans.save();
    await interaction.reply(`✅ **${kamp.isim}** kampındaki **${brans.isim}** branşı için taban rütbe **${seviye}** olarak ayarlandı.`);
  }
};
