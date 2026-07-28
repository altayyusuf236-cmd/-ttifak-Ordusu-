const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Kamp = require('../../models/Kamp');
const Yasak = require('../../models/Yasak');
const kampBul = require('../../utils/kampBul');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tam-yasaklilari-goster')
    .setDescription('Kamptaki aktif tam yasaklı kullanıcıları listeler.')
    .addStringOption(opt => 
      opt.setName('kamp-ismi')
        .setDescription('Kamp adı (opsiyonel)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.reply('Tam yasaklılar listesi yükleniyor...');

    const kampIsmi = interaction.options.getString('kamp-ismi');
    let kamp = kampIsmi ? await Kamp.findOne({ isim: kampIsmi }) : await kampBul(interaction.guildId);

    if (!kamp) return interaction.editReply('Aranan kriterlere uygun bir kamp bulunamadı.');

    const yasaklar = await Yasak.find({ kampId: kamp._id, tur: 'tam', aktif: true });

    if (!yasaklar.length) {
      return interaction.editReply(`**${kamp.isim}** kampında aktif tam yasaklı kimse bulunmuyor.`);
    }

    const liste = yasaklar.map((y, index) => {
      const tarihStr = y.tarih ? `<t:${Math.floor(new Date(y.tarih).getTime() / 1000)}:R>` : 'Bilinmiyor';
      return `${index + 1}. <@${y.userId}> (\`${y.userId}\`) - Sebep: *${y.sebep || 'Belirtilmemiş'}* (${tarihStr})`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`${kamp.isim} - Aktif Tam Yasaklılar`)
      .setDescription(liste.length > 4096 ? liste.substring(0, 4093) + '...' : liste)
      .setTimestamp()
      .setFooter({ text: `Toplam ${yasaklar.length} aktif tam yasaklı listeleniyor.` });

    await interaction.editReply({ content: '', embeds: [embed] });
  }
};
