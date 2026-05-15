import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  getDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseConfig, isFirebaseConfigured } from '../firebase/config'
import { DEFAULT_ADMIN } from '../utils/defaultAdmin'
import { getLocalUsers, saveLocalUsers } from './localStore'

const USERS_COLLECTION = 'users'
const DEFAULT_ADMIN_DOC_ID = 'default-admin'

const mapFirestoreUser = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

async function createFirebaseAuthUser(data) {
  const secondaryApp = initializeApp(firebaseConfig, `user-create-${crypto.randomUUID()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      data.email,
      data.authPassword || data.password,
    )
    return credential.user.uid
  } finally {
    await deleteApp(secondaryApp)
  }
}

export async function ensureDefaultAdmin() {
  if (!isFirebaseConfigured) {
    getLocalUsers()
    return
  }

  const adminRef = doc(db, USERS_COLLECTION, DEFAULT_ADMIN_DOC_ID)
  const adminSnapshot = await getDoc(adminRef)

  if (!adminSnapshot.exists()) {
    await setDoc(adminRef, {
      ...DEFAULT_ADMIN,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: 'seed',
    })
  }

  const usersRef = collection(db, USERS_COLLECTION)
  const legacyAdminQuery = query(usersRef, where('username', '==', DEFAULT_ADMIN.username))
  const legacyAdmins = await getDocs(legacyAdminQuery)

  await Promise.all(
    legacyAdmins.docs
      .filter((snapshot) => snapshot.id !== DEFAULT_ADMIN_DOC_ID)
      .map((snapshot) => deleteDoc(snapshot.ref)),
  )
}

export async function listUsers() {
  if (!isFirebaseConfigured) {
    return getLocalUsers()
  }

  await ensureDefaultAdmin()
  const usersRef = collection(db, USERS_COLLECTION)
  const result = await getDocs(query(usersRef, orderBy('createdAt', 'desc')))
  const users = result.docs.map(mapFirestoreUser)
  const uniqueUsers = new Map()

  users.forEach((user) => {
    const key = user.username || user.email || user.id
    if (!uniqueUsers.has(key) || user.id === DEFAULT_ADMIN_DOC_ID) {
      uniqueUsers.set(key, user)
    }
  })

  return [...uniqueUsers.values()]
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

  const uid = await createFirebaseAuthUser(data)
  const docRef = doc(db, USERS_COLLECTION, uid)
  await setDoc(docRef, {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProvider: 'firestore-dev-profile',
  })
  return { id: docRef.id, uid, ...data }
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

export async function findUserProfileByUid(uid) {
  if (!isFirebaseConfigured) {
    return getLocalUsers().find((user) => user.uid === uid || user.id === uid)
  }

  const directSnapshot = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (directSnapshot.exists()) return mapFirestoreUser(directSnapshot)

  const result = await getDocs(
    query(collection(db, USERS_COLLECTION), where('uid', '==', uid)),
  )
  return result.empty ? null : mapFirestoreUser(result.docs[0])
}

export async function getDefaultAdminProfile() {
  if (!isFirebaseConfigured) {
    return getLocalUsers().find((user) => user.username === DEFAULT_ADMIN.username)
  }

  const adminSnapshot = await getDoc(doc(db, USERS_COLLECTION, DEFAULT_ADMIN_DOC_ID))
  return adminSnapshot.exists() ? mapFirestoreUser(adminSnapshot) : null
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
