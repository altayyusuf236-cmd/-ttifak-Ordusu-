const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const TicketAyar = require('../../models/TicketAyar');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-kurulum')
    .setDescription('Gelişmiş bilet sistemini bu kanala kurar.')
    .addChannelOption(opt => 
      opt.setName('kategori')
        .setDescription('Biletlerin açılacağı kategori')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addRoleOption(opt => 
      opt.setName('yetkili-rol')
        .setDescription('Biletlerle ilgilenecek yetkili rolü')
        .setRequired(true)
    )
    .addChannelOption(opt => 
      opt.setName('log-kanal')
        .setDescription('Bilet işlemlerinin kayıt edileceği kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const kategori = interaction.options.getChannel('kategori');
    const yetkiliRol = interaction.options.getRole('yetkili-rol');
    const logKanal = interaction.options.getChannel('log-kanal');

    let ayar = await TicketAyar.findOne({ sunucuId: interaction.guildId });
    if (!ayar) {
      ayar = new TicketAyar({ sunucuId: interaction.guildId });
    }

    ayar.kategoriId = kategori.id;
    ayar.yetkiliRolId = yetkiliRol.id;
    ayar.logKanalId = logKanal.id;
    await ayar.save();

    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle('Destek Sistemi')
      .setDescription('Bizimle iletişime geçmek için aşağıdaki menüden size en uygun konuyu seçebilirsiniz. Yetkili ekibimiz en kısa sürede sizinle ilgilenecektir.');

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_secim_menu')
        .setPlaceholder('Destek almak istediğiniz konuyu seçin')
        .addOptions([
          { label: 'Sorun veya Şikayet', description: 'Oyun içi veya sunucu içi sorunlarınızı bildirin.', value: 'sorun_sikayet' },
          { label: 'İşbirliği ve Partnerlik', description: 'Ortaklık ve işbirliği teklifleri için iletişime geçin.', value: 'isbirligi_partner' },
          { label: 'Yetkili Alımı', description: 'Ekibimize katılmak için başvuru yapın.', value: 'yetkili_alim' }
        ])
    );

    await interaction.channel.send({ embeds: [embed], components: [menu] });
    await interaction.reply({ content: 'Bilet sistemi başarıyla kuruldu ve ayarlar kaydedildi.', ephemeral: true });
  }
};
