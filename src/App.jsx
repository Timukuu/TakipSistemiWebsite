import { useEffect, useMemo, useState } from 'react'
import gamesData from '../data/games.json'
import subjectsData from '../data/subjects.json'
import usersData from '../data/users.json'
import {
  COMPLETION_FILTER_OPTIONS,
  DEFAULT_FILTERS,
  NAV_ITEMS,
  ROLE_OPTIONS,
  STAGE_LABELS,
  STAGE_ORDER,
  STATUS_BADGE_CLASSNAMES,
  STATUS_FILTER_OPTIONS,
  STATUS_LABELS,
  SUBJECT_LABELS,
} from './constants'
import {
  buildDashboardSummary,
  buildStageSummary,
  formatDate,
  getEffectiveFilters,
  getInitialRoleState,
  getResponsibleUserName,
  getScopedGames,
  getSubjectSummaries,
  matchesFilters,
} from './utils/gameData'

function App() {
  const baseUrl = import.meta.env.BASE_URL
  const initialRoleState = useMemo(() => getInitialRoleState(usersData), [])
  const [currentView, setCurrentView] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [roleMode, setRoleMode] = useState(initialRoleState.roleMode)
  const [selectedUserId, setSelectedUserId] = useState(initialRoleState.selectedUserId)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [draftGame, setDraftGame] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState('')

  const nonAdminUsers = useMemo(() => usersData.filter((user) => user.role === 'user'), [])

  const activeUser = useMemo(
    () => usersData.find((user) => user.id === selectedUserId) ?? nonAdminUsers[0] ?? null,
    [nonAdminUsers, selectedUserId],
  )

  const scopedGames = useMemo(
    () => getScopedGames(gamesData, roleMode, activeUser),
    [activeUser, roleMode],
  )

  const effectiveFilters = useMemo(
    () => getEffectiveFilters(filters, roleMode, activeUser),
    [activeUser, filters, roleMode],
  )

  const filteredGames = useMemo(
    () => scopedGames.filter((game) => matchesFilters(game, effectiveFilters)),
    [effectiveFilters, scopedGames],
  )

  const dashboardSummary = useMemo(
    () => buildDashboardSummary(scopedGames),
    [scopedGames],
  )

  const stageSummary = useMemo(
    () => buildStageSummary(scopedGames),
    [scopedGames],
  )

  const subjectSummaries = useMemo(
    () => getSubjectSummaries(scopedGames, subjectsData),
    [scopedGames],
  )

  useEffect(() => {
    document.body.classList.toggle('toggled', isSidebarCollapsed)
    return () => document.body.classList.remove('toggled')
  }, [isSidebarCollapsed])

  const subjectOptions =
    roleMode === 'admin'
      ? subjectsData
      : subjectsData.filter((subject) => subject.code === activeUser?.subject)

  const handleRoleChange = (nextRoleMode) => {
    setRoleMode(nextRoleMode)
    setFilters(DEFAULT_FILTERS)
    setCurrentView('dashboard')
    handleCloseGame()
  }

  const handleUserChange = (nextUserId) => {
    setSelectedUserId(nextUserId)
    setFilters(DEFAULT_FILTERS)
    handleCloseGame()
  }

  const handleFilterChange = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }))
  }

  const handleDraftChange = (field, value) => {
    setDraftGame((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
  }

  const handleOpenGame = (gameId) => {
    const nextGame = scopedGames.find((game) => game.id === gameId)

    if (!nextGame) {
      return
    }

    setDraftGame(nextGame)
    setFormErrors({})
    setSaveMessage('')
  }

  const handleCloseGame = () => {
    setDraftGame(null)
    setFormErrors({})
    setSaveMessage('')
  }

  const validateDraft = () => {
    const nextErrors = {}

    if (!draftGame?.topic?.trim()) {
      nextErrors.topic = 'Konu alani zorunludur.'
    }

    if (Number(draftGame?.interface_count) < 0) {
      nextErrors.interface_count = 'Arayuz sayisi 0 veya daha buyuk olmalidir.'
    }

    if (draftGame?.start_date && draftGame?.end_date && draftGame.start_date > draftGame.end_date) {
      nextErrors.end_date = 'Bitis tarihi baslangic tarihinden once olamaz.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveDraft = () => {
    if (!validateDraft()) {
      setSaveMessage('')
      return
    }

    setSaveMessage(
      'Bu surumde kayitlar yalnizca repo icindeki JSON dosyalari duzenlenip push edilerek kalici hale gelir. Form, Faz 2 veri akisina hazirlik amaciyla sunuluyor.',
    )
  }

  return (
    <>
      <header className="top-header">
        <nav className="navbar navbar-expand align-items-center gap-4">
          <div className="btn-toggle">
            <button
              type="button"
              className="theme-icon-button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label="Yan menuyu daralt"
            >
              <span className="material-icons-outlined">menu</span>
            </button>
          </div>
          <div className="search-bar flex-grow-1">
            <div className="page-title-wrap">
              <span className="eyebrow">MEB Uretim Paneli</span>
              <h1 className="page-title">Oyun Uretim Takip Sistemi</h1>
            </div>
          </div>
          <ul className="navbar-nav gap-2 nav-right-links align-items-center ms-auto">
            <li className="nav-item d-xl-none">
              <button
                type="button"
                className="theme-icon-button"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Mobil menuyu ac"
              >
                <span className="material-icons-outlined">dashboard</span>
              </button>
            </li>
            <li className="nav-item">
              <div className="header-chip">
                <span className="material-icons-outlined">public</span>
                <span>GitHub Pages</span>
              </div>
            </li>
          </ul>
        </nav>
      </header>

      <aside className={`sidebar-wrapper ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">
            <img
              src={`${baseUrl}theme/assets/images/logo-icon.png`}
              className="logo-img"
              alt="MEB Oyun Uretim Takip Sistemi"
            />
          </div>
          <div className="logo-name flex-grow-1">
            <h5 className="mb-0">MEB Takip</h5>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Yan menuyu kapat"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="sidebar-nav">
          <ul className="metismenu">
            <li className="menu-label">Genel Menu</li>
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className={currentView === item.id ? 'mm-active' : ''}>
                <button
                  type="button"
                  className="nav-button"
                  onClick={() => {
                    setCurrentView(item.id)
                    setIsMobileSidebarOpen(false)
                  }}
                >
                  <div className="parent-icon">
                    <span className="material-icons-outlined">{item.icon}</span>
                  </div>
                  <div className="menu-title">{item.label}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="main-wrapper">
        <div className="main-content">
          <div className="page-breadcrumb d-flex flex-column flex-lg-row align-items-lg-center gap-3 mb-4">
            <div className="breadcrumb-title pe-lg-3">
              {currentView === 'dashboard' ? 'Dashboard' : 'Oyun Listesi'}
            </div>
            <div className="page-breadcrumb-content">
              <span className="crumb-pill">
                {roleMode === 'admin' ? 'Yonetici gorunumu' : 'Ders sorumlusu gorunumu'}
              </span>
              {roleMode === 'user' && activeUser ? (
                <span className="crumb-pill muted">
                  {activeUser.name} · {SUBJECT_LABELS[activeUser.subject]}
                </span>
              ) : null}
            </div>
          </div>

          <section className="card rounded-4 border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-xl-3">
                  <label className="form-label">Aktif Gorunum</label>
                  <select
                    className="form-select"
                    value={roleMode}
                    onChange={(event) => handleRoleChange(event.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-xl-3">
                  <label className="form-label">Mock Kullanici</label>
                  <select
                    className="form-select"
                    value={selectedUserId}
                    onChange={(event) => handleUserChange(event.target.value)}
                    disabled={roleMode === 'admin'}
                  >
                    {nonAdminUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {SUBJECT_LABELS[user.subject]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-xl-6">
                  <div className="alert alert-primary mb-0 info-banner">
                    Bu panel statik yayinlanir. Form alanlari operasyon akisinin iskeletidir; kalici veri guncellemesi repo icindeki JSON dosyalari uzerinden yapilir.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {currentView === 'dashboard' ? (
            <DashboardView
              dashboardSummary={dashboardSummary}
              stageSummary={stageSummary}
              subjectSummaries={subjectSummaries}
            />
          ) : (
            <GamesView
              filteredGames={filteredGames}
              filters={effectiveFilters}
              formFilters={filters}
              onFilterChange={handleFilterChange}
              onOpenGame={handleOpenGame}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              roleMode={roleMode}
              subjectOptions={subjectOptions}
              users={usersData}
            />
          )}
        </div>
      </main>

      <div
        className={`overlay ${isMobileSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {draftGame ? (
        <GameDetailDrawer
          draftGame={draftGame}
          formErrors={formErrors}
          onChange={handleDraftChange}
          onClose={handleCloseGame}
          onSave={handleSaveDraft}
          saveMessage={saveMessage}
          users={usersData}
        />
      ) : null}
    </>
  )
}

function DashboardView({ dashboardSummary, stageSummary, subjectSummaries }) {
  return (
    <>
      <section className="row g-4 mb-4">
        <MetricCard icon="sports_esports" label="Toplam oyun" value={dashboardSummary.totalGames} tone="primary" helper="Panel kapsamindaki tum kayitlar" />
        <MetricCard icon="task_alt" label="Tamamlanan kayit" value={dashboardSummary.completedGames} tone="success" helper="Tum asamalari kapanan oyunlar" />
        <MetricCard icon="autorenew" label="Devam eden kayit" value={dashboardSummary.inProgressGames} tone="warning" helper="En az bir asamasi aktif olanlar" />
        <MetricCard icon="approval" label="Onay bekleyen asama" value={dashboardSummary.awaitingApprovalStages} tone="danger" helper="Onaya gonderildi durumundaki adimlar" />
      </section>

      <section className="row g-4 mb-4">
        <div className="col-12 col-xxl-7">
          <div className="card rounded-4 border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="section-heading">
                <div>
                  <h3>Ders Bazli Ozet</h3>
                  <p>Her ders icin toplam, tamamlanan ve aktif kayit gorunumu.</p>
                </div>
              </div>
              <div className="row g-3 mt-1">
                {subjectSummaries.map((subjectSummary) => (
                  <div className="col-12 col-md-6" key={subjectSummary.code}>
                    <div className="subject-summary-card">
                      <div className="subject-summary-top">
                        <div>
                          <h4>{subjectSummary.name}</h4>
                          <p>{subjectSummary.totalGames} oyun kaydi</p>
                        </div>
                        <span className="badge text-bg-light">{subjectSummary.completedGames} tamamlandi</span>
                      </div>
                      <div className="subject-progress">
                        <div className="subject-progress-bar" style={{ width: `${subjectSummary.completionRate}%` }} />
                      </div>
                      <div className="subject-summary-bottom">
                        <span>{subjectSummary.inProgressGames} aktif kayit</span>
                        <span>{subjectSummary.awaitingApprovalStages} onay bekleyen asama</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xxl-5">
          <div className="card rounded-4 border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="section-heading">
                <div>
                  <h3>Asama Durum Ozeti</h3>
                  <p>Bes uretim adiminin anlik dagilimi.</p>
                </div>
              </div>
              <div className="table-responsive mt-3">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Asama</th>
                      <th>Baslamadi</th>
                      <th>Devam</th>
                      <th>Onay</th>
                      <th>Tamam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageSummary.map((stage) => (
                      <tr key={stage.stageKey}>
                        <td className="fw-semibold">{stage.label}</td>
                        <td>{stage.counts.baslamadi}</td>
                        <td>{stage.counts.devam_ediyor}</td>
                        <td>{stage.counts.onaya_gonderildi}</td>
                        <td>{stage.counts.onaylandi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function GamesView({ filteredGames, filters, formFilters, onFilterChange, onOpenGame, onResetFilters, roleMode, subjectOptions, users }) {
  const subjectValue = roleMode === 'user' ? filters.subject : formFilters.subject

  return (
    <>
      <section className="card rounded-4 border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-xl-4">
              <label className="form-label">Konu Ara</label>
              <input className="form-control" type="search" value={formFilters.search} onChange={(event) => onFilterChange('search', event.target.value)} placeholder="Ornek: Kuvvet ve Hareket" />
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Ders</label>
              <select className="form-select" value={subjectValue} onChange={(event) => onFilterChange('subject', event.target.value)} disabled={roleMode === 'user'}>
                <option value="">Tum dersler</option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.code}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Durum</label>
              <select className="form-select" value={formFilters.status} onChange={(event) => onFilterChange('status', event.target.value)}>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Tamamlanma</label>
              <select className="form-select" value={formFilters.completion} onChange={(event) => onFilterChange('completion', event.target.value)}>
                {COMPLETION_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 col-xl-2 d-flex align-items-end">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={onResetFilters}>Filtreleri Sifirla</button>
            </div>
          </div>
        </div>
      </section>

      <section className="card rounded-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="section-heading mb-3">
            <div>
              <h3>Oyun Listesi</h3>
              <p>{filteredGames.length} kayit gosteriliyor.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0 project-table">
              <thead>
                <tr>
                  <th>Ders</th>
                  <th>Konu</th>
                  <th>Sorumlu</th>
                  <th>Arayuz</th>
                  {STAGE_ORDER.map((stageKey) => (<th key={stageKey}>{STAGE_LABELS[stageKey]}</th>))}
                  <th>Baslangic</th>
                  <th>Bitis</th>
                  <th>Tamam</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <tr key={game.id}>
                    <td className="fw-semibold">{SUBJECT_LABELS[game.subject]}</td>
                    <td>
                      <div className="table-title">{game.topic}</div>
                      <div className="table-subtitle">{game.kazanimlar}</div>
                    </td>
                    <td>{getResponsibleUserName(users, game.responsible_user_id)}</td>
                    <td>{game.interface_count}</td>
                    {STAGE_ORDER.map((stageKey) => (
                      <td key={stageKey}>
                        <span className={`badge rounded-pill ${STATUS_BADGE_CLASSNAMES[game[stageKey]]}`}>
                          {STATUS_LABELS[game[stageKey]]}
                        </span>
                      </td>
                    ))}
                    <td>{formatDate(game.start_date)}</td>
                    <td>{formatDate(game.end_date)}</td>
                    <td>
                      <span className={`badge rounded-pill ${game.is_completed ? 'text-bg-success' : 'text-bg-light'}`}>
                        {game.is_completed ? 'Tamamlandi' : 'Acik'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onOpenGame(game.id)}>Detay</button>
                    </td>
                  </tr>
                ))}
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={11 + STAGE_ORDER.length}>
                      <div className="empty-state">Secili filtrelerle eslesen kayit bulunamadi.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}

function MetricCard({ helper, icon, label, tone, value }) {
  return (
    <div className="col-12 col-md-6 col-xxl-3">
      <div className={`card rounded-4 border-0 shadow-sm metric-card metric-${tone}`}>
        <div className="card-body">
          <div className="metric-top">
            <span className="material-icons-outlined">{icon}</span>
            <span>{label}</span>
          </div>
          <strong>{value}</strong>
          <p>{helper}</p>
        </div>
      </div>
    </div>
  )
}

function GameDetailDrawer({ draftGame, formErrors, onChange, onClose, onSave, saveMessage, users }) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="detail-drawer">
        <div className="detail-drawer-header">
          <div>
            <span className="eyebrow">Oyun Detay / Duzenleme</span>
            <h3>{draftGame.topic}</h3>
          </div>
          <button type="button" className="theme-icon-button" onClick={onClose} aria-label="Detay panelini kapat">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="detail-drawer-body">
          <div className="alert alert-warning">
            Kalici kayit yok. Bu form, Faz 2 kalici veri akisina hazir bir operasyon iskeleti saglar.
          </div>
          <div className="row g-3">
            <FormField label="Ders">
              <input className="form-control" value={SUBJECT_LABELS[draftGame.subject]} disabled />
            </FormField>
            <FormField label="Sorumlu">
              <select className="form-select" value={draftGame.responsible_user_id} onChange={(event) => onChange('responsible_user_id', event.target.value)}>
                {users.filter((user) => user.role === 'user').map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Konu" error={formErrors.topic}>
              <input className={`form-control ${formErrors.topic ? 'is-invalid' : ''}`} value={draftGame.topic} onChange={(event) => onChange('topic', event.target.value)} />
            </FormField>
            <FormField label="Arayuz Sayisi" error={formErrors.interface_count}>
              <input className={`form-control ${formErrors.interface_count ? 'is-invalid' : ''}`} type="number" min="0" value={draftGame.interface_count} onChange={(event) => onChange('interface_count', Number(event.target.value))} />
            </FormField>
            <FormField label="Baslangic Tarihi">
              <input className="form-control" type="date" value={draftGame.start_date} onChange={(event) => onChange('start_date', event.target.value)} />
            </FormField>
            <FormField label="Bitis Tarihi" error={formErrors.end_date}>
              <input className={`form-control ${formErrors.end_date ? 'is-invalid' : ''}`} type="date" value={draftGame.end_date} onChange={(event) => onChange('end_date', event.target.value)} />
            </FormField>
            {STAGE_ORDER.map((stageKey) => (
              <FormField key={stageKey} label={STAGE_LABELS[stageKey]}>
                <select className="form-select" value={draftGame[stageKey]} onChange={(event) => onChange(stageKey, event.target.value)}>
                  {STATUS_FILTER_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </FormField>
            ))}
            <FormField label="Kazanimlar" fullWidth>
              <textarea className="form-control" rows="3" value={draftGame.kazanimlar} onChange={(event) => onChange('kazanimlar', event.target.value)} />
            </FormField>
            <FormField label="EBA Baglantisi" fullWidth>
              <input className="form-control" type="url" value={draftGame.eba_link} onChange={(event) => onChange('eba_link', event.target.value)} />
            </FormField>
            <FormField label="Notlar" fullWidth>
              <textarea className="form-control" rows="4" value={draftGame.notes} onChange={(event) => onChange('notes', event.target.value)} />
            </FormField>
          </div>
          {saveMessage ? <div className="alert alert-info mt-3 mb-0">{saveMessage}</div> : null}
        </div>
        <div className="detail-drawer-footer">
          <button type="button" className="btn btn-light" onClick={onClose}>Kapat</button>
          <button type="button" className="btn btn-primary" onClick={onSave}>Kaydet Akisini Goster</button>
        </div>
      </aside>
    </>
  )
}

function FormField({ children, error, fullWidth = false, label }) {
  return (
    <div className={fullWidth ? 'col-12' : 'col-12 col-md-6'}>
      <label className="form-label">{label}</label>
      {children}
      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  )
}

export default App
