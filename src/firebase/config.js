import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// 🔥 FIREBASE CONFIGURATION
// Connected to Chamak Firebase Project
const firebaseConfig = {
  apiKey: "AIzaSyCSzAowpl-4b4Vurflv5iBXRDQSC0c4ogE",
  authDomain: "chamak-39472.firebaseapp.com",
  projectId: "chamak-39472",
  storageBucket: "chamak-39472.firebasestorage.app",
  messagingSenderId: "228866341171",
  appId: "1:228866341171:web:9deacb4ab0cf95aab2a646",
  measurementId: "G-HN28S7YN1D"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app

