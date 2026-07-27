const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserIdByUsername, getUserGroups } = require('../../services/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('grup-listele')
    .setDescription('Roblox kullanıcısının tüm gruplarını listeler')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true)),
  async execute(interaction) {
    await interaction.reply('⏳ **Roblox grupları aranıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const userId = await getUserIdByUsername(kullaniciAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const gruplar = await getUserGroups(userId);
    if (!gruplar.length) return interaction.editReply(`❌ **${kullaniciAdi}** hiçbir gruba üye değil.`);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle(`📋 ${kullaniciAdi} (${userId}) - Gruplar`)
      .setDescription(gruplar.map(g =>
        `**${g.groupName}** (ID: ${g.groupId})\nRol: ${g.roleName} (Seviye: ${g.roleRank})`
      ).join('\n\n'))
      .setFooter({ text: 'İttifak Bot' })
      .setTimestamp();

    await interaction.editReply({ content: '✅ Gruplar bulundu:', embeds: [embed] });
  }
};