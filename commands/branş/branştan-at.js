const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const Kamp = require('../../models/Kamp');
const BranşUyelik = require('../../models/BranşUyelik');
const { yetkiKontrol } = require('../../utils/yetki');
const { log } = require('../../utils/logger'); // LOG EKLENDİ

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branştan-at')
    .setDescription('Kullanıcıyı branştan atar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('branş-ismi').setDescription('Branş adı').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const branşIsmi = interaction.options.getString('branş-ismi');
    const branş = await Branş.findOne({ isim: branşIsmi });
    if (!branş) {
      await interaction.reply('❌ Branş bulunamadı.');
      log('HATA', `Branş bulunamadı: ${branşIsmi}`, { kullanici: interaction.user.id });
      return;
    }

    const kamp = await Kamp.findById(branş.kampId);
    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'branş')) {
      await interaction.reply('❌ Bu işlem için yetkiniz yok.');
      log('UYARI', `Yetkisiz branştan atma girişimi`, { kullanici: interaction.user.id, branş: branşIsmi });
      return;
    }

    try {
      const result = await BranşUyelik.deleteOne({ userId: user.id, branşId: branş._id });
      if (result.deletedCount === 0) {
        await interaction.reply(`❌ ${user} bu branşta zaten değil.`);
        log('BİLGİ', `Kullanıcı branşta değildi`, { yetkili: interaction.user.id, hedef: user.id, branş: branşIsmi });
        return;
      }
      await interaction.reply(`✅ ${user} **${branşIsmi}** branşından atıldı.`);
      log('BİLGİ', `Kullanıcı branştan atıldı`, {
        yetkili: interaction.user.id,
        hedef: user.id,
        branş: branşIsmi
      });
    } catch (err) {
      await interaction.reply('❌ Bir hata oluştu.');
      log('HATA', `Branştan atma hatası: ${err.message}`, { kullanici: interaction.user.id, branş: branşIsmi });
    }
  }
};