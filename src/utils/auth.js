import accountsData from '../../data/accounts.json'

export const ACCOUNTS = accountsData

export const ACCOUNT_ROLES = {
  admin: 'admin',
  lead: 'lead',
  user: 'user',
}

export const ACCOUNT_ROLE_LABELS = {
  admin: 'Yönetici',
  lead: 'Ders Sorumlusu',
  user: 'Kullanıcı',
}

const STORAGE_KEY = 'app.currentAccount'

export function authenticate(username, password) {
  if (!username || !password) return null
  const normalized = username.trim().toLocaleLowerCase('tr')
  const account = ACCOUNTS.find(
    (item) => item.username.toLocaleLowerCase('tr') === normalized && item.password === password,
  )
  return account || null
}

export function loadStoredAccount() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const match = ACCOUNTS.find((item) => item.username === parsed?.username)
    return match || null
  } catch {
    return null
  }
}

export function persistAccount(account) {
  if (typeof window === 'undefined') return
  if (!account) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: account.username }))
}

export function accountToActiveUser(account) {
  if (!account || account.role === 'admin') return null
  const subjects = account.subjects?.length ? account.subjects : []
  return {
    id: `account_${account.username}`,
    name: account.name,
    subject: subjects[0] || '',
    subjects,
    role: 'user',
    email: account.email,
    created_at: account.created_at || null,
  }
}
