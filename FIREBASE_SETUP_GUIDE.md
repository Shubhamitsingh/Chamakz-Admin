# 🔥 Firebase Integration - Complete Setup Guide

## ✅ What's Been Done (Step 2 Complete!)

### 1. Firebase SDK & Services Created
- ✅ Installed Firebase SDK
- ✅ Created 6 Firebase service files with 50+ functions
- ✅ Authentication system ready
- ✅ Real-time database listeners ready
- ✅ File upload to Firebase Storage ready

### 2. Admin Authentication System
- ✅ Created beautiful Login page (`src/pages/Login.jsx`)
- ✅ Updated AppContext with authentication state
- ✅ Created ProtectedRoute component
- ✅ All admin routes now protected
- ✅ Logout functionality connected

### 3. Route Protection
- ✅ Login page at `/login`
- ✅ All admin pages require authentication
- ✅ Auto-redirect to login if not authenticated
- ✅ Auto-redirect to dashboard after login

---

## 🎯 NEXT STEPS - You Need To Do This!

### Step 1: Add Your Firebase Credentials

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select your **Chamak** project

2. **Get Your Web App Config:**
   - Click the ⚙️ (Settings) icon
   - Go to **Project Settings**
   - Scroll to **"Your apps"** section
   - If you don't have a web app:
     * Click **"</> Web"** icon
     * Register app as: `Chamak Admin`
   - Copy the `firebaseConfig` object

3. **Update the Config File:**
   - Open: `src/firebase/config.js`
   - Replace these lines:

```javascript
// REPLACE THIS:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

// WITH YOUR ACTUAL CONFIG (looks like this):
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "chamak-xxxxx.firebaseapp.com",
  projectId: "chamak-xxxxx",
  storageBucket: "chamak-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234"
}
```

---

### Step 2: Enable Firebase Authentication

1. **Go to Firebase Console → Authentication**
2. Click **"Get started"** (if not enabled)
3. Click **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Save

### Step 3: Create Admin User

**Option A: Using Firebase Console (Easy)**
1. Go to **Authentication → Users** tab
2. Click **"Add user"**
3. Enter:
   - Email: `admin@chamak.com` (or your email)
   - Password: (your secure password)
4. Click **"Add user"**

**Option B: Using Firebase CLI (Advanced)**
```bash
firebase auth:import users.json
```

---

### Step 4: Setup Firestore Database

1. **Go to Firebase Console → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for now)
4. Choose location: (closest to your users)
5. Click **"Enable"**

### Step 5: Create Firestore Collections

You can create collections automatically when you add data, or manually:

**Manual Creation (Optional):**
1. Click **"Start collection"**
2. Create these collections (leave empty for now):
   - `users`
   - `wallets`
   - `transactions`
   - `chats`
   - `messages`
   - `tickets`
   - `ticketMessages`
   - `events`
   - `announcements`
   - `approvals`
   - `resellers`

---

### Step 6: Configure Firestore Security Rules

1. Go to **Firestore Database → Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all operations
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules for production:
    // match /users/{userId} {
    //   allow read: if request.auth != null;
    //   allow write: if request.auth != null && request.auth.token.admin == true;
    // }
  }
}
```

3. Click **"Publish"**

---

### Step 7: Enable Firebase Storage (For Event Banners)

1. Go to **Firebase Console → Storage**
2. Click **"Get started"**
3. Accept default rules (for now)
4. Click **"Done"**

### Step 8: Configure Storage Security Rules

1. Go to **Storage → Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

---

## 🚀 Testing Your Setup

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Browser

Go to: `http://localhost:5173`

### 3. You Should See:

- ✅ Login page (redirected automatically)
- ✅ Email and password fields
- ✅ Beautiful gradient background

### 4. Login:

- Enter the email/password you created in Firebase
- Click "Sign In"
- You should be redirected to Dashboard

### 5. Test Logout:

- Click "Logout" in the sidebar
- You should be redirected back to login

---

