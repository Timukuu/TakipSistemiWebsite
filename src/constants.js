export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Yönetici' },
  { value: 'user', label: 'Ders Sorumlusu' },
]

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Ana Panel', icon: 'dashboard' },
  { id: 'games', label: 'Oyun Listesi', icon: 'table_rows' },
]

export const STAGE_ORDER = [
  'scenario_status',
  'design_status',
  'unity_status',
  'webgl_scorm_status',
  'eba_status',
]

export const STAGE_LABELS = {
  scenario_status: 'Senaryo',
  design_status: 'Tasarım',
  unity_status: 'Unity',
  webgl_scorm_status: 'WebGL / SCORM',
  eba_status: 'EBA',
}

export const STATUS_LABELS = {
  baslamadi: 'Başlamadı',
  devam_ediyor: 'Devam Ediyor',
  onaya_gonderildi: 'Onaya Gönderildi',
  onaylandi: 'Onaylandı',
}

export const STATUS_BADGE_CLASSNAMES = {
  baslamadi: 'text-bg-light',
  devam_ediyor: 'text-bg-warning',
  onaya_gonderildi: 'text-bg-danger',
  onaylandi: 'text-bg-success',
}

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'baslamadi', label: 'Başlamadı' },
  { value: 'devam_ediyor', label: 'Devam Ediyor' },
  { value: 'onaya_gonderildi', label: 'Onaya Gönderildi' },
  { value: 'onaylandi', label: 'Onaylandı' },
]

export const COMPLETION_FILTER_OPTIONS = [
  { value: 'all', label: 'Hepsi' },
  { value: 'completed', label: 'Tamamlananlar' },
  { value: 'open', label: 'Tamamlanmayanlar' },
]

export const SUBJECT_LABELS = {
  fizik: 'Fizik',
  kimya: 'Kimya',
  matematik: 'Matematik',
  biyoloji: 'Biyoloji',
  fen_bilimleri: 'Fen Bilimleri',
  sosyal_bilgiler: 'Sosyal Bilgiler',
  hayat_bilgisi: 'Hayat Bilgisi',
  turkce: 'Türkçe',
}

export const DEFAULT_FILTERS = {
  search: '',
  subject: '',
  status: '',
  completion: 'all',
}

