const fs = require('fs');

const FILES = ['src/App.jsx', 'src/utils/gameData.js'];

const MOJIBAKE_MAP = new Map([
  ['Ã¼', '\u00fc'],
  ['Ãœ', '\u00dc'],
  ['Ã¶', '\u00f6'],
  ['Ã–', '\u00d6'],
  ['Ã§', '\u00e7'],
  ['Ã‡', '\u00c7'],
  ['Ä±', '\u0131'],
  ['Ä°', '\u0130'],
  ['ÄŸ', '\u011f'],
  ['Äž', '\u011e'],
  ['ÅŸ', '\u015f'],
  ['Åž', '\u015e'],
  ['â€™', '\u2019'],
  ['â€œ', '\u201c'],
  ['â€\u009d', '\u201d'],
  ['Â·', '\u00b7'],
  ['Â', ''],
]);

const MANUAL_MAP = new Map([
  ['Mock Kullanici', 'Mock Kullan\u0131c\u0131'],
  ['I\u00e7erik Kapsami', '\u0130\u00e7erik Kapsam\u0131'],
  ['Son Islemler', 'Son \u0130\u015flemler'],
  ['Hen\u00fcz g\u00f6sterilecek bir islem bulunmuyor.', 'Hen\u00fcz g\u00f6sterilecek bir i\u015flem bulunmuyor.'],
  ['Toplam Kayit', 'Toplam Kay\u0131t'],
  ['A\u00e7ik Kayit', 'A\u00e7\u0131k Kay\u0131t'],
  ['Simulasyon', 'Sim\u00fclasyon'],
  ['Varsayilan', 'Varsay\u0131lan'],
  ['Kullanici', 'Kullan\u0131c\u0131'],
  ['Kapsami', 'Kapsam\u0131'],
  ['Sinif', 'S\u0131n\u0131f'],
  ['Turkce', 'T\u00fcrk\u00e7e'],
  ['Yonetici', 'Y\u00f6netici'],
]);

function repairContent(content) {
  let next = content;

  for (const [wrong, right] of MOJIBAKE_MAP) {
    next = next.split(wrong).join(right);
  }

  for (const [wrong, right] of MANUAL_MAP) {
    next = next.split(wrong).join(right);
  }

  return next;
}

for (const file of FILES) {
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, repairContent(content), 'utf8');
}
