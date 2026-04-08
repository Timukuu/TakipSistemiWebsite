export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Y\u00f6netici' },
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
  design_status: 'Tasar\u0131m',
  unity_status: 'Unity',
  webgl_scorm_status: 'WebGL / SCORM',
  eba_status: 'EBA',
}

export const STATUS_LABELS = {
  baslamadi: 'Ba\u015flamad\u0131',
  devam_ediyor: 'Devam Ediyor',
  onaya_gonderildi: 'Onaya G\u00f6nderildi',
  onaylandi: 'Onayland\u0131',
}

export const STATUS_BADGE_CLASSNAMES = {
  baslamadi: 'text-bg-light',
  devam_ediyor: 'text-bg-warning',
  onaya_gonderildi: 'text-bg-danger',
  onaylandi: 'text-bg-success',
}

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'T\u00fcm Durumlar' },
  { value: 'baslamadi', label: 'Ba\u015flamad\u0131' },
  { value: 'devam_ediyor', label: 'Devam Ediyor' },
  { value: 'onaya_gonderildi', label: 'Onaya G\u00f6nderildi' },
  { value: 'onaylandi', label: 'Onayland\u0131' },
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
  turkce: 'T\u00fcrk\u00e7e',
}

export const DEFAULT_FILTERS = {
  search: '',
  subject: '',
  status: '',
  completion: 'all',
}

