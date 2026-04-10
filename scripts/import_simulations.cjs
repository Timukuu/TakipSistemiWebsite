const fs = require('fs');
const XLSX = require('xlsx');

const workbookPath = process.argv[2];

if (!workbookPath) {
  throw new Error('Excel dosya yolu gerekli.');
}

const workbook = XLSX.readFile(workbookPath);

const BASE_USERS = [
  { id: 'user_admin', name: 'Merkez Y\u00f6netici', email: 'admin@meb.gov.tr', role: 'admin', subject: 'fizik', created_at: '2026-04-08T08:00:00Z' },
  { id: 'user_fizik', name: 'Aylin Demir', email: 'aylin.demir@meb.gov.tr', role: 'user', subject: 'fizik', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_kimya', name: 'Bar\u0131\u015f Tun\u00e7', email: 'baris.tunc@meb.gov.tr', role: 'user', subject: 'kimya', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_matematik', name: 'Ceren K\u00f6se', email: 'ceren.kose@meb.gov.tr', role: 'user', subject: 'matematik', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_biyoloji', name: 'Deniz Erkan', email: 'deniz.erkan@meb.gov.tr', role: 'user', subject: 'biyoloji', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_fen', name: 'Ebru Y\u0131lmaz', email: 'ebru.yilmaz@meb.gov.tr', role: 'user', subject: 'fen_bilimleri', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_sosyal', name: 'Furkan Aksoy', email: 'furkan.aksoy@meb.gov.tr', role: 'user', subject: 'sosyal_bilgiler', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_hayat', name: 'Gizem Karaca', email: 'gizem.karaca@meb.gov.tr', role: 'user', subject: 'hayat_bilgisi', created_at: '2026-04-08T08:10:00Z' },
  { id: 'user_turkce', name: 'Hakan Ate\u015f', email: 'hakan.ates@meb.gov.tr', role: 'user', subject: 'turkce', created_at: '2026-04-08T08:10:00Z' },
];

const SUBJECTS = [
  { id: 'subject_fizik', name: 'Fizik', code: 'fizik', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['orta_ogretim'] },
  { id: 'subject_kimya', name: 'Kimya', code: 'kimya', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['orta_ogretim'] },
  { id: 'subject_matematik', name: 'Matematik', code: 'matematik', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['temel_egitim', 'orta_ogretim'] },
  { id: 'subject_biyoloji', name: 'Biyoloji', code: 'biyoloji', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['orta_ogretim'] },
  { id: 'subject_fen', name: 'Fen Bilimleri', code: 'fen_bilimleri', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['temel_egitim'] },
  { id: 'subject_sosyal', name: 'Sosyal Bilgiler', code: 'sosyal_bilgiler', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['temel_egitim'] },
  { id: 'subject_hayat', name: 'Hayat Bilgisi', code: 'hayat_bilgisi', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['temel_egitim'] },
  { id: 'subject_turkce', name: 'T\u00fcrk\u00e7e', code: 'turkce', is_active: true, catalogs: ['game', 'simulation'], education_levels: ['temel_egitim'] },
];

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

function getSheetConfig(sheetName) {
  const normalized = normalizeText(sheetName);
  if (normalized.includes('fen bilimleri')) return { subject: 'fen_bilimleri', level: 'temel_egitim' };
  if (normalized.includes('hayat bilgisi')) return { subject: 'hayat_bilgisi', level: 'temel_egitim' };
  if (normalized.includes('matematik temel')) return { subject: 'matematik', level: 'temel_egitim' };
  if (normalized.includes('sosyal bilgiler')) return { subject: 'sosyal_bilgiler', level: 'temel_egitim' };
  if (normalized.includes('fizik')) return { subject: 'fizik', level: 'orta_ogretim' };
  if (normalized.includes('kimya')) return { subject: 'kimya', level: 'orta_ogretim' };
  if (normalized.includes('matematik orta')) return { subject: 'matematik', level: 'orta_ogretim' };
  if (normalized.includes('biyoloji')) return { subject: 'biyoloji', level: 'orta_ogretim' };
  return null;
}

function firstTopicValue(row) {
  const preferredKey = Object.keys(row).find((key) => normalizeText(key).includes('konu'));
  if (preferredKey) return row[preferredKey];
  const firstKey = Object.keys(row)[0];
  return firstKey ? row[firstKey] : '';
}

function getValue(row, containsText) {
  const normalizedNeedle = normalizeText(containsText);
  const key = Object.keys(row).find((candidate) => normalizeText(candidate).includes(normalizedNeedle));
  return key ? row[key] : '';
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'kayit';
}

