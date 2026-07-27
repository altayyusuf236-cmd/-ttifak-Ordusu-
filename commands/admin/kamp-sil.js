const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yetkili = require('../../models/Yetkili');
const Yasak = require('../../models/Yasak');
const Rutbe = require('../../models/Rutbe');
const { isOwner } = require('../../utils/yetki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kamp-sil')
    .setDescription('Kamp siler (sadece bot sahibi)')
    .addStringOption(opt => opt.setName('isim').setDescription('Kamp adı').setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const isim = interaction.options.getString('isim');
    const kamp = await Kamp.findOne({ isim });
    if (!kamp) return interaction.reply('❌ Kamp bulunamadı.');

    await Branş.deleteMany({ kampId: kamp._id });
    await Yetkili.deleteMany({ kampId: kamp._id });
    await Yasak.deleteMany({ kampId: kamp._id });
    await Rutbe.deleteMany({ kampId: kamp._id });
    await Kamp.deleteOne({ _id: kamp._id });

    await interaction.reply(`✅ **${isim}** kampı ve tüm bağlı veriler silindi.`);
  }
};