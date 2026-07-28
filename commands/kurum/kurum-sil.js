const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Kurum = require('../../models/Kurum');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurum-sil')
    .setDescription('Kampa bağlı bir kurumu siler')
    .addStringOption(opt => opt.setName('isim').setDescription('Silinecek kurumun ismi').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)').setRequired(false)),
  async execute(interaction) {
    await interaction.reply('⏳ **Kurum siliniyor...**');

    const kurumIsmi = interaction.options.getString('isim');
    const kampIsmi = interaction.options.getString('kamp-ismi');

    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'tam_yasak')) {
      return interaction.editReply('❌ Bu işlem için yetkiniz yok.');
    }

    const silinen = await Kurum.findOneAndDelete({ kampId: kamp._id, isim: kurumIsmi });
    if (!silinen) return interaction.editReply('❌ Bu isimde bir kurum bulunamadı.');

    await interaction.editReply(`✅ **${kurumIsmi}** kurumu başarıyla kaldırıldı.`);
  }
};
