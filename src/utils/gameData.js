import { STAGE_LABELS, STAGE_ORDER, SUBJECT_LABELS } from '../constants'

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
const STATUS_PROGRESS_SCORE = {
  baslamadi: 0,
  devam_ediyor: 1,
  onaya_gonderildi: 2,
  onaylandi: 3,
}

function normalizeText(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isValidOptionalUrl(value) {
  if (!value?.trim()) {
    return true
  }

  if (/^(https?:)?\/\//i.test(value)) {
    try {
      const parsedUrl = new URL(value)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }

  return !value.includes(' ')
}

function safeDateDifference(dateValue, referenceDate) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY
  }

  const targetDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(targetDate.getTime())) {
    return Number.POSITIVE_INFINITY
  }

  const normalizedReference = new Date(referenceDate)
  normalizedReference.setHours(0, 0, 0, 0)

  return Math.round((targetDate.getTime() - normalizedReference.getTime()) / ONE_DAY_IN_MS)
}

export function getInitialRoleState(users) {
  const firstUser = users.find((user) => user.role === 'user') ?? null

  return {
    roleMode: 'admin',
    selectedUserId: firstUser?.id ?? '',
  }
}

export function createEmptyGame(subjectCode, userId) {
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10)
  const uniqueSuffix = `${Date.now()}`

  return {
    id: `game_${uniqueSuffix}`,
    subject: subjectCode ?? 'fizik',
    class_level: '',
    topic: '',
    oyun_ozeti: '',
    interface_count: 0,
    scenario_status: 'baslamadi',
    design_status: 'baslamadi',
    unity_status: 'baslamadi',
    webgl_scorm_status: 'baslamadi',
    eba_status: 'baslamadi',
    start_date: dateStamp,
    end_date: '',
    is_completed: false,
    responsible_user_id: userId ?? '',
    kazanimlar: '',
    eba_link: '',
    play_url: '',
    notes: '',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }
}

export function getScopedGames(games, roleMode, activeUser) {
  if (roleMode === 'admin') {
    return games
  }

  if (!activeUser) {
    return []
  }

  return games.filter((game) => game.subject === activeUser.subject)
}

export function getEffectiveFilters(filters, roleMode, activeUser) {
  if (roleMode === 'user' && activeUser) {
    return {
      ...filters,
      subject: activeUser.subject,
    }
  }

  return filters
}

export function matchesFilters(game, filters) {
  const searchValue = normalizeText(filters.search.trim())
  const searchTarget = normalizeText(`${game.topic} ${game.oyun_ozeti} ${game.kazanimlar} ${game.class_level}`)
  const topicMatches = !searchValue || searchTarget.includes(searchValue)
  const subjectMatches = !filters.subject || game.subject === filters.subject
  const completionMatches =
    filters.completion === 'all' ||
    (filters.completion === 'completed' && game.is_completed) ||
    (filters.completion === 'open' && !game.is_completed)
  const statusMatches =
    !filters.status || STAGE_ORDER.some((stageKey) => game[stageKey] === filters.status)

  return topicMatches && subjectMatches && completionMatches && statusMatches
}

export function validateGameDraft(game, users) {
  const errors = {}
  const responsibleUser = users.find((user) => user.id === game?.responsible_user_id)

  if (!game?.subject) {
    errors.subject = 'Ders seçimi zorunludur.'
  }

  if (!game?.class_level?.trim()) {
    errors.class_level = 'Sınıf bilgisi zorunludur.'
  }

  if (!game?.topic?.trim()) {
    errors.topic = 'Konu alanı zorunludur.'
  }

  if (!game?.oyun_ozeti?.trim()) {
    errors.oyun_ozeti = 'Oyun Özeti alanı zorunludur.'
  }

  if (!game?.responsible_user_id) {
    errors.responsible_user_id = 'Sorumlu kullanıcı seçimi zorunludur.'
  }

  if (responsibleUser && game.subject && responsibleUser.subject !== game.subject) {
    errors.responsible_user_id = 'Seçilen sorumlu kullanıcının dersi kayıtla uyuşmuyor.'
  }

  if (!Number.isInteger(Number(game?.interface_count)) || Number(game?.interface_count) < 0) {
    errors.interface_count = 'Bölüm sayısı 0 veya daha büyük bir sayı olmalıdır.'
  }

  if (!game?.kazanimlar?.trim()) {
    errors.kazanimlar = 'Kazanımlar alanı zorunludur.'
  }

  if (!game?.start_date) {
    errors.start_date = 'Başlangıç tarihi zorunludur.'
  }

  if (game?.start_date && game?.end_date && game.start_date > game.end_date) {
    errors.end_date = 'Bitiş tarihi başlangıç tarihinden önce olamaz.'
  }

  if (game?.eba_link?.trim() && !isValidOptionalUrl(game.eba_link)) {
    errors.eba_link = 'EBA Link alanı geçerli bir URL olmalıdır.'
  }

  if (game?.play_url?.trim() && !isValidOptionalUrl(game.play_url)) {
    errors.play_url = 'Play URL alanı geçerli bir adres olmalıdır.'
  }

  if (game?.is_completed) {
    const hasOpenStage = STAGE_ORDER.some((stageKey) => game[stageKey] !== 'onaylandi')
    if (hasOpenStage) {
      errors.is_completed = 'Tamamlandı işaretli kayıtların tüm aşamaları Onaylandı olmalıdır.'
    }
  }

  return errors
}

