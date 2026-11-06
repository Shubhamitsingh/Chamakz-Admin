const AUTH_KEY = 'chamakz.mock.auth'

const listeners = new Set()

const readUser = () => {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let currentUser = readUser()

const emit = (user) => {
  currentUser = user
  listeners.forEach((callback) => callback(currentUser))
}

export const getAuth = () => ({
  get currentUser() {
    return currentUser
  },
})

export const signInWithEmailAndPassword = async (_auth, email, password) => {
  if (!email || !password) {
    const error = new Error('Missing email or password')
    error.code = 'auth/invalid-credential'
    throw error
  }
  const user = {
    uid: 'mock-admin',
    email,
    displayName: 'Admin User',
    photoURL: null,
  }
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
  emit(user)
  return { user }
}

export const signOut = async () => {
  sessionStorage.removeItem(AUTH_KEY)
  emit(null)
}

export const onAuthStateChanged = (_auth, callback) => {
  if (typeof callback === 'function') {
    queueMicrotask(() => callback(currentUser))
    listeners.add(callback)
  }
  return () => listeners.delete(callback)
}

export const sendPasswordResetEmail = async () => ({ success: true })

export const updatePassword = async () => {}

export const updateProfile = async (_user, profile) => {
  if (!currentUser) return
  currentUser = { ...currentUser, ...profile }
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(currentUser))
  emit(currentUser)
}

export const createUserWithEmailAndPassword = async (_auth, email) => {
  const user = { uid: `mock-${Date.now()}`, email, displayName: email }
  return { user }
}
