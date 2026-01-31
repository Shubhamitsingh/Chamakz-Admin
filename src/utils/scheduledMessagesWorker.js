import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

let workerInterval = null

/**
 * Start the scheduled messages worker
 * Checks every minute for messages that need to be sent
 */
export const startScheduledMessagesWorker = () => {
  // Clear any existing interval
  if (workerInterval) {
    clearInterval(workerInterval)
  }
  
  // Check immediately on start
  processScheduledMessages()
  
  // Then check every minute
  workerInterval = setInterval(async () => {
    await processScheduledMessages()
  }, 60000) // 1 minute
  
  console.log('✅ Scheduled messages worker started')
}

/**
 * Stop the scheduled messages worker
 */
export const stopScheduledMessagesWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
    console.log('⏹️ Scheduled messages worker stopped')
  }
}

/**
 * Process scheduled messages that are due
 */
const processScheduledMessages = async () => {
  try {
    const now = Timestamp.now()
    
    // Find scheduled messages that are due
    const scheduledQuery = query(
      collection(db, 'team_messages'),
      where('status', '==', 'scheduled'),
      where('scheduledFor', '<=', now)
    )
    
    const scheduledSnapshot = await getDocs(scheduledQuery)
    
    for (const docSnap of scheduledSnapshot.docs) {
      const messageData = docSnap.data()
      
      try {
        // Update status to sent
        await updateDoc(doc(db, 'team_messages', docSnap.id), {
          status: 'sent',
          sentAt: serverTimestamp()
        })
        
        console.log(`✅ Scheduled message ${docSnap.id} sent at scheduled time`)
      } catch (error) {
        console.error(`❌ Error sending scheduled message ${docSnap.id}:`, error)
      }
    }
    
    // Process recurring messages that need to be sent
    const recurringQuery = query(
      collection(db, 'team_messages'),
      where('isRecurring', '==', true),
      where('status', '==', 'active'),
      where('nextScheduledTime', '<=', now)
    )
    
    const recurringSnapshot = await getDocs(recurringQuery)
    
    for (const docSnap of recurringSnapshot.docs) {
      const messageData = docSnap.data()
      const pattern = messageData.recurrencePattern || {}
      
      try {
        // Create new message instance
        const newMessage = {
          message: messageData.message || '',
          text: messageData.text || messageData.message || '',
          image: messageData.image || null,
          imageUrl: messageData.imageUrl || messageData.image || null,
          sender: 'Admin',
          senderId: messageData.senderId || 'admin',
          senderName: 'Chamakz Team',
          type: 'team_message',
          sentTo: 'all_users',
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp(),
          status: 'sent',
          sentAt: serverTimestamp(),
          parentRecurringId: docSnap.id // Link to original recurring template
        }
        
        // Only add image fields if image exists
        if (!newMessage.image) {
          delete newMessage.image
          delete newMessage.imageUrl
        }
        
        await addDoc(collection(db, 'team_messages'), newMessage)
        
        // Calculate next scheduled time
        const nextTime = calculateNextScheduledTime(pattern, now)
        await updateDoc(doc(db, 'team_messages', docSnap.id), {
          nextScheduledTime: nextTime
        })
        
        console.log(`✅ Recurring message ${docSnap.id} sent, next: ${nextTime.toDate()}`)
      } catch (error) {
        console.error(`❌ Error processing recurring message ${docSnap.id}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Error processing scheduled messages:', error)
    // Don't throw - worker should continue running
  }
}

/**
 * Calculate the next scheduled time based on recurrence pattern
 */
function calculateNextScheduledTime(pattern, currentTime) {
  const now = currentTime.toDate()
  let next = new Date(now)
  
  if (pattern.type === 'daily') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number)
    next.setHours(hours, minutes, 0, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
  }
  else if (pattern.type === 'weekly') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number)
    const daysOfWeek = pattern.daysOfWeek || []
    
    if (daysOfWeek.length === 0) {
      // Default to same day next week
      next.setDate(next.getDate() + 7)
      next.setHours(hours, minutes, 0, 0)
    } else {
      // Find next matching day
      const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      let daysToAdd = 0
      let found = false
      
      // Check remaining days of current week
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7
        if (daysOfWeek.includes(checkDay === 0 ? 7 : checkDay)) {
          daysToAdd = i
          found = true
          break
        }
      }
      
      // If not found, check next week
      if (!found) {
        for (const day of daysOfWeek.sort((a, b) => a - b)) {
          const targetDay = day === 7 ? 0 : day
          if (targetDay > currentDay || (targetDay === 0 && currentDay !== 0)) {
            daysToAdd = targetDay === 0 ? 7 - currentDay : targetDay - currentDay
            found = true
            break
          }
        }
        if (!found) {
          // Next occurrence is next week's first day
          daysToAdd = 7 - currentDay + (daysOfWeek[0] === 7 ? 0 : daysOfWeek[0])
        }
      }
      
      next.setDate(next.getDate() + daysToAdd)
      next.setHours(hours, minutes, 0, 0)
    }
  }
  else if (pattern.type === 'monthly') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number)
    const dayOfMonth = pattern.dayOfMonth || 1
    
    next.setDate(dayOfMonth)
    next.setHours(hours, minutes, 0, 0)
    
    if (next <= now) {
      // Move to next month
      next.setMonth(next.getMonth() + 1)
      // Handle edge case where day doesn't exist in next month (e.g., Feb 31)
      if (next.getDate() !== dayOfMonth) {
        next.setDate(0) // Last day of previous month
      }
    }
  }
  
  return Timestamp.fromDate(next)
}
