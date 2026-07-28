const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Branş = require('../../models/Branş');
const Kurum = require('../../models/Kurum');
const Yasak = require('../../models/Yasak');
const Yetki = require('../../models/Yetkili');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kamp-ayarlar')
    .setDescription('Kampın ayarlarını, log durumunu, yetkililerini ve istatistiklerini gösterir.')
    .addStringOption(opt => 
      opt.setName('kamp-ismi')
        .setDescription('Kamp adı (opsiyonel)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.reply('Kamp ayarları ve sistem paneli yükleniyor...');

    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);

    if (!kamp) return interaction.editReply('Aranan kriterlere uygun bir kamp bulunamadı.');

    const anaGuild = interaction.client.guilds.cache.get(kamp.anaSunucuId);
    const branşlar = await Branş.find({ kampId: kamp._id });
    const kurumlar = await Kurum.find({ kampId: kamp._id });
    
    // Yasak istatistikleri
    const aktifYasakSayisi = await Yasak.countDocuments({ kampId: kamp._id, aktif: true });
    const tamYasakSayisi = await Yasak.countDocuments({ kampId: kamp._id, aktif: true, tur: 'tam' });
    const oyunYasakSayisi = await Yasak.countDocuments({ kampId: kamp._id, aktif: true, tur: 'oyun' });
    const ittifakYasakSayisi = await Yasak.countDocuments({ kampId: kamp._id, aktif: true, tur: 'ittifak' });
    const toplamKayitSayisi = await Yasak.countDocuments({ kampId: kamp._id });

    // Yetkili istatistikleri
    const tamYasakYetkiliSayisi = await Yetki.countDocuments({ kampId: kamp._id, 'yetkiler.tam_yasak': true });
    const oyunYasakYetkiliSayisi = await Yetki.countDocuments({ kampId: kamp._id, 'yetkiler.oyun_yasak': true });
    const toplamYetkiliSayisi = await Yetki.countDocuments({ kampId: kamp._id });

    // Log Kanalı Durumu
    const logKanalBilgi = kamp.logKanalId ? `<#${kamp.logKanalId}> (\`${kamp.logKanalId}\`)` : 'Ayarlandı/Tanımlı Değil';

    const anaGrupLink = kamp.robloxGrupId 
      ? `[Roblox Grubu](https://www.roblox.com/groups/${kamp.robloxGrupId})` 
      : 'Grup ID eklenmemiş';

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${kamp.isim} - Kamp Sistem Paneli`)
      .setDescription(`Bu panel ${kamp.isim} kampına ait tüm aktif yapılandırmaları, bağlı sunucuları, Roblox grup bağlantılarını, log durumunu ve yetkili/yasak istatistiklerini listeler.`)
      .addFields(
        {
          name: 'Ana Sunucu ve Log Bilgisi',
          value: anaGuild ? `**${anaGuild.name}**\nSunucu ID: \`${kamp.anaSunucuId}\`\nGrup: ${anaGrupLink}\nLog Kanalı: ${logKanalBilgi}` : `Sunucuya ulaşılamıyor (\`${kamp.anaSunucuId}\`)`,
          inline: false
        },
        {
          name: `Bagli Branslar (${branşlar.length})`,
          value: branşlar.length ? branşlar.map(b => {
            const guild = interaction.client.guilds.cache.get(b.discordSunucuId);
            const sunucuAdi = guild ? guild.name : 'Bilinmeyen Sunucu';
            const grupLink = b.robloxGrupId 
              ? ` - [Roblox Grubu](https://www.roblox.com/groups/${b.robloxGrupId})` 
              : '';
            return `• **${b.isim}** — ${sunucuAdi} (\`${b.discordSunucuId}\`)${grupLink}`;
          }).join('\n') : 'Bu kampa bağlı hiç branş eklenmemiş',
          inline: false
        },
        {
          name: `Bagli Kurumlar (${kurumlar.length})`,
          value: kurumlar.length ? kurumlar.map(k => {
            const guild = interaction.client.guilds.cache.get(k.discordSunucuId);
            const sunucuAdi = guild ? guild.name : 'Bilinmeyen Sunucu';
            const grupLink = k.robloxGrupId 
              ? ` - [Roblox Grubu](https://www.roblox.com/groups/${k.robloxGrupId})` 
              : '';
            return `• **${k.isim}** — ${sunucuAdi} (\`${k.discordSunucuId}\`)${grupLink}`;
          }).join('\n') : 'Bu kampa bağlı hiç kurum eklenmemiş',
          inline: false
        },
        {
          name: 'Yetkili İstatistikleri',
          value: `Toplam Yetkili Kaydı: **${toplamYetkiliSayisi}**\n- Tam Yasak Yetkilisi: **${tamYasakYetkiliSayisi}**\n- Oyun Yasak Yetkilisi: **${oyunYasakYetkiliSayisi}**`,
          inline: false
        },
        {
          name: 'Sistem İstatistikleri',
          value: `Toplam Aktif Yasak / Cezalı Kaydı: **${aktifYasakSayisi}**\n- Aktif Tam Yasak: **${tamYasakSayisi}**\n- Aktif Oyun Yasağı: **${oyunYasakSayisi}**\n- Aktif İttifak Yasağı: **${ittifakYasakSayisi}**\n- Veritabanındaki Toplam Kayıt Geçmişi: **${toplamKayitSayisi}**`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'İttifak Bot • Gelişmiş Sistem Paneli' });

    await interaction.editReply({ content: '', embeds: [embed] });
  }
};
