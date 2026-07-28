const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserIdByUsername, getUserGroups } = require('../../services/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grup-listele')
    .setDescription('Roblox kullanıcısının tüm gruplarını sayfalı olarak listeler')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **Roblox grupları aranıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const userId = await getUserIdByUsername(kullaniciAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const gruplar = await getUserGroups(userId);
    if (!gruplar.length) return interaction.editReply(`❌ **${kullaniciAdi}** hiçbir gruba üye değil.`);

    const PER_PAGE = 5; // Her sayfada kaç grup görüneceği
    const totalPages = Math.ceil(gruplar.length / PER_PAGE);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * PER_PAGE;
      const currentGroups = gruplar.slice(start, start + PER_PAGE);

      return new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle(`📋 ${kullaniciAdi} (${userId}) - Gruplar`)
        .setDescription(currentGroups.map(g =>
          `**${g.groupName}** (ID: ${g.groupId})\nRol: ${g.roleName} (Seviye: ${g.roleRank})`
        ).join('\n\n'))
        .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} • İttifak Bot` })
        .setTimestamp();
    };

    const generateButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️ Önceki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Sonraki ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );
    };

    const initialMessage = await interaction.editReply({
      content: '✅ Gruplar bulundu:',
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [generateButtons(currentPage)] : []
    });

    if (totalPages <= 1) return;

    const collector = initialMessage.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu butonları sadece komutu kullanan kişi yönetebilir!', ephemeral: true });
      }

      if (i.customId === 'prev_page') {
        currentPage--;
      } else if (i.customId === 'next_page') {
        currentPage++;
      }

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)]
      });
    });

    collector.on('end', () => {
      initialMessage.edit({ components: [] }).catch(() => {});
    });
  }
};