export function getGameHealthIssues(game, users) {
  const issues = []
  const responsibleUser = users.find((user) => user.id === game.responsible_user_id)

  if (!game.class_level?.trim()) {
    issues.push('Sınıf bilgisi eksik')
  }

  if (!game.kazanimlar?.trim()) {
    issues.push('Kazanım bilgisi eksik')
  }

  if (!game.oyun_ozeti?.trim()) {
    issues.push('Oyun özeti eksik')
  }

  if (!game.end_date) {
    issues.push('Bitiş tarihi eksik')
  }

  if (!responsibleUser) {
    issues.push('Sorumlu kullanıcı tanımsız')
  } else if (responsibleUser.subject !== game.subject) {
    issues.push('Ders-sorumlu eşleşmesi hatalı')
  }

  if (game.is_completed && STAGE_ORDER.some((stageKey) => game[stageKey] !== 'onaylandi')) {
    issues.push('Tamamlandı kaydı aşamalarla uyumsuz')
  }

  return issues
}

export function buildDashboardSummary(games, users) {
  const completedGames = games.filter((game) => game.is_completed).length
  const openGames = games.filter((game) => !game.is_completed)
  const awaitingApprovalStages = games.reduce(
    (count, game) =>
      count + STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length,
    0,
  )
  const missingInfoGames = games.filter((game) => getGameHealthIssues(game, users).length > 0).length

  return {
    totalGames: games.length,
    completedGames,
    inProgressGames: openGames.length,
    awaitingApprovalStages,
    missingInfoGames,
  }
}

export function getSubjectSummaries(games, subjects, users) {
  return subjects
    .filter((subject) => subject.is_active)
    .map((subject) => {
      const subjectGames = games.filter((game) => game.subject === subject.code)
      const completedGames = subjectGames.filter((game) => game.is_completed).length
      const inProgressGames = subjectGames.filter((game) => !game.is_completed).length
      const awaitingApprovalStages = subjectGames.reduce(
        (count, game) =>
          count + STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length,
        0,
      )
      const missingInfoGames = subjectGames.filter((game) => getGameHealthIssues(game, users).length > 0).length

      return {
        code: subject.code,
        name: SUBJECT_LABELS[subject.code] ?? subject.name,
        totalGames: subjectGames.length,
        completedGames,
        inProgressGames,
        awaitingApprovalStages,
        missingInfoGames,
        completionRate: subjectGames.length
          ? Math.round((completedGames / subjectGames.length) * 100)
          : 0,
      }
    })
}

export function buildStageSummary(games) {
  return STAGE_ORDER.map((stageKey) => ({
    stageKey,
    label: STAGE_LABELS[stageKey],
    counts: games.reduce(
      (accumulator, game) => {
        accumulator[game[stageKey]] += 1
        return accumulator
      },
      {
        baslamadi: 0,
        devam_ediyor: 0,
        onaya_gonderildi: 0,
        onaylandi: 0,
      },
    ),
  }))
}

