const { SlashCommandBuilder } = require('discord.js');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, setRank, getGroupRoles, getMemberRank } = require('../../services/roblox');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbe-tenzil')
    .setDescription('Ana kamp grubunda kullanıcıyı 1 rütbe düşürür')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Tenzil sebebi').setRequired(true)),

  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe tenzil işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const sebep = interaction.options.getString('sebep');

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, null, hedefRobloxId, 'tenzil');
    if (!yetkiSonuc.yetkili) return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);

    try {
      const hedefMevcutRank = await getMemberRank(kamp.oyunGrubuId, hedefRobloxId);
      const roller = await getGroupRoles(kamp.oyunGrubuId);
      const siraliRoller = roller.filter(r => r.rank > 0).sort((a, b) => b.rank - a.rank);
      
      const oncekiRol = siraliRoller.find(r => r.rank < hedefMevcutRank);
      if (!oncekiRol) return interaction.editReply(`❌ Kullanıcı taban rütbede veya alt rütbe yok.`);

      if (oncekiRol.rank < (kamp.tabanRutbe || 0)) {
        return interaction.editReply(`❌ Kampın taban rütbe seviyesinin (${kamp.tabanRutbe}) altına düşürülemez.`);
      }

      await setRank(kamp.oyunGrubuId, hedefRobloxId, oncekiRol.rank);
      await interaction.editReply(` **${kullaniciAdi}** tenzil edildi.\n **Yeni Rütbe:** ${oncekiRol.name}\n **Sebep:** ${sebep}`);
      
      log('BILGI', 'Ana kamp tenzil', { 
        yetkili: interaction.user.tag, 
        hedef: kullaniciAdi, 
        yeniRutbe: oncekiRol.name,
        sebep: sebep 
      });
    } catch (err) {
      await interaction.editReply(`❌ Tenzil başarısız oldu.`);
    }
  }
};
