import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { DEFAULT_ADMIN } from '../utils/defaultAdmin'
import { getLocalUsers, saveLocalUsers } from './localStore'

const USERS_COLLECTION = 'users'

const mapFirestoreUser = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function ensureDefaultAdmin() {
  if (!isFirebaseConfigured) {
    getLocalUsers()
    return
  }

  const usersRef = collection(db, USERS_COLLECTION)
  const adminQuery = query(usersRef, where('username', '==', DEFAULT_ADMIN.username))
  const result = await getDocs(adminQuery)

  if (result.empty) {
    await addDoc(usersRef, {
      ...DEFAULT_ADMIN,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'seed',
    })
  }
}

export async function listUsers() {
  if (!isFirebaseConfigured) {
    return getLocalUsers()
  }

  await ensureDefaultAdmin()
  const usersRef = collection(db, USERS_COLLECTION)
  const result = await getDocs(query(usersRef, orderBy('createdAt', 'desc')))
  return result.docs.map(mapFirestoreUser)
}

export async function createUser(data) {
  if (!isFirebaseConfigured) {
    const users = getLocalUsers()
    const user = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveLocalUsers([user, ...users])
    return user
  }

  const docRef = await addDoc(collection(db, USERS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProvider: 'firestore-dev-profile',
  })
  return { id: docRef.id, ...data }
}

export async function updateUser(id, data) {
  if (!isFirebaseConfigured) {
    const users = getLocalUsers()
    const nextUsers = users.map((user) =>
      user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user,
    )
    saveLocalUsers(nextUsers)
    return nextUsers.find((user) => user.id === id)
  }

  await updateDoc(doc(db, USERS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteUser(id) {
  if (!isFirebaseConfigured) {
    saveLocalUsers(getLocalUsers().filter((user) => user.id !== id))
    return
  }

  await deleteDoc(doc(db, USERS_COLLECTION, id))
}

export async function upsertUserProfile(id, data) {
  if (!isFirebaseConfigured) return null

  await setDoc(
    doc(db, USERS_COLLECTION, id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function findUserProfileByEmail(email) {
  if (!isFirebaseConfigured) {
    return getLocalUsers().find((user) => user.email.toLowerCase() === email.toLowerCase())
  }

  const result = await getDocs(
    query(collection(db, USERS_COLLECTION), where('email', '==', email)),
  )
  return result.empty ? null : mapFirestoreUser(result.docs[0])
}

export async function findUserProfileByUsername(username) {
  if (!isFirebaseConfigured) {
    return getLocalUsers().find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    )
  }

  const result = await getDocs(
    query(collection(db, USERS_COLLECTION), where('username', '==', username)),
  )
  return result.empty ? null : mapFirestoreUser(result.docs[0])
}