export function buildOperationalHighlights(games, users, referenceDate = new Date()) {
  const openGames = games.filter((game) => !game.is_completed)

  const dueSoonGames = [...openGames]
    .filter((game) => safeDateDifference(game.end_date, referenceDate) <= 10)
    .sort((leftGame, rightGame) => safeDateDifference(leftGame.end_date, referenceDate) - safeDateDifference(rightGame.end_date, referenceDate))
    .slice(0, 5)
    .map((game) => ({
      id: game.id,
      topic: game.topic,
      subjectLabel: SUBJECT_LABELS[game.subject] ?? game.subject,
      meta: game.end_date ? `${formatDate(game.end_date)} terminli` : 'Bitiş tarihi eksik',
      tone: safeDateDifference(game.end_date, referenceDate) < 0 ? 'danger' : 'warning',
    }))

  const approvalQueue = [...openGames]
    .filter((game) => STAGE_ORDER.some((stageKey) => game[stageKey] === 'onaya_gonderildi'))
    .slice(0, 5)
    .map((game) => ({
      id: game.id,
      topic: game.topic,
      subjectLabel: SUBJECT_LABELS[game.subject] ?? game.subject,
      meta: `${STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length} aşama onay bekliyor`,
      tone: 'danger',
    }))

  const missingFieldQueue = games
    .map((game) => ({
      game,
      issues: getGameHealthIssues(game, users),
    }))
    .filter((entry) => entry.issues.length > 0)
    .slice(0, 5)
    .map(({ game, issues }) => ({
      id: game.id,
      topic: game.topic,
      subjectLabel: SUBJECT_LABELS[game.subject] ?? game.subject,
      meta: issues.join(' · '),
      tone: 'secondary',
    }))

  return {
    dueSoonGames,
    approvalQueue,
    missingFieldQueue,
  }
}

