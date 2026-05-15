import { auth, isFirebaseConfigured } from '../firebase/config'
import { getLocalSession } from './localStore'

export function getCurrentActor() {
  if (isFirebaseConfigured && auth?.currentUser) {
    return {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName || auth.currentUser.email || 'Usuario Firebase',
      email: auth.currentUser.email || '',
    }
  }

  const session = getLocalSession()
  return {
    uid: session?.uid || session?.id || '',
    name: session?.name || session?.username || 'Usuario local',
    email: session?.email || '',
  }
}

export function createAuditFields() {
  const actor = getCurrentActor()
  return {
    createdBy: actor.uid,
    createdByName: actor.name,
    createdByEmail: actor.email,
    updatedBy: actor.uid,
    updatedByName: actor.name,
    updatedByEmail: actor.email,
  }
}

export function updateAuditFields() {
  const actor = getCurrentActor()
  return {
    updatedBy: actor.uid,
    updatedByName: actor.name,
    updatedByEmail: actor.email,
  }
}
