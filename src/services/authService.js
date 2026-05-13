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

const resolveFirebasePassword = (profile, enteredPassword) => {
  if (
    profile?.username === DEFAULT_ADMIN.username &&
    enteredPassword === DEFAULT_ADMIN.password
  ) {
    return DEFAULT_ADMIN.authPassword
  }

  return profile?.authPassword || enteredPassword
}

const isFirebaseAuthConfigError = (error) =>
  ['auth/operation-not-allowed', 'auth/configuration-not-found'].includes(error.code) ||
  error.message?.toLowerCase().includes('configuration_not_found') ||
  error.message?.toLowerCase().includes('configuration-not-found')

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
  const firebasePassword = resolveFirebasePassword(profileByUsername, password)

  try {
    const credential = await signInWithEmailAndPassword(auth, email, firebasePassword)
    const profile = await findUserProfileByEmail(credential.user.email)
    return publicUser({ ...credential.user, ...profile })
  } catch (error) {
    const canCreateMissingAuthUser =
      profileByUsername &&
      password === profileByUsername.password &&
      ['auth/user-not-found', 'auth/invalid-credential'].includes(error.code)

    if (canCreateMissingAuthUser) {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, firebasePassword)
        await upsertUserProfile(profileByUsername.id || credential.user.uid, {
          ...profileByUsername,
          uid: credential.user.uid,
        })
        return publicUser({ ...credential.user, ...profileByUsername })
      } catch (creationError) {
        if (isFirebaseAuthConfigError(creationError)) {
          throw new Error(
            'Firebase Authentication no está inicializado o falta habilitar Email/Password.',
            { cause: creationError },
          )
        }

        throw creationError
      }
    }

    if (isFirebaseAuthConfigError(error)) {
      throw new Error(
        'Firebase Authentication no está inicializado o falta habilitar Email/Password.',
        { cause: error },
      )
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
