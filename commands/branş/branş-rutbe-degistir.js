const { SlashCommandBuilder } = require('discord.js');
const Branş = require('../../models/Branş');
const { rutbeYetkiKontrol } = require('../../utils/yetki');
const kampBul = require('../../utils/kampBul');
const { getUserIdByUsername, setRank, getGroupRoles } = require('../../services/roblox');
const { log } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brans-rutbe-degistir')
    .setDescription('Seçilen branş grubunda rütbe değiştirir')
    .addStringOption(opt => opt.setName('kullanici-adi').setDescription('Roblox kullanıcı adı').setRequired(true))
    .addStringOption(opt => opt.setName('brans-ismi').setDescription('Branş adı').setRequired(true))
    .addStringOption(opt => opt.setName('rutbe-adi').setDescription('Hedef rütbe adı').setRequired(true).setAutocomplete(true)),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const bransIsmi = interaction.options.getString('brans-ismi');

    if (!bransIsmi) return await interaction.respond([]);

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return await interaction.respond([]);

    const brans = await Branş.findOne({ isim: bransIsmi, kampId: kamp._id });
    if (!brans || !brans.oyunGrubuId) return await interaction.respond([]);

    try {
      const roller = await getGroupRoles(brans.oyunGrubuId);
      const filtrelenmis = roller.filter(rol => 
        rol.rank <= (brans.maxRutbe || 255) && 
        rol.rank > 0 && 
        rol.name.toLowerCase().includes(focusedValue.toLowerCase())
      );
      await interaction.respond(filtrelenmis.slice(0, 25).map(rol => ({ name: rol.name, value: rol.name })));
    } catch (error) {
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.reply('⏳ **Branş rütbe değiştirme işlemi başlatılıyor...**');

    const kullaniciAdi = interaction.options.getString('kullanici-adi');
    const bransIsmi = interaction.options.getString('brans-ismi');
    const rutbeAdi = interaction.options.getString('rutbe-adi');

    const kamp = await kampBul(interaction.guildId);
    if (!kamp) return interaction.editReply('❌ Bu sunucu bir kampa bağlı değil.');

    const brans = await Branş.findOne({ isim: bransIsmi, kampId: kamp._id });
    if (!brans) return interaction.editReply('❌ Belirtilen branş bulunamadı.');
    if (!brans.oyunGrubuId) return interaction.editReply('❌ Bu branşın Roblox grup ID\'si ayarlanmamış.');

    const hedefRobloxId = await getUserIdByUsername(kullaniciAdi);
    if (!hedefRobloxId) return interaction.editReply('❌ Roblox kullanıcısı bulunamadı.');

    const yetkiSonuc = await rutbeYetkiKontrol(interaction.user.id, kamp._id, brans._id, hedefRobloxId, 'degistir');
    if (!yetkiSonuc.yetkili) return interaction.editReply(`❌ ${yetkiSonuc.mesaj}`);

    try {
      const roller = await getGroupRoles(brans.oyunGrubuId);
      const hedefRol = roller.find(r => r.name === rutbeAdi);
      
      if (!hedefRol) return interaction.editReply(`❌ "${rutbeAdi}" rütbesi bu branş grubunda bulunamadı.`);
      
      if (hedefRol.rank > (brans.maxRutbe || 255)) {
        return interaction.editReply(`❌ Bu branş için maksimum rütbe sınırı **${brans.maxRutbe}**'dir.`);
      }

      if (hedefRol.rank >= yetkiSonuc.yetkiliRank) {
        return interaction.editReply(`❌ Kendi rütbenizden (${yetkiSonuc.yetkiliRank}) yüksek veya eşit bir rütbeye atama yapamazsınız.`);
      }

      const basarili = await setRank(brans.oyunGrubuId, hedefRobloxId, hedefRol.rank);
      if (basarili) {
        await interaction.editReply(`✅ **${kullaniciAdi}** başarıyla **${brans.isim}** branşında **${rutbeAdi}** rütbesine atandı.`);
        log('BILGI', 'Branş rütbe değiştirildi', { yetkili: interaction.user.tag, hedef: kullaniciAdi, brans: brans.isim, yeniRutbe: rutbeAdi });
      } else {
        await interaction.editReply('❌ Rütbe değiştirilemedi. Botun Roblox grup yetkilerini kontrol edin.');
      }
    } catch (error) {
      await interaction.editReply('❌ İşlem sırasında beklenmeyen bir hata oluştu.');
    }
  }
};
