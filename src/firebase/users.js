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
  startAfter,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

const USERS_COLLECTION = 'users'

/**
 * Get all users with pagination
 * @param {number} pageSize - Number of users per page
 * @param {Object} lastVisible - Last document from previous page
 * @returns {Promise} Users data
 */
export const getUsers = async (pageSize = 50, lastVisible = null) => {
  try {
    let q = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    )

    if (lastVisible) {
      q = query(q, startAfter(lastVisible))
    }

    const snapshot = await getDocs(q)
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return {
      success: true,
      users,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get single user by ID
 * @param {string} userId - User ID
 * @returns {Promise} User data
 */
export const getUserById = async (userId) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { success: true, user: { id: docSnap.id, ...docSnap.data() } }
    } else {
      return { success: false, error: 'User not found' }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Search users by email or name
 * @param {string} searchTerm - Search term
 * @returns {Promise} Matching users
 */
export const searchUsers = async (searchTerm) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(20)
    )

    const snapshot = await getDocs(q)
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return { success: true, users }
  } catch (error) {
    console.error('Error searching users:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} updates - Data to update
 * @returns {Promise} Success status
 */
export const updateUser = async (userId, updates) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete user (soft delete - mark as deleted)
 * @param {string} userId - User ID
 * @returns {Promise} Success status
 */
export const deleteUser = async (userId) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(docRef, {
      deleted: true,
      deletedAt: new Date().toISOString()
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Block/Unblock user
 * @param {string} userId - User ID
 * @param {boolean} blocked - Block status
 * @returns {Promise} Success status
 */
export const toggleUserBlock = async (userId, blocked) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(docRef, {
      blocked,
      blockedAt: blocked ? new Date().toISOString() : null
    })
    return { success: true }
  } catch (error) {
    console.error('Error blocking/unblocking user:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate unique approval code (6-8 digits)
 * @returns {string} Unique approval code
 */
const generateApprovalCode = () => {
  // Generate 6-digit code (100000 to 999999)
  const min = 100000
  const max = 999999
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

/**
 * Approve user for live streaming with unique code
 * @param {string} userId - User ID
 * @param {string} approvalCode - Approval code (optional, will generate if not provided)
 * @returns {Promise} Success status with approval code
 */
export const approveUserForLive = async (userId, approvalCode = null) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    
    // Generate code if not provided
    const code = approvalCode || generateApprovalCode()
    
    // Check if code already exists for another user
    // Note: For production, you might want to add a check here
    // For now, we'll just use the provided/generated code
    
    const updates = {
      liveApprovalCode: code,
      // User still needs to enter code in app, so isLiveApproved stays false initially
      isLiveApproved: false,
      role: 'Host', // Set role to Host when approved by admin
      liveApprovalDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    await updateDoc(docRef, updates)
    return { success: true, approvalCode: code }
  } catch (error) {
    console.error('Error approving user for live:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify and activate live approval code (called from Flutter app)
 * @param {string} userId - User ID
 * @param {string} enteredCode - Code entered by user
 * @returns {Promise} Success status
 */
export const verifyLiveApprovalCode = async (userId, enteredCode) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    const userDoc = await getDoc(docRef)
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' }
    }
    
    const userData = userDoc.data()
    const storedCode = userData.liveApprovalCode
    
    if (!storedCode) {
      return { success: false, error: 'No approval code found. Please contact admin.' }
    }
    
    if (storedCode.toString() !== enteredCode.toString()) {
      return { success: false, error: 'Invalid approval code. Please try again.' }
    }
    
    // Code matches - activate live access
    await updateDoc(docRef, {
      isLiveApproved: true,
      liveCodeActivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error verifying approval code:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Toggle live streaming approval for user (direct toggle - for admin panel)
 * @param {string} userId - User ID
 * @param {boolean} approved - Approval status
 * @returns {Promise} Success status
 */
export const toggleLiveApproval = async (userId, approved) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId)
    const updates = {
      isLiveApproved: approved,
      updatedAt: serverTimestamp()
    }
    
    if (approved) {
      updates.liveApprovalDate = serverTimestamp()
    }
    
    await updateDoc(docRef, updates)
    return { success: true }
  } catch (error) {
    console.error('Error toggling live approval:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to real-time user updates
 * @param {Function} callback - Callback function with users data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUsers = (callback) => {
  const q = query(
    collection(db, USERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(users)
  })
}











