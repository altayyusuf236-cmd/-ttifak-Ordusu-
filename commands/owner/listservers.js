const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const SAHIP_ID = '1469310778518536265';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listservers')
    .setDescription('Botun bulunduğu sunucuları listeler (Sadece Kurucu).'),
  async execute(interaction) {
    if (interaction.user.id !== SAHIP_ID) {
      return interaction.reply({ content: 'Bu komutu sadece bot sahibi kullanabilir.', ephemeral: true });
    }

    const guilds = interaction.client.guilds.cache.map(g => `**${g.name}** | \`${g.id}\``);
    
    let chunks = [];
    let currentChunk = '';
    
    // Discord embed açıklama sınırı 4096 karakterdir. Bot çok sunucudaysa hata vermemesi için bölüyoruz.
    for (const guildStr of guilds) {
      if (currentChunk.length + guildStr.length > 4000) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += guildStr + '\n';
    }
    if (currentChunk) chunks.push(currentChunk);

    for (let i = 0; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle(i === 0 ? `Botun Bulunduğu Sunucular (${interaction.client.guilds.cache.size})` : 'Sunucular (Devam)')
        .setDescription(chunks[i] || 'Sunucu bulunamadı.');
      
      if (i === 0) await interaction.reply({ embeds: [embed], ephemeral: true });
      else await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  }
};
