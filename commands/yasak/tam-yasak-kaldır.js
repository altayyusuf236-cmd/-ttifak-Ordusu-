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
    .setName('tam-yasak-kaldir')
    .setDescription('Kullanıcının kamp, branş ve kurum yasağını kaldırır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı (ID veya Etiket)').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasağın kaldırılma sebebi').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Tam yasak kaldırma işlemi başlatılıyor...**');

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
        await anaGuild.members.unban(user.id);
        basarili.push(`✅ ${anaGuild.name} (Ana Kamp)`);
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

    await Yasak.updateOne({ userId: user.id, kampId: kamp._id, tur: 'tam' }, { aktif: false });

    try {
      await user.send(`${interaction.user.tag} kişisi tarafından ${sebep} sebebiyle ${kamp.isim} Kampının Tüm Sunucularından yasağınız kaldırıldı`);
    } catch (e) {}

    await interaction.editReply(`✅ **${user.tag}** için kamp ve kurum yasakları kaldırıldı.`);

    await logIslem(interaction, 'yasak', 'Tam yasak kaldırıldı', {
      Kullanıcı: user.tag,
      Kamp: kamp.isim,
      Sebep: sebep
    });
  }
};
