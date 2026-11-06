import { getDocs, collection, limit, query } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './config'

export const checkFirebaseConnection = async () => {
  if (!db) {
    return { ok: false, error: 'Database is not initialized' }
  }

  try {
    const usersRef = collection(db, 'users')
    await getDocs(query(usersRef, limit(1)))
    return { ok: true, mock: !isFirebaseConfigured }
  } catch (error) {
    const message = error?.message || String(error)
    return { ok: false, error: message }
  }
}
