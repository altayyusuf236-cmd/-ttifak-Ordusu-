const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { ittifakYetkiKontrol } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-tam-yasak-kaldır')
    .setDescription('İttifak tam yasağı kaldırır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **İttifak tam yasak kaldırma işlemi başlatılıyor...**');

    const user = interaction.options.getUser('kullanici');

    if (!await ittifakYetkiKontrol(interaction.user.id, 'ittifak_yasak')) {
      return interaction.editReply('❌ Bu işlem için İttifak Tam Yasak yetkiniz yok.');
    }

    const kamplar = await Kamp.find();
    if (!kamplar.length) return interaction.editReply('❌ Hiç kamp bulunamadı.');

    const basarili = [];
    const basarisiz = [];

    for (const kamp of kamplar) {
      const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
      if (anaGuild) {
        try {
          await anaGuild.members.unban(user.id);
          basarili.push(`✅ ${anaGuild.name} (${kamp.isim})`);
        } catch (e) {
          basarisiz.push(`❌ ${anaGuild.name} (${kamp.isim}) - Yetki yok`);
        }
      } else {
        basarisiz.push(`❌ ${kamp.isim} ana sunucusu bulunamadı`);
      }

      const branşlar = await Branş.find({ kampId: kamp._id });
      for (const b of branşlar) {
        const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
        if (guild) {
          try {
            await guild.members.unban(user.id);
            basarili.push(`✅ ${guild.name} (${kamp.isim} - ${b.isim})`);
          } catch (e) {
            basarisiz.push(`❌ ${guild.name} (${kamp.isim} - ${b.isim}) - Yetki yok`);
          }
        } else {
          basarisiz.push(`❌ ${kamp.isim} - ${b.isim} sunucusu bulunamadı`);
        }
      }

      await Yasak.updateOne({ userId: user.id, kampId: kamp._id, tur: 'ittifak' }, { aktif: false });
    }

    const mesaj = `✅ **${user.tag}** için ittifak tam yasağı kaldırıldı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'yasak', 'İttifak tam yasak kaldırıldı', {
      Kullanıcı: user.tag,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};