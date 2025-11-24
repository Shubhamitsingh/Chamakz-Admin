import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

const FEEDBACK_COLLECTION = 'feedback'

// ==================== FEEDBACK ====================

/**
 * Get all feedback entries
 * @param {string} status - Filter by status (optional)
 * @returns {Promise} Feedback data
 */
export const getFeedback = async (status = null) => {
  try {
    let q
    if (status) {
      q = query(
        collection(db, FEEDBACK_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else {
      q = query(
        collection(db, FEEDBACK_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    const snapshot = await getDocs(q)
    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, feedback }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get single feedback by ID
 * @param {string} feedbackId - Feedback ID
 * @returns {Promise} Feedback data
 */
export const getFeedbackById = async (feedbackId) => {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { success: true, feedback: { id: docSnap.id, ...docSnap.data() } }
    } else {
      return { success: false, error: 'Feedback not found' }
    }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update feedback status
 * @param {string} feedbackId - Feedback ID
 * @param {string} status - New status (new, read, archived)
 * @returns {Promise} Success status
 */
export const updateFeedbackStatus = async (feedbackId, status) => {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId)
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'read' && { readAt: serverTimestamp() }),
      ...(status === 'archived' && { archivedAt: serverTimestamp() })
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating feedback status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete feedback
 * @param {string} feedbackId - Feedback ID
 * @returns {Promise} Success status
 */
export const deleteFeedback = async (feedbackId) => {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId)
    await deleteDoc(docRef)
    return { success: true }
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time feedback updates
 * @param {Function} callback - Callback with feedback data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFeedback = (callback) => {
  const q = query(
    collection(db, FEEDBACK_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(feedback)
  })
}


