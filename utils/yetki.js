const Yetkili = require('../models/Yetkili');
const Kullanici = require('../models/Kullanici');

async function yetkiKontrol(userId, kampId, yetkiTuru) {
  const yetkili = await Yetkili.findOne({
    userId,
    kampId,
    $or: [{ yetkiTuru: yetkiTuru }, { yetkiTuru: 'admin' }]
  });
  return !!yetkili;
}

async function adminKontrol(userId, kampId) {
  const yetkili = await Yetkili.findOne({ userId, kampId, yetkiTuru: 'admin' });
  return !!yetkili;
}

async function ittifakYetkiKontrol(userId, yetkiTuru) {
  const yetkili = await Yetkili.findOne({ userId, yetkiTuru: yetkiTuru });
  return !!yetkili;
}

function isOwner(userId) {
  return userId === process.env.OWNER_ID;
}

// Rütbe yetki kontrolü – doğrulama kontrolü dahil
async function rutbeYetkiKontrol(userId, kampId, hedefRobloxId, islemTuru) {
  const yetkili = await Yetkili.findOne({
    userId,
    kampId,
    $or: [{ yetkiTuru: 'rutbe' }, { yetkiTuru: 'branş' }, { yetkiTuru: 'admin' }]
  });
  if (!yetkili) return { yetkili: false, mesaj: 'Rütbe yetkiniz yok.' };

  const Kamp = require('../models/Kamp');
  const kamp = await Kamp.findById(kampId);
  if (!kamp) return { yetkili: false, mesaj: 'Kamp bulunamadı.' };

  // 🔐 DOĞRULAMA KONTROLÜ
  const kullanici = await Kullanici.findOne({ discordId: userId });
  if (!kullanici || !kullanici.dogrulandi) {
    return { yetkili: false, mesaj: 'Önce Roblox hesabınızı doğrulayın (`/doğrula`).' };
  }

  const { getMemberRank } = require('../services/roblox');
  const yetkiliRank = await getMemberRank(kamp.oyunGrubuId, kullanici.robloxId);
  if (yetkiliRank === null) return { yetkili: false, mesaj: 'Yetkili bu grupta değil.' };

  if (yetkiliRank <= kamp.tabanRutbe) {
    return { yetkili: false, mesaj: `Yetkiniz taban rütbenin (${kamp.tabanRutbe}) altında.` };
  }

  const hedefRank = await getMemberRank(kamp.oyunGrubuId, hedefRobloxId);
  if (hedefRank === null) return { yetkili: false, mesaj: 'Hedef kullanıcı bu grupta değil.' };

  if (yetkiliRank <= hedefRank) {
    return { yetkili: false, mesaj: `Hedef kullanıcı (rütbe ${hedefRank}) sizden (rütbe ${yetkiliRank}) düşük veya eşit rütbede.` };
  }

  if (islemTuru === 'terfi' && hedefRank >= yetkiliRank - 1) {
    return { yetkili: false, mesaj: 'Hedef zaten sizin altınızda en yüksek rütbede.' };
  }
  if (islemTuru === 'tenzil' && hedefRank <= kamp.tabanRutbe) {
    return { yetkili: false, mesaj: 'Hedef zaten taban rütbede, daha düşük verilemez.' };
  }

  return { yetkili: true, yetkiliRank, hedefRank };
}

module.exports = { yetkiKontrol, adminKontrol, ittifakYetkiKontrol, isOwner, rutbeYetkiKontrol };