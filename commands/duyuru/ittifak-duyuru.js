const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const { ittifakYetkiKontrol } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-duyuru')
    .setDescription('Tüm ittifak kamplarında duyuru yapar')
    .addStringOption(opt => opt.setName('kanal-adi').setDescription('Duyuru yapılacak kanal adı').setRequired(true))
    .addStringOption(opt => opt.setName('duyuru').setDescription('Duyuru mesajı').setRequired(true))
    .addStringOption(opt => opt.setName('imza').setDescription('İmza (yetkili adı)').setRequired(true)),
  async execute(interaction) {
    if (!await ittifakYetkiKontrol(interaction.user.id, 'ittifak_duyuru')) {
      return interaction.reply({ content: '❌ Bu işlem için İttifak Duyuru yetkiniz yok.', ephemeral: true });
    }

    const kanalAdi = interaction.options.getString('kanal-adi');
    const duyuru = interaction.options.getString('duyuru');
    const imza = interaction.options.getString('imza');

    await interaction.reply('⏳ **Duyuru yayınlanıyor...**');

    const kamplar = await Kamp.find();
    if (!kamplar.length) return interaction.editReply('❌ Hiç kamp bulunamadı.');

    const basarili = [];
    const basarisiz = [];

    for (const kamp of kamplar) {
      const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
      if (anaGuild) {
        const kanal = anaGuild.channels.cache.find(c => c.name === kanalAdi && c.isTextBased());
        if (kanal) {
          try {
            await kanal.send(`*${duyuru}*\n\n**${imza}**`);
            basarili.push(` ${anaGuild.name} (${kamp.isim})`);
          } catch (e) {
            basarisiz.push(`❌ ${anaGuild.name} (${kamp.isim}) - Mesaj gönderilemedi`);
          }
        } else {
          basarisiz.push(`❌ ${anaGuild.name} (${kamp.isim}) - "${kanalAdi}" kanalı bulunamadı`);
        }
      } else {
        basarisiz.push(`❌ ${kamp.isim} ana sunucusu bulunamadı`);
      }

      const branşlar = await Branş.find({ kampId: kamp._id });
      for (const b of branşlar) {
        const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
        if (guild) {
          const kanal = guild.channels.cache.find(c => c.name === kanalAdi && c.isTextBased());
          if (kanal) {
            try {
              await kanal.send(`📢 **${duyuru}**\n\n✍️ ${imza}`);
              basarili.push(` ${guild.name} (${kamp.isim} - ${b.isim})`);
            } catch (e) {
              basarisiz.push(`❌ ${guild.name} (${kamp.isim} - ${b.isim}) - Mesaj gönderilemedi`);
            }
          } else {
            basarisiz.push(`❌ ${guild.name} (${kamp.isim} - ${b.isim}) - "${kanalAdi}" kanalı bulunamadı`);
          }
        } else {
          basarisiz.push(`❌ ${kamp.isim} - ${b.isim} sunucusu bulunamadı`);
        }
      }
    }

    const mesaj = ` **Duyuru yayınlandı.**\n\n**Başarılı:**\n${basarili.join('\n') || 'Yok'}\n\n**Başarısız:**\n${basarisiz.join('\n') || 'Yok'}`;
    await interaction.editReply(mesaj);

    await logIslem(interaction, 'duyuru', 'Duyuru yayınlandı', {
      Duyuru: duyuru,
      İmza: imza,
      'Başarılı Sunucu': basarili.length,
      'Başarısız Sunucu': basarisiz.length
    });
  }
};