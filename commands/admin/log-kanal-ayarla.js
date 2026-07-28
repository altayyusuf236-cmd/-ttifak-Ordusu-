const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LogKanal = require('../../models/LogKanal');
const Kamp = require('../../models/Kamp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-kanal-ayarla')
    .setDescription('Log kanalını ayarla')
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı').setRequired(true))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Log kanalı').setRequired(true))
    .addStringOption(opt => opt.setName('tur').setDescription('Log türü').addChoices(
      { name: 'Tam Yasak', value: 'tam_yasak' },
      { name: 'Oyun Yasak', value: 'oyun_yasak' },
      { name: 'Rütbe', value: 'rutbe' },
      { name: 'Branş', value: 'branş' },
      { name: 'Hepsi', value: 'hepsi' }
    ).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const kampIsmi = interaction.options.getString('kamp-ismi');
    const kanal = interaction.options.getChannel('kanal');
    const logTuru = interaction.options.getString('tur');

    const kamp = await Kamp.findOne({ isim: kampIsmi });
    if (!kamp) return interaction.reply({ content: '❌ Kamp bulunamadı.', ephemeral: true });

    await LogKanal.findOneAndUpdate(
      { kampId: kamp._id, logTuru },
      { kanalId: kanal.id },
      { upsert: true, new: true }
    );

    await interaction.reply(`✅ **${kampIsmi}** kampı için **${logTuru}** log kanalı **#${kanal.name}** olarak ayarlandı.`);
  }
};
