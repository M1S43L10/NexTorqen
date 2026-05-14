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
  getDefaultAdminProfile,
  upsertUserProfile,
} from './userService'

const withTimeout = (promise, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), 12000)
    }),
  ])

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
  if (!isFirebaseConfigured) {
    await ensureDefaultAdmin()
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
  if (!isFirebaseConfigured) {
    await ensureDefaultAdmin()
    const user = findLocalUserByLogin(identifier, password)
    if (!user) throw new Error('Credenciales incorrectas.')
    const session = publicUser(user)
    setLocalSession(session)
    return session
  }

  const normalizedIdentifier = identifier.trim().toLowerCase()
  const isDefaultAdminLogin =
    normalizedIdentifier === DEFAULT_ADMIN.username ||
    normalizedIdentifier === DEFAULT_ADMIN.email.toLowerCase()

  let profileByUsername = isDefaultAdminLogin
    ? await getDefaultAdminProfile()
    : await withTimeout(
        findUserProfileByUsername(identifier),
        'No se pudo consultar el perfil del usuario en Firestore.',
      )

  if (isDefaultAdminLogin && !profileByUsername) {
    profileByUsername = DEFAULT_ADMIN
  }

  const email = profileByUsername?.email || identifier
  const firebasePassword = resolveFirebasePassword(profileByUsername, password)

  try {
    const credential = await withTimeout(
      signInWithEmailAndPassword(auth, email, firebasePassword),
      'Firebase Auth tardó demasiado en responder.',
    )
    const profile =
      profileByUsername ||
      (await withTimeout(
        findUserProfileByEmail(credential.user.email),
        'No se pudo cargar el perfil del usuario.',
      ))

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
