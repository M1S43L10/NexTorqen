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
  saveLocalCollection,
  updateLocalRecord,
} from './localStore'

const STOCK_COLLECTION = 'stockItems'
const LOCAL_STOCK_KEY = LOCAL_COLLECTION_KEYS.stockItems

const toNumber = (value) => Number(value) || 0

const mapFirestoreStockItem = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function listStockItems() {
  if (!isFirebaseConfigured) {
    return getLocalCollection(LOCAL_STOCK_KEY)
  }

  const result = await getDocs(query(collection(db, STOCK_COLLECTION), orderBy('createdAt', 'desc')))
  return result.docs.map(mapFirestoreStockItem)
}

export async function createStockItem(data) {
  if (!isFirebaseConfigured) {
    return createLocalRecord(LOCAL_STOCK_KEY, data)
  }

  const docRef = await addDoc(collection(db, STOCK_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export async function updateStockItem(id, data) {
  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_STOCK_KEY, id, data)
  }

  await updateDoc(doc(db, STOCK_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return { id, ...data }
}

export async function deleteStockItem(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_STOCK_KEY, id)
    return
  }

  await deleteDoc(doc(db, STOCK_COLLECTION, id))
}

const aggregateStockParts = (parts = []) =>
  parts.reduce((accumulator, part) => {
    if (!part.stockItemId) return accumulator
    accumulator[part.stockItemId] = (accumulator[part.stockItemId] || 0) + toNumber(part.quantity)
    return accumulator
  }, {})

export async function validateStockAvailability(previousParts = [], nextParts = []) {
  const stockItems = await listStockItems()
  const previous = aggregateStockParts(previousParts)
  const next = aggregateStockParts(nextParts)

  for (const [stockItemId, nextQuantity] of Object.entries(next)) {
    const currentQuantity = toNumber(stockItems.find((item) => item.id === stockItemId)?.stock)
    const availableQuantity = currentQuantity + (previous[stockItemId] || 0)

    if (nextQuantity > availableQuantity) {
      const item = stockItems.find((stockItem) => stockItem.id === stockItemId)
      throw new Error(`Stock insuficiente para ${item?.name || 'el repuesto seleccionado'}.`)
    }
  }
}

export async function applyStockMovements(previousParts = [], nextParts = []) {
  const stockItems = await listStockItems()
  const previous = aggregateStockParts(previousParts)
  const next = aggregateStockParts(nextParts)
  const ids = new Set([...Object.keys(previous), ...Object.keys(next)])

  if (!ids.size) return

  if (!isFirebaseConfigured) {
    const nextItems = stockItems.map((item) => {
      if (!ids.has(item.id)) return item
      const previousQuantity = previous[item.id] || 0
      const nextQuantity = next[item.id] || 0
      return {
        ...item,
        stock: toNumber(item.stock) + previousQuantity - nextQuantity,
        updatedAt: new Date().toISOString(),
      }
    })
    saveLocalCollection(LOCAL_STOCK_KEY, nextItems)
    return
  }

  await Promise.all(
    stockItems
      .filter((item) => ids.has(item.id))
      .map((item) => {
        const previousQuantity = previous[item.id] || 0
        const nextQuantity = next[item.id] || 0
        return updateDoc(doc(db, STOCK_COLLECTION, item.id), {
          stock: toNumber(item.stock) + previousQuantity - nextQuantity,
          updatedAt: serverTimestamp(),
        })
      }),
  )
}
