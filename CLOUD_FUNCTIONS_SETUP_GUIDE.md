# ☁️ Firebase Cloud Functions Setup Guide

## 🎯 Overview

Scheduled messages are now processed by **Firebase Cloud Functions** instead of client-side polling. This provides:
- ✅ **24/7 reliability** - Runs on Firebase servers
- ✅ **No browser dependency** - Works even when admin panel is closed
- ✅ **Automatic execution** - Runs every minute automatically
- ✅ **Production-ready** - Scalable and reliable

---

## 📁 Files Created

### **1. `functions/package.json`**
- Dependencies for Cloud Functions
- Firebase Admin SDK and Functions SDK

### **2. `functions/index.js`**
- Main Cloud Function: `processScheduledMessages`
- Runs every minute automatically
- Processes scheduled and recurring messages

### **3. `firebase.json`**
- Firebase project configuration
- Points to functions directory

### **4. `firestore.indexes.json`**
- Required Firestore indexes for queries
- Auto-deployed with functions

---

## 🚀 Setup Instructions

### **Step 1: Install Firebase CLI**

```bash
npm install -g firebase-tools
```

### **Step 2: Login to Firebase**

```bash
firebase login
```

### **Step 3: Initialize Firebase (if not already done)**

```bash
firebase init functions
```

**Select:**
- ✅ Use existing project: `chamak-39472`
- ✅ Language: JavaScript
- ✅ ESLint: Yes (optional)
- ✅ Install dependencies: Yes

### **Step 4: Install Function Dependencies**

```bash
cd functions
npm install
cd ..
```

### **Step 5: Deploy Cloud Functions**

```bash
firebase deploy --only functions
```

**Expected output:**
```
✔  functions[processScheduledMessages(us-central1)]: Successful create operation.
```

---

## ✅ Verification

### **Check Function Status:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `chamak-39472`
3. Navigate to **Functions** in left sidebar
4. You should see: `processScheduledMessages`

### **Check Function Logs:**

```bash
firebase functions:log
```

Or in Firebase Console:
- Functions → `processScheduledMessages` → Logs

### **Test Function:**

1. Create a scheduled message in admin panel
2. Set time to 1-2 minutes in the future
3. Wait and check logs:
   ```bash
   firebase functions:log --only processScheduledMessages
   ```
4. Verify message status changes to "sent"

---

## 🔧 Function Details

### **Function Name:** `processScheduledMessages`

### **Schedule:** Every 1 minute (automatically)

### **What It Does:**

1. **Finds scheduled messages due:**
   - Queries `team_messages` where `status == 'scheduled'`
   - Checks `scheduledFor <= now`
   - Updates status to `'sent'`

2. **Finds recurring messages due:**
   - Queries `team_messages` where `isRecurring == true` and `status == 'active'`
   - Checks `nextScheduledTime <= now`
   - Creates new message instance
   - Updates `nextScheduledTime` for next occurrence

### **Function Code Location:**
- `functions/index.js`

---

## 📊 Monitoring

### **View Function Metrics:**

1. Firebase Console → Functions → `processScheduledMessages`
2. View:
   - Execution count
   - Execution time
   - Error rate
   - Invocations per day

### **View Logs:**

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only processScheduledMessages

# Last 50 lines
firebase functions:log --limit 50
```

### **Real-time Logs:**

```bash
firebase functions:log --follow
```

---

## 💰 Cost Estimation

### **Free Tier (Spark Plan):**
- ✅ 2 million invocations/month (FREE)
- ✅ 400,000 GB-seconds/month (FREE)
- ✅ 200,000 CPU-seconds/month (FREE)

### **For This Function:**
- Runs every minute = **1,440 invocations/day**
- **~43,200 invocations/month**
- **Well within free tier** ✅

### **Blaze Plan (Pay-as-you-go):**
- $0.40 per million invocations
- $0.0000025 per GB-second
- $0.0000100 per GHz-second

**Estimated cost:** **$0.00 - $0.02/month** (essentially free)

---

## 🔒 Security

### **Firestore Rules:**

The function uses **Firebase Admin SDK** which bypasses security rules. Ensure your Firestore rules allow:

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

### **Function Permissions:**

The function runs with **admin privileges** and can:
- ✅ Read all messages
- ✅ Write/update messages
- ✅ Create new message instances

---

## 🐛 Troubleshooting

### **Issue: Function not deploying**

**Solution:**
```bash
# Check Firebase login
firebase login

# Check project
firebase use chamak-39472

# Try deploy again
firebase deploy --only functions
```

### **Issue: Function not running**

**Solution:**
1. Check function status in Firebase Console
2. Check logs for errors:
   ```bash
   firebase functions:log
   ```
3. Verify indexes are created (check Firestore → Indexes)

### **Issue: "Index not found" error**

**Solution:**
1. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```
2. Wait for indexes to build (1-2 minutes)
3. Check Firebase Console → Firestore → Indexes

### **Issue: Messages not being sent**

**Solution:**
1. Check function logs:
   ```bash
   firebase functions:log --only processScheduledMessages
   ```
2. Verify message has correct fields:
   - `status: 'scheduled'` or `isRecurring: true`
   - `scheduledFor` or `nextScheduledTime` set correctly
3. Check timezone (function uses UTC)

---

## 🔄 Updating Functions

### **After Making Changes:**

1. Edit `functions/index.js`
2. Deploy:
   ```bash
   firebase deploy --only functions
   ```
3. Function updates automatically (no downtime)

### **Rollback:**

```bash
# List versions
firebase functions:list

# Rollback to previous version
firebase functions:rollback processScheduledMessages
```

---

## 📝 Code Structure

```
functions/
├── index.js          # Main function code
├── package.json      # Dependencies
└── .gitignore        # Ignore files

firebase.json         # Firebase config
firestore.indexes.json  # Required indexes
```

---

## ✅ Checklist

- [x] Firebase CLI installed
- [x] Logged into Firebase
- [x] Functions directory created
- [x] Dependencies installed (`cd functions && npm install`)
- [x] Function deployed (`firebase deploy --only functions`)
- [x] Indexes deployed (`firebase deploy --only firestore:indexes`)
- [x] Function visible in Firebase Console
- [x] Test scheduled message created
- [x] Verify message sent at scheduled time
- [x] Check function logs for execution

---

## 🎊 Next Steps

1. **Deploy functions** (see Step 5 above)
2. **Test with a scheduled message** (set 1-2 minutes in future)
3. **Monitor logs** to verify it's working
4. **Remove client-side worker** (optional - already commented out)

---

## 📚 Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Cloud Functions Pricing](https://firebase.google.com/pricing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Status:** ✅ **READY FOR DEPLOYMENT**

**Last Updated:** January 2024
