# 📅 Scheduled Messages Feature - Implementation Report

## 🎯 Feature Overview

Add scheduling capabilities to the "Chamakz Team" menu, allowing admins to:
1. **Send instant messages** (current functionality)
2. **Schedule messages** for specific date/time
3. **Set recurring system messages** (daily, weekly, etc.)

---

## 📊 Current Implementation Analysis

### ✅ What Exists Now
- **Instant Message Sending**: Admin can send messages immediately to all users
- **Collection**: `team_messages` in Firestore
- **Features**: Text + Image support
- **Storage**: Images stored in Firebase Storage (`team_messages/` folder)

### ❌ What's Missing
- Date/time picker for scheduling
- Scheduled message storage
- Background job to process scheduled messages
- Recurring message templates
- Message status tracking (scheduled, sent, failed)

---

## 🏗️ Proposed Architecture

### **Option 1: Enhanced `team_messages` Collection** (Recommended)

#### Database Structure
```
team_messages/
  ├── {messageId}
      ├── message: string
      ├── image: string (optional)
      ├── sender: "Admin"
      ├── senderName: "Chamakz Team"
      ├── type: "team_message"
      ├── sentTo: "all_users"
      ├── createdAt: Timestamp
      ├── status: "sent" | "scheduled" | "failed"
      ├── scheduledFor: Timestamp (optional)
      ├── sentAt: Timestamp (optional)
      ├── isRecurring: boolean
      ├── recurrencePattern: {
      │     type: "daily" | "weekly" | "monthly" | null
      │     time: "09:00" (HH:mm format)
      │     daysOfWeek: [1,2,3,4,5] (for weekly, 1=Monday)
      │     dayOfMonth: 1 (for monthly)
      │   }
      └── nextScheduledTime: Timestamp (for recurring)
```

#### UI Components Needed
1. **Message Type Selector** (Radio buttons)
   - ⚡ Instant
   - 📅 Scheduled
   - 🔄 Recurring

2. **Date/Time Picker** (for scheduled)
   - Date picker
   - Time picker (HH:mm)
   - Timezone selector

3. **Recurrence Settings** (for recurring)
   - Frequency: Daily / Weekly / Monthly
   - Time: HH:mm
   - Days of week (for weekly)
   - Day of month (for monthly)

4. **Scheduled Messages List**
   - Show pending scheduled messages
   - Show sent scheduled messages
   - Allow cancel/edit before sending

---

## 🔄 Implementation Flow

### **1. Instant Messages** (Already Working)
```
Admin → Types Message → Clicks "Send Now" → 
Message saved to team_messages with status="sent" → 
All users receive immediately
```

### **2. Scheduled Messages** (New)
```
Admin → Types Message → Selects "Scheduled" → 
Sets Date/Time → Clicks "Schedule Message" → 
Message saved with status="scheduled", scheduledFor={timestamp} → 
Background job checks every minute → 
When time arrives → Status changed to "sent" → 
All users receive message
```

### **3. Recurring Messages** (New)
```
Admin → Types Message → Selects "Recurring" → 
Sets Pattern (Daily 9 AM) → Clicks "Create Recurring Message" → 
Message saved with isRecurring=true, recurrencePattern={...} → 
Background job checks every minute → 
When pattern matches → Creates new message → 
All users receive → Updates nextScheduledTime
```

---

## 🛠️ Technical Implementation

### **Frontend Changes** (`src/pages/ChamakzTeam.jsx`)

#### New State Variables
```javascript
const [messageType, setMessageType] = useState('instant') // 'instant' | 'scheduled' | 'recurring'
const [scheduledDate, setScheduledDate] = useState('')
const [scheduledTime, setScheduledTime] = useState('')
const [recurrenceType, setRecurrenceType] = useState('daily') // 'daily' | 'weekly' | 'monthly'
const [recurrenceTime, setRecurrenceTime] = useState('09:00')
const [selectedDays, setSelectedDays] = useState([]) // For weekly
const [dayOfMonth, setDayOfMonth] = useState(1) // For monthly
const [scheduledMessages, setScheduledMessages] = useState([])
```

