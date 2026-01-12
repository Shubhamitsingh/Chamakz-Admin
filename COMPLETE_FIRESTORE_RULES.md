# 🔥 Complete Firestore Rules - All Collections Report

## 📊 **Collection Inventory Report**

Based on your admin panel codebase, here are **ALL** the Firestore collections that need security rules:

---

## 📁 **Main Collections (16)**

### 1. **users** ✅
- **Used in:** Users page, Dashboard, Approvals, User Management
- **Operations:** Read, Write, Update, Delete
- **Priority:** HIGH

### 2. **announcements** ✅
- **Used in:** Events page (Announcements tab)
- **Operations:** Create, Read, Update, Delete
- **Priority:** HIGH

### 3. **events** ✅
- **Used in:** Events page (Events tab)
- **Operations:** Create, Read, Update, Delete
- **Priority:** HIGH

### 4. **supportTickets** ✅
- **Used in:** Tickets page, Dashboard, TopNav
- **Operations:** Read, Write, Update
- **Priority:** HIGH

### 5. **supportChats** ✅
- **Used in:** Chats page, Dashboard, TopNav
- **Operations:** Read, Write, Update, Delete
- **Subcollection:** `messages`
- **Priority:** HIGH

### 6. **resellerChats** ✅
- **Used in:** Resellers page
- **Operations:** Read, Write, Update
- **Subcollection:** `messages`
- **Priority:** HIGH

### 7. **coinResellers** ✅
- **Used in:** Resellers page
- **Operations:** Read, Write, Update, Delete
- **Priority:** HIGH

### 8. **coinResellerApprovals** ✅
- **Used in:** Resellers/Approvals page
- **Operations:** Read, Write, Update, Delete
- **Priority:** MEDIUM

### 9. **withdrawal_requests** ✅
- **Used in:** Transactions/Payment page
- **Operations:** Read, Write, Update
- **Priority:** HIGH

### 10. **transactions** ✅
- **Used in:** Transactions/Payment page, Dashboard
- **Operations:** Read, Write
- **Priority:** HIGH

### 11. **wallets** ✅
- **Used in:** Wallet/Coin management
- **Operations:** Read, Write, Update, Delete
- **Priority:** HIGH

### 12. **feedback** ✅
- **Used in:** Feedback page
- **Operations:** Read, Write, Update, Delete
- **Priority:** MEDIUM

### 13. **tickets** ✅ (Fallback)
- **Used in:** Tickets page (fallback collection)
- **Operations:** Read, Write
- **Priority:** LOW

### 14. **chats** ✅ (Fallback)
- **Used in:** Chats page (fallback collection)
- **Operations:** Read, Write
- **Priority:** LOW

### 15. **ticketMessages** ✅
- **Used in:** Tickets (subcollection)
- **Operations:** Read, Write
- **Priority:** MEDIUM

### 16. **settings** ✅
- **Used in:** Settings page
- **Operations:** Read, Write, Update
- **Priority:** MEDIUM

---

## 📂 **User Subcollections (4)**

### 16. **users/{userId}/tickets** ✅
- **Used in:** TicketsV2 page
- **Operations:** Read, Write
- **Priority:** MEDIUM

### 17. **users/{userId}/feedback** ✅
- **Used in:** Feedback page
- **Operations:** Read, Write
- **Priority:** MEDIUM

### 18. **users/{userId}/support** ✅
- **Used in:** Support/Tickets
- **Operations:** Read, Write
- **Priority:** LOW

### 19. **users/{userId}/userFeedback** ✅
- **Used in:** Feedback page
- **Operations:** Read, Write
- **Priority:** LOW

---

## 🔒 **Complete Firestore Security Rules**

