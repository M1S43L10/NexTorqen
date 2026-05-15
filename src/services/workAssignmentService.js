import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  where,
  query,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'
import { createAuditFields, updateAuditFields } from './auditService'
import { createNotification } from './notificationService'
import {
  createLocalRecord,
  deleteLocalRecord,
  getLocalCollection,
  LOCAL_COLLECTION_KEYS,
  updateLocalRecord,
} from './localStore'

const WORK_ASSIGNMENTS_COLLECTION = 'workAssignments'
const LOCAL_WORK_ASSIGNMENTS_KEY = LOCAL_COLLECTION_KEYS.workAssignments

const mapAssignment = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

const sortByDueAndCreatedAt = (items) =>
  [...items].sort((a, b) => {
    const dueCompare = String(a.dueDate || '9999-99-99').localeCompare(
      String(b.dueDate || '9999-99-99'),
    )
    if (dueCompare !== 0) return dueCompare

    const dateA = a.createdAt?.toMillis?.() || Date.parse(a.createdAt || 0) || 0
    const dateB = b.createdAt?.toMillis?.() || Date.parse(b.createdAt || 0) || 0
    return dateB - dateA
  })

const shouldShowAssignment = (assignment, user) =>
  user?.role === 'admin' ||
  assignment.assignedToUid === user?.uid ||
  assignment.assignedToId === user?.id ||
  assignment.assignedToEmail === user?.email

export async function listWorkAssignments(user) {
  if (!user) return []

  if (!isFirebaseConfigured) {
    return sortByDueAndCreatedAt(
      getLocalCollection(LOCAL_WORK_ASSIGNMENTS_KEY).filter((assignment) =>
        shouldShowAssignment(assignment, user),
      ),
    )
  }

  const assignmentsRef = collection(db, WORK_ASSIGNMENTS_COLLECTION)
  const result =
    user.role === 'admin'
      ? await getDocs(assignmentsRef)
      : await getDocs(query(assignmentsRef, where('assignedToUid', '==', user.uid)))

  return sortByDueAndCreatedAt(result.docs.map(mapAssignment))
}

export async function createWorkAssignment(data, actor) {
  const payload = {
    ...data,
    status: data.status || 'Pendiente',
    createdByUid: actor?.uid || actor?.id || '',
    createdByName: actor?.name || '',
    ...createAuditFields(),
  }

  let assignment

  if (!isFirebaseConfigured) {
    assignment = createLocalRecord(LOCAL_WORK_ASSIGNMENTS_KEY, payload)
  } else {
    const docRef = await addDoc(collection(db, WORK_ASSIGNMENTS_COLLECTION), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    assignment = { id: docRef.id, ...payload }
  }

  await createNotification({
    recipientId: payload.assignedToId,
    recipientUid: payload.assignedToUid,
    recipientEmail: payload.assignedToEmail,
    title: 'Nuevo trabajo asignado',
    message: `${payload.title}${payload.orderNumber ? ` · Orden ${payload.orderNumber}` : ''}`,
    type: 'work-assignment',
    assignmentId: assignment.id,
  })

  return assignment
}

export async function updateWorkAssignment(id, data) {
  const payload = { ...data, ...updateAuditFields() }

  if (!isFirebaseConfigured) {
    return updateLocalRecord(LOCAL_WORK_ASSIGNMENTS_KEY, id, payload)
  }

  await updateDoc(doc(db, WORK_ASSIGNMENTS_COLLECTION, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
  return { id, ...payload }
}

export async function deleteWorkAssignment(id) {
  if (!isFirebaseConfigured) {
    deleteLocalRecord(LOCAL_WORK_ASSIGNMENTS_KEY, id)
    return
  }

  await deleteDoc(doc(db, WORK_ASSIGNMENTS_COLLECTION, id))
}