export function buildReportsSnapshot(games, subjects, users, referenceDate = new Date()) {
  const dashboardSummary = buildDashboardSummary(games, users)
  const subjectSummaries = getSubjectSummaries(games, subjects, users)
  const openGames = games.filter((game) => !game.is_completed)
  const overdueGames = openGames.filter((game) => safeDateDifference(game.end_date, referenceDate) < 0).length
  const dueSoonGames = openGames.filter((game) => {
    const diff = safeDateDifference(game.end_date, referenceDate)
    return diff >= 0 && diff <= 10
  }).length

  const subjectDistribution = subjectSummaries
    .filter((item) => item.totalGames > 0)
    .map((item) => ({
      label: item.name,
      value: item.totalGames,
    }))

  const stageDistribution = STAGE_ORDER.map((stageKey) => ({
    label: STAGE_LABELS[stageKey],
    baslamadi: games.filter((game) => game[stageKey] === 'baslamadi').length,
    devam_ediyor: games.filter((game) => game[stageKey] === 'devam_ediyor').length,
    onaya_gonderildi: games.filter((game) => game[stageKey] === 'onaya_gonderildi').length,
    onaylandi: games.filter((game) => game[stageKey] === 'onaylandi').length,
  }))

  const reportTableRows = subjectSummaries
    .filter((item) => item.totalGames > 0)
    .map((item) => ({
      ...item,
      overdueGames: games.filter(
        (game) =>
          game.subject === item.code &&
          !game.is_completed &&
          safeDateDifference(game.end_date, referenceDate) < 0,
      ).length,
      dueSoonGames: games.filter((game) => {
        const diff = safeDateDifference(game.end_date, referenceDate)
        return game.subject === item.code && !game.is_completed && diff >= 0 && diff <= 10
      }).length,
      averageSections: item.totalGames
        ? (
            games
              .filter((game) => game.subject === item.code)
              .reduce((sum, game) => sum + Number(game.interface_count || 0), 0) / item.totalGames
          ).toFixed(1)
        : '0.0',
    }))
    .sort((leftItem, rightItem) => rightItem.totalGames - leftItem.totalGames)

  const classDistribution = [...games]
    .reduce((accumulator, game) => {
      const key = game.class_level || 'Belirtilmemiş'
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1)
      return accumulator
    }, new Map())
    .entries()

  const classDistributionSeries = Array.from(classDistribution)
    .map(([label, value]) => ({ label, value }))
    .sort((leftItem, rightItem) => rightItem.value - leftItem.value)

  const riskRanking = subjectSummaries
    .filter((item) => item.totalGames > 0)
    .map((item) => {
      const subjectGames = games.filter((game) => game.subject === item.code)
      const overdueCount = subjectGames.filter(
        (game) => !game.is_completed && safeDateDifference(game.end_date, referenceDate) < 0,
      ).length
      const missingCount = subjectGames.filter((game) => getGameHealthIssues(game, users).length > 0).length
      const awaitingCount = subjectGames.reduce(
        (count, game) =>
          count + STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length,
        0,
      )
      const openCount = subjectGames.filter((game) => !game.is_completed).length
      const riskScore = overdueCount * 35 + missingCount * 18 + awaitingCount * 8 + openCount * 5

      return {
        code: item.code,
        name: item.name,
        riskScore,
        overdueCount,
        missingCount,
        openCount,
      }
    })
    .sort((leftItem, rightItem) => rightItem.riskScore - leftItem.riskScore)

  const silentSubjects = subjectSummaries
    .filter((item) => item.totalGames > 0)
    .map((item) => {
      const subjectGames = games.filter((game) => game.subject === item.code)
      const lastActivityAt = subjectGames
        .map((game) => new Date(game.updated_at || game.created_at || 0).getTime())
        .reduce((latest, value) => Math.max(latest, value), 0)
      const daysSinceActivity = lastActivityAt
        ? Math.max(0, Math.floor((referenceDate.getTime() - lastActivityAt) / ONE_DAY_IN_MS))
        : 0

      return {
        code: item.code,
        name: item.name,
        daysSinceActivity,
        totalGames: item.totalGames,
        completionRate: item.completionRate,
      }
    })
    .sort((leftItem, rightItem) => rightItem.daysSinceActivity - leftItem.daysSinceActivity)

  const fastestSubjects = subjectSummaries
    .filter((item) => item.totalGames > 0)
    .map((item) => {
      const subjectGames = games.filter((game) => game.subject === item.code)
      const stageVelocity = subjectGames.length
        ? Math.round(
            (subjectGames.reduce(
              (sum, game) =>
                sum +
                STAGE_ORDER.reduce((stageSum, stageKey) => stageSum + STATUS_PROGRESS_SCORE[game[stageKey]], 0),
              0,
            ) /
              (subjectGames.length * STAGE_ORDER.length * 3)) *
              100,
          )
        : 0

      return {
        code: item.code,
        name: item.name,
        completionRate: item.completionRate,
        stageVelocity,
        momentumScore: Math.round(item.completionRate * 0.6 + stageVelocity * 0.4),
      }
    })
    .sort((leftItem, rightItem) => rightItem.momentumScore - leftItem.momentumScore)

  const last7DaysActivity = Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(referenceDate)
    currentDate.setHours(0, 0, 0, 0)
    currentDate.setDate(currentDate.getDate() - (6 - index))
    const dateKey = currentDate.toISOString().slice(0, 10)

    return {
      label: new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
      }).format(currentDate),
      createdCount: games.filter((game) => (game.created_at || '').slice(0, 10) === dateKey).length,
      updatedCount: games.filter((game) => {
        const updatedKey = (game.updated_at || '').slice(0, 10)
        const createdKey = (game.created_at || '').slice(0, 10)
        return updatedKey === dateKey && updatedKey !== createdKey
      }).length,
    }
  })

  const scopeSizeRows = [...games]
    .map((game) => ({
      id: game.id,
      topic: game.topic,
      subjectLabel: SUBJECT_LABELS[game.subject] ?? game.subject,
      sectionCount: Number(game.interface_count || 0),
      classLevel: game.class_level || '-',
    }))
    .sort((leftItem, rightItem) => rightItem.sectionCount - leftItem.sectionCount)

  const responsibleWorkload = users
    .filter((user) => user.role === 'user')
    .map((user) => {
      const assignedGames = games.filter((game) => game.responsible_user_id === user.id)
      return {
        name: user.name,
        subjectLabel: SUBJECT_LABELS[user.subject] ?? user.subject,
        openGames: assignedGames.filter((game) => !game.is_completed).length,
        totalSections: assignedGames.reduce((sum, game) => sum + Number(game.interface_count || 0), 0),
      }
    })
    .sort((leftItem, rightItem) => rightItem.openGames - leftItem.openGames)

  const stageEfficiency = STAGE_ORDER.map((stageKey) => {
    const progressedGames = games.filter(
      (game) => game[stageKey] === 'onaya_gonderildi' || game[stageKey] === 'onaylandi',
    ).length
    const efficiencyScore = games.length
      ? Math.round((progressedGames / games.length) * 100)
      : 0

    return {
      stageKey,
      label: STAGE_LABELS[stageKey],
      efficiencyScore,
      activeCount: games.filter((game) => game[stageKey] === 'devam_ediyor').length,
    }
  })

  const funnelSeries = [
    { label: 'Toplam Oyun', value: games.length },
    { label: 'Üretimde', value: openGames.length },
    {
      label: 'Onaya Giden',
      value: openGames.filter((game) =>
        STAGE_ORDER.some((stageKey) => game[stageKey] === 'onaya_gonderildi'),
      ).length,
    },
    {
      label: 'Yayına Yakın',
      value: openGames.filter(
        (game) =>
          game.webgl_scorm_status === 'onaylandi' ||
          game.eba_status === 'onaya_gonderildi' ||
          game.eba_status === 'onaylandi',
      ).length,
    },
    { label: 'Tamamlanan', value: dashboardSummary.completedGames },
  ]

  const stageHeatmap = subjectSummaries
    .filter((summary) => summary.totalGames > 0)
    .map((summary) => ({
      name: summary.name,
      data: STAGE_ORDER.map((stageKey) => {
        const subjectGames = games.filter((game) => game.subject === summary.code)
        const stageAverage = subjectGames.length
          ? subjectGames.reduce(
              (sum, game) => sum + STATUS_PROGRESS_SCORE[game[stageKey]],
              0,
            ) / subjectGames.length
          : 0

        return {
          x: STAGE_LABELS[stageKey],
          y: Math.round((stageAverage / 3) * 100),
        }
      }),
    }))

  const healthScoreRows = games
    .map((game) => {
      const issues = getGameHealthIssues(game, users)
      const overduePenalty = safeDateDifference(game.end_date, referenceDate) < 0 && !game.is_completed ? 20 : 0
      const approvalBoost =
        STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaylandi').length * 8
      const completionBoost = game.is_completed ? 25 : 0
      const healthScore = Math.max(
        0,
        Math.min(100, 55 + approvalBoost + completionBoost - issues.length * 12 - overduePenalty),
      )

      return {
        id: game.id,
        topic: game.topic,
        subjectLabel: SUBJECT_LABELS[game.subject] ?? game.subject,
        healthScore,
        issues,
      }
    })
    .sort((leftItem, rightItem) => leftItem.healthScore - rightItem.healthScore)

  const averageHealthScore = healthScoreRows.length
    ? Math.round(
        healthScoreRows.reduce((sum, item) => sum + item.healthScore, 0) / healthScoreRows.length,
      )
    : 0

  return {
    kpis: {
      ...dashboardSummary,
      overdueGames,
      dueSoonGames,
      averageHealthScore,
    },
    subjectDistribution,
    stageDistribution,
    reportTableRows,
    classDistribution: classDistributionSeries,
    responsibleWorkload,
    stageEfficiency,
    funnelSeries,
    stageHeatmap,
    healthScoreRows,
    riskRanking,
    silentSubjects,
    fastestSubjects,
    last7DaysActivity,
    scopeSizeRows,
  }
}

