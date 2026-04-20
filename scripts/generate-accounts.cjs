const fs = require('fs')
const path = require('path')

const teams = require(path.join('..', 'data', 'teams.json'))

/** Kişiye bağlı olmayan süper yönetici — script her çalıştığında korunur */
const SUPER_ADMIN_ACCOUNT = {
  username: 'admin',
  password: 'admin2026',
  name: 'Anonim Yönetici',
  role: 'admin',
  subjects: [],
  email: null,
  anonymous: true,
}

const TR_MAP = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' }

function slug(str) {
  return str
    .split('')
    .map((c) => TR_MAP[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function buildUsername(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 2) return `${slug(parts[0])}_${slug(parts[1])}`
  if (parts.length === 3) return `${slug(parts[0]).charAt(0)}${slug(parts[1]).charAt(0)}_${slug(parts[2])}`
  // 4+ tokens: first 2 initials + first surname
  return `${slug(parts[0]).charAt(0)}${slug(parts[1]).charAt(0)}_${slug(parts[2])}`
}

function buildPassword(fullName) {
  return `${slug(fullName).charAt(0)}2026`
}

const peopleMap = new Map()
for (const member of teams) {
  const key = member.name.trim()
  if (!peopleMap.has(key)) {
    peopleMap.set(key, { name: key, subjects: new Set(), isLead: false, email: null })
  }
  const entry = peopleMap.get(key)
  entry.subjects.add(member.subject)
  if (member.is_lead) entry.isLead = true
  if (member.email && !entry.email) entry.email = member.email
}

const ADMIN_OVERRIDES = new Set(['Berk Timuçin Önür', 'Esin Özgenç'])
if (!peopleMap.has('Esin Özgenç')) {
  peopleMap.set('Esin Özgenç', { name: 'Esin Özgenç', subjects: new Set(), isLead: false, email: null })
}

const accounts = []
const usedUsernames = new Set()

for (const [, person] of peopleMap) {
  let username = buildUsername(person.name)
  let suffix = 2
  while (usedUsernames.has(username)) {
    username = `${buildUsername(person.name)}_${suffix++}`
  }
  usedUsernames.add(username)

  const isAdmin = ADMIN_OVERRIDES.has(person.name)
  const role = isAdmin ? 'admin' : person.isLead ? 'lead' : 'user'

  accounts.push({
    username,
    password: buildPassword(person.name),
    name: person.name,
    role,
    subjects: Array.from(person.subjects).sort(),
    email: person.email || `${username}@meb.gov.tr`,
  })
}

const teamAccounts = accounts.filter((a) => a.username !== SUPER_ADMIN_ACCOUNT.username)

teamAccounts.sort((a, b) => {
  const rolePriority = { admin: 0, lead: 1, user: 2 }
  const priorityDiff = rolePriority[a.role] - rolePriority[b.role]
  if (priorityDiff !== 0) return priorityDiff
  return a.name.localeCompare(b.name, 'tr')
})

const finalAccounts = [SUPER_ADMIN_ACCOUNT, ...teamAccounts]

const outPath = path.join(__dirname, '..', 'data', 'accounts.json')
fs.writeFileSync(outPath, JSON.stringify(finalAccounts, null, 2) + '\n', 'utf8')
console.log(`Wrote ${finalAccounts.length} accounts to ${outPath}`)
finalAccounts.forEach((a) => console.log(`${a.role.padEnd(6)} ${a.username.padEnd(22)} ${a.password.padEnd(8)} ${a.name}`))
