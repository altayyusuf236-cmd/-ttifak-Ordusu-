const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tam-yasakla')
    .setDescription('Kullanıcıyı kamp ve tüm branşlarından yasaklar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Tam yasak işlemi başlatılıyor...**');

    const user = interaction.options.getUser('kullanici');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp;

    if (kampIsmi) {
      kamp = await Kamp.findOne({ isim: kampIsmi });
    } else {
      kamp = await kampBul(interaction.guildId);
    }

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const yetkili = await yetkiKontrol(interaction.user.id, kamp._id, 'tam_yasak');
    if (!yetkili) return interaction.editReply('❌ Bu işlem için yetkiniz yok.');

    const basarili = [];
    const basarisiz = [];

    const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
    if (anaGuild) {
      try {
        await anaGuild.members.ban(user.id, { reason: 'Tam yasak' });
        basarili.push(`✅ ${anaGuild.name} (Ana Kamp)`);
      } catch (e) {
        basarisiz.push(`❌ ${anaGuild.name} (Yetki yok veya bot ban yetkisi yok)`);
      }
    } else {
      basarisiz.push(`❌ Ana sunucu bulunamadı (ID: ${kamp.anaSunucuId})`);
    }

    const branşlar = await Branş.find({ kampId: kamp._id });
    for (const b of branşlar) {
      const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
      if (guild) {
        try {
          await guild.members.ban(user.id, { reason: 'Tam yasak' });
          basarili.push(`✅ ${guild.name} (${b.isim})`);
        } catch (e) {
          basarisiz.push(`❌ ${guild.name} (${b.isim}) - Yetki yok veya bot ban yetkisi yok`);
        }
      } else {
        basarisiz.push(`❌ ${b.isim} sunucusu bulunamadı (ID: ${b.discordSunucuId})`);
      }
    }

    await Yasak.create({ userId: user.id, kampId: kamp._id, tur: 'tam' });

    const mesaj = `✅ **${user.tag}** kullanıcısı **${kamp.isim}** kampı ve tüm branşlarından yasaklandı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    // LOG
    await logIslem(interaction, 'yasak', 'Tam yasak işlemi yapıldı', {
      Kullanıcı: user.tag,
      Kamp: kamp.isim,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};