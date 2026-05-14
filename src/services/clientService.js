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

const CLIENTS_COLLECTION = 'clients'
const LOCAL_CLIENTS_KEY = LOCAL_COLLECTION_KEYS.clients

const mapFirestoreClient = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listClients() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_CLIENTS_KEY)
  }

  const result = await getDocs(
    query(collection(db, CLIENTS_COLLECTION), orderBy('createdAt', 'desc')),
  )
  return result.docs.map(mapFirestoreClient)
}

export async function createClient(data) {
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_CLIENTS_KEY, data)
  }

  const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateClient(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_CLIENTS_KEY, id, data)
  }

  await updateDoc(doc(db, CLIENTS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteClient(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_CLIENTS_KEY, id)
    return
  }

  await deleteDoc(doc(db, CLIENTS_COLLECTION, id))
}