export function buildDashboardPieSnapshot(games, subjects) {
  const activeSubjects = subjects.filter((subject) => subject.is_active)

  const scenarioCompleted = games.filter((game) => game.scenario_status === 'onaylandi').length
  const scenarioOpen = Math.max(games.length - scenarioCompleted, 0)
  const completedGames = games.filter((game) => game.is_completed).length
  const openGames = Math.max(games.length - completedGames, 0)

  const scenarioBySubject = activeSubjects
    .map((subject) => ({
      label: SUBJECT_LABELS[subject.code] ?? subject.name,
      value: games.filter(
        (game) => game.subject === subject.code && game.scenario_status === 'onaylandi',
      ).length,
    }))
    .filter((item) => item.value > 0)

  const completedBySubject = activeSubjects
    .map((subject) => ({
      label: SUBJECT_LABELS[subject.code] ?? subject.name,
      value: games.filter((game) => game.subject === subject.code && game.is_completed).length,
    }))
    .filter((item) => item.value > 0)

  return {
    scenarioStatusSeries: [scenarioCompleted, scenarioOpen],
    scenarioBySubject,
    gameStatusSeries: [completedGames, openGames],
    completedBySubject,
  }
}

export function getResponsibleUserName(users, responsibleUserId) {
  return users.find((user) => user.id === responsibleUserId)?.name ?? '-'
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return '-'
  }

  const [year, month, day] = dateValue.split('-')
  return `${day}.${month}.${year}`
}
