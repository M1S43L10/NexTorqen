import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import {
  createLocalRecord,
  getLocalCollection,
  LOCAL_COLLECTION_KEYS,
  updateLocalRecord,
} from './localStore'

const NOTIFICATIONS_COLLECTION = 'notifications'
const LOCAL_NOTIFICATIONS_KEY = LOCAL_COLLECTION_KEYS.notifications

const mapNotification = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

const sortByCreatedAt = (items) =>
  [...items].sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || Date.parse(a.createdAt || 0) || 0
    const dateB = b.createdAt?.toMillis?.() || Date.parse(b.createdAt || 0) || 0
    return dateB - dateA
  })

export async function createNotification(data) {
  const payload = {
    ...data,
    read: false,
  }

  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_NOTIFICATIONS_KEY, payload)
  }

  const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION))
  await setDoc(docRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...payload }
}

export async function listNotificationsForUser(user) {
  if (!user) return []

  if (!isFirebaseConfigured) {
    return sortByCreatedAt(
      getLocalCollection(LOCAL_NOTIFICATIONS_KEY).filter(
        (notification) =>
          notification.recipientUid === user.uid ||
          notification.recipientId === user.id ||
          notification.recipientEmail === user.email,
      ),
    )
  }

  const result = await getDocs(
    query(collection(db, NOTIFICATIONS_COLLECTION), where('recipientUid', '==', user.uid)),
  )
  return sortByCreatedAt(result.docs.map(mapNotification))
}

export function subscribeToUserNotifications(user, callback) {
  if (!user) return () => {}

  if (!isFirebaseConfigured) {
    listNotificationsForUser(user).then(callback)
    return () => {}
  }

  const notificationsQuery = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientUid', '==', user.uid),
  )

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      callback(sortByCreatedAt(snapshot.docs.map(mapNotification)))
    },
    () => {
      callback([])
    },
  )
}

export async function markNotificationRead(id) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_NOTIFICATIONS_KEY, id, { read: true })
  }

  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
    read: true,
    updatedAt: serverTimestamp(),
  })
}

export async function markAllNotificationsRead(user) {
  const notifications = await listNotificationsForUser(user)
  await Promise.all(
    notifications
      .filter((notification) => !notification.read)
      .map((notification) => markNotificationRead(notification.id)),
  )
}
