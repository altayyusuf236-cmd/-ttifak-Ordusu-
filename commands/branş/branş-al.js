const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const Kamp = require('../../models/Kamp');
const BranşUyelik = require('../../models/BranşUyelik');
const { yetkiKontrol } = require('../../utils/yetki');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branş-al')
    .setDescription('Kullanıcıyı branşa alır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('branş-ismi').setDescription('Branş adı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Branşa alma sebebi').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const branşIsmi = interaction.options.getString('branş-ismi');
    const sebep = interaction.options.getString('sebep');

    const branş = await Branş.findOne({ isim: branşIsmi });
    if (!branş) {
      await interaction.reply('❌ Branş bulunamadı.');
      log('HATA', `Branş bulunamadı: ${branşIsmi}`, { kullanici: interaction.user.id });
      return;
    }

    const kamp = await Kamp.findById(branş.kampId);
    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'branş')) {
      await interaction.reply('❌ Bu işlem için yetkiniz yok.');
      log('UYARI', `Yetkisiz branş alma girişimi`, { kullanici: interaction.user.id, branş: branşIsmi });
      return;
    }

    try {
      await BranşUyelik.findOneAndUpdate(
        { userId: user.id, branşId: branş._id },
        { userId: user.id, branşId: branş._id },
        { upsert: true, new: true }
      );
      await interaction.reply(` ${user} **${branşIsmi}** branşına alındı.\n **Sebep:** ${sebep}`);
      
      log('BİLGİ', `Kullanıcı branşa alındı`, {
        yetkili: interaction.user.tag || interaction.user.id,
        hedef: user.tag || user.id,
        branş: branşIsmi,
        sebep: sebep
      });
    } catch (err) {
      await interaction.reply('❌ Bir hata oluştu.');
      log('HATA', `Branş alma hatası: ${err.message}`, { kullanici: interaction.user.id, branş: branşIsmi });
    }
  }
};
