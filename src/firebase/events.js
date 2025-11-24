import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'

const ANNOUNCEMENTS_COLLECTION = 'announcements'
const EVENTS_COLLECTION = 'events'

// ==================== ANNOUNCEMENTS ====================

/**
 * Get all announcements
 * @returns {Promise} Announcements data
 */
export const getAnnouncements = async () => {
  try {
    const q = query(
      collection(db, ANNOUNCEMENTS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, announcements }
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create new announcement
 * @param {Object} announcementData - Announcement data
 * @returns {Promise} Created announcement
 */
export const createAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error creating announcement:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} updates - Data to update
 * @returns {Promise} Success status
 */
export const updateAnnouncement = async (announcementId, updates) => {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcementId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating announcement:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete announcement
 * @param {string} announcementId - Announcement ID
 * @returns {Promise} Success status
 */
export const deleteAnnouncement = async (announcementId) => {
  try {
    await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, announcementId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return { success: false, error: error.message }
  }
}

// ==================== EVENTS ====================

/**
 * Get all events
 * @returns {Promise} Events data
 */
export const getEvents = async () => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      orderBy('startDate', 'desc')
    )
    const snapshot = await getDocs(q)
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return { success: true, events }
  } catch (error) {
    console.error('Error fetching events:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create new event
 * @param {Object} eventData - Event data
 * @param {File} bannerFile - Optional banner image file
 * @returns {Promise} Created event
 */
export const createEvent = async (eventData, bannerFile = null) => {
  try {
    let bannerUrl = null

    // Upload banner if provided
    if (bannerFile) {
      const storageRef = ref(storage, `events/${Date.now()}_${bannerFile.name}`)
      await uploadBytes(storageRef, bannerFile)
      bannerUrl = await getDownloadURL(storageRef)
    }

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      banner: bannerUrl,
      participants: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Error creating event:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Data to update
 * @param {File} bannerFile - Optional new banner image
 * @returns {Promise} Success status
 */
export const updateEvent = async (eventId, updates, bannerFile = null) => {
  try {
    let bannerUrl = updates.banner

    // Upload new banner if provided
    if (bannerFile) {
      const storageRef = ref(storage, `events/${Date.now()}_${bannerFile.name}`)
      await uploadBytes(storageRef, bannerFile)
      bannerUrl = await getDownloadURL(storageRef)
    }

    const docRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(docRef, {
      ...updates,
      banner: bannerUrl,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating event:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @returns {Promise} Success status
 */
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to real-time announcements updates
 * @param {Function} callback - Callback with announcements data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAnnouncements = (callback) => {
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(announcements)
  })
}

/**
 * Subscribe to real-time events updates
 * @param {Function} callback - Callback with events data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToEvents = (callback) => {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    orderBy('startDate', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    callback(events)
  })
}











