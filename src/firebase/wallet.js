import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore'
import { db } from './config'

const WALLETS_COLLECTION = 'wallets'
const TRANSACTIONS_COLLECTION = 'transactions'

// ==================== WALLETS ====================

/**
 * Get wallet by user ID
 * @param {string} userId - User ID
 * @returns {Promise} Wallet data
 */
export const getWallet = async (userId) => {
  try {
    const docRef = doc(db, WALLETS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { success: true, wallet: { id: docSnap.id, ...docSnap.data() } }
    } else {
      return { success: false, error: 'Wallet not found' }
    }
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all wallets with pagination
 * @param {number} pageSize - Number of wallets per page
 * @returns {Promise} Wallets data
 */
export const getAllWallets = async (pageSize = 50) => {
  try {
    const q = query(
      collection(db, WALLETS_COLLECTION),
      orderBy('balance', 'desc'),
      limit(pageSize)
    )
    const snapshot = await getDocs(q)
    const wallets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, wallets }
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Add coins to user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Coins amount
 * @param {string} reason - Transaction reason
 * @returns {Promise} Success status
 */
export const addCoins = async (userId, amount, reason = 'Admin credit') => {
  try {
    const walletRef = doc(db, WALLETS_COLLECTION, userId)
    
    // Update wallet balance
    await updateDoc(walletRef, {
      balance: increment(amount),
      updatedAt: serverTimestamp()
    })

    // Record transaction
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      userId,
      type: 'credit',
      amount,
      reason,
      balanceAfter: null, // Will be calculated
      createdAt: serverTimestamp()
    })

    return { success: true }
  } catch (error) {
    console.error('Error adding coins:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deduct coins from user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Coins amount
 * @param {string} reason - Transaction reason
 * @returns {Promise} Success status
 */
export const deductCoins = async (userId, amount, reason = 'Admin debit') => {
  try {
    const walletRef = doc(db, WALLETS_COLLECTION, userId)
    
    // Update wallet balance
    await updateDoc(walletRef, {
      balance: increment(-amount),
      updatedAt: serverTimestamp()
    })

    // Record transaction
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      userId,
      type: 'debit',
      amount,
      reason,
      balanceAfter: null,
      createdAt: serverTimestamp()
    })

    return { success: true }
  } catch (error) {
    console.error('Error deducting coins:', error)
    return { success: false, error: error.message }
  }
}

// ==================== TRANSACTIONS ====================

/**
 * Get user transaction history
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of transactions
 * @returns {Promise} Transactions data
 */
export const getTransactions = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, transactions }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all transactions (admin view)
 * @param {number} limitCount - Number of transactions
 * @returns {Promise} Transactions data
 */
export const getAllTransactions = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, transactions }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to wallet updates
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with wallet data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToWallet = (userId, callback) => {
  const docRef = doc(db, WALLETS_COLLECTION, userId)
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    }
  })
}

/**
 * Subscribe to transactions updates
 * @param {string} userId - User ID (optional, null for all)
 * @param {Function} callback - Callback with transactions data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTransactions = (userId = null, callback) => {
  let q
  if (userId) {
    q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  } else {
    q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
  }

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(transactions)
  })
}











