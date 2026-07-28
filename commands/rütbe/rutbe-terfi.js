const { SlashCommandBuilder } = require('discord.js');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, setRank, getGroupRoles, getMemberRank } = require('../../services/roblox');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbe-terfi')
    .setDescription('Ana kamp grubunda kullanıcıyı 1 rütbe terfi ettirir')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true)),
  
  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe terfi işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, null, hedefRobloxId, 'terfi');
    if (!yetkiSonuc.yetkili) return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);

    try {
      const hedefMevcutRank = await getMemberRank(kamp.oyunGrubuId, hedefRobloxId);
      const roller = await getGroupRoles(kamp.oyunGrubuId);
      const siraliRoller = roller.filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
      
      const sonrakiRol = siraliRoller.find(r => r.rank > hedefMevcutRank);
      if (!sonrakiRol) return interaction.editReply(`❌ Kullanıcı en yüksek rütbede.`);

      if (sonrakiRol.rank > (kamp.maxRutbe || 255)) {
        return interaction.editReply(`❌ Gruptaki max rütbe sınırı (${kamp.maxRutbe}) aşılıyor.`);
      }

      await setRank(kamp.oyunGrubuId, hedefRobloxId, sonrakiRol.rank);
      await interaction.editReply(`✅ **${kullaniciAdi}** terfi ettirildi. Yeni Rütbe: **${sonrakiRol.name}**`);
      log('BILGI', 'Ana kamp terfi', { yetkili: interaction.user.tag, hedef: kullaniciAdi, yeniRutbe: sonrakiRol.name });
    } catch (err) {
      await interaction.editReply(`❌ Terfi başarısız oldu.`);
    }
  }
};
