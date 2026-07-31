const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');
const DogrulamaKodu = require('../../models/DogrulamaKodu');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dogrulama-sifirla') // Discord slash isimlerinde Türkçe karakter (ğ, ı) KULLANILAMAZ!
    .setDescription('Mevcut Roblox doğrulamasını sıfırlar (başka hesap bağlamak için)'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const kayit = await Kullanici.findOne({ discordId: interaction.user.id });

      // Olası bekleyen / yarım kalmış doğrulama kodlarını da temizleyelim
      await DogrulamaKodu.deleteMany({ discordId: interaction.user.id });

      if (!kayit) {
        return interaction.editReply('❌ Sistemde zaten doğrulanmış veya kayıtlı bir hesabınız bulunmuyor.');
      }

      // HATA DÜZELTİLDİ: kayit._id doğrudan Mongo ID'si ile silinmeli
      await Kullanici.deleteOne({ _id: kayit._id });

      return interaction.editReply('✅ Roblox hesap doğrulamanız başarıyla sıfırlandı! Şimdi **/dogrula-baslat** ile doğru Roblox hesabınızı bağlayabilirsiniz.');
    } catch (error) {
      console.error('Doğrulama sıfırlama hatası:', error);
      return interaction.editReply('❌ Sıfırlama işlemi sırasında bir veritabanı hatası oluştu.');
    }
  }
};
