const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { ittifakYetkiKontrol } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-tam-yasakla')
    .setDescription('Kullanıcıyı tüm ittifak kamplarından yasaklar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **İttifak tam yasak işlemi başlatılıyor...**');

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
          await anaGuild.members.ban(user.id, { reason: 'İttifak tam yasak' });
          basarili.push(`✅ ${anaGuild.name} (${kamp.isim} - Ana)`);
        } catch (e) {
          basarisiz.push(`❌ ${anaGuild.name} (${kamp.isim} - Yetki yok)`);
        }
      } else {
        basarisiz.push(`❌ ${kamp.isim} ana sunucusu bulunamadı`);
      }

      const branşlar = await Branş.find({ kampId: kamp._id });
      for (const b of branşlar) {
        const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
        if (guild) {
          try {
            await guild.members.ban(user.id, { reason: 'İttifak tam yasak' });
            basarili.push(`✅ ${guild.name} (${kamp.isim} - ${b.isim})`);
          } catch (e) {
            basarisiz.push(`❌ ${guild.name} (${kamp.isim} - ${b.isim}) - Yetki yok`);
          }
        } else {
          basarisiz.push(`❌ ${kamp.isim} - ${b.isim} sunucusu bulunamadı`);
        }
      }

      await Yasak.create({ userId: user.id, kampId: kamp._id, tur: 'ittifak' });
    }

    const mesaj = `✅ **${user.tag}** tüm ittifak kamplarından yasaklandı.\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'yasak', 'İttifak tam yasak yapıldı', {
      Kullanıcı: user.tag,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};