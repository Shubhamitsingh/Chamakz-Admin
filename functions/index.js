const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Process scheduled messages that are due to be sent
 * Runs every minute automatically
 */
exports.processScheduledMessages = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('⏰ Checking for scheduled messages...');
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Find scheduled messages that are due
      const scheduledQuery = await db.collection('team_messages')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .get();
      
      console.log(`📅 Found ${scheduledQuery.size} scheduled messages due`);
      
      // Process each scheduled message
      for (const docSnap of scheduledQuery.docs) {
        const messageData = docSnap.data();
        
        try {
          // Update status to 'sent'
          await docSnap.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Scheduled message ${docSnap.id} sent at scheduled time`);
        } catch (error) {
          console.error(`❌ Error sending scheduled message ${docSnap.id}:`, error);
        }
      }
      
      // Find recurring messages that need to be sent
      const recurringQuery = await db.collection('team_messages')
        .where('isRecurring', '==', true)
        .where('status', '==', 'active')
        .where('nextScheduledTime', '<=', now)
        .get();
      
      console.log(`🔄 Found ${recurringQuery.size} recurring messages due`);
      
      // Process each recurring message
      for (const docSnap of recurringQuery.docs) {
        const messageData = docSnap.data();
        const pattern = messageData.recurrencePattern || {};
        
        try {
          // Create new message instance
          const newMessage = {
            message: messageData.message || '',
            text: messageData.text || messageData.message || '',
            sender: 'Admin',
            senderId: messageData.senderId || 'admin',
            senderName: 'Chamakz Team',
            type: 'team_message',
            sentTo: 'all_users',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            parentRecurringId: docSnap.id // Link to original recurring template
          };
          
          // Only add image fields if image exists
          if (messageData.image) {
            newMessage.image = messageData.image;
            newMessage.imageUrl = messageData.imageUrl || messageData.image;
          }
          
          // Add the new message instance
          await db.collection('team_messages').add(newMessage);
          
          // Calculate next scheduled time
          const nextTime = calculateNextScheduledTime(pattern, now);
          await docSnap.ref.update({
            nextScheduledTime: nextTime
          });
          
          console.log(`✅ Recurring message ${docSnap.id} sent, next: ${nextTime.toDate()}`);
        } catch (error) {
          console.error(`❌ Error processing recurring message ${docSnap.id}:`, error);
        }
      }
      
      console.log('✅ Scheduled messages processing complete');
      return null;
    } catch (error) {
      console.error('❌ Error processing scheduled messages:', error);
      return null;
    }
  });

/**
 * Calculate the next scheduled time based on recurrence pattern
 */
function calculateNextScheduledTime(pattern, currentTime) {
  const now = currentTime.toDate();
  let next = new Date(now);
  
  if (pattern.type === 'daily') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  }
  else if (pattern.type === 'weekly') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number);
    const daysOfWeek = pattern.daysOfWeek || [];
    
    if (daysOfWeek.length === 0) {
      // Default to same day next week
      next.setDate(next.getDate() + 7);
      next.setHours(hours, minutes, 0, 0);
    } else {
      // Find next matching day
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysToAdd = 0;
      let found = false;
      
      // Check remaining days of current week
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const normalizedDay = checkDay === 0 ? 7 : checkDay;
        if (daysOfWeek.includes(normalizedDay)) {
          daysToAdd = i;
          found = true;
          break;
        }
      }
      
      // If not found, check next week
      if (!found) {
        for (const day of daysOfWeek.sort((a, b) => a - b)) {
          const targetDay = day === 7 ? 0 : day;
          if (targetDay > currentDay || (targetDay === 0 && currentDay !== 0)) {
            daysToAdd = targetDay === 0 ? 7 - currentDay : targetDay - currentDay;
            found = true;
            break;
          }
        }
        if (!found) {
          // Next occurrence is next week's first day
          daysToAdd = 7 - currentDay + (daysOfWeek[0] === 7 ? 0 : daysOfWeek[0]);
        }
      }
      
      next.setDate(next.getDate() + daysToAdd);
      next.setHours(hours, minutes, 0, 0);
    }
  }
  else if (pattern.type === 'monthly') {
    const [hours, minutes] = (pattern.time || '09:00').split(':').map(Number);
    const dayOfMonth = pattern.dayOfMonth || 1;
    
    next.setDate(dayOfMonth);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      // Move to next month
      next.setMonth(next.getMonth() + 1);
      // Handle edge case where day doesn't exist in next month (e.g., Feb 31)
      if (next.getDate() !== dayOfMonth) {
        next.setDate(0); // Last day of previous month
      }
    }
  }
  
  return admin.firestore.Timestamp.fromDate(next);
}