#### New UI Sections
1. **Message Type Selector**
   ```jsx
   <div className="flex gap-4 mb-4">
     <label>
       <input type="radio" value="instant" checked={messageType === 'instant'} />
       ⚡ Send Now
     </label>
     <label>
       <input type="radio" value="scheduled" checked={messageType === 'scheduled'} />
       📅 Schedule
     </label>
     <label>
       <input type="radio" value="recurring" checked={messageType === 'recurring'} />
       🔄 Recurring
     </label>
   </div>
   ```

2. **Scheduled Date/Time Picker** (shown when messageType === 'scheduled')
   ```jsx
   <div className="grid grid-cols-2 gap-4">
     <div>
       <label>Date</label>
       <input type="date" value={scheduledDate} min={new Date().toISOString().split('T')[0]} />
     </div>
     <div>
       <label>Time</label>
       <input type="time" value={scheduledTime} />
     </div>
   </div>
   ```

3. **Recurrence Settings** (shown when messageType === 'recurring')
   ```jsx
   <div className="space-y-4">
     <div>
       <label>Frequency</label>
       <select value={recurrenceType}>
         <option value="daily">Daily</option>
         <option value="weekly">Weekly</option>
         <option value="monthly">Monthly</option>
       </select>
     </div>
     <div>
       <label>Time</label>
       <input type="time" value={recurrenceTime} />
     </div>
     {recurrenceType === 'weekly' && (
       <div>
         <label>Days of Week</label>
         {/* Checkboxes for Mon-Sun */}
       </div>
     )}
     {recurrenceType === 'monthly' && (
       <div>
         <label>Day of Month</label>
         <input type="number" min="1" max="31" value={dayOfMonth} />
       </div>
     )}
   </div>
   ```

4. **Scheduled Messages List**
   ```jsx
   <div className="card">
     <h3>Scheduled Messages</h3>
     <div className="space-y-2">
       {scheduledMessages.map(msg => (
         <div key={msg.id} className="p-4 border rounded">
           <p>{msg.message}</p>
           <p className="text-sm text-gray-500">
             Scheduled for: {new Date(msg.scheduledFor).toLocaleString()}
           </p>
           <button onClick={() => cancelScheduled(msg.id)}>Cancel</button>
         </div>
       ))}
     </div>
   </div>
   ```

#### Updated Send Function
```javascript
const handleSendMessage = async () => {
  // ... existing validation ...

  const messageData = {
    message: message.trim() || '',
    text: message.trim() || '',
    sender: 'Admin',
    senderId: adminUser?.uid || 'admin',
    senderName: 'Chamakz Team',
    type: 'team_message',
    sentTo: 'all_users',
    createdAt: serverTimestamp(),
    timestamp: serverTimestamp()
  }

  // Add image if provided
  if (imageUrl) {
    messageData.image = imageUrl
    messageData.imageUrl = imageUrl
  }

  // Handle different message types
  if (messageType === 'instant') {
    // Current behavior - send immediately
    messageData.status = 'sent'
    messageData.sentAt = serverTimestamp()
    await addDoc(collection(db, 'team_messages'), messageData)
    showToast('Message sent to all users!', 'success')
  } 
  else if (messageType === 'scheduled') {
    // Schedule for later
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    if (scheduledDateTime <= new Date()) {
      showToast('Please select a future date and time', 'error')
      return
    }
    
    messageData.status = 'scheduled'
    messageData.scheduledFor = Timestamp.fromDate(scheduledDateTime)
    await addDoc(collection(db, 'team_messages'), messageData)
    showToast(`Message scheduled for ${scheduledDateTime.toLocaleString()}`, 'success')
  }
  else if (messageType === 'recurring') {
    // Create recurring message
    messageData.isRecurring = true
    messageData.status = 'active'
    messageData.recurrencePattern = {
      type: recurrenceType,
      time: recurrenceTime,
      daysOfWeek: recurrenceType === 'weekly' ? selectedDays : null,
      dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : null
    }
    // Calculate next scheduled time
    messageData.nextScheduledTime = calculateNextScheduledTime(recurrencePattern)
    await addDoc(collection(db, 'team_messages'), messageData)
    showToast('Recurring message created!', 'success')
  }

  // Reset form
  setMessage('')
  setSelectedImage(null)
  setImagePreview(null)
}
```

