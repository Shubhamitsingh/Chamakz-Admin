# 🔥 Firebase Integration Guide

## Setup Instructions

### 1. Configure Firebase

Open `config.js` and replace the placeholder values with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your **Chamak** project
3. Click the ⚙️ (Settings) icon → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If no web app exists:
   - Click **"Add app"** → Select **Web** icon (</>)
   - Register app with nickname: `Chamak Admin`
6. Copy the `firebaseConfig` object

### 3. Firestore Database Structure

Your Firestore should have these collections:

```
📁 Firestore Collections:
├── users/              - User profiles and data
├── wallets/            - User wallet/coin balances
├── transactions/       - Coin transaction history
├── chats/              - Chat conversations
├── messages/           - Chat messages
├── tickets/            - Support tickets
├── ticketMessages/     - Ticket replies
├── events/             - Events data
├── announcements/      - Announcements
├── approvals/          - Pending account approvals
└── resellers/          - Reseller accounts
```

### 4. Firebase Services Available

#### Authentication (`auth.js`)
- `loginAdmin()` - Admin login
- `logoutAdmin()` - Logout
- `onAuthChange()` - Listen to auth state
- `resetPassword()` - Password reset
- `getCurrentUser()` - Get current user

#### Users Management (`users.js`)
- `getUsers()` - Fetch users with pagination
- `getUserById()` - Get single user
- `searchUsers()` - Search by email/name
- `updateUser()` - Update user data
- `deleteUser()` - Soft delete user
- `toggleUserBlock()` - Block/unblock user
- `subscribeToUsers()` - Real-time updates

#### Wallet & Transactions (`wallet.js`)
- `getWallet()` - Get user wallet
- `getAllWallets()` - Get all wallets
- `addCoins()` - Add coins to wallet
- `deductCoins()` - Deduct coins
- `getTransactions()` - Get transaction history
- `subscribeToWallet()` - Real-time wallet updates

#### Events & Announcements (`events.js`)
- `getAnnouncements()` - Fetch announcements
- `createAnnouncement()` - Create new
- `updateAnnouncement()` - Update existing
- `deleteAnnouncement()` - Delete
- `getEvents()` - Fetch events
- `createEvent()` - Create with banner upload
- `updateEvent()` - Update event
- `deleteEvent()` - Delete event
- `subscribeToAnnouncements()` - Real-time updates
- `subscribeToEvents()` - Real-time updates

#### Chats (`chats.js`)
- `getChats()` - Get all chats
- `getChatMessages()` - Get chat messages
- `toggleChatBlock()` - Block/unblock chat
- `deleteMessage()` - Delete message
- `sendWarning()` - Send warning to chat
- `subscribeToChats()` - Real-time chat updates
- `subscribeToChatMessages()` - Real-time messages

#### Tickets (`tickets.js`)
- `getTickets()` - Get all tickets
- `getTicket()` - Get single ticket
- `updateTicketStatus()` - Change status
- `assignTicket()` - Assign to admin
- `updateTicketPriority()` - Change priority
- `getTicketMessages()` - Get ticket replies
- `replyToTicket()` - Send reply
- `subscribeToTickets()` - Real-time updates
- `subscribeToTicketMessages()` - Real-time replies

## Usage Examples

### Import and Use
```javascript
import { loginAdmin } from '../firebase/auth'
import { getUsers, updateUser } from '../firebase/users'

// Login
const result = await loginAdmin('admin@chamak.com', 'password')

// Get users
const { users } = await getUsers(50)

// Update user
await updateUser('userId123', { blocked: true })
```

### Real-time Subscriptions
```javascript
import { subscribeToChats } from '../firebase/chats'

// Subscribe to real-time chat updates
const unsubscribe = subscribeToChats((chats) => {
  console.log('Chats updated:', chats)
})

// Unsubscribe when component unmounts
unsubscribe()
```

## Next Steps

1. ✅ Configure `config.js` with your Firebase credentials
2. 🔐 Set up Firebase Authentication in Console
3. 📊 Create Firestore collections
4. 🔒 Configure Firestore Security Rules
5. 🎨 Update React components to use Firebase functions

## Security Rules (Important!)

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated admins can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For production, use more specific rules to restrict access by user roles.











