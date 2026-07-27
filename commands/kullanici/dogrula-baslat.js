const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');
const DogrulamaKodu = require('../../models/DogrulamaKodu');
const { getUserIdByUsername } = require('../../services/roblox');

function rastgeleKod() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dogrula-baslat')
    .setDescription('Doğrulama kodunu başlatır')
    .addStringOption(opt => opt.setName('roblox-adi').setDescription('Roblox kullanıcı adı').setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const robloxAdi = interaction.options.getString('roblox-adi');
    const userId = await getUserIdByUsername(robloxAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const varMi = await Kullanici.findOne({ discordId: interaction.user.id });
    if (varMi && varMi.dogrulandi) return interaction.editReply('❌ Zaten doğrulanmışsınız.');

    const baska = await Kullanici.findOne({ robloxId: userId.toString(), dogrulandi: true });
    if (baska) return interaction.editReply('❌ Bu Roblox hesabı zaten başka bir Discord hesabına bağlı.');

    const kod = rastgeleKod();
    await DogrulamaKodu.deleteMany({ discordId: interaction.user.id });
    await DogrulamaKodu.create({
      discordId: interaction.user.id,
      robloxId: userId.toString(),
      robloxAdi: robloxAdi,
      kod: kod
    });

    let dmGonderildi = false;
    try {
      await interaction.user.send(`🔑 Doğrulama kodunuz: \`${kod}\`\n1 dakika içinde Discord açıklamanıza yazın ve **/dogrula-tamamla** yapın.`);
      dmGonderildi = true;
    } catch (e) {}

    await interaction.editReply(dmGonderildi
      ? '✅ Kod DM ile gönderildi. Açıklamaya yazıp **/dogrula-tamamla** yapın.'
      : `⚠️ DM gönderilemedi. Kod: \`${kod}\`\nAçıklamaya yazıp **/dogrula-tamamla** yapın.`
    );
  }
};