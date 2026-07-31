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
    .addStringOption(opt => opt.setName('rutbe-adi').setDescription('Hedef rütbe adı').setRequired(true).setAutocomplete(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Rütbe değiştirme sebebi').setRequired(true)),

  async autocomplete(interaction) {
    try {
      const focusedValue = String(interaction.options.getFocused() || '').toLowerCase();
      const kamp = await kampBul(interaction.guildId);
      
      if (!kamp || !kamp.oyunGrubuId) return await interaction.respond([]);

      const roller = await getGroupRoles(kamp.oyunGrubuId);
      if (!roller || roller.length === 0) return await interaction.respond([]);

      const filtrelenmis = roller.filter(rol => {
        const rutbeAdi = String(rol.name || '').toLowerCase();
        return rol.rank <= (kamp.maxRutbe || 255) && 
               rol.rank > 0 && 
               rutbeAdi.includes(focusedValue);
      });

      await interaction.respond(
        filtrelenmis.slice(0, 25).map(rol => ({
          name: String(rol.name).substring(0, 100),
          value: String(rol.name).substring(0, 100)
        }))
      );
    } catch (error) {
      console.error('Autocomplete Hatası (Ana Kamp):', error);
      await interaction.respond([]).catch(() => {});
    }
  },

  async execute(interaction) {
    await interaction.reply('⏳ **Rütbe değiştirme işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const rutbeAdi = interaction.options.getString('rutbe-adi');
    const sebep = interaction.options.getString('sebep');

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
        await interaction.editReply(` **${kullaniciAdi}** başarıyla **${rutbeAdi}** rütbesine atandı.\n **Sebep:** ${sebep}`);
        log('BILGI', 'Ana kamp rütbe değiştirildi', { 
          yetkili: interaction.user.tag || interaction.user.id, 
          hedef: kullaniciAdi, 
          yeniRutbe: rutbeAdi,
          sebep: sebep 
        });
      } else {
        await interaction.editReply(`❌ Rütbe değiştirilemedi. Bot yetkilerini kontrol edin.`);
      }
    } catch (error) {
      await interaction.editReply(`❌ İşlem sırasında bir hata oluştu.`);
    }
  }
};
