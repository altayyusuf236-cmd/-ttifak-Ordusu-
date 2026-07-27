const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');
const DogrulamaKodu = require('../../models/DogrulamaKodu');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dogrula-tamamla')
    .setDescription('Doğrulama işlemini tamamlar (açıklamadaki kodu kontrol eder)'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = await interaction.client.users.fetch(interaction.user.id);
    const about = user.bio || '';

    const kayit = await DogrulamaKodu.findOne({ discordId: interaction.user.id });
    if (!kayit) return interaction.editReply('❌ Önce **/dogrula-baslat** ile kod alın.');

    if (!about.includes(kayit.kod)) {
      return interaction.editReply(`❌ Kod açıklamanızda bulunamadı. Kod: \`${kayit.kod}\` (1 dakika geçerli)`);
    }

    await Kullanici.findOneAndUpdate(
      { discordId: interaction.user.id },
      {
        discordId: interaction.user.id,
        robloxId: kayit.robloxId,
        robloxAdi: kayit.robloxAdi,
        dogrulandi: true,
        dogrulamaTarihi: new Date()
      },
      { upsert: true, new: true }
    );

    await DogrulamaKodu.deleteMany({ discordId: interaction.user.id });
    await interaction.editReply(`✅ **${kayit.robloxAdi}** ile doğrulandı. /update ile rütbenizi güncelleyin.`);
  }
};