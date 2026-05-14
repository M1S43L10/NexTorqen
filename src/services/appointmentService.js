import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import {
  createLocalRecord,
  deleteLocalRecord,
  getLocalCollection,
  LOCAL_COLLECTION_KEYS,
  updateLocalRecord,
} from './localStore'

const APPOINTMENTS_COLLECTION = 'appointments'
const LOCAL_APPOINTMENTS_KEY = LOCAL_COLLECTION_KEYS.appointments

const mapFirestoreAppointment = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listAppointments() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_APPOINTMENTS_KEY)
  }

  const result = await getDocs(
    query(collection(db, APPOINTMENTS_COLLECTION), orderBy('date', 'asc')),
  )
  return result.docs.map(mapFirestoreAppointment)
}

export async function createAppointment(data) {
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_APPOINTMENTS_KEY, data)
  }

  const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateAppointment(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_APPOINTMENTS_KEY, id, data)
  }

  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteAppointment(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_APPOINTMENTS_KEY, id)
    return
  }

  await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, id))
}
