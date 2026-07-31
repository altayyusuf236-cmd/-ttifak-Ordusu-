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

    const rehberMesaj = `🔑 Doğrulama kodunuz: \`${kod}\`\n👉 Lütfen bu kodu **Roblox profilinizdeki Hakkında (About)** kısmına yapıştırın ve ardından **/dogrula-tamamla** komutunu çalıştırın.`;

    let dmGonderildi = false;
    try {
      await interaction.user.send(rehberMesaj);
      dmGonderildi = true;
    } catch (e) {}

    await interaction.editReply(dmGonderildi
      ? '✅ Kod DM ile gönderildi. Roblox profilinize ekleyip **/dogrula-tamamla** yapın.'
      : `⚠️ DM gönderilemedi.\n🔑 Kodunuz: \`${kod}\`\nRoblox profilinizin **Hakkında** kısmına yazıp **/dogrula-tamamla** yapın.`
    );
  }
};
