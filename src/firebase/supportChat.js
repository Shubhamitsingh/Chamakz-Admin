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
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'

const SUPPORT_CHATS_COLLECTION = 'supportChats'

// ==================== USER APP FUNCTIONS ====================

/**
 * Create or get existing support chat for user
 * @param {Object} userData - User data (userId, numericUserId, name, email)
 * @returns {Promise} Chat document ID
 */
export const createOrGetSupportChat = async (userData) => {
  try {
    const { userId, numericUserId, name, email } = userData
    
    // Check if user already has a support chat
    const chatsRef = collection(db, SUPPORT_CHATS_COLLECTION)
    const existingChatQuery = query(
      chatsRef,
      where('userId', '==', userId)
    )
    const existingChatSnapshot = await getDocs(existingChatQuery)
    
    if (!existingChatSnapshot.empty) {
      // Return existing chat
      const existingChat = existingChatSnapshot.docs[0]
      return { 
        success: true, 
        chatId: existingChat.id, 
        isNew: false,
        chat: { id: existingChat.id, ...existingChat.data() }
      }
    }
    
    // Create new support chat
    const newChatRef = await addDoc(chatsRef, {
      userId: userId,
      numericUserId: numericUserId || 'N/A',
      userName: name || 'Unknown User',
      username: name || 'Unknown User',
      name: name || 'Unknown User',
      email: email || '',
      status: 'active',
      lastMessage: 'Chat started',
      lastMessageTime: serverTimestamp(),
      lastMessageBy: 'user',
      unreadByAdmin: 0,
      unreadByUser: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ Support chat created:', newChatRef.id)
    return { 
      success: true, 
      chatId: newChatRef.id, 
      isNew: true,
      chat: { id: newChatRef.id, ...(await getDoc(newChatRef)).data() }
    }
  } catch (error) {
    console.error('Error creating/getting support chat:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send message from user to admin
 * @param {string} chatId - Chat document ID
 * @param {string} messageText - Message text
 * @param {Object} userData - User data (userId, name)
 * @returns {Promise} Success status
 */
export const sendUserMessage = async (chatId, messageText, userData) => {
  try {
    const { userId, name } = userData
    
    // Get chat data to identify receiver and check current unread count
    const chatRef = doc(db, SUPPORT_CHATS_COLLECTION, chatId)
    const chatData = (await getDoc(chatRef)).data()
    const currentUnread = chatData?.unreadByAdmin || 0
    const newUnreadCount = currentUnread + 1
    
    // Add message to subcollection
    const messagesRef = collection(db, SUPPORT_CHATS_COLLECTION, chatId, 'messages')
    await addDoc(messagesRef, {
      text: messageText.trim(),
      message: messageText.trim(),
      content: messageText.trim(),
      senderType: 'user',
      isAdmin: false,
      senderId: userId,
      senderName: name || 'User',
      receiverId: 'admin', // Message is for admin
      isRead: false, // Not read yet
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    // Update chat document - increment unread count for admin
    await updateDoc(chatRef, {
      lastMessage: messageText.trim(),
      lastMessageTime: serverTimestamp(),
      lastMessageBy: 'user',
      unreadByAdmin: newUnreadCount, // Increment unread count for admin
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ User message sent successfully. Unread count: ${currentUnread} → ${newUnreadCount}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending user message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's support chat
 * @param {string} userId - User ID
 * @returns {Promise} Chat data
 */
export const getUserSupportChat = async (userId) => {
  try {
    const chatsRef = collection(db, SUPPORT_CHATS_COLLECTION)
    const chatQuery = query(
      chatsRef,
      where('userId', '==', userId)
    )
    const chatSnapshot = await getDocs(chatQuery)
    
    if (chatSnapshot.empty) {
      return { success: false, error: 'No support chat found' }
    }
    
    const chatDoc = chatSnapshot.docs[0]
    return { 
      success: true, 
      chat: { id: chatDoc.id, ...chatDoc.data() }
    }
  } catch (error) {
    console.error('Error getting user support chat:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to user's support chat messages (real-time)
 * @param {string} chatId - Chat document ID
 * @param {Function} callback - Callback with messages data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserChatMessages = (chatId, callback) => {
  try {
    const messagesRef = collection(db, SUPPORT_CHATS_COLLECTION, chatId, 'messages')
    const messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'asc')
    )
    
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            text: data.text || data.message || data.content || '',
            sender: data.senderType === 'admin' || data.isAdmin ? 'admin' : 'user',
            senderName: data.senderName || (data.senderType === 'admin' ? 'Admin' : 'User'),
            time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
            timestamp: data.timestamp,
            ...data
          }
        })
        callback(messages)
      },
      (error) => {
        console.error('Error subscribing to messages:', error)
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up message subscription:', error)
    return () => {} // Return empty unsubscribe function
  }
}

/**
 * Subscribe to user's support chat (real-time updates)
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with chat data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserSupportChat = (userId, callback) => {
  try {
    const chatsRef = collection(db, SUPPORT_CHATS_COLLECTION)
    const chatQuery = query(
      chatsRef,
      where('userId', '==', userId)
    )
    
    return onSnapshot(
      chatQuery,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null)
          return
        }
        
        const chatDoc = snapshot.docs[0]
        const chatData = {
          id: chatDoc.id,
          ...chatDoc.data()
        }
        callback(chatData)
      },
      (error) => {
        console.error('Error subscribing to support chat:', error)
        callback(null)
      }
    )
  } catch (error) {
    console.error('Error setting up chat subscription:', error)
    return () => {} // Return empty unsubscribe function
  }
}

/**
 * Mark messages as read by user
 * @param {string} chatId - Chat document ID
 * @returns {Promise} Success status
 */
export const markMessagesAsReadByUser = async (chatId) => {
  try {
    const chatRef = doc(db, SUPPORT_CHATS_COLLECTION, chatId)
    await updateDoc(chatRef, {
      unreadByUser: 0,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark messages as read by admin
 * Marks all unread user messages (where receiverId == 'admin') as read
 * @param {string} chatId - Chat document ID
 * @param {string} userId - User ID (to identify which user's messages to mark)
 * @returns {Promise} Success status
 */
export const markMessagesAsReadByAdmin = async (chatId, userId) => {
  try {
    // Get all messages in the chat
    const messagesRef = collection(db, SUPPORT_CHATS_COLLECTION, chatId, 'messages')
    const messagesSnapshot = await getDocs(messagesRef)
    
    // Filter and update unread user messages (messages sent by user to admin, not yet read)
    const updatePromises = []
    
    messagesSnapshot.docs.forEach(messageDoc => {
      const messageData = messageDoc.data()
      const isUserMessage = messageData.senderType === 'user' || messageData.isAdmin === false
      const receiverId = messageData.receiverId || 'admin' // Default to admin if not set
      const isRead = messageData.isRead === true // Explicitly check for true
      
      // Mark as read if:
      // 1. It's a user message (sent by user)
      // 2. Receiver is admin (or default/not set, which means admin)
      // 3. Not yet read
      if (isUserMessage && (receiverId === 'admin' || !messageData.receiverId) && !isRead) {
        updatePromises.push(
          updateDoc(doc(db, SUPPORT_CHATS_COLLECTION, chatId, 'messages', messageDoc.id), {
            isRead: true,
            readAt: serverTimestamp(),
            readBy: 'admin'
          })
        )
      }
    })
    
    // Execute all updates
    await Promise.all(updatePromises)
    
    // Update chat document to reset unread count
    const chatRef = doc(db, SUPPORT_CHATS_COLLECTION, chatId)
    await updateDoc(chatRef, {
      unreadByAdmin: 0,
      updatedAt: serverTimestamp()
    })
    
    console.log(`✅ Marked ${updatePromises.length} messages as read by admin (chatId: ${chatId})`)
    return { success: true, markedCount: updatePromises.length }
  } catch (error) {
    console.error('Error marking messages as read by admin:', error)
    return { success: false, error: error.message }
  }
}

// ==================== ADMIN FUNCTIONS (for reference) ====================

/**
 * Get all support chats (Admin only)
 * @returns {Promise} Chats data
 */
export const getAllSupportChats = async () => {
  try {
    const chatsRef = collection(db, SUPPORT_CHATS_COLLECTION)
    const chatsQuery = query(
      chatsRef,
      orderBy('lastMessageTime', 'desc')
    )
    const snapshot = await getDocs(chatsQuery)
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, chats }
  } catch (error) {
    console.error('Error fetching support chats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send message from admin to user
 * @param {string} chatId - Chat document ID
 * @param {string} messageText - Message text
 * @param {string} adminId - Admin user ID
 * @returns {Promise} Success status
 */
export const sendAdminMessage = async (chatId, messageText, adminId = 'admin') => {
  try {
    // Add message to subcollection
    const messagesRef = collection(db, SUPPORT_CHATS_COLLECTION, chatId, 'messages')
    await addDoc(messagesRef, {
      text: messageText.trim(),
      message: messageText.trim(),
      content: messageText.trim(),
      senderType: 'admin',
      isAdmin: true,
      senderId: adminId,
      senderName: 'Admin',
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    })
    
    // Update chat document
    const chatRef = doc(db, SUPPORT_CHATS_COLLECTION, chatId)
    await updateDoc(chatRef, {
      lastMessage: messageText.trim(),
      lastMessageTime: serverTimestamp(),
      lastMessageBy: 'admin',
      unreadByUser: (await getDoc(chatRef)).data()?.unreadByUser || 0 + 1,
      updatedAt: serverTimestamp()
    })
    
    console.log('✅ Admin message sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Error sending admin message:', error)
    return { success: false, error: error.message }
  }
}


