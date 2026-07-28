const Yetkili = require('../models/Yetkili');
const Kullanici = require('../models/Kullanici');
const { getMemberRank } = require('../services/roblox');

// Diğer komutlar (yasaklama vb.) için mevcut genel yetki kontrolü
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

// Gelişmiş Rütbe Yetki Kontrolü (SADECE ROBLOX RÜTBESİ VE TABAN RÜTBE BAZLI)
async function rutbeYetkiKontrol(userId, kampId, bransId = null, hedefRobloxId, islemTuru) {
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

  // 1. İşlemi yapan kullanıcının doğrulanmış Roblox hesabını bul
  const kullanici = await Kullanici.findOne({ discordId: userId });
  if (!kullanici || !kullanici.dogrulandi) {
    return { yetkili: false, mesaj: 'Önce Roblox hesabınızı doğrulayın (`/doğrula`).' };
  }

  // 2. İşlemi yapan kişinin Roblox'taki güncel rütbesini çek
  const yetkiliRank = await getMemberRank(hedefGrupId, kullanici.robloxId);
  if (yetkiliRank === null) return { yetkili: false, mesaj: 'Siz bu Roblox grubunda bulunmuyorsunuz.' };

  // 3. TABAN RÜTBE KONTROLÜ
  if (yetkiliRank <= tabanRutbe) {
    return { yetkili: false, mesaj: `Yetkiniz yetersiz. Bu grupta rütbe işlemi yapabilmek için taban rütbenin (${tabanRutbe}) üzerinde olmalısınız.` };
  }

  // 4. Hedef kullanıcının durumunu kontrol et
  const hedefRank = await getMemberRank(hedefGrupId, hedefRobloxId);
  if (hedefRank === null) return { yetkili: false, mesaj: 'Hedef kullanıcı bu grupta bulunmuyor.' };

  // 5. Kendinden üst veya eşit rütbedeki birine işlem yapamama
  if (yetkiliRank <= hedefRank) {
    return { yetkili: false, mesaj: `Hedef kullanıcı (rütbe ${hedefRank}) sizden (rütbe ${yetkiliRank}) yüksek veya eşit rütbede.` };
  }

  // 6. Terfi ve Tenzil Sınırları
  if (islemTuru === 'terfi' && hedefRank >= yetkiliRank - 1) {
    return { yetkili: false, mesaj: 'Hedef zaten sizin altınızda verebileceğiniz en yüksek rütbede.' };
  }
  if (islemTuru === 'tenzil' && hedefRank <= tabanRutbe) {
    return { yetkili: false, mesaj: `Hedef zaten taban rütbede (${tabanRutbe}), daha düşük bir rütbeye tenzil edilemez.` };
  }

  return { yetkili: true, yetkiliRank, hedefRank, hedefGrupId, maxRutbe, tabanRutbe };
}

// İttifak Duyuru Yetki Kontrolü
async function ittifakYetkiKontrol(userId) {
  // Bot sahibi ise direkt izin ver
  if (isOwner(userId)) return true;

  const DuyuruYetkili = require('../models/DuyuruYetkili');

  // 1. Standart 'Yetkili' şemasında ittifak duyuru veya admin yetkisi var mı kontrol et
  const yetkili = await Yetkili.findOne({
    userId,
    $or: [{ yetkiTuru: 'ittifak_duyuru' }, { yetkiTuru: 'admin' }]
  });

  // 2. Özel 'DuyuruYetkili' şemasında ekli mi kontrol et
  const ozelDuyuruYetkilisi = await DuyuruYetkili.findOne({ userId });

  // İkisinden birinde kaydı varsa true, yoksa false döndür
  return !!yetkili || !!ozelDuyuruYetkilisi;
}

module.exports = { yetkiKontrol, isOwner, rutbeYetkiKontrol, ittifakYetkiKontrol };