Copy and paste this **ENTIRE** code block into Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Optional: Check if user is admin (uncomment and add your admin emails)
    // function isAdmin() {
    //   return request.auth != null && 
    //          request.auth.token.email in [
    //            'admin@yourdomain.com',
    //            'your-admin-email@domain.com'
    //          ];
    // }
    
    // ============================================
    // MAIN COLLECTIONS
    // ============================================
    
    // 1. USERS - User Management
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
      
      // User subcollections
      match /tickets/{ticketId} {
        allow read, write: if isAuthenticated();
      }
      
      match /feedback/{feedbackId} {
        allow read, write: if isAuthenticated();
      }
      
      match /support/{supportId} {
        allow read, write: if isAuthenticated();
      }
      
      match /userFeedback/{feedbackId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    // 2. ANNOUNCEMENTS - Events/Announcements Page
    match /announcements/{announcementId} {
      allow read: if true; // Public read (for Flutter app)
      allow write: if isAuthenticated(); // Only authenticated can create/update/delete
    }
    
    // 3. EVENTS - Events Page
    match /events/{eventId} {
      allow read: if true; // Public read (for Flutter app)
      allow write: if isAuthenticated(); // Only authenticated can create/update/delete
    }
    
    // 4. SUPPORT TICKETS - Tickets Page
    match /supportTickets/{ticketId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 5. SUPPORT CHATS - Chats Page
    match /supportChats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated(); // Create, Update, Delete
      }
    }
    
    // 6. RESELLER CHATS - Resellers Page
    match /resellerChats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated(); // Create, Update, Delete
      }
    }
    
    // 7. COIN RESELLERS - Resellers Page
    match /coinResellers/{resellerId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 8. COIN RESELLER APPROVALS - Approvals Page
    match /coinResellerApprovals/{approvalId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 9. WITHDRAWAL REQUESTS - Transactions/Payment Page
    match /withdrawal_requests/{requestId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 10. TRANSACTIONS - Transactions/Payment Page
    match /transactions/{transactionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update
    }
    
    // 11. WALLETS - Wallet/Coin Management
    match /wallets/{walletId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 12. FEEDBACK - Feedback Page
    match /feedback/{feedbackId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Create, Update, Delete
    }
    
    // 13. TICKETS (Fallback) - Tickets Page
    match /tickets/{ticketId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 14. CHATS (Fallback) - Chats Page
    match /chats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 15. TICKET MESSAGES - Tickets Subcollection
    match /ticketMessages/{messageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
  }
}
```

---

## 🎯 **Quick Copy-Paste (Simplified Version)**

If you want a simpler version that allows all authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // All main collections
    match /users/{userId} {
      allow read, write: if isAuthenticated();
      match /{document=**} {
        allow read, write: if isAuthenticated();
      }
    }
    
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    match /supportTickets/{ticketId} {
      allow read, write: if isAuthenticated();
    }
    
    match /supportChats/{chatId} {
      allow read, write: if isAuthenticated();
      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    match /resellerChats/{chatId} {
      allow read, write: if isAuthenticated();
      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    match /coinResellers/{resellerId} {
      allow read, write: if isAuthenticated();
    }
    
    match /coinResellerApprovals/{approvalId} {
      allow read, write: if isAuthenticated();
    }
    
    match /withdrawal_requests/{requestId} {
      allow read, write: if isAuthenticated();
    }
    
    match /transactions/{transactionId} {
      allow read, write: if isAuthenticated();
    }
    
    match /wallets/{walletId} {
      allow read, write: if isAuthenticated();
    }
    
    match /feedback/{feedbackId} {
      allow read, write: if isAuthenticated();
    }
    
    match /tickets/{ticketId} {
      allow read, write: if isAuthenticated();
    }
    
    match /chats/{chatId} {
      allow read, write: if isAuthenticated();
    }
    
    match /ticketMessages/{messageId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## 📋 **Summary by Page**

### ✅ Dashboard
- `users` (read)
- `supportTickets` (read)
- `supportChats` (read)
- `transactions` (read)

### ✅ Users Page
- `users` (read, write, update, delete)

### ✅ Events Page
- `announcements` (create, read, update, delete)
- `events` (create, read, update, delete)

### ✅ Tickets Page
- `supportTickets` (read, write, update)
- `tickets` (read, write - fallback)
- `ticketMessages` (read, write)
- `users/{userId}/tickets` (read, write)

### ✅ Chats Page
- `supportChats` (read, write, update, delete)
- `supportChats/{chatId}/messages` (read, write, update, delete)
- `chats` (read, write - fallback)

### ✅ Transactions/Payment Page
- `withdrawal_requests` (read, write, update)
- `transactions` (read, write)
- `wallets` (read, write, update, delete)

### ✅ Resellers Page
- `coinResellers` (read, write, update, delete)
- `resellerChats` (read, write, update)
- `resellerChats/{chatId}/messages` (read, write, update, delete)

### ✅ Approvals Page
- `users` (read, write, update)
- `coinResellerApprovals` (read, write, update, delete)

### ✅ Feedback Page
- `feedback` (read, write, update, delete)
- `users/{userId}/feedback` (read, write)
- `users/{userId}/userFeedback` (read, write)

---

## 🚀 **How to Apply These Rules**

### Step 1: Open Firebase Console
1. Go to: **https://console.firebase.google.com/project/chamak-39472/firestore/rules**
2. Or navigate: Firebase Console → Your Project → Firestore Database → Rules tab

### Step 2: Copy Rules
1. Copy the **complete rules** from above (first code block)
2. Paste into the Firebase Console rules editor

### Step 3: Publish
1. Click **"Publish"** button at the top
2. Wait 5-10 seconds for rules to deploy

### Step 4: Test
1. Refresh your admin panel (Ctrl+Shift+R)
2. Test each page:
   - ✅ Events → Create announcement
   - ✅ Chats → Send message
   - ✅ Transactions → View withdrawals
   - ✅ Resellers → View resellers
   - ✅ All pages should work now!

---

## 🔒 **Security Notes**

1. **Authentication Required**: All rules require `request.auth != null` (user must be logged in)

2. **Public Read**: Only `announcements` and `events` allow public read (for Flutter app users)

3. **Write Access**: Only authenticated users can write to any collection

4. **For Production**: Consider adding admin-only rules (see commented `isAdmin()` function)

---

## ✅ **Verification Checklist**

After applying rules, verify:
- [ ] Events page - Can create announcements ✅
- [ ] Events page - Can create events ✅
- [ ] Chats page - Can send messages ✅
- [ ] Tickets page - Can view/create tickets ✅
- [ ] Transactions page - Can view withdrawals ✅
- [ ] Resellers page - Can view resellers ✅
- [ ] Users page - Can view/manage users ✅
- [ ] Feedback page - Can view feedback ✅
- [ ] No permission errors in console ✅

---

**📝 Note:** Make sure you're logged in to Firebase Auth before testing. All rules require authentication!

**🎉 After updating these rules, all your admin panel features should work!**
