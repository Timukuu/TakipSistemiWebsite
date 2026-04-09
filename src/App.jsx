import { useEffect, useMemo, useState } from 'react'
import gamesData from '../data/games.json'
import subjectsData from '../data/subjects.json'
import usersData from '../data/users.json'
import {
  CLASS_LEVEL_OPTIONS,
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
  buildOperationalHighlights,
  buildStageSummary,
  createEmptyGame,
  formatDate,
  getEffectiveFilters,
  getGameHealthIssues,
  getInitialRoleState,
  getResponsibleUserName,
  getScopedGames,
  getSubjectSummaries,
  matchesFilters,
  validateGameDraft,
} from './utils/gameData'

function App() {
  const baseUrl = import.meta.env.BASE_URL
  const initialRoleState = useMemo(() => getInitialRoleState(usersData), [])
  const [games, setGames] = useState(gamesData)
  const [currentView, setCurrentView] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [roleMode, setRoleMode] = useState(initialRoleState.roleMode)
  const [selectedUserId, setSelectedUserId] = useState(initialRoleState.selectedUserId)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [draftGame, setDraftGame] = useState(null)
  const [drawerMode, setDrawerMode] = useState('edit')
  const [formErrors, setFormErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState('')

  const nonAdminUsers = useMemo(() => usersData.filter((user) => user.role === 'user'), [])

  const activeUser = useMemo(
    () => usersData.find((user) => user.id === selectedUserId) ?? nonAdminUsers[0] ?? null,
    [nonAdminUsers, selectedUserId],
  )

  const scopedGames = useMemo(
    () => getScopedGames(games, roleMode, activeUser),
    [activeUser, games, roleMode],
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
    () => buildDashboardSummary(scopedGames, usersData),
    [scopedGames],
  )

  const stageSummary = useMemo(
    () => buildStageSummary(scopedGames),
    [scopedGames],
  )

  const subjectSummaries = useMemo(
    () => getSubjectSummaries(scopedGames, subjectsData, usersData),
    [scopedGames],
  )

  const operationalHighlights = useMemo(
    () => buildOperationalHighlights(scopedGames, usersData),
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

  const availableResponsibleUsers = useMemo(() => {
    const subjectCode = draftGame?.subject
    if (!subjectCode) {
      return nonAdminUsers
    }

    return nonAdminUsers.filter((user) => user.subject === subjectCode)
  }, [draftGame?.subject, nonAdminUsers])

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
    setDraftGame((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      }

      if (field === 'subject') {
        const fallbackUser = nonAdminUsers.find((user) => user.subject === value)
        nextDraft.responsible_user_id = fallbackUser?.id ?? ''
      }

      if (field === 'is_completed' && value) {
        STAGE_ORDER.forEach((stageKey) => {
          nextDraft[stageKey] = 'onaylandi'
        })
      }

      nextDraft.updated_at = new Date().toISOString()
      return nextDraft
    })

    setFormErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      if (field === 'subject') {
        delete nextErrors.responsible_user_id
      }
      return nextErrors
    })
    setSaveMessage('')
  }

  const handleOpenGame = (gameId) => {
    const nextGame = scopedGames.find((game) => game.id === gameId)

    if (!nextGame) {
      return
    }

    setDrawerMode('edit')
    setDraftGame(structuredClone(nextGame))
    setFormErrors({})
    setSaveMessage('')
  }

  const handleCreateGame = () => {
    const subjectCode = roleMode === 'user' ? activeUser?.subject : subjectOptions[0]?.code
    const responsibleUserId =
      roleMode === 'user'
        ? activeUser?.id
        : nonAdminUsers.find((user) => user.subject === subjectCode)?.id

    setDrawerMode('create')
    setDraftGame(createEmptyGame(subjectCode, responsibleUserId))
    setFormErrors({})
    setSaveMessage('')
  }

  const handleCloseGame = () => {
    setDraftGame(null)
    setDrawerMode('edit')
    setFormErrors({})
    setSaveMessage('')
  }

  const handleSaveDraft = () => {
    if (!draftGame) {
      return
    }

    const nextErrors = validateGameDraft(draftGame, usersData)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage('')
      return
    }

    setGames((currentGames) => {
      const nextGame = {
        ...draftGame,
        updated_at: new Date().toISOString(),
      }

      if (drawerMode === 'create') {
        return [nextGame, ...currentGames]
      }

      return currentGames.map((game) => (game.id === nextGame.id ? nextGame : game))
    })

    setSaveMessage(
      drawerMode === 'create'
        ? 'Yeni kayıt panel üzerinde eklendi. Kalıcı yayın için JSON verisini repo üzerinden güncellemeniz gerekir.'
        : 'Kayıt panel üzerinde güncellendi. Kalıcı yayın için JSON verisini repo üzerinden güncellemeniz gerekir.',
    )
    setDrawerMode('edit')
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
              aria-label="Yan menüyü daralt"
            >
              <span className="material-icons-outlined">menu</span>
            </button>
          </div>
          <div className="search-bar flex-grow-1">
            <div className="page-title-wrap">
              <span className="eyebrow">MEB Üretim Paneli</span>
              <h1 className="page-title">Oyun Üretim Takip Sistemi</h1>
            </div>
          </div>
          <ul className="navbar-nav gap-2 nav-right-links align-items-center ms-auto">
            <li className="nav-item d-xl-none">
              <button
                type="button"
                className="theme-icon-button"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Mobil menüyü aç"
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
              alt="MEB Oyun Üretim Takip Sistemi"
            />
          </div>
          <div className="logo-name flex-grow-1">
            <h5 className="mb-0">MEB Takip</h5>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Yan menüyü kapat"
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
              {currentView === 'dashboard' ? 'Ana Panel' : 'Oyun Listesi'}
            </div>
            <div className="page-breadcrumb-content">
              <span className="crumb-pill">
                {roleMode === 'admin' ? 'Yönetici Görünümü' : 'Ders Sorumlusu Görünümü'}
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
                  <label className="form-label">Aktif Görünüm</label>
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
                  <label className="form-label">Mock Kullanıcı</label>
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
                  <div className="phase-banner">
                    <strong>Faz 2 Aktif</strong>
                    <span>Yerel düzenleme, yeni kayıt akışı ve yönetici operasyon özetleri açık durumda.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {currentView === 'dashboard' ? (
            <DashboardView
              dashboardSummary={dashboardSummary}
              operationalHighlights={operationalHighlights}
              stageSummary={stageSummary}
              subjectSummaries={subjectSummaries}
            />
          ) : (
            <GamesView
              filteredGames={filteredGames}
              formFilters={filters}
              onCreateGame={handleCreateGame}
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
          availableResponsibleUsers={availableResponsibleUsers}
          drawerMode={drawerMode}
          draftGame={draftGame}
          formErrors={formErrors}
          onChange={handleDraftChange}
          onClose={handleCloseGame}
          onSave={handleSaveDraft}
          saveMessage={saveMessage}
          subjectOptions={subjectOptions}
        />
      ) : null}
    </>
  )
}

