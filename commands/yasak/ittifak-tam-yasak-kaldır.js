const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Kurum = require('../../models/Kurum');
const Yasak = require('../../models/Yasak');
const { ittifakYetkiKontrol } = require('../../utils/yetki');
const { logIslem } = require('../../services/logger');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-tam-yasak-kaldir')
    .setDescription('İttifak tam yasağını, branş ve kurum yasaklarını kaldırır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı (ID veya Etiket)').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasağın kaldırılma sebebi').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **İttifak tam yasak kaldırma işlemi başlatılıyor...**');
    const user = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');

    if (!await ittifakYetkiKontrol(interaction.user.id, 'ittifak_yasak')) {
      return interaction.editReply('❌ Bu işlem için yetkiniz yok.');
    }

    const kamplar = await Kamp.find();
    const basarili = [];
    const basarisiz = [];

    for (const kamp of kamplar) {
      const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
      if (anaGuild) {
        try {
          await anaGuild.members.unban(user.id);
          basarili.push(`✅ ${anaGuild.name}`);
          await delay(1000);
        } catch (e) {
          basarisiz.push(`❌ ${anaGuild.name}`);
        }
      }

      const branşlar = await Branş.find({ kampId: kamp._id });
      for (const b of branşlar) {
        const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
        if (guild) {
          try {
            await guild.members.unban(user.id);
            basarili.push(`✅ ${guild.name} (${b.isim})`);
            await delay(1000);
          } catch (e) {
            basarisiz.push(`❌ ${guild.name} (${b.isim})`);
          }
        }
      }

      const kurumlar = await Kurum.find({ kampId: kamp._id });
      for (const k of kurumlar) {
        const guild = interaction.client.guilds.cache.get(k.discordSunucuId);
        if (guild) {
          try {
            await guild.members.unban(user.id);
            basarili.push(`✅ ${guild.name} (Kurum: ${k.isim})`);
            await delay(1000);
          } catch (e) {
            basarisiz.push(`❌ ${guild.name} (Kurum: ${k.isim})`);
          }
        }
      }

      await Yasak.updateOne({ userId: user.id, kampId: kamp._id, tur: 'ittifak' }, { aktif: false });
    }

    try {
      await user.send(`${interaction.user.tag} kişisi tarafından ${sebep} sebebiyle tüm İttifak Ordusu Sunucularından yasağınız kaldırıldı`);
    } catch (e) {}

    await interaction.editReply(`✅ **${user.tag}** için ittifak yasağı, branş ve kurum yasakları kaldırıldı.`);

    await logIslem(interaction, 'yasak', 'İttifak tam yasak kaldırıldı', {
      Kullanıcı: user.tag,
      Sebep: sebep
    });
  }
};
