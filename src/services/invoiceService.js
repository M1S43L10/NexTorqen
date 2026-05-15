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

const INVOICES_COLLECTION = 'invoices'
const LOCAL_INVOICES_KEY = LOCAL_COLLECTION_KEYS.invoices

const mapFirestoreInvoice = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listInvoices() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_INVOICES_KEY)
  }

  const result = await getDocs(query(collection(db, INVOICES_COLLECTION), orderBy('createdAt', 'desc')))
  return result.docs.map(mapFirestoreInvoice)
}

export async function createInvoice(data) {
  const payload = { ...data, ...createAuditFields() }
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_INVOICES_KEY, payload)
  }

  const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...payload }
}

export async function updateInvoice(id, data) {
  const payload = { ...data, ...updateAuditFields() }
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_INVOICES_KEY, id, payload)
  }

  await updateDoc(doc(db, INVOICES_COLLECTION, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
  return { id, ...payload }
}

export async function deleteInvoice(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_INVOICES_KEY, id)
    return
  }

  await deleteDoc(doc(db, INVOICES_COLLECTION, id))
}