function DashboardView({ dashboardSummary, operationalHighlights, stageSummary, subjectSummaries }) {
  return (
    <>
      <section className="row g-4 mb-4">
        <MetricCard icon="sports_esports" label="Toplam Oyun" value={dashboardSummary.totalGames} tone="primary" helper="Panel kapsamındaki tüm kayıtlar" />
        <MetricCard icon="task_alt" label="Tamamlanan Kayıt" value={dashboardSummary.completedGames} tone="success" helper="Tüm aşamaları kapanan oyunlar" />
        <MetricCard icon="autorenew" label="Aktif Kayıt" value={dashboardSummary.inProgressGames} tone="warning" helper="Tamamlanmamış oyunlar" />
        <MetricCard icon="warning" label="Eksik Bilgi" value={dashboardSummary.missingInfoGames} tone="danger" helper="Veri doğrulama uyarısı taşıyan kayıtlar" />
      </section>

      <section className="row g-4 mb-4">
        <div className="col-12 col-xxl-7">
          <div className="card rounded-4 border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="section-heading">
                <div>
                  <h3>Ders Bazlı Özet</h3>
                  <p>Her ders için toplam, tamamlanan, aktif ve eksik alanlı kayıt görünümü.</p>
                </div>
              </div>
              <div className="row g-3 mt-1">
                {subjectSummaries.map((subjectSummary) => (
                  <div className="col-12 col-md-6" key={subjectSummary.code}>
                    <div className="subject-summary-card">
                      <div className="subject-summary-top">
                        <div>
                          <h4>{subjectSummary.name}</h4>
                          <p>{subjectSummary.totalGames} Oyun Kaydı</p>
                        </div>
                        <span className="badge text-bg-light">{subjectSummary.completedGames} Tamamlandı</span>
                      </div>
                      <div className="subject-progress">
                        <div className="subject-progress-bar" style={{ width: `${subjectSummary.completionRate}%` }} />
                      </div>
                      <div className="subject-summary-bottom">
                        <span>{subjectSummary.inProgressGames} Aktif Kayıt</span>
                        <span>{subjectSummary.awaitingApprovalStages} Onay Bekleyen Aşama</span>
                      </div>
                      <div className="subject-summary-meta">
                        <span>{subjectSummary.missingInfoGames} Eksik Bilgili Kayıt</span>
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
                  <h3>Aşama Durum Özeti</h3>
                  <p>Beş üretim adımının anlık dağılımı.</p>
                </div>
              </div>
              <div className="table-responsive mt-3">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Aşama</th>
                      <th>Başlamadı</th>
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

      <section className="row g-4 mb-4">
        <HighlightListCard
          title="Yaklaşan Terminler"
          description="Bitiş tarihi yakın veya geçmiş olan açık kayıtlar."
          items={operationalHighlights.dueSoonGames}
          emptyMessage="Yaklaşan veya geciken açık kayıt bulunmuyor."
        />
        <HighlightListCard
          title="Onay Kuyruğu"
          description="En az bir aşaması onaya gönderilmiş kayıtlar."
          items={operationalHighlights.approvalQueue}
          emptyMessage="Onay bekleyen kayıt bulunmuyor."
        />
        <HighlightListCard
          title="Veri Uyarıları"
          description="Eksik alan veya tutarsızlık taşıyan kayıtlar."
          items={operationalHighlights.missingFieldQueue}
          emptyMessage="Veri doğrulama uyarısı bulunmuyor."
        />
      </section>
    </>
  )
}

function GamesView({
  filteredGames,
  formFilters,
  onCreateGame,
  onFilterChange,
  onOpenGame,
  onResetFilters,
  roleMode,
  subjectOptions,
  users,
}) {
  const subjectValue = roleMode === 'user' ? subjectOptions[0]?.code ?? '' : formFilters.subject

  return (
    <>
      <section className="card rounded-4 border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-xl-4">
              <label className="form-label">Konu Ara</label>
              <input
                className="form-control"
                type="search"
                value={formFilters.search}
                onChange={(event) => onFilterChange('search', event.target.value)}
                placeholder="Örnek: Kuvvet ve Hareket"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Ders</label>
              <select
                className="form-select"
                value={subjectValue}
                onChange={(event) => onFilterChange('subject', event.target.value)}
                disabled={roleMode === 'user'}
              >
                <option value="">Tüm Dersler</option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.code}>
                    {SUBJECT_LABELS[subject.code] ?? subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Durum</label>
              <select
                className="form-select"
                value={formFilters.status}
                onChange={(event) => onFilterChange('status', event.target.value)}
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 col-xl-2">
              <label className="form-label">Tamamlanma</label>
              <select
                className="form-select"
                value={formFilters.completion}
                onChange={(event) => onFilterChange('completion', event.target.value)}
              >
                {COMPLETION_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3 col-xl-1 d-flex align-items-end">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={onResetFilters}>
                Sıfırla
              </button>
            </div>
            <div className="col-6 col-md-3 col-xl-1 d-flex align-items-end">
              <button type="button" className="btn btn-primary w-100" onClick={onCreateGame}>
                Yeni
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card rounded-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="section-heading mb-3">
            <div>
              <h3>Oyun Listesi</h3>
              <p>{filteredGames.length} Kayıt Gösteriliyor.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0 project-table">
              <thead>
                <tr>
                  <th>Ders</th>
                  <th>Sınıf</th>
                  <th>Konu</th>
                  <th>Sorumlu</th>
                  <th>Bölüm</th>
                  <th>Üretim Akışı</th>
                  <th>Başlangıç</th>
                  <th>Bitiş</th>
                  <th>Link</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => {
                  const issues = getGameHealthIssues(game, users)

                  return (
                    <tr key={game.id}>
                      <td className="fw-semibold">{SUBJECT_LABELS[game.subject]}</td>
                      <td>{game.class_level}</td>
                      <td>
                        <div className="table-title">{game.topic}</div>
                        <div className="table-subtitle">{game.kazanimlar}</div>
                        {issues.length > 0 ? <div className="table-inline-note">{issues.length} Veri Uyarısı</div> : null}
                      </td>
                      <td>{getResponsibleUserName(users, game.responsible_user_id)}</td>
                      <td>{game.interface_count}</td>
                      <td className="stage-flow-cell">
                        <StageProgress game={game} />
                      </td>
                      <td>
                        <div className="table-secondary-stack">{formatDate(game.start_date)}</div>
                      </td>
                      <td>
                        <div className="table-secondary-stack">{formatDate(game.end_date)}</div>
                      </td>
                      <td>
                        <div className="table-secondary-stack">
                          {game.eba_link ? (
                            <a className="badge rounded-pill text-bg-primary link-badge table-pill" href={game.eba_link} target="_blank" rel="noreferrer">
                              Aç
                            </a>
                          ) : (
                            <span className="badge rounded-pill text-bg-light link-badge table-pill disabled">Yok</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="table-secondary-stack">
                          <span className={`badge rounded-pill table-pill ${game.is_completed ? 'text-bg-success' : 'text-bg-light'}`}>
                            {game.is_completed ? 'Tamamlandı' : 'Açık'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onOpenGame(game.id)}>
                          Detay
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">Seçili filtrelerle eşleşen kayıt bulunamadı.</div>
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

function StageProgress({ game }) {
  return (
    <div className="stage-progress-track" role="list" aria-label="Üretim Aşamaları">
      {STAGE_ORDER.map((stageKey, index) => {
        const status = game[stageKey]
        return (
          <div key={stageKey} className={`stage-progress-item ${index === STAGE_ORDER.length - 1 ? 'is-last' : ''}`} role="listitem">
            <span className="stage-progress-label">{STAGE_LABELS[stageKey]}</span>
            <span className={`stage-progress-badge status-${status}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HighlightListCard({ description, emptyMessage, items, title }) {
  return (
    <div className="col-12 col-xl-4">
      <div className="card rounded-4 border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="section-heading compact-heading">
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>
          <div className="highlight-list">
            {items.length === 0 ? (
              <div className="empty-state small">{emptyMessage}</div>
            ) : (
              items.map((item) => (
                <article key={item.id} className={`highlight-item tone-${item.tone}`}>
                  <div className="highlight-meta">{item.subjectLabel}</div>
                  <h4>{item.topic}</h4>
                  <p>{item.meta}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
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

function GameDetailDrawer({
  availableResponsibleUsers,
  drawerMode,
  draftGame,
  formErrors,
  onChange,
  onClose,
  onSave,
  saveMessage,
  subjectOptions,
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="detail-drawer">
        <div className="detail-drawer-header">
          <div>
            <span className="eyebrow">{drawerMode === 'create' ? 'Yeni Oyun Kaydı' : 'Oyun Detay / Düzenleme'}</span>
            <h3>{draftGame.topic || 'Yeni Kayıt Hazırlanıyor'}</h3>
          </div>
          <button type="button" className="theme-icon-button" onClick={onClose} aria-label="Detay Panelini Kapat">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="detail-drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-title">
              <h4>Temel Bilgiler</h4>
              <p>Ders, sınıf, konu ve sorumlu atamalarını bu alanda yönetin.</p>
            </div>
            <div className="row g-3">
              <FormField label="Ders" error={formErrors.subject}>
                <select className={`form-select ${formErrors.subject ? 'is-invalid' : ''}`} value={draftGame.subject} onChange={(event) => onChange('subject', event.target.value)}>
                  {subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.code}>
                      {SUBJECT_LABELS[subject.code] ?? subject.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sınıf" error={formErrors.class_level}>
                <select className={`form-select ${formErrors.class_level ? 'is-invalid' : ''}`} value={draftGame.class_level ?? ''} onChange={(event) => onChange('class_level', event.target.value)}>
                  <option value="">Sınıf Seçin</option>
                  {CLASS_LEVEL_OPTIONS.map((classLevel) => (
                    <option key={classLevel} value={classLevel}>
                      {classLevel}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Sorumlu" error={formErrors.responsible_user_id}>
                <select className={`form-select ${formErrors.responsible_user_id ? 'is-invalid' : ''}`} value={draftGame.responsible_user_id} onChange={(event) => onChange('responsible_user_id', event.target.value)}>
                  <option value="">Sorumlu Seçin</option>
                  {availableResponsibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Konu" error={formErrors.topic}>
                <input className={`form-control ${formErrors.topic ? 'is-invalid' : ''}`} value={draftGame.topic} onChange={(event) => onChange('topic', event.target.value)} placeholder="Örnek: Kesirler Parkuru" />
              </FormField>
              <FormField label="Bölüm Sayısı" error={formErrors.interface_count}>
                <input className={`form-control ${formErrors.interface_count ? 'is-invalid' : ''}`} type="number" min="0" value={draftGame.interface_count} onChange={(event) => onChange('interface_count', Number(event.target.value))} />
              </FormField>
              <FormField label="Tamamlandı Uygula" error={formErrors.is_completed}>
                <div className="completion-toggle">
                  <input id="is-completed" className="form-check-input" type="checkbox" checked={draftGame.is_completed} onChange={(event) => onChange('is_completed', event.target.checked)} />
                  <label htmlFor="is-completed">Tüm aşamalar onaylandıysa kaydı tamamlandı olarak işaretle</label>
                </div>
              </FormField>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <h4>Tarih ve Aşamalar</h4>
              <p>Üretim akışındaki zamanlamayı ve aşama durumlarını burada güncelleyin.</p>
            </div>
            <div className="row g-3">
              <FormField label="Başlangıç Tarihi" error={formErrors.start_date}>
                <input className={`form-control ${formErrors.start_date ? 'is-invalid' : ''}`} type="date" value={draftGame.start_date} onChange={(event) => onChange('start_date', event.target.value)} />
              </FormField>
              <FormField label="Bitiş Tarihi" error={formErrors.end_date}>
                <input className={`form-control ${formErrors.end_date ? 'is-invalid' : ''}`} type="date" value={draftGame.end_date} onChange={(event) => onChange('end_date', event.target.value)} />
              </FormField>
              {STAGE_ORDER.map((stageKey) => (
                <FormField key={stageKey} label={STAGE_LABELS[stageKey]}>
                  <select className="form-select" value={draftGame[stageKey]} onChange={(event) => onChange(stageKey, event.target.value)}>
                    {STATUS_FILTER_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">
              <h4>İçerik ve Yayın Bilgileri</h4>
              <p>Kazanım, link ve operasyon notları kaydın görünürlüğünü güçlendirir.</p>
            </div>
            <div className="row g-3">
              <FormField label="Kazanımlar" error={formErrors.kazanimlar} fullWidth>
                <textarea className={`form-control ${formErrors.kazanimlar ? 'is-invalid' : ''}`} rows="3" value={draftGame.kazanimlar} onChange={(event) => onChange('kazanimlar', event.target.value)} placeholder="Oyunun desteklediği kazanımları yazın" />
              </FormField>
              <FormField label="Link" error={formErrors.eba_link} fullWidth>
                <input className={`form-control ${formErrors.eba_link ? 'is-invalid' : ''}`} type="url" value={draftGame.eba_link} onChange={(event) => onChange('eba_link', event.target.value)} placeholder="https://" />
              </FormField>
              <FormField label="Notlar" fullWidth>
                <textarea className="form-control" rows="4" value={draftGame.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Üretim ekibinin bilmesi gereken operasyon notlarını ekleyin" />
              </FormField>
            </div>
          </div>

          {saveMessage ? <div className="alert alert-info mt-3 mb-0">{saveMessage}</div> : null}
        </div>
        <div className="detail-drawer-footer">
          <button type="button" className="btn btn-light" onClick={onClose}>
            Kapat
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            {drawerMode === 'create' ? 'Kaydı Ekle' : 'Kaydı Güncelle'}
          </button>
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