---

### **Backend Implementation Options**

#### **Option A: Firebase Cloud Functions** (Recommended for Production)

**File**: `functions/index.js`
```javascript
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

// Run every minute to check scheduled messages
exports.processScheduledMessages = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const db = admin.firestore()
    const now = admin.firestore.Timestamp.now()
    
    // Find scheduled messages that are due
    const scheduledQuery = await db.collection('team_messages')
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '<=', now)
      .get()
    
    // Process each scheduled message
    for (const doc of scheduledQuery.docs) {
      const messageData = doc.data()
      
      // Update status to 'sent'
      await doc.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      })
      
      // Message is now available to all users (they read from team_messages)
      console.log(`Message ${doc.id} sent at scheduled time`)
    }
    
    // Find recurring messages that need to be sent
    const recurringQuery = await db.collection('team_messages')
      .where('isRecurring', '==', true)
      .where('status', '==', 'active')
      .where('nextScheduledTime', '<=', now)
      .get()
    
    // Process each recurring message
    for (const doc of recurringQuery.docs) {
      const messageData = doc.data()
      const pattern = messageData.recurrencePattern
      
      // Create new message instance
      const newMessage = {
        message: messageData.message,
        image: messageData.image || null,
        sender: 'Admin',
        senderId: messageData.senderId,
        senderName: 'Chamakz Team',
        type: 'team_message',
        sentTo: 'all_users',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        parentRecurringId: doc.id // Link to original recurring template
      }
      
      await db.collection('team_messages').add(newMessage)
      
      // Calculate next scheduled time
      const nextTime = calculateNextScheduledTime(pattern, now)
      await doc.ref.update({
        nextScheduledTime: nextTime
      })
      
      console.log(`Recurring message ${doc.id} sent, next: ${nextTime.toDate()}`)
    }
    
    return null
  })

function calculateNextScheduledTime(pattern, currentTime) {
  const now = currentTime.toDate()
  let next = new Date(now)
  
  if (pattern.type === 'daily') {
    const [hours, minutes] = pattern.time.split(':').map(Number)
    next.setHours(hours, minutes, 0, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
  }
  else if (pattern.type === 'weekly') {
    const [hours, minutes] = pattern.time.split(':').map(Number)
    const daysOfWeek = pattern.daysOfWeek || []
    // Find next matching day
    // ... implementation
  }
  else if (pattern.type === 'monthly') {
    next.setDate(pattern.dayOfMonth)
    const [hours, minutes] = pattern.time.split(':').map(Number)
    next.setHours(hours, minutes, 0, 0)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
    }
  }
  
  return admin.firestore.Timestamp.fromDate(next)
}
```

**Pros:**
- ✅ Reliable (runs on Firebase servers)
- ✅ No client-side dependencies
- ✅ Handles timezone automatically
- ✅ Scales automatically

**Cons:**
- ❌ Requires Firebase Functions setup
- ❌ Additional cost (minimal for this use case)
- ❌ Requires deployment

---

#### **Option B: Client-Side Polling** (Quick Implementation)

