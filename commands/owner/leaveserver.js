const { SlashCommandBuilder } = require('discord.js');

const SAHIP_ID = '1469310778518536265';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaveserver')
    .setDescription('Belirtilen ID ye sahip sunucudan çıkar (Sadece Kurucu).')
    .addStringOption(option => 
      option.setName('sunucu_id')
        .setDescription('Çıkılacak sunucunun ID numarası')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== SAHIP_ID) {
      return interaction.reply({ content: 'Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const guildId = interaction.options.getString('sunucu_id');
    const guild = interaction.client.guilds.cache.get(guildId);

    if (!guild) {
      return interaction.reply({ content: `Sistemde ${guildId} ID numaralı bir sunucu bulunamadı.`, ephemeral: true });
    }

    try {
      await guild.leave();
      await interaction.reply({ content: `Başarıyla **${guild.name}** (${guild.id}) sunucusundan çıkış yapıldı.`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Sunucudan çıkarken bir hata oluştu: ${error.message}`, ephemeral: true });
    }
  }
};
