const { SlashCommandBuilder } = require('discord.js');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, setRank, getGroupRoles } = require('../../services/roblox');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rutbe-degistir')
    .setDescription('Ana kamp grubunda rütbe değiştirir')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('rutbe-adi').setDescription('Hedef rütbe adı').setRequired(true).setAutocomplete(true)),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return await interaction.respond([]);

    try {
      const roller = await getGroupRoles(kamp.oyunGrubuId);
      const filtrelenmis = roller.filter(rol => 
        rol.rank <= (kamp.maxRutbe || 255) && 
        rol.rank > 0 && 
        rol.name.toLowerCase().includes(focusedValue.toLowerCase())
      );
      await interaction.respond(filtrelenmis.slice(0, 25).map(rol => ({ name: rol.name, value: rol.name })));
    } catch (error) {
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe değiştirme işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const rutbeAdi = interaction.options.getString('rutbe-adi');

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, null, hedefRobloxId, 'degistir');
    if (!yetkiSonuc.yetkili) return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);

    try {
      const roller = await getGroupRoles(kamp.oyunGrubuId);
      const hedefRol = roller.find(r => r.name === rutbeAdi);
      
      if (!hedefRol) return interaction.editReply(`❌ "${rutbeAdi}" rütbesi grupta bulunamadı.`);
      
      if (hedefRol.rank > (kamp.maxRutbe || 255)) {
        return interaction.editReply(`❌ Bu grupta verebileceğiniz maksimum rütbe sınırı **${kamp.maxRutbe}**'dir.`);
      }

      if (hedefRol.rank >= yetkiSonuc.yetkiliRank) {
        return interaction.editReply(`❌ Kendi rütbenizden (${yetkiSonuc.yetkiliRank}) yüksek veya eşit bir rütbeye atama yapamazsınız.`);
      }

      const basarili = await setRank(kamp.oyunGrubuId, hedefRobloxId, hedefRol.rank);
      if (basarili) {
        await interaction.editReply(`✅ **${kullaniciAdi}** başarıyla **${rutbeAdi}** rütbesine atandı.`);
        log('BILGI', 'Ana kamp rütbe değiştirildi', { yetkili: interaction.user.tag, hedef: kullaniciAdi, yeniRutbe: rutbeAdi });
      } else {
        await interaction.editReply(`❌ Rütbe değiştirilemedi. Bot yetkilerini kontrol edin.`);
      }
    } catch (error) {
      await interaction.editReply(`❌ İşlem sırasında bir hata oluştu.`);
    }
  }
};
