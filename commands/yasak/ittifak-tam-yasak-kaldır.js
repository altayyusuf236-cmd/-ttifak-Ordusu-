const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Yasak = require('../../models/Yasak');
const { ittifakYetkiKontrol } = require('../../utils/yetki');

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ittifak-tam-yasak-kaldir')
    .setDescription('İttifak tam yasağı kaldırır')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **İttifak tam yasak kaldırma işlemi başlatılıyor...**');
    const user = interaction.options.getUser('kullanici');

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
      await Yasak.updateOne({ userId: user.id, kampId: kamp._id, tur: 'ittifak' }, { aktif: false });
    }

    await interaction.editReply(`✅ **${user.tag}** için ittifak yasağı kaldırıldı.`);
  }
};
