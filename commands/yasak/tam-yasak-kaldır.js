const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tam-yasak-kaldır')
    .setDescription('Kullanıcının tam yasağını kaldırır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Tam yasak kaldırma işlemi başlatılıyor...**');

    const user = interaction.options.getUser('kullanici');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp;

    if (kampIsmi) {
      kamp = await Kamp.findOne({ isim: kampIsmi });
    } else {
      kamp = await kampBul(interaction.guildId);
    }

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');
    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'tam_yasak')) {
      return interaction.editReply('❌ Bu işlem için yetkiniz yok.');
    }

    const basarili = [];
    const basarisiz = [];

    const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
    if (anaGuild) {
      try {
        await anaGuild.members.unban(user.id);
        basarili.push(`✅ ${anaGuild.name} (Ana Kamp)`);
      } catch (e) {
        basarisiz.push(`❌ ${anaGuild.name} (Yetki yok)`);
      }
    } else {
      basarisiz.push(`❌ Ana sunucu bulunamadı`);
    }

    const branşlar = await Branş.find({ kampId: kamp._id });
    for (const b of branşlar) {
      const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
      if (guild) {
        try {
          await guild.members.unban(user.id);
          basarili.push(`✅ ${guild.name} (${b.isim})`);
        } catch (e) {
          basarisiz.push(`❌ ${guild.name} (${b.isim}) - Yetki yok`);
        }
      } else {
        basarisiz.push(`❌ ${b.isim} sunucusu bulunamadı`);
      }
    }

    await Yasak.updateOne({ userId: user.id, kampId: kamp._id, tur: 'tam' }, { aktif: false });

    const mesaj = `✅ **${user.tag}** kullanıcısının **${kamp.isim}** kampındaki tam yasağı kaldırıldı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'yasak', 'Tam yasak kaldırıldı', {
      Kullanıcı: user.tag,
      Kamp: kamp.isim,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};