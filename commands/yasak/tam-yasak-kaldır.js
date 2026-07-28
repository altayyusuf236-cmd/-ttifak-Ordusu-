const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername } = require('../../services/roblox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun-yasak-kaldir')
    .setDescription('Roblox oyun yasağını veritabanından kaldırır')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Oyun yasak kaldırma işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');
    if (!await yetkiKontrol(interaction.user.id, kamp._id, 'oyun_yasak')) {
      return interaction.editReply('❌ Bu işlem için yetkiniz yok.');
    }

    const userId = await getUserIdByUsername(kullaniciAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    await Yasak.updateOne({ userId: userId.toString(), kampId: kamp._id, tur: 'oyun' }, { aktif: false });
    await interaction.editReply(`✅ **${kullaniciAdi}** (${userId}) için oyun yasağı veritabanından kaldırıldı. Artık oyuna girebilir.`);
  }
};
