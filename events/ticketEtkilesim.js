const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const TicketAyar = require('../models/TicketAyar');
const TicketDB = require('../models/TicketDB');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const ayar = await TicketAyar.findOne({ sunucuId: interaction.guildId });

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_secim_menu') {
      if (!ayar) return interaction.reply({ content: 'Sistem ayarları bulunamadı. Lütfen yetkililere bildirin.', ephemeral: true });

      const secim = interaction.values[0];
      let konuIsmi = 'destek';
      let konuAciklamasi = 'Sorun / Şikayet';

      if (secim === 'isbirligi_partner') {
        konuIsmi = 'partner';
        konuAciklamasi = 'İşbirliği / Partner';
      } else if (secim === 'yetkili_alim') {
        konuIsmi = 'basvuru';
        konuAciklamasi = 'Yetkili Alım';
      }

      const varOlanBilet = await TicketDB.findOne({ sunucuId: interaction.guildId, sahipId: interaction.user.id, durum: 'acik' });
      if (varOlanBilet) return interaction.reply({ content: 'Zaten açık bir biletiniz bulunuyor. Lütfen önce onu sonuçlandırın.', ephemeral: true });

      await interaction.reply({ content: 'Talebiniz işleniyor, lütfen bekleyin.', ephemeral: true });

      const biletKanali = await interaction.guild.channels.create({
        name: `${konuIsmi}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ayar.kategoriId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: ayar.yetkiliRolId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
      });

      const yeniBilet = new TicketDB({
        sunucuId: interaction.guildId,
        kanalId: biletKanali.id,
        sahipId: interaction.user.id,
        konuTuru: konuAciklamasi
      });
      await yeniBilet.save();

      const biletEmbed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle('Talebiniz Oluşturuldu')
        .setDescription(`Merhaba <@${interaction.user.id}>, yetkililerimiz en kısa sürede bu kanal üzerinden sizinle iletişime geçecektir. Konu türü: **${konuAciklamasi}**.`);

      const butonlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bilet_ustlen').setLabel('Bileti Üstlen').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bilet_kullanici_ekle').setLabel('Kişi Ekle').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bilet_kapat').setLabel('Bileti Kapat').setStyle(ButtonStyle.Danger)
      );

      await biletKanali.send({ content: `<@${interaction.user.id}> | <@&${ayar.yetkiliRolId}>`, embeds: [biletEmbed], components: [butonlar] });
      await interaction.editReply({ content: `Biletiniz başarıyla oluşturuldu: <#${biletKanali.id}>` });

      if (ayar.logKanalId) {
        const logKanali = interaction.guild.channels.cache.get(ayar.logKanalId);
        if (logKanali) {
          const logEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Yeni Bilet Açıldı')
            .addFields(
              { name: 'Bilet Sahibi', value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)`, inline: true },
              { name: 'Konu Türü', value: konuAciklamasi, inline: true },
              { name: 'Kanal', value: `<#${biletKanali.id}>`, inline: true }
            )
            .setTimestamp();
          logKanali.send({ embeds: [logEmbed] });
        }
      }
    }

    if (interaction.isButton()) {
      const bilet = await TicketDB.findOne({ kanalId: interaction.channelId });
      if (!bilet) return;

      if (interaction.customId === 'bilet_ustlen') {
        if (bilet.ustlenenId) {
          return interaction.reply({ content: 'Bu bilet zaten başka bir yetkili tarafından üstlenilmiş.', ephemeral: true });
        }

        bilet.ustlenenId = interaction.user.id;
        await bilet.save();

        if (ayar && ayar.yetkiliRolId) {
          await interaction.channel.permissionOverwrites.edit(ayar.yetkiliRolId, { ViewChannel: false }).catch(() => {});
        }
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true });

        await interaction.reply({ content: `Bu bilet <@${interaction.user.id}> tarafından üstlenildi. Diğer yetkililerin erişimi sınırlandırıldı.` });

        if (ayar && ayar.logKanalId) {
          const logKanali = interaction.guild.channels.cache.get(ayar.logKanalId);
          if (logKanali) {
            logKanali.send({ content: `<@${interaction.user.id}> adlı yetkili <#${interaction.channel.id}> kanalındaki bileti üstlendi.` });
          }
        }
      }

      if (interaction.customId === 'bilet_kapat') {
        bilet.durum = 'kapali';
        await bilet.save();

        await interaction.channel.permissionOverwrites.edit(bilet.sahipId, { ViewChannel: false }).catch(() => {});

        const silButonu = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('bilet_sil').setLabel('Kanalı Tamamen Sil').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: 'Bilet kapatıldı ve kullanıcının erişimi kesildi. Kanalı tamamen silmek için aşağıdaki butonu kullanabilirsiniz.', components: [silButonu] });

        if (ayar && ayar.logKanalId) {
          const logKanali = interaction.guild.channels.cache.get(ayar.logKanalId);
          if (logKanali) {
            const ustlenenKisi = bilet.ustlenenId ? `<@${bilet.ustlenenId}>` : 'Kimse üstlenmemiş';
            const logEmbed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('Bilet Kapatıldı')
              .addFields(
                { name: 'Bilet Sahibi', value: `<@${bilet.sahipId}>`, inline: true },
                { name: 'İşlemi Yapan Yetkili', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Üstlenen Yetkili', value: ustlenenKisi, inline: true },
                { name: 'Konu', value: bilet.konuTuru || 'Bilinmiyor', inline: true }
              )
              .setTimestamp();
            logKanali.send({ embeds: [logEmbed] });
          }
        }
      }

      if (interaction.customId === 'bilet_sil') {
        await interaction.reply({ content: 'Kanal birkaç saniye içinde siliniyor.' });
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);
      }

      if (interaction.customId === 'bilet_kullanici_ekle') {
        const modal = new ModalBuilder()
          .setCustomId('modal_kullanici_ekle')
          .setTitle('Kanala Kullanıcı Ekle');

        const input = new TextInputBuilder()
          .setCustomId('kullanici_id')
          .setLabel('Eklenecek kullanıcının ID numarasını girin')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(input);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_kullanici_ekle') {
      const kullaniciId = interaction.fields.getTextInputValue('kullanici_id');
      
      try {
        const eklenecekKisi = await interaction.guild.members.fetch(kullaniciId);
        if (!eklenecekKisi) throw new Error('Bulunamadı');

        await interaction.channel.permissionOverwrites.edit(kullaniciId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        });

        await interaction.reply({ content: `<@${kullaniciId}> başarıyla bu bilete eklendi.` });
      } catch (error) {
        await interaction.reply({ content: 'Belirttiğiniz ID numarasına sahip bir kullanıcı sunucuda bulunamadı. Lütfen doğru bir ID girdiğinizden emin olun.', ephemeral: true });
      }
    }
  }
};
