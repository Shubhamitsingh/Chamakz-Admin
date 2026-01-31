# 📊 User Activity Tracking - Implementation Approach

## 🔍 **Current Situation**

### **What's Working:**
- ✅ Users page shows "Last Active" column
- ✅ Displays date from `lastActive` field in Firebase
- ✅ Real-time listener updates when data changes

### **What's Missing:**
- ❌ Only shows date, not time (e.g., "18/1/2026" instead of "2 hours ago")
- ❌ No "Currently Active" indicator
- ❌ No real-time tracking of when users are using the app
- ❌ No way to see which users are online right now

---

## 🎯 **What We Need to Implement**

### **1. Real-Time Activity Tracking**
Track when users are actively using the mobile app in real-time.

### **2. Better Display Format**
Show:
- **"Currently Active"** - User is using the app right now (last 5 minutes)
- **"X minutes ago"** - User was active recently (5-60 minutes)
- **"X hours ago"** - User was active today (1-24 hours)
- **"X days ago"** - User was active this week
- **"Last seen: [date]"** - User hasn't been active recently

### **3. Online Status Indicator**
Visual indicator showing:
- 🟢 **Green dot** - Currently active (last 5 minutes)
- 🟡 **Yellow dot** - Recently active (5-30 minutes)
- ⚪ **Gray dot** - Not active (30+ minutes)

---

## 🏗️ **Implementation Approach**

### **Phase 1: Mobile App Changes (Required)**

The mobile app needs to update the `lastActive` field in Firebase whenever:
1. User opens the app
2. User performs any action (navigate, interact, etc.)
3. App comes to foreground
4. User sends a message, makes a transaction, etc.

**Implementation in Mobile App:**
```javascript
// In your mobile app (React Native/Flutter/etc.)

// Update lastActive whenever user is active
const updateLastActive = async () => {
  const userRef = doc(db, 'users', currentUserId)
  await updateDoc(userRef, {
    lastActive: serverTimestamp(), // Firebase server timestamp
    isOnline: true // Optional: track online status
  })
}

// Call this:
// - On app open
// - On app resume (foreground)
// - Every 2-3 minutes while app is active
// - On user interactions (optional, for more accuracy)
```

**Firebase Cloud Function (Alternative):**
If you can't modify the mobile app immediately, you can use Firebase Cloud Functions to track activity based on other events (like chat messages, transactions, etc.)

---

### **Phase 2: Admin Panel Improvements**

#### **2.1. Enhanced Last Active Display**

**Current:**
```javascript
lastActive: date.toLocaleDateString() // "18/1/2026"
```

**Improved:**
```javascript
const getLastActiveDisplay = (lastActiveDate) => {
  if (!lastActiveDate) return 'Never'
  
  const now = new Date()
  const lastActive = lastActiveDate.toDate ? lastActiveDate.toDate() : new Date(lastActiveDate)
  const diffMs = now - lastActive
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 5) return 'Currently Active'
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return `Last seen: ${lastActive.toLocaleDateString()}`
}
```

#### **2.2. Online Status Indicator**

Add a visual indicator column:
```javascript
{
  header: 'Status',
  render: (row) => {
    const status = getOnlineStatus(row.lastActive)
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          status === 'online' ? 'bg-green-500' :
          status === 'recent' ? 'bg-yellow-500' :
          'bg-gray-400'
        }`}></span>
        <span>{getLastActiveDisplay(row.lastActive)}</span>
      </div>
    )
  }
}
```

#### **2.3. Real-Time Updates**

The admin panel already has real-time listeners, so it will automatically update when `lastActive` changes in Firebase.

---

### **Phase 3: Additional Features (Optional)**

#### **3.1. Activity Filter**
- Filter by: "Currently Active", "Active Today", "Active This Week", "Inactive"

#### **3.2. Activity Log**
- Show detailed activity history (when user logged in, what actions they performed)

#### **3.3. Push Notifications**
- Notify admin when users become active/inactive (optional)

---

## 📋 **Step-by-Step Implementation Plan**

### **Step 1: Mobile App (Critical)**
1. Add `updateLastActive()` function
2. Call it on app open/resume
3. Set up interval to update every 2-3 minutes while app is active
4. Test that `lastActive` field updates in Firebase

### **Step 2: Admin Panel - Display Format**
1. Create `getLastActiveDisplay()` helper function
2. Update Users page to use new format
3. Add online status indicator
4. Test with real data

### **Step 3: Admin Panel - Visual Indicators**
1. Add status dot column
2. Style based on activity time
3. Add tooltips for clarity

### **Step 4: Testing**
1. Test with mobile app updating `lastActive`
2. Verify real-time updates in admin panel
3. Test different time ranges (active, recent, old)

---

## 🔧 **Technical Details**

### **Firebase Field Structure**
```javascript
// User document in Firebase
{
  lastActive: Timestamp, // Server timestamp
  isOnline: boolean,     // Optional: true/false
  // ... other fields
}
```

### **Time Thresholds**
- **Currently Active**: < 5 minutes
- **Recently Active**: 5-30 minutes
- **Active Today**: 30 minutes - 24 hours
- **Active This Week**: 1-7 days
- **Inactive**: > 7 days

### **Performance Considerations**
- Update `lastActive` every 2-3 minutes (not on every action)
- Use Firebase `serverTimestamp()` for accuracy
- Consider using Firebase Realtime Database for online status (faster updates)

---

## ✅ **Expected Results**

After implementation:
- ✅ Admin can see which users are currently using the app
- ✅ Shows "Currently Active" for users active in last 5 minutes
- ✅ Shows relative time ("5 mins ago", "2 hours ago")
- ✅ Visual indicators (green/yellow/gray dots)
- ✅ Real-time updates when users become active
- ✅ Better understanding of user engagement

---

## 🚀 **Next Steps**

1. **First**: Implement mobile app changes to update `lastActive`
2. **Then**: Update admin panel to show better format
3. **Finally**: Add visual indicators and filters

**Would you like me to:**
- ✅ Implement the admin panel improvements now (display format + indicators)?
- ⏳ Wait for mobile app changes first?

---

**Status**: 📝 **PLAN READY - AWAITING IMPLEMENTATION**

**Date**: $(date)
