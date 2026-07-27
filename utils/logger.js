const fs = require('fs');
const path = require('path');

function log(seviye, mesaj, veri = {}) {
  const logDizini = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDizini)) fs.mkdirSync(logDizini);

  const dosyaAdi = path.join(logDizini, `${new Date().toISOString().split('T')[0]}.log`);
  const zaman = new Date().toISOString();
  const satir = `[${zaman}] [${seviye}] ${mesaj} ${JSON.stringify(veri)}\n`;
  fs.appendFileSync(dosyaAdi, satir);
}

module.exports = { log };