**File**: `src/utils/scheduledMessagesWorker.js`
```javascript
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

let workerInterval = null

export const startScheduledMessagesWorker = () => {
  // Check every minute
  workerInterval = setInterval(async () => {
    await processScheduledMessages()
  }, 60000) // 1 minute
}

export const stopScheduledMessagesWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
  }
}

const processScheduledMessages = async () => {
  try {
    const now = Timestamp.now()
    
    // Find scheduled messages due
    const scheduledQuery = query(
      collection(db, 'team_messages'),
      where('status', '==', 'scheduled'),
      where('scheduledFor', '<=', now)
    )
    
    const scheduledSnapshot = await getDocs(scheduledQuery)
    
    for (const docSnap of scheduledSnapshot.docs) {
      const messageData = docSnap.data()
      
      // Update status to sent
      await updateDoc(doc(db, 'team_messages', docSnap.id), {
        status: 'sent',
        sentAt: serverTimestamp()
      })
      
      console.log(`Scheduled message ${docSnap.id} sent`)
    }
    
    // Process recurring messages
    const recurringQuery = query(
      collection(db, 'team_messages'),
      where('isRecurring', '==', true),
      where('status', '==', 'active'),
      where('nextScheduledTime', '<=', now)
    )
    
    const recurringSnapshot = await getDocs(recurringQuery)
    
    for (const docSnap of recurringSnapshot.docs) {
      const messageData = docSnap.data()
      
      // Create new message instance
      const newMessage = {
        message: messageData.message,
        image: messageData.image || null,
        sender: 'Admin',
        senderId: messageData.senderId,
        senderName: 'Chamakz Team',
        type: 'team_message',
        sentTo: 'all_users',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        status: 'sent',
        sentAt: serverTimestamp(),
        parentRecurringId: docSnap.id
      }
      
      await addDoc(collection(db, 'team_messages'), newMessage)
      
      // Calculate next scheduled time
      const nextTime = calculateNextScheduledTime(messageData.recurrencePattern)
      await updateDoc(doc(db, 'team_messages', docSnap.id), {
        nextScheduledTime: nextTime
      })
    }
  } catch (error) {
    console.error('Error processing scheduled messages:', error)
  }
}

function calculateNextScheduledTime(pattern) {
  const now = new Date()
  let next = new Date(now)
  
  if (pattern.type === 'daily') {
    const [hours, minutes] = pattern.time.split(':').map(Number)
    next.setHours(hours, minutes, 0, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
  }
  // ... similar for weekly/monthly
  
  return Timestamp.fromDate(next)
}
```

**Usage in ChamakzTeam.jsx:**
```javascript
import { startScheduledMessagesWorker, stopScheduledMessagesWorker } from '../utils/scheduledMessagesWorker'

useEffect(() => {
  // Start worker when component mounts
  startScheduledMessagesWorker()
  
  return () => {
    // Stop worker when component unmounts
    stopScheduledMessagesWorker()
  }
}, [])
```

**Pros:**
- ✅ Quick to implement
- ✅ No additional Firebase setup
- ✅ Works immediately

**Cons:**
- ❌ Only works when admin panel is open
- ❌ Requires admin to be logged in
- ❌ Not reliable for production

---

## 📋 Implementation Checklist

### Phase 1: UI Enhancement
- [ ] Add message type selector (Instant/Scheduled/Recurring)
- [ ] Add date/time picker for scheduled messages
- [ ] Add recurrence pattern UI (daily/weekly/monthly)
- [ ] Add scheduled messages list view
- [ ] Add cancel/edit functionality for scheduled messages
- [ ] Update form validation

### Phase 2: Database Structure
- [ ] Update Firestore rules to support new fields
- [ ] Add indexes for scheduled queries
- [ ] Test message creation with new fields

### Phase 3: Background Processing
- [ ] Implement Cloud Function OR Client-side worker
- [ ] Test scheduled message processing
- [ ] Test recurring message processing
- [ ] Handle edge cases (timezone, DST, etc.)

### Phase 4: Testing & Polish
- [ ] Test instant messages (should still work)
- [ ] Test scheduled messages
- [ ] Test recurring messages
- [ ] Test cancel/edit scheduled messages
- [ ] Test error handling
- [ ] Add loading states
- [ ] Add success/error notifications

