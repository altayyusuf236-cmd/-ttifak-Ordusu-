const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Kurum = require('../../models/Kurum');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurum-ekle')
    .setDescription('Kampa yeni kurum ekler')
    .addStringOption(opt => opt.setName('isim').setDescription('Kurum ismi').setRequired(true))
    .addStringOption(opt => opt.setName('sunucu-id').setDescription('Kurumun Discord sunucu IDsi').setRequired(true))
    .addStringOption(opt => opt.setName('grup-id').setDescription('Roblox grup IDsi (opsiyonel)').setRequired(false))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)').setRequired(false)),
  async execute(interaction) {
    await interaction.reply('⏳ **Kurum ekleniyor...**');

    const kurumIsmi = interaction.options.getString('isim');
    const sunucuId = interaction.options.getString('sunucu-id');
    const robloxGrupId = interaction.options.getString('grup-id');
    const kampIsmi = interaction.options.getString('kamp-ismi');

    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'tam_yasak')) {
      return interaction.editReply('❌ Bu işlem için yetkiniz yok.');
    }

    const varmi = await Kurum.findOne({ kampId: kamp._id, isim: kurumIsmi });
    if (varmi) return interaction.editReply('❌ Bu isimde bir kurum zaten var.');

    await Kurum.create({
      isim: kurumIsmi,
      kampId: kamp._id,
      discordSunucuId: sunucuId,
      robloxGrupId: robloxGrupId || null
    });

    await interaction.editReply(`✅ **${kurumIsmi}** kurumu başarıyla eklendi.`);
  }
};
