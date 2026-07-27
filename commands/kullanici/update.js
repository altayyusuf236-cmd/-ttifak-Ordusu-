const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');
const Kamp = require('../../models/Kamp');
const { getMemberRank } = require('../../services/roblox');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Roblox rütbenizi günceller (doğrulanmış olmanız gerekir)')
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const kullanici = await Kullanici.findOne({ discordId: interaction.user.id });
    if (!kullanici || !kullanici.dogrulandi) {
      return interaction.editReply('❌ Önce **/doğrula** ile Roblox hesabınızı doğrulayın.');
    }

    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp;

    if (kampIsmi) {
      kamp = await Kamp.findOne({ isim: kampIsmi });
    } else {
      kamp = await kampBul(interaction.guildId);
    }

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı. Lütfen kamp ismi belirtin.');

    const rank = await getMemberRank(kamp.oyunGrubuId, kullanici.robloxId);
    if (rank === null) {
      return interaction.editReply(`❌ Roblox hesabınız (${kullanici.robloxAdi}) bu grupta değil.`);
    }

    // Güncelle
    kullanici.mevcutRutbe = rank;
    kullanici.sonGuncelleme = new Date();
    await kullanici.save();

    await interaction.editReply(`✅ **${kullanici.robloxAdi}** rütbeniz güncellendi. Mevcut rütbeniz: **${rank}**`);
  }
};