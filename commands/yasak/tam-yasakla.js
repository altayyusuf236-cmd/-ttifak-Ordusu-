const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { logIslem } = require('../../services/logger');

// Bekleme fonksiyonu (Rate Limit'e takılmamak için)
const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tam-yasakla')
    .setDescription('Kullanıcıyı kamp ve tüm branşlarından yasaklar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Tam yasak işlemi başlatılıyor, lütfen bekleyin...**');

    const user = interaction.options.getUser('kullanici');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const yetkili = await yetkiKontrol(interaction.user.id, kamp._id, 'tam_yasak');
    if (!yetkili) return interaction.editReply('❌ Bu işlem için yetkiniz yok.');

    const basarili = [];
    const basarisiz = [];

    const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
    if (anaGuild) {
      try {
        await anaGuild.members.ban(user.id, { reason: `Tam yasak - ${interaction.user.tag}` });
        basarili.push(`✅ ${anaGuild.name} (Ana Kamp)`);
        await delay(1000); // 1 Saniye bekle
      } catch (e) {
        basarisiz.push(`❌ ${anaGuild.name} (Yetki yok)`);
      }
    }

    const branşlar = await Branş.find({ kampId: kamp._id });
    for (const b of branşlar) {
      const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
      if (guild) {
        try {
          await guild.members.ban(user.id, { reason: `Tam yasak - ${interaction.user.tag}` });
          basarili.push(`✅ ${guild.name} (${b.isim})`);
          await delay(1000); // 1 Saniye bekle
        } catch (e) {
          basarisiz.push(`❌ ${guild.name} (${b.isim}) - Yetki yok`);
        }
      }
    }

    await Yasak.findOneAndUpdate(
      { userId: user.id, kampId: kamp._id, tur: 'tam' },
      { aktif: true },
      { upsert: true }
    );

    const mesaj = `✅ **${user.tag}** kullanıcısı **${kamp.isim}** kampı ve tüm branşlarından yasaklandı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'yasak', 'Tam yasak işlemi yapıldı', {
      Kullanıcı: user.tag,
      Kamp: kamp.isim,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};
