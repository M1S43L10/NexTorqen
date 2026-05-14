import { DEFAULT_ADMIN } from '../utils/defaultAdmin'

const USERS_KEY = 'nextorqen:users'
const SESSION_KEY = 'nextorqen:session'
const CLIENTS_KEY = 'nextorqen:clients'
const VEHICLES_KEY = 'nextorqen:vehicles'
const WORK_ORDERS_KEY = 'nextorqen:work-orders'

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

export function getLocalCollection(key) {
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

export function saveLocalCollection(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

export function createLocalRecord(key, data) {
  const items = getLocalCollection(key)
  const record = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  saveLocalCollection(key, [record, ...items])
  return record
}

export function updateLocalRecord(key, id, data) {
  const items = getLocalCollection(key)
  const nextItems = items.map((item) =>
    item.id === id ? { ...item, ...data, updatedAt: nowIso() } : item,
  )
  saveLocalCollection(key, nextItems)
  return nextItems.find((item) => item.id === id)
}

export function deleteLocalRecord(key, id) {
  saveLocalCollection(
    key,
    getLocalCollection(key).filter((item) => item.id !== id),
  )
}

export const LOCAL_COLLECTION_KEYS = {
  clients: CLIENTS_KEY,
  vehicles: VEHICLES_KEY,
  workOrders: WORK_ORDERS_KEY,
}
