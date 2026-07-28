const { SlashCommandBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yasak = require('../../models/Yasak');
const { yetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername } = require('../../services/roblox');
const { logIslem } = require('../../services/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun-yasakla')
    .setDescription('Roblox oyunundan yasaklar (Gruba dokunmaz)')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklanma sebebi').setRequired(true))
    .addStringOption(opt => opt.setName('kamp-ismi').setDescription('Kamp adı (opsiyonel)')),
  async execute(interaction) {
    await interaction.reply('⏳ **Oyun yasak işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const sebep = interaction.options.getString('sebep');
    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);

    if (!kamp) return interaction.editReply('❌ Kamp bulunamadı.');

    const yetkili = await yetkiKontrol(interaction.user.id, kamp._id, 'oyun_yasak');
    if (!yetkili) return interaction.editReply('❌ Bu işlem için yetkiniz yok.');

    const userId = await getUserIdByUsername(kullaniciAdi);
    if (!userId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    // Sadece veritabanına "oyun" yasağı olarak işliyoruz. Roblox oyunundaki script bu kaydı okuyup adamı kickleyecek.
    await Yasak.findOneAndUpdate(
      { userId: userId.toString(), kampId: kamp._id, tur: 'oyun' },
      { aktif: true, sebep: sebep, tarih: new Date() },
      { upsert: true, new: true }
    );

    await interaction.editReply(`✅ **${kullaniciAdi}** (${userId}) veritabanında oyundan yasaklandı.\n*(Not: Roblox içindeki script bu veriyi okuduğunda kullanıcı oyuna giremeyecektir.)*`);
    
    await logIslem(interaction, 'yasak', 'Oyun yasak işlemi yapıldı', {
      'Roblox Adı': kullaniciAdi,
      Kamp: kamp.isim,
      Sebep: sebep
    });
  }
};
