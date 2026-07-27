const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Log = require('../../models/Log');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal-ayarla')
    .setDescription('Log kanalını ayarlar (sadece admin)')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Log kanalı').setRequired(true))
    .addStringOption(opt => opt.setName('tur').setDescription('Log türü').addChoices(
      { name: 'Yasak', value: 'yasak' },
      { name: 'Rütbe', value: 'rutbe' },
      { name: 'Branş', value: 'branş' },
      { name: 'Duyuru', value: 'duyuru' },
      { name: 'Yetki', value: 'yetki' },
      { name: 'Sistem', value: 'sistem' }
    ).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const kanal = interaction.options.getChannel('kanal');
    const tur = interaction.options.getString('tur');

    await Log.findOneAndUpdate(
      { sunucuId: interaction.guildId, tur },
      { kanalId: kanal.id },
      { upsert: true, new: true }
    );

    await interaction.reply(`✅ Log kanalı **#${kanal.name}** olarak ayarlandı (Tür: ${tur}).`);
  }
};