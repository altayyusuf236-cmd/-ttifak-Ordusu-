const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, setRank, getGroupRoles, getMemberRank } = require('../../services/roblox');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brans-rutbe-tenzil')
    .setDescription('Seçilen branş grubunda kullanıcıyı 1 rütbe düşürür')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('brans-ismi').setDescription('Branş adı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Tenzil sebebi').setRequired(true)),

  async execute(interaction) {
    await interaction.reply('⏳ **Branş tenzil işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const bransIsmi = interaction.options.getString('brans-ismi');
    const sebep = interaction.options.getString('sebep');

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const brans = await Branş.findOne({ isim: bransIsmi, kampId: kamp._id });
    if (!brans || !brans.oyunGrubuId) return interaction.editReply('❌ Branş veya branş grup ID\'si bulunamadı.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, brans._id, hedefRobloxId, 'tenzil');
    if (!yetkiSonuc.yetkili) return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);

    try {
      const hedefMevcutRank = await getMemberRank(brans.oyunGrubuId, hedefRobloxId);
      const roller = await getGroupRoles(brans.oyunGrubuId);
      const siraliRoller = roller.filter(r => r.rank > 0).sort((a, b) => b.rank - a.rank);
      
      const oncekiRol = siraliRoller.find(r => r.rank < hedefMevcutRank);
      if (!oncekiRol) return interaction.editReply('❌ Kullanıcı zaten bu branşın taban rütbesinde.');

      if (oncekiRol.rank < (brans.tabanRutbe || 0)) {
        return interaction.editReply(`❌ Bu branşın taban rütbe seviyesinin (${brans.tabanRutbe}) altına düşürülemez.`);
      }

      await setRank(brans.oyunGrubuId, hedefRobloxId, oncekiRol.rank);
      await interaction.editReply(`✅ **${kullaniciAdi}** tenzil edildi.\n🔻 **Yeni Rütbe:** ${oncekiRol.name}\n📝 **Sebep:** ${sebep}`);
      
      log('BILGI', 'Branş tenzil edildi', { 
        yetkili: interaction.user.tag, 
        hedef: kullaniciAdi, 
        brans: brans.isim, 
        yeniRutbe: oncekiRol.name,
        sebep: sebep 
      });
    } catch (err) {
      await interaction.editReply('❌ Tenzil işlemi başarısız oldu.');
    }
  }
};
