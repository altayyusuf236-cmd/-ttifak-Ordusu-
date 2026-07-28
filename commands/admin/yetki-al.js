const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yetkili = require('../../models/Yetkili');
const { isOwner } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetki-al')
    .setDescription('Kullanıcının özel yetkisini alır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addStringOption(opt => opt.setName('yetki').setDescription('Alınacak yetki türü').addChoices(
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
    const alinacakYetki = interaction.options.getString('yetki');
    const executorId = interaction.user.id;

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply({ content: '❌ Kamp bulunamadı.', ephemeral: true });

    // 1. Bot Sahibi Kontrolü (Değilse "Grup Sahibi" yetkisi var mı diye bakacağız)
    const ownerMi = isOwner(executorId);

    if (!ownerMi) {
      // Komutu kullanan kişi bot sahibi değilse, bu kampta 'grup_sahibi' yetkisine sahip mi kontrol et
      const executorYetkiKaydi = await Yetkili.findOne({
        userId: executorId,
        kampId: kamp._id,
        yetkiTuru: 'grup_sahibi'
      });

      if (!executorYetkiKaydi) {
        return interaction.reply({ content: '❌ Bu komutu bu kampta kullanmak için yetkiniz yok.', ephemeral: true });
      }

      // 2. Grup Sahibi Sınırlandırması: Sadece kendi kampı için 'oyun_yasak' veya 'tam_yasak' yetkisini alabilir
      const grupSahibininAlabilecegiYetkiler = ['oyun_yasak', 'tam_yasak'];
      if (!grupSahibininAlabilecegiYetkiler.includes(alinacakYetki)) {
        return interaction.reply({ 
          content: '❌ **Grup Sahibi** unvanıyla sadece **Oyun Yasak** ve **Tam Yasak** yetkilerini alabilirsiniz!', 
          ephemeral: true 
        });
      }
    }

    // Veritabanından belirtilen yetkiyi sil
    const silinenKayit = await Yetkili.findOneAndDelete({
      userId: user.id,
      kampId: kamp._id,
      yetkiTuru: alinacakYetki
    });

    if (!silinenKayit) {
      return interaction.reply({ content: `❌ Kullanıcıda zaten **${alinacakYetki}** yetkisi bulunmuyor.`, ephemeral: true });
    }

    await interaction.reply(`✅ ${user} kullanıcısının **${kampIsmi}** kampındaki **${alinacakYetki}** yetkisi başarıyla alındı.`);

    await logIslem(interaction, 'yetki', 'Yetki alındı', {
      Kullanıcı: user.tag,
      Kamp: kampIsmi,
      Yetki: alinacakYetki
    });
  }
};
