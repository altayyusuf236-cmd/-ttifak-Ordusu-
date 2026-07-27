const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yetkili = require('../../models/Yetkili');
const { isOwner } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetki-ver')
    .setDescription('Kullanıcıya yetki verir (sadece bot sahibi)')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addStringOption(opt => opt.setName('yetki').setDescription('Yetki türü').addChoices(
      { name: 'Admin', value: 'admin' },
      { name: 'Tam Yasak', value: 'tam_yasak' },
      { name: 'Oyun Yasak', value: 'oyun_yasak' },
      { name: 'Rütbe', value: 'rutbe' },
      { name: 'Branş', value: 'branş' },
      { name: 'İttifak Tam Yasak', value: 'ittifak_yasak' },
      { name: 'İttifak Duyuru', value: 'ittifak_duyuru' }
    ).setRequired(true)),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const user = interaction.options.getUser('kullanici');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    const yetki = interaction.options.getString('yetki');

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply('❌ Kamp bulunamadı.');

    await Yetkili.findOneAndUpdate(
      { userId: user.id, kampId: kamp._id },
      { yetkiTuru: yetki },
      { upsert: true, new: true }
    );
    await interaction.reply(`✅ ${user} için **${kampIsmi}** kampında **${yetki}** yetkisi verildi.`);

    await logIslem(interaction, 'yetki', 'Yetki verildi', {
      Kullanıcı: user.tag,
      Kamp: kampIsmi,
      Yetki: yetki
    });
  }
};