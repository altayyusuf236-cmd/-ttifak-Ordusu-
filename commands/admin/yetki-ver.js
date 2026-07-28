const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yetkili = require('../../models/Yetkili');
const { isOwner } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetki-ver')
    .setDescription('Kullanıcıya özel yetki verir')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addStringOption(opt => opt.setName('yetki').setDescription('Yetki türü').addChoices(
      { name: 'Admin', value: 'admin' },
      { name: 'Grup Sahibi', value: 'grup_sahibi' },
      { name: 'Tam Yasak', value: 'tam_yasak' },
      { name: 'Oyun Yasak', value: 'oyun_yasak' },
      { name: 'İttifak Tam Yasak', value: 'ittifak_yasak' },
      { name: 'İttifak Duyuru', value: 'ittifak_duyuru' }
    ).setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanici');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    const istenenYetki = interaction.options.getString('yetki');
    const executorId = interaction.user.id;

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply({ content: '❌ Kamp bulunamadı.', ephemeral: true });

    const ownerMi = isOwner(executorId);

    if (!ownerMi) {
      const executorYetkiKaydi = await Yetkili.findOne({
        userId: executorId,
        kampId: kamp._id,
        yetkiTuru: 'grup_sahibi'
      });

      if (!executorYetkiKaydi) {
        return interaction.reply({ content: '❌ Bu komutu bu kampta kullanmak için yetkiniz yok.', ephemeral: true });
      }

      const grupSahibininVerebilecegiYetkiler = ['oyun_yasak', 'tam_yasak'];
      if (!grupSahibininVerebilecegiYetkiler.includes(istenenYetki)) {
        return interaction.reply({ 
          content: '❌ **Grup Sahibi** unvanıyla sadece **Oyun Yasak** ve **Tam Yasak** yetkilerini verebilirsiniz!', 
          ephemeral: true 
        });
      }
    }

    await Yetkili.findOneAndUpdate(
      { userId: user.id, kampId: kamp._id },
      { yetkiTuru: istenenYetki },
      { upsert: true, new: true }
    );

    await interaction.reply(`✅ ${user} için **${kampIsmi}** kampında **${istenenYetki}** yetkisi başarıyla verildi.`);

    await logIslem(interaction, 'yetki', 'Yetki verildi', {
      Kullanıcı: user.tag,
      Kamp: kampIsmi,
      Yetki: istenenYetki
    });
  }
};
