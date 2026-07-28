const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Kurum = require('../../models/Kurum');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { logIslem } = require('../../services/logger');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tam-yasakla')
    .setDescription('Kullanıcıyı kamp, tüm branşlar ve kurumlarından yasaklar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı (ID veya Etiket)').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklanma sebebi').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Tam yasak işlemi başlatılıyor, lütfen bekleyin...**');

    const user = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');
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
        await anaGuild.members.ban(user.id, { reason: `${sebep} - ${interaction.user.tag}` });
        basarili.push(`✅ ${anaGuild.name} (Ana Kamp)`);
        await delay(1000);
      } catch (e) {
        basarisiz.push(`❌ ${anaGuild.name} (Yetki yok)`);
      }
    }

    const branşlar = await Branş.find({ kampId: kamp._id });
    for (const b of branşlar) {
      const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
      if (guild) {
        try {
          await guild.members.ban(user.id, { reason: `${sebep} - ${interaction.user.tag}` });
          basarili.push(`✅ ${guild.name} (${b.isim})`);
          await delay(1000);
        } catch (e) {
          basarisiz.push(`❌ ${guild.name} (${b.isim}) - Yetki yok`);
        }
      }
    }

    const kurumlar = await Kurum.find({ kampId: kamp._id });
    for (const k of kurumlar) {
      const guild = interaction.client.guilds.cache.get(k.discordSunucuId);
      if (guild) {
        try {
          await guild.members.ban(user.id, { reason: `${sebep} - ${interaction.user.tag}` });
          basarili.push(`✅ ${guild.name} (Kurum: ${k.isim})`);
          await delay(1000);
        } catch (e) {
          basarisiz.push(`❌ ${guild.name} (Kurum: ${k.isim}) - Yetki yok`);
        }
      }
    }

    await Yasak.findOneAndUpdate(
      { userId: user.id, kampId: kamp._id, tur: 'tam' },
      { aktif: true, sebep: sebep, tarih: new Date() },
      { upsert: true }
    );

    try {
      await user.send(`${interaction.user.tag} kişisi tarafından ${sebep} sebebiyle ${kamp.isim} Kampının tüm sunucularından yasaklandınız`);
    } catch (e) {}

    const mesaj = `✅ **${user.tag}** kullanıcısı **${kamp.isim}** kampı, branşları ve kurumlarından yasaklandı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'yasak', 'Tam yasak işlemi yapıldı', {
      Kullanıcı: user.tag,
      Kamp: kamp.isim,
      Sebep: sebep,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};
