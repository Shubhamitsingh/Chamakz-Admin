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

const TICKETS_COLLECTION = 'tickets'
const TICKET_MESSAGES_COLLECTION = 'ticketMessages'

// ==================== TICKETS ====================

/**
 * Get all tickets
 * @param {string} status - Filter by status (optional)
 * @returns {Promise} Tickets data
 */
export const getTickets = async (status = null) => {
  try {
    let q
    if (status) {
      q = query(
        collection(db, TICKETS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else {
      q = query(
        collection(db, TICKETS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    const snapshot = await getDocs(q)
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, tickets }
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get single ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise} Ticket data
 */
export const getTicket = async (ticketId) => {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { success: true, ticket: { id: docSnap.id, ...docSnap.data() } }
    } else {
      return { success: false, error: 'Ticket not found' }
    }
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update ticket status
 * @param {string} ticketId - Ticket ID
 * @param {string} status - New status (open, in-progress, resolved, closed)
 * @returns {Promise} Success status
 */
export const updateTicketStatus = async (ticketId, status) => {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId)
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'resolved' && { resolvedAt: serverTimestamp() }),
      ...(status === 'closed' && { closedAt: serverTimestamp() })
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Assign ticket to admin
 * @param {string} ticketId - Ticket ID
 * @param {string} adminId - Admin user ID
 * @param {string} adminName - Admin name
 * @returns {Promise} Success status
 */
export const assignTicket = async (ticketId, adminId, adminName) => {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId)
    await updateDoc(docRef, {
      assignedTo: adminId,
      assignedToName: adminName,
      assignedAt: serverTimestamp(),
      status: 'in-progress',
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error assigning ticket:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update ticket priority
 * @param {string} ticketId - Ticket ID
 * @param {string} priority - Priority level (low, medium, high, urgent)
 * @returns {Promise} Success status
 */
export const updateTicketPriority = async (ticketId, priority) => {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId)
    await updateDoc(docRef, {
      priority,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating ticket priority:', error)
    return { success: false, error: error.message }
  }
}

// ==================== TICKET MESSAGES ====================

/**
 * Get messages for a ticket
 * @param {string} ticketId - Ticket ID
 * @returns {Promise} Messages data
 */
export const getTicketMessages = async (ticketId) => {
  try {
    const q = query(
      collection(db, TICKET_MESSAGES_COLLECTION),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, messages }
  } catch (error) {
    console.error('Error fetching ticket messages:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send reply to ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} message - Reply message
 * @param {string} senderId - Sender ID
 * @param {string} senderName - Sender name
 * @returns {Promise} Success status
 */
export const replyToTicket = async (ticketId, message, senderId, senderName) => {
  try {
    await addDoc(collection(db, TICKET_MESSAGES_COLLECTION), {
      ticketId,
      message,
      senderId,
      senderName,
      senderType: 'admin',
      createdAt: serverTimestamp()
    })

    // Update ticket's last message time
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId)
    await updateDoc(ticketRef, {
      lastMessageAt: serverTimestamp(),
      lastMessageBy: 'admin'
    })

    return { success: true }
  } catch (error) {
    console.error('Error replying to ticket:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time tickets updates
 * @param {Function} callback - Callback with tickets data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTickets = (callback) => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(tickets)
  })
}

/**
 * Subscribe to ticket messages updates
 * @param {string} ticketId - Ticket ID
 * @param {Function} callback - Callback with messages data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTicketMessages = (ticketId, callback) => {
  const q = query(
    collection(db, TICKET_MESSAGES_COLLECTION),
    where('ticketId', '==', ticketId),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(messages)
  })
}











