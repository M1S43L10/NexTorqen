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
import { createAuditFields, updateAuditFields } from './auditService'
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
  const payload = { ...data, ...createAuditFields() }
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_APPOINTMENTS_KEY, payload)
  }

  const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...payload }
}

export async function updateAppointment(id, data) {
  const payload = { ...data, ...updateAuditFields() }
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_APPOINTMENTS_KEY, id, payload)
  }

  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
  return { id, ...payload }
}

export async function deleteAppointment(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_APPOINTMENTS_KEY, id)
    return
  }

  await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, id))
}
