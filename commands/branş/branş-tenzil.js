const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const Kamp = require('../../models/Kamp');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const { getUserIdByUsername, getMemberRank, setRank } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branş-tenzil')
    .setDescription('Branş içinde 1 rütbe tenzil eder (Roblox ismi ile)')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('branş-ismi').setDescription('Branş adı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **Branş tenzil işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const branşIsmi = interaction.options.getString('branş-ismi');

    const branş = await Branş.findOne({ isim: branşIsmi });
    if (!branş) return interaction.editReply('❌ Branş bulunamadı.');

    const kamp = await Kamp.findById(branş.kampId);
    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, hedefRobloxId, 'tenzil');
    if (!yetkiSonuc.yetkili) {
      return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);
    }

    const mevcutRank = await getMemberRank(kamp.oyunGrubuId, hedefRobloxId);
    if (mevcutRank === null) return interaction.editReply('❌ Kullanıcı bu grupta değil.');
    if (mevcutRank <= kamp.tabanRutbe) return interaction.editReply(`❌ Kullanıcı zaten taban rütbede (${kamp.tabanRutbe}).`);

    const yeniRank = mevcutRank - 1;
    const basarili = await setRank(kamp.oyunGrubuId, hedefRobloxId, yeniRank);

    if (basarili) {
      await interaction.editReply(`✅ **${kullaniciAdi}** kullanıcısı **${branşIsmi}** branşında **${mevcutRank}** rütbesinden **${yeniRank}** rütbesine tenzil edildi.`);
      await logIslem(interaction, 'branş', 'Branş tenzil işlemi yapıldı', {
        'Roblox Adı': kullaniciAdi,
        Branş: branşIsmi,
        Kamp: kamp.isim,
        'Eski Rütbe': mevcutRank,
        'Yeni Rütbe': yeniRank
      });
    } else {
      await interaction.editReply(`❌ Tenzil işlemi başarısız.`);
    }
  }
};