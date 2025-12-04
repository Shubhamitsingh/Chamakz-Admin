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
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from './config'

const COIN_RESELLERS_COLLECTION = 'coinResellers'
const COIN_RESELLER_APPROVALS_COLLECTION = 'coinResellerApprovals'

// ==================== COIN RESELLER APPROVALS ====================

/**
 * Create a new coin reseller approval request
 * @param {Object} resellerData - Reseller data (name, email, password, phone, region, etc.)
 * @returns {Promise} Success status with reseller ID
 */
export const createCoinResellerApproval = async (resellerData) => {
  try {
    const { email, password, numericUserId, ...otherData } = resellerData
    
    // Generate numericUserId if not provided
    const finalNumericUserId = numericUserId || generateNumericId()
    
    // Create Firebase Auth account
    let authUser = null
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      authUser = userCredential.user
      console.log('✅ Firebase Auth account created:', authUser.uid)
    } catch (error) {
      console.error('Error creating auth account:', error)
      // Continue even if auth creation fails - we'll handle it in approval
      return { success: false, error: `Auth creation failed: ${error.message}` }
    }

    // Create approval document
    const approvalRef = await addDoc(collection(db, COIN_RESELLER_APPROVALS_COLLECTION), {
      email,
      password: '***', // Don't store password
      authUserId: authUser?.uid || '',
      numericUserId: finalNumericUserId, // Store the numeric ID
      status: 'pending',
      ...otherData,
      createdAt: serverTimestamp(),
      createdBy: 'admin'
    })

    console.log('✅ Coin reseller approval created with numericUserId:', finalNumericUserId)
    return { success: true, approvalId: approvalRef.id, authUserId: authUser?.uid, numericUserId: finalNumericUserId }
  } catch (error) {
    console.error('Error creating coin reseller approval:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all coin reseller approvals
 * @param {string} status - Filter by status (optional)
 * @returns {Promise} Approvals data
 */
export const getCoinResellerApprovals = async (status = null) => {
  try {
    let q
    if (status) {
      q = query(
        collection(db, COIN_RESELLER_APPROVALS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else {
      q = query(
        collection(db, COIN_RESELLER_APPROVALS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    const snapshot = await getDocs(q)
    const approvals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, approvals }
  } catch (error) {
    console.error('Error fetching coin reseller approvals:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time coin reseller approvals
 * @param {Function} callback - Callback with approvals data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCoinResellerApprovals = (callback) => {
  const q = query(
    collection(db, COIN_RESELLER_APPROVALS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const approvals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(approvals)
  })
}

/**
 * Approve coin reseller
 * @param {string} approvalId - Approval ID
 * @returns {Promise} Success status
 */
export const approveCoinReseller = async (approvalId) => {
  try {
    // Get approval data
    const approvalRef = doc(db, COIN_RESELLER_APPROVALS_COLLECTION, approvalId)
    const approvalSnap = await getDoc(approvalRef)
    
    if (!approvalSnap.exists()) {
      return { success: false, error: 'Approval not found' }
    }

    const approvalData = approvalSnap.data()
    
    // Create coin reseller document
    const resellerData = {
      name: approvalData.name || approvalData.userName || 'Unknown Reseller',
      email: approvalData.email,
      phone: approvalData.phone || approvalData.phoneNumber || '',
      region: approvalData.region || approvalData.location || 'N/A',
      userId: approvalData.authUserId || '',
      numericUserId: approvalData.numericUserId || generateNumericId(),
      status: 'Active',
      coinsSold: 0,
      revenue: 0,
      totalTransactions: 0,
      performance: 'New',
      rating: 0,
      joinDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: 'admin',
      role: 'CoinReseller'
    }

    // Add to coinResellers collection
    const resellerRef = await addDoc(collection(db, COIN_RESELLERS_COLLECTION), resellerData)
    
    // Also add to users collection for visibility in user app
    try {
      await addDoc(collection(db, 'users'), {
        ...resellerData,
        name: resellerData.name,
        displayName: resellerData.name,
        email: resellerData.email,
        role: 'CoinReseller',
        accountType: 'CoinReseller',
        blocked: false,
        coins: 0
      })
    } catch (error) {
      console.log('Could not add to users collection:', error)
    }

    // Update approval status with numericUserId
    await updateDoc(approvalRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      numericUserId: resellerData.numericUserId // Save numericUserId in approval document
    })

    console.log('✅ Coin reseller approved with numericUserId:', resellerData.numericUserId)
    return { success: true, numericUserId: resellerData.numericUserId }
  } catch (error) {
    console.error('Error approving coin reseller:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reject coin reseller
 * @param {string} approvalId - Approval ID
 * @returns {Promise} Success status
 */
export const rejectCoinReseller = async (approvalId) => {
  try {
    const approvalRef = doc(db, COIN_RESELLER_APPROVALS_COLLECTION, approvalId)
    await updateDoc(approvalRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error rejecting coin reseller:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate unique numeric user ID (15 digits, matching user ID format)
 * Format: 176319008881402 (15 digits)
 * @returns {string} Numeric ID (always 15 digits)
 */
const generateNumericId = () => {
  // Generate 15-digit ID (100000000000000 to 999999999999999)
  // Similar format to user IDs like "176319008881402"
  const min = 100000000000000 // 15 digits starting with 1
  const max = 999999999999999 // 15 digits max
  const id = Math.floor(min + Math.random() * (max - min + 1)).toString()
  
  // Ensure it's exactly 15 digits
  if (id.length !== 15) {
    // If somehow not 15 digits, pad or trim to make it 15
    return id.padStart(15, '1').substring(0, 15)
  }
  
  return id
}

// ==================== COIN RESELLERS ====================

/**
 * Get all coin resellers
 * @returns {Promise} Resellers data
 */
export const getCoinResellers = async () => {
  try {
    const q = query(
      collection(db, COIN_RESELLERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(q)
    const resellers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, resellers }
  } catch (error) {
    console.error('Error fetching coin resellers:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time coin resellers
 * @param {Function} callback - Callback with resellers data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCoinResellers = (callback) => {
  const q = query(
    collection(db, COIN_RESELLERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const resellers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(resellers)
  })
}

/**
 * Delete coin reseller
 * @param {string} resellerId - Coin reseller document ID
 * @param {string} numericUserId - Numeric user ID of the reseller
 * @returns {Promise} Success status
 */
export const deleteCoinReseller = async (resellerId, numericUserId) => {
  try {
    // Delete from coinResellers collection
    const resellerRef = doc(db, COIN_RESELLERS_COLLECTION, resellerId)
    await deleteDoc(resellerRef)
    console.log('✅ Deleted from coinResellers collection')

    // Delete from users collection (find by numericUserId)
    try {
      const usersRef = collection(db, 'users')
      const usersQuery = query(usersRef, where('numericUserId', '==', numericUserId))
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        for (const userDoc of usersSnapshot.docs) {
          // Only delete if it's a CoinReseller
          const userData = userDoc.data()
          if (userData.role === 'CoinReseller' || userData.accountType === 'CoinReseller') {
            await deleteDoc(doc(db, 'users', userDoc.id))
            console.log('✅ Deleted from users collection')
          }
        }
      }
    } catch (userError) {
      console.log('Could not delete from users collection:', userError)
    }

    // Delete from wallets collection
    try {
      const walletsRef = collection(db, 'wallets')
      const walletQuery = query(walletsRef, where('numericUserId', '==', numericUserId))
      const walletSnapshot = await getDocs(walletQuery)
      
      if (!walletSnapshot.empty) {
        for (const walletDoc of walletSnapshot.docs) {
          await deleteDoc(doc(db, 'wallets', walletDoc.id))
          console.log('✅ Deleted from wallets collection')
        }
      }
    } catch (walletError) {
      console.log('Could not delete from wallets collection:', walletError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting coin reseller:', error)
    return { success: false, error: error.message }
  }
}

