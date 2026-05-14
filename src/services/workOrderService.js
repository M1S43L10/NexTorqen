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

const WORK_ORDERS_COLLECTION = 'workOrders'
const LOCAL_WORK_ORDERS_KEY = LOCAL_COLLECTION_KEYS.workOrders

const mapFirestoreWorkOrder = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listWorkOrders() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_WORK_ORDERS_KEY)
  }

  const result = await getDocs(
    query(collection(db, WORK_ORDERS_COLLECTION), orderBy('createdAt', 'desc')),
  )
  return result.docs.map(mapFirestoreWorkOrder)
}

export async function createWorkOrder(data) {
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_WORK_ORDERS_KEY, data)
  }

  const docRef = await addDoc(collection(db, WORK_ORDERS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateWorkOrder(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_WORK_ORDERS_KEY, id, data)
  }

  await updateDoc(doc(db, WORK_ORDERS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteWorkOrder(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_WORK_ORDERS_KEY, id)
    return
  }

  await deleteDoc(doc(db, WORK_ORDERS_COLLECTION, id))
}
