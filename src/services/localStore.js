import { DEFAULT_ADMIN } from '../utils/defaultAdmin'

const USERS_KEY = 'nextorqen:users'
const SESSION_KEY = 'nextorqen:session'

const nowIso = () => new Date().toISOString()

const normalizeUser = (user) => ({
  id: user.id || crypto.randomUUID(),
  name: user.name || '',
  username: user.username || '',
  email: user.email || '',
  password: user.password || '',
  role: user.role || 'empleado',
  createdAt: user.createdAt || nowIso(),
  updatedAt: nowIso(),
})

export function getLocalUsers() {
  const stored = localStorage.getItem(USERS_KEY)
  const users = stored ? JSON.parse(stored) : []

  if (!users.some((user) => user.username === DEFAULT_ADMIN.username)) {
    const admin = normalizeUser(DEFAULT_ADMIN)
    const nextUsers = [admin, ...users]
    localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
    return nextUsers
  }

  return users
}

export function saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getLocalSession() {
  const session = localStorage.getItem(SESSION_KEY)
  return session ? JSON.parse(session) : null
}

export function setLocalSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function findLocalUserByLogin(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase()
  return getLocalUsers().find(
    (user) =>
      (user.username.toLowerCase() === normalizedIdentifier ||
        user.email.toLowerCase() === normalizedIdentifier) &&
      user.password === password,
  )
}
