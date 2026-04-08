import { STAGE_LABELS, STAGE_ORDER, SUBJECT_LABELS } from '../constants'

export function getInitialRoleState(users) {
  const firstUser = users.find((user) => user.role === 'user') ?? null

  return {
    roleMode: 'admin',
    selectedUserId: firstUser?.id ?? '',
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
  const topicMatches = game.topic.toLowerCase().includes(filters.search.toLowerCase().trim())
  const subjectMatches = !filters.subject || game.subject === filters.subject
  const completionMatches =
    filters.completion === 'all' ||
    (filters.completion === 'completed' && game.is_completed) ||
    (filters.completion === 'open' && !game.is_completed)
  const statusMatches =
    !filters.status || STAGE_ORDER.some((stageKey) => game[stageKey] === filters.status)

  return topicMatches && subjectMatches && completionMatches && statusMatches
}

export function buildDashboardSummary(games) {
  const completedGames = games.filter((game) => game.is_completed).length
  const inProgressGames = games.filter((game) =>
    STAGE_ORDER.some((stageKey) => game[stageKey] === 'devam_ediyor'),
  ).length
  const awaitingApprovalStages = games.reduce(
    (count, game) =>
      count + STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length,
    0,
  )

  return {
    totalGames: games.length,
    completedGames,
    inProgressGames,
    awaitingApprovalStages,
  }
}

export function getSubjectSummaries(games, subjects) {
  return subjects
    .filter((subject) => subject.is_active)
    .map((subject) => {
      const subjectGames = games.filter((game) => game.subject === subject.code)
      const completedGames = subjectGames.filter((game) => game.is_completed).length
      const inProgressGames = subjectGames.filter((game) =>
        STAGE_ORDER.some((stageKey) => game[stageKey] === 'devam_ediyor'),
      ).length
      const awaitingApprovalStages = subjectGames.reduce(
        (count, game) =>
          count + STAGE_ORDER.filter((stageKey) => game[stageKey] === 'onaya_gonderildi').length,
        0,
      )

      return {
        code: subject.code,
        name: SUBJECT_LABELS[subject.code] ?? subject.name,
        totalGames: subjectGames.length,
        completedGames,
        inProgressGames,
        awaitingApprovalStages,
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
