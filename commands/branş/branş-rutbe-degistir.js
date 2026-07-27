const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const Kamp = require('../../models/Kamp');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const { getUserIdByUsername, getRankLevelByName, setRank } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('branş-rutbe-degistir')
    .setDescription('Branş içinde belirtilen rütbeye atar (Roblox ismi ile)')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('rutbe-adi').setDescription('Hedef rütbe adı').setRequired(true))
    .addStringOption(opt => opt.setName('branş-ismi').setDescription('Branş adı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **Branş rütbe değiştirme işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const rutbeAdi = interaction.options.getString('rutbe-adi');
    const branşIsmi = interaction.options.getString('branş-ismi');

    const branş = await Branş.findOne({ isim: branşIsmi });
    if (!branş) return interaction.editReply('❌ Branş bulunamadı.');

    const kamp = await Kamp.findById(branş.kampId);
    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, hedefRobloxId, 'degistir');
    if (!yetkiSonuc.yetkili) {
      return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);
    }

    const rankLevel = await getRankLevelByName(kamp.oyunGrubuId, rutbeAdi);
    if (!rankLevel) return interaction.editReply(`❌ "${rutbeAdi}" rütbesi bu grupta bulunamadı.`);

    if (rankLevel >= yetkiSonuc.yetkiliRank) {
      return interaction.editReply(`❌ Hedef rütbe (${rankLevel}) sizin rütbenizden (${yetkiSonuc.yetkiliRank}) yüksek veya eşit.`);
    }

    const basarili = await setRank(kamp.oyunGrubuId, hedefRobloxId, rankLevel);
    if (basarili) {
      await interaction.editReply(`✅ **${kullaniciAdi}** kullanıcısı **${branşIsmi}** branşında **${rutbeAdi}** rütbesine atandı.`);
      await logIslem(interaction, 'branş', 'Branş rütbe değiştirildi', {
        'Roblox Adı': kullaniciAdi,
        Branş: branşIsmi,
        Kamp: kamp.isim,
        'Hedef Rütbe': rutbeAdi
      });
    } else {
      await interaction.editReply(`❌ Rütbe değiştirilemedi.`);
    }
  }
};