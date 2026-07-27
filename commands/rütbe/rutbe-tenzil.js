const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, getMemberRank, setRank } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbe-tenzil')
    .setDescription('Roblox grubunda 1 rütbe tenzil eder')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe tenzil işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp;

    if (kampIsmi) {
      kamp = await Kamp.findOne({ isim: kampIsmi });
    } else {
      kamp = await kampBul(interaction.guildId);
    }

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
      await interaction.editReply(`✅ **${kullaniciAdi}** kullanıcısı **${kamp.isim}** grubunda **${mevcutRank}** rütbesinden **${yeniRank}** rütbesine tenzil edildi.`);
      await logIslem(interaction, 'rutbe', 'Rütbe tenzil işlemi yapıldı', {
        'Roblox Adı': kullaniciAdi,
        Kamp: kamp.isim,
        'Eski Rütbe': mevcutRank,
        'Yeni Rütbe': yeniRank
      });
    } else {
      await interaction.editReply(`❌ Tenzil işlemi başarısız.`);
    }
  }
};