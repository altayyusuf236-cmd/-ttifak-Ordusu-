const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, getRankLevelByName, setRank } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbe-degistir')
    .setDescription('Roblox grubunda belirtilen rütbeye atar')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('rutbe-adi').setDescription('Hedef rütbe adı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe değiştirme işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const rutbeAdi = interaction.options.getString('rutbe-adi');
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
      await interaction.editReply(`✅ **${kullaniciAdi}** kullanıcısı **${kamp.isim}** grubunda **${rutbeAdi}** rütbesine atandı.`);
      await logIslem(interaction, 'rutbe', 'Rütbe değiştirildi', {
        'Roblox Adı': kullaniciAdi,
        Kamp: kamp.isim,
        'Hedef Rütbe': rutbeAdi
      });
    } else {
      await interaction.editReply(`❌ Rütbe değiştirilemedi.`);
    }
  }
};