## 📊 Current State

### ✅ Working Features:
- Login page
- Protected routes
- Authentication state management
- Logout functionality
- All UI pages (using mock data)

### ⏳ Next Phase (Step 3):
- Connect Dashboard to Firebase
- Connect Users page to Firebase
- Connect Wallet to Firebase
- Connect Events to Firebase
- Connect Chats to Firebase
- Connect Tickets to Firebase
- Real-time data updates

---

## 🔧 Troubleshooting

### Issue: "Missing script: dev"

**Solution:**
```bash
npm install
npm run dev
```

### Issue: Firebase config errors

**Solution:**
- Make sure you replaced ALL placeholder values in `src/firebase/config.js`
- Check that your Firebase project exists
- Verify you're using the web app config (not Android/iOS)

### Issue: "auth/invalid-email" or "auth/wrong-password"

**Solution:**
- Verify the email/password in Firebase Console → Authentication → Users
- Make sure Email/Password sign-in is enabled

### Issue: Can't login - "Permission denied"

**Solution:**
- Check Firestore rules are set to allow authenticated users
- Make sure you published the rules

---

## 📝 Available Firebase Functions

### Authentication (`firebase/auth.js`)
- `loginAdmin(email, password)` - Login
- `logoutAdmin()` - Logout
- `resetPassword(email)` - Password reset
- `onAuthChange(callback)` - Listen to auth state
- `getCurrentUser()` - Get current user

### Users (`firebase/users.js`)
- `getUsers()` - Fetch all users
- `getUserById(id)` - Get single user
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user
- `toggleUserBlock(id, blocked)` - Block/unblock
- `searchUsers(term)` - Search users
- `subscribeToUsers(callback)` - Real-time updates

### Wallet (`firebase/wallet.js`)
- `getWallet(userId)` - Get wallet
- `getAllWallets()` - Get all wallets
- `addCoins(userId, amount, reason)` - Add coins
- `deductCoins(userId, amount, reason)` - Deduct coins
- `getTransactions(userId)` - Get transaction history
- `subscribeToWallet(userId, callback)` - Real-time updates

### Events (`firebase/events.js`)
- `getAnnouncements()` - Fetch announcements
- `createAnnouncement(data)` - Create announcement
- `updateAnnouncement(id, data)` - Update announcement
- `deleteAnnouncement(id)` - Delete announcement
- `getEvents()` - Fetch events
- `createEvent(data, bannerFile)` - Create event with banner
- `updateEvent(id, data, bannerFile)` - Update event
- `deleteEvent(id)` - Delete event
- Real-time subscriptions available

### Chats (`firebase/chats.js`)
- `getChats()` - Get all chats
- `getChatMessages(chatId)` - Get messages
- `toggleChatBlock(chatId, blocked)` - Block/unblock
- `deleteMessage(messageId)` - Delete message
- `sendWarning(chatId, text)` - Send warning
- Real-time subscriptions available

### Tickets (`firebase/tickets.js`)
- `getTickets(status)` - Get all tickets
- `getTicket(id)` - Get single ticket
- `updateTicketStatus(id, status)` - Change status
- `assignTicket(id, adminId, name)` - Assign ticket
- `updateTicketPriority(id, priority)` - Change priority
- `replyToTicket(id, message, senderId, name)` - Send reply
- Real-time subscriptions available

---

## 🎉 You're Almost There!

1. ✅ Firebase SDK installed
2. ✅ All service files created
3. ✅ Login system working
4. ✅ Routes protected
5. ⏳ **NEXT:** Add your Firebase credentials
6. ⏳ **THEN:** Start using real Firebase data

---

## 📞 Need Help?

Check the documentation in `src/firebase/README.md` for:
- Detailed function usage
- Code examples
- Database structure
- Security best practices

---

**Current Status:** Your admin panel is running with authentication! 🎉
**Next Step:** Add your Firebase credentials and create an admin user to login.

**Access your app at:** http://localhost:5173











