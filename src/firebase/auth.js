import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './config'

export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

export const logoutAdmin = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: error.message }
  }
}

export const getCurrentUser = () => {
  return auth?.currentUser || null
}
