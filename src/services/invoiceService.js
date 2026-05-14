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
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_INVOICES_KEY, data)
  }

  const docRef = await addDoc(collection(db, INVOICES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateInvoice(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_INVOICES_KEY, id, data)
  }

  await updateDoc(doc(db, INVOICES_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteInvoice(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_INVOICES_KEY, id)
    return
  }

  await deleteDoc(doc(db, INVOICES_COLLECTION, id))
}
