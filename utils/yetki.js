const Yetkili = require('../models/Yetkili');
const Kullanici = require('../models/Kullanici');
const { getMemberRank } = require('../services/roblox');

async function yetkiKontrol(userId, kampId, yetkiTuru) {
  const yetkili = await Yetkili.findOne({
    userId,
    kampId,
    $or: [{ yetkiTuru: yetkiTuru }, { yetkiTuru: 'admin' }]
  });
  return !!yetkili;
}

function isOwner(userId) {
  return userId === process.env.OWNER_ID;
}

// Gelişmiş Rütbe Yetki Kontrolü (Ana Kamp ve Branş Uyumlu)
async function rutbeYetkiKontrol(userId, kampId, bransId = null, hedefRobloxId, islemTuru) {
  const yetkili = await Yetkili.findOne({
    userId,
    kampId,
    $or: [{ yetkiTuru: 'rutbe' }, { yetkiTuru: 'branş' }, { yetkiTuru: 'admin' }]
  });
  if (!yetkili) return { yetkili: false, mesaj: 'Rütbe yetkiniz yok.' };

  const Kamp = require('../models/Kamp');
  const Branş = require('../models/Branş');
  
  const kamp = await Kamp.findById(kampId);
  if (!kamp) return { yetkili: false, mesaj: 'Kamp bulunamadı.' };

  let hedefGrupId = kamp.oyunGrubuId;
  let tabanRutbe = kamp.tabanRutbe || 0;
  let maxRutbe = kamp.maxRutbe || 255;

  if (bransId) {
    const brans = await Branş.findById(bransId);
    if (!brans) return { yetkili: false, mesaj: 'Branş bulunamadı.' };
    if (brans.oyunGrubuId) hedefGrupId = brans.oyunGrubuId;
    if (brans.tabanRutbe !== undefined) tabanRutbe = brans.tabanRutbe;
    if (brans.maxRutbe !== undefined) maxRutbe = brans.maxRutbe;
  }

  const kullanici = await Kullanici.findOne({ discordId: userId });
  if (!kullanici || !kullanici.dogrulandi) {
    return { yetkili: false, mesaj: 'Önce Roblox hesabınızı doğrulayın (`/doğrula`).' };
  }

  const yetkiliRank = await getMemberRank(hedefGrupId, kullanici.robloxId);
  if (yetkiliRank === null) return { yetkili: false, mesaj: 'Yetkili bu grupta bulunmuyor.' };

  if (yetkiliRank <= tabanRutbe) {
    return { yetkili: false, mesaj: `Yetkiniz bu grubun taban rütbesinin (${tabanRutbe}) altında veya eşit.` };
  }

  const hedefRank = await getMemberRank(hedefGrupId, hedefRobloxId);
  if (hedefRank === null) return { yetkili: false, mesaj: 'Hedef kullanıcı bu grupta bulunmuyor.' };

  if (yetkiliRank <= hedefRank) {
    return { yetkili: false, mesaj: `Hedef kullanıcı (rütbe ${hedefRank}) sizden (rütbe ${yetkiliRank}) düşük veya eşit rütbede.` };
  }

  if (islemTuru === 'terfi' && hedefRank >= yetkiliRank - 1) {
    return { yetkili: false, mesaj: 'Hedef zaten sizin altınızda en yüksek rütbede.' };
  }
  if (islemTuru === 'tenzil' && hedefRank <= tabanRutbe) {
    return { yetkili: false, mesaj: 'Hedef zaten taban rütbede, daha düşük verilemez.' };
  }

  return { yetkili: true, yetkiliRank, hedefRank, hedefGrupId, maxRutbe, tabanRutbe };
}

module.exports = { yetkiKontrol, isOwner, rutbeYetkiKontrol };