---

## 🎨 Visual Mockup

### **Current UI** (Instant Only)
```
┌─────────────────────────────────────┐
│  Send Message to All Users          │
├─────────────────────────────────────┤
│  Message: [Textarea]                │
│  Image: [Upload Button]             │
│  [Send Message to All Users]        │
└─────────────────────────────────────┘
```

### **Enhanced UI** (With Scheduling)
```
┌─────────────────────────────────────┐
│  Send Message to All Users          │
├─────────────────────────────────────┤
│  Message Type:                      │
│  ⚪ Send Now  ⚪ Schedule  ⚪ Recurring│
│                                     │
│  Message: [Textarea]                │
│  Image: [Upload Button]             │
│                                     │
│  ┌─ Schedule Settings ───────────┐ │
│  │ Date: [2024-01-15]             │ │
│  │ Time: [09:00]                  │ │
│  └────────────────────────────────┘ │
│                                     │
│  [Schedule Message]                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Scheduled Messages (3)             │
├─────────────────────────────────────┤
│  📅 "Welcome message"               │
│     Scheduled: Jan 15, 2024 9:00 AM│
│     [Cancel] [Edit]                 │
│                                     │
│  🔄 "Daily reminder" (Daily 9 AM)  │
│     Status: Active                  │
│     Next: Jan 16, 2024 9:00 AM     │
│     [Stop] [Edit]                   │
└─────────────────────────────────────┘
```

---

## 🔒 Firestore Security Rules Update

```javascript
match /team_messages/{messageId} {
  // Allow admins to read/write all messages
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
  
  // Allow users to read sent messages only
  allow read: if resource.data.status == 'sent';
  
  // Deny users from writing
  allow write: if false;
}
```

**Indexes Needed:**
```
Collection: team_messages
- status (Ascending) + scheduledFor (Ascending)
- isRecurring (Ascending) + status (Ascending) + nextScheduledTime (Ascending)
```

---

## ⚠️ Important Considerations

### **1. Timezone Handling**
- Store all times in UTC
- Convert to admin's timezone in UI
- Convert to user's timezone when displaying

### **2. Edge Cases**
- What if admin cancels a scheduled message?
- What if recurring message is edited?
- What if Cloud Function fails?
- What if multiple admins schedule at same time?

### **3. Performance**
- Limit scheduled messages query (use pagination)
- Index properly for fast queries
- Consider batch processing for large user bases

### **4. User Experience**
- Show countdown for scheduled messages
- Show next scheduled time for recurring
- Allow preview before scheduling
- Send confirmation when scheduled

---

## 🚀 Recommended Approach

**For Quick Implementation (MVP):**
1. Use **Option B (Client-Side Polling)** initially
2. Add UI for scheduling
3. Test thoroughly
4. Migrate to **Option A (Cloud Functions)** for production

**For Production:**
1. Implement **Option A (Cloud Functions)** from start
2. Add comprehensive error handling
3. Add monitoring and logging
4. Set up alerts for failed messages

---

## 📊 Estimated Implementation Time

- **UI Enhancement**: 4-6 hours
- **Database Setup**: 1-2 hours
- **Client-Side Worker**: 3-4 hours
- **Cloud Functions**: 4-6 hours
- **Testing & Polish**: 3-4 hours

**Total**: 15-22 hours

---

## ✅ Next Steps

1. **Review this report** and confirm approach
2. **Choose implementation option** (Client-side vs Cloud Functions)
3. **Start with UI enhancement** (Phase 1)
4. **Implement background processing** (Phase 3)
5. **Test thoroughly** (Phase 4)
6. **Deploy to production**

---

## 📝 Notes

- This feature requires careful timezone handling
- Consider adding message templates for recurring messages
- May want to add "Send to specific user groups" in future
- Consider adding message analytics (open rate, etc.)

---

**Report Generated**: January 2024  
**Status**: Ready for Review & Approval
