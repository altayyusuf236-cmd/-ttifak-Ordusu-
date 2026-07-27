const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun-yasak-kaldır')
    .setDescription('Roblox oyun yasağını kaldırır')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Oyun yasak kaldırma işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp;

    if (kampIsmi) {
      kamp = await Kamp.findOne({ isim: kampIsmi });
    } else {
      kamp = await kampBul(interaction.guildId);
    }

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const yetkili = await yetkiKontrol(interaction.user.id, kamp._id, 'oyun_yasak');
    if (!yetkili) return interaction.editReply('❌ Bu işlem için yetkiniz yok.');

    const userId = await getUserIdByUsername(kullaniciAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    await Yasak.updateOne({ userId: userId.toString(), kampId: kamp._id, tur: 'oyun' }, { aktif: false });
    await interaction.editReply(`✅ **${kullaniciAdi}** (${userId}) için oyun yasağı kaldırıldı. (Manuel olarak gruba tekrar eklemeniz gerekebilir.)`);

    await logIslem(interaction, 'yasak', 'Oyun yasak kaldırıldı', {
      'Roblox Adı': kullaniciAdi,
      Kamp: kamp.isim
    });
  }
};