function excelDate(value) {
  if (typeof value === 'number' && value > 0) return XLSX.SSF.format('yyyy-mm-dd', value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return '';
}

function mapStatus(value) {
  const normalized = normalizeText(String(value || '').trim());
  if (normalized.includes('onaylandi')) return 'onaylandi';
  if (normalized.includes('onaya gonderildi')) return 'onaya_gonderildi';
  if (normalized.includes('devam ediyor')) return 'devam_ediyor';
  if (normalized.includes('beklemede') || normalized.includes('baslamadi') || !normalized) return 'baslamadi';
  return 'baslamadi';
}

function inferClassLevel(topic, gains, level) {
  const normalized = normalizeText(`${topic} ${gains}`);
  const directMatch = normalized.match(/(?:^|\s|\(|-|_)(\d{1,2})\.?\s*sinif/);
  if (directMatch) return `${directMatch[1]}. Sınıf`;
  const parenMatch = normalized.match(/\((\d{1,2})\)/);
  if (parenMatch) return `${parenMatch[1]}. Sınıf`;
  const curriculumMatch = normalized.match(/(?:hb|sb|mat|f|fb)\.(\d{1,2})\./);
  if (curriculumMatch) return `${curriculumMatch[1]}. Sınıf`;
  const ogmMatch = normalized.match(/ogm\d+[a-z]+_(\d{1,2})_/);
  if (ogmMatch) return `${ogmMatch[1]}. Sınıf`;
  return level === 'temel_egitim' ? '1. Sınıf' : '9. Sınıf';
}

function buildSummary(topic) {
  return `${topic} konusunu etkileşimli olarak pekiştirir.`;
}

const simulations = [];
const responsibleUsers = new Map();

for (const sheetName of workbook.SheetNames) {
  const config = getSheetConfig(sheetName);
  if (!config) continue;

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  rows.forEach((row, index) => {
    const topic = String(firstTopicValue(row)).trim();
    if (!topic) return;

    const responsibleName = String(getValue(row, 'sorumlu')).trim();
    const gains = String(getValue(row, 'kazan')).trim();
    const responsibleId = responsibleName ? `user_sim_${slugify(responsibleName)}_${config.subject}` : '';

    simulations.push({
      id: `simulation_${config.subject}_${config.level}_${String(index + 1).padStart(3, '0')}`,
      content_type: 'simulation',
      education_level: config.level,
      subject: config.subject,
      class_level: inferClassLevel(topic, gains, config.level),
      topic,
      oyun_ozeti: buildSummary(topic),
      interface_count: Number(getValue(row, 'bolum')) || Number(getValue(row, 'bölüm')) || 0,
      scenario_status: mapStatus(getValue(row, 'senaryo')),
      design_status: mapStatus(getValue(row, 'tasar')),
      unity_status: mapStatus(getValue(row, 'unity')),
      webgl_scorm_status: mapStatus(getValue(row, 'scorm')),
      eba_status: mapStatus(getValue(row, 'eba')),
      start_date: excelDate(getValue(row, 'baslangic tarihi') || getValue(row, 'başlangıç tarihi')),
      end_date: excelDate(getValue(row, 'bitis tarihi') || getValue(row, 'bitiş tarihi')),
      is_completed: Boolean(getValue(row, 'tamamlandi') || getValue(row, 'tamamlandı')),
      responsible_user_id: responsibleId,
      kazanimlar: gains,
      eba_link: String(getValue(row, 'eba link')).trim().startsWith('http') ? String(getValue(row, 'eba link')).trim() : '',
      play_url: '',
      notes: `Excel aktarımı • ${sheetName}`,
      created_at: '2026-04-10T09:00:00Z',
      updated_at: '2026-04-10T09:00:00Z',
      source_sheet: sheetName,
    });

    if (responsibleName) {
      responsibleUsers.set(`${config.subject}::${responsibleName}`, {
        id: responsibleId,
        name: responsibleName,
        email: `${slugify(responsibleName)}@meb.gov.tr`,
        role: 'user',
        subject: config.subject,
        created_at: '2026-04-10T09:00:00Z',
      });
    }
  });
}

fs.writeFileSync('data/simulations.json', `${JSON.stringify(simulations, null, 2)}\n`, 'utf8');
fs.writeFileSync('data/users.json', `${JSON.stringify([...BASE_USERS, ...responsibleUsers.values()], null, 2)}\n`, 'utf8');
fs.writeFileSync('data/subjects.json', `${JSON.stringify(SUBJECTS, null, 2)}\n`, 'utf8');
