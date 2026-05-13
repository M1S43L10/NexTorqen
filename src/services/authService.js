import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'
import { DEFAULT_ADMIN } from '../utils/defaultAdmin'
import {
  clearLocalSession,
  findLocalUserByLogin,
  getLocalSession,
  setLocalSession,
} from './localStore'
import {
  ensureDefaultAdmin,
  findUserProfileByEmail,
  findUserProfileByUsername,
  upsertUserProfile,
} from './userService'

const publicUser = (user) => {
  if (!user) return null
  return {
    id: user.id || user.uid,
    uid: user.uid || user.id,
    name: user.name || user.displayName || user.email,
    username: user.username || user.email,
    email: user.email,
    role: user.role || 'empleado',
  }
}

export async function bootstrapAuth() {
  await ensureDefaultAdmin()

  if (!isFirebaseConfigured) {
    return publicUser(getLocalSession())
  }

  await setPersistence(auth, browserLocalPersistence)

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe()
      if (!firebaseUser) {
        resolve(null)
        return
      }

      const profile = await findUserProfileByEmail(firebaseUser.email)
      resolve(publicUser({ ...firebaseUser, ...profile }))
    })
  })
}

export async function login(identifier, password) {
  await ensureDefaultAdmin()

  if (!isFirebaseConfigured) {
    const user = findLocalUserByLogin(identifier, password)
    if (!user) throw new Error('Credenciales incorrectas.')
    const session = publicUser(user)
    setLocalSession(session)
    return session
  }

  const profileByUsername = await findUserProfileByUsername(identifier)
  const email = profileByUsername?.email || identifier

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const profile = await findUserProfileByEmail(credential.user.email)
    return publicUser({ ...credential.user, ...profile })
  } catch (error) {
    if (
      email === DEFAULT_ADMIN.email &&
      password === DEFAULT_ADMIN.password &&
      ['auth/user-not-found', 'auth/invalid-credential'].includes(error.code)
    ) {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await upsertUserProfile(credential.user.uid, {
        ...DEFAULT_ADMIN,
        uid: credential.user.uid,
        createdAt: new Date().toISOString(),
      })
      return publicUser({ ...credential.user, ...DEFAULT_ADMIN })
    }

    throw new Error('Credenciales incorrectas o usuario no disponible en Firebase Auth.', {
      cause: error,
    })
  }
}

export async function logout() {
  if (!isFirebaseConfigured) {
    clearLocalSession()
    return
  }

  await signOut(auth)
}
