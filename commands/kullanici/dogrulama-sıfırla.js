const { SlashCommandBuilder } = require('discord.js');
const Kullanici = require('../../models/Kullanici');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('doğrulama-sıfırla')
    .setDescription('Mevcut doğrulamayı sıfırlar (başka hesap bağlamak için)'),
  async execute(interaction) {
    const kayit = await Kullanici.findOne({ discordId: interaction.user.id });
    if (!kayit) {
      return interaction.reply({ content: '❌ Zaten doğrulanmış bir hesabınız yok.', ephemeral: true });
    }

    if (kayit.dogrulandi) {
      await Kullanici.deleteOne({ discordId: kayit._id });
      return interaction.reply({ content: '✅ Doğrulamanız sıfırlandı. Yeni bir doğrulama için `/doğrula` kullanabilirsiniz.', ephemeral: true });
    } else {
      // Zaten doğrulanmamış ama kayıt varsa sil
      await Kullanici.deleteOne({ discordId: kayit._id });
      return interaction.reply({ content: '✅ Kaydınız temizlendi. Tekrar deneyebilirsiniz.', ephemeral: true });
    }
  }
};