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

const VEHICLES_COLLECTION = 'vehicles'
const LOCAL_VEHICLES_KEY = LOCAL_COLLECTION_KEYS.vehicles

const mapFirestoreVehicle = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listVehicles() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_VEHICLES_KEY)
  }

  const result = await getDocs(
    query(collection(db, VEHICLES_COLLECTION), orderBy('createdAt', 'desc')),
  )
  return result.docs.map(mapFirestoreVehicle)
}

export async function createVehicle(data) {
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_VEHICLES_KEY, data)
  }

  const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateVehicle(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_VEHICLES_KEY, id, data)
  }

  await updateDoc(doc(db, VEHICLES_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteVehicle(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_VEHICLES_KEY, id)
    return
  }

  await deleteDoc(doc(db, VEHICLES_COLLECTION, id))
}
