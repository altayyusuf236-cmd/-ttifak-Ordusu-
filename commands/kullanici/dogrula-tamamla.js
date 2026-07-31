const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');
const DogrulamaKodu = require('../../models/DogrulamaKodu');
const { getUserBio } = require('../../services/roblox'); // YENİ: Roblox bio servisi eklendi

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dogrula-tamamla')
    .setDescription('Doğrulama işlemini tamamlar (Roblox açıklamanızdaki kodu kontrol eder)'),
    
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const kayit = await DogrulamaKodu.findOne({ discordId: interaction.user.id });
    if (!kayit) return interaction.editReply('❌ Önce **/dogrula-baslat** ile kod alın.');

    // Discord bio'su yerine doğrudan Roblox profilindeki "Hakkında/About" metni çekiliyor
    const robloxBio = await getUserBio(kayit.robloxId);

    if (!robloxBio || !robloxBio.includes(kayit.kod)) {
      return interaction.editReply(`❌ Kod Roblox profilinizin **Hakkında (About)** kısmında bulunamadı.\n🔑 Kodunuz: \`${kayit.kod}\`\n👉 Lütfen Roblox profil açıklamanıza bu kodu ekleyip birkaç saniye sonra tekrar deneyin.`);
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
    await interaction.editReply(`✅ **${kayit.robloxAdi}** hesabı başarıyla doğrulandı! /update ile rütbenizi güncelleyebilirsiniz.`);
  }
};
