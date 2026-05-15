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
  const payload = { ...data, ...createAuditFields() }
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_WORK_ORDERS_KEY, payload)
  }

  const docRef = await addDoc(collection(db, WORK_ORDERS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...payload }
}

export async function updateWorkOrder(id, data) {
  const payload = { ...data, ...updateAuditFields() }
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_WORK_ORDERS_KEY, id, payload)
  }

  await updateDoc(doc(db, WORK_ORDERS_COLLECTION, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
  return { id, ...payload }
}

export async function deleteWorkOrder(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_WORK_ORDERS_KEY, id)
    return
  }

  await deleteDoc(doc(db, WORK_ORDERS_COLLECTION, id))
}
