import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

const CHATS_COLLECTION = 'chats'
const MESSAGES_COLLECTION = 'messages'

// ==================== CHATS ====================

/**
 * Get all active chats
 * @returns {Promise} Chats data
 */
export const getChats = async () => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      orderBy('lastMessageAt', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(q)
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, chats }
  } catch (error) {
    console.error('Error fetching chats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get messages for a specific chat
 * @param {string} chatId - Chat ID
 * @param {number} limitCount - Number of messages
 * @returns {Promise} Messages data
 */
export const getChatMessages = async (chatId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, messages }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Block/Unblock a chat
 * @param {string} chatId - Chat ID
 * @param {boolean} blocked - Block status
 * @returns {Promise} Success status
 */
export const toggleChatBlock = async (chatId, blocked) => {
  try {
    const docRef = doc(db, CHATS_COLLECTION, chatId)
    await updateDoc(docRef, {
      blocked,
      blockedAt: blocked ? serverTimestamp() : null
    })
    return { success: true }
  } catch (error) {
    console.error('Error blocking/unblocking chat:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a message (admin)
 * @param {string} messageId - Message ID
 * @returns {Promise} Success status
 */
export const deleteMessage = async (messageId) => {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId)
    await updateDoc(docRef, {
      deleted: true,
      deletedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send admin warning message to chat
 * @param {string} chatId - Chat ID
 * @param {string} warningText - Warning message
 * @returns {Promise} Success status
 */
export const sendWarning = async (chatId, warningText) => {
  try {
    await addDoc(collection(db, MESSAGES_COLLECTION), {
      chatId,
      type: 'warning',
      text: warningText,
      senderId: 'admin',
      senderName: 'Admin',
      createdAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending warning:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time chats updates
 * @param {Function} callback - Callback with chats data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToChats = (callback) => {
  const q = query(
    collection(db, CHATS_COLLECTION),
    orderBy('lastMessageAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(chats)
  })
}

/**
 * Subscribe to real-time messages updates for a chat
 * @param {string} chatId - Chat ID
 * @param {Function} callback - Callback with messages data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToChatMessages = (chatId, callback) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(messages)
  })
}











