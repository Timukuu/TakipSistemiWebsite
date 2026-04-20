export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Yönetici' },
  { value: 'user', label: 'Ders Sorumlusu' },
]

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Ana Panel', icon: 'dashboard' },
  { id: 'games', label: 'Oyun Listesi', icon: 'sports_esports' },
  { id: 'simulations', label: 'Simülasyon Listesi', icon: 'science' },
  { id: 'teams', label: 'Ekip Listesi', icon: 'groups' },
]

export const REPORTS_NAV_ITEM = { id: 'reports', label: 'Raporlar', icon: 'pie_chart' }

export const TEAM_ROLE_TYPES = [
  { value: 'alan_uzmani', label: 'Alan Uzmanı', icon: 'menu_book' },
  { value: 'grafik_tasarim', label: 'Grafik Tasarım', icon: 'brush' },
  { value: 'unity', label: 'Unity', icon: 'code' },
]

export const TEAM_ROLE_LABELS = {
  alan_uzmani: 'Alan Uzmanı',
  grafik_tasarim: 'Grafik Tasarım',
  unity: 'Unity',
}

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

export const INSIGHT_SCOPE_OPTIONS = [
  { value: 'games', label: 'Genel Oyun' },
  { value: 'games_temel', label: 'Temel Eğitim Oyun' },
  { value: 'games_orta', label: 'Orta Öğretim Oyun' },
  { value: 'simulations', label: 'Genel Simülasyon' },
  { value: 'simulations_temel', label: 'Temel Eğitim Simülasyon' },
  { value: 'simulations_orta', label: 'Orta Öğretim Simülasyon' },
]

export const SIMULATION_LEVEL_OPTIONS = [
  { value: 'all', label: 'Tüm Simülasyonlar' },
  { value: 'temel_egitim', label: 'Temel Eğitim' },
  { value: 'orta_ogretim', label: 'Orta Öğretim' },
]

export const EDUCATION_LEVEL_LABELS = {
  temel_egitim: 'Temel Eğitim',
  orta_ogretim: 'Orta Öğretim',
}

export const CLASS_LEVEL_OPTIONS = [
  '1. Sınıf',
  '2. Sınıf',
  '3. Sınıf',
  '4. Sınıf',
  '5. Sınıf',
  '6. Sınıf',
  '7. Sınıf',
  '8. Sınıf',
  '9. Sınıf',
  '10. Sınıf',
  '11. Sınıf',
  '12. Sınıf',
]

