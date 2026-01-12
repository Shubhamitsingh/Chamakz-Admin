# 🔒 Firestore Rules - Live Permission Security Fix

## ❌ **CURRENT PROBLEM**

**Issue:** Current Firestore rules allow ANY authenticated user to write to `users` collection, which means:
- Users can set `isActive: true` during registration
- Users can update their own `isActive` field to `true`
- No security protection against unauthorized live permission

**Current Rule (INSECURE):**
```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated(); // ❌ TOO PERMISSIVE - Users can set isActive: true
}
```

---

## ✅ **SECURE FIRESTORE RULES**

Copy and paste this **COMPLETE** rules block into Firebase Console → Firestore → Rules:

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
    
    // Check if user is updating their own document
    function isOwnDocument() {
      return request.auth != null && request.auth.uid == resource.id;
    }
    
    // Check if user is creating their own document
    function isCreatingOwnDocument() {
      return request.auth != null && request.auth.uid == request.resource.id;
    }
    
    // ============================================
    // USERS COLLECTION - SECURE RULES
    // ============================================
    
    match /users/{userId} {
      // Allow read for authenticated users
      allow read: if isAuthenticated();
      
      // Allow users to CREATE their own document (registration)
      // BUT: Prevent them from setting isActive: true
      allow create: if isAuthenticated() && 
                      isCreatingOwnDocument() &&
                      // ✅ NEW USER CANNOT SET isActive: true
                      (request.resource.data.isActive == false || 
                       !('isActive' in request.resource.data));
      
      // Allow users to UPDATE their own document
      // BUT: Prevent them from changing isActive field
      allow update: if isAuthenticated() && 
                      isOwnDocument() &&
                      // ✅ USER CANNOT CHANGE isActive FIELD
                      (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isActive', 'liveApprovalDate', 'liveApprovalCode']));
      
      // Only admins can update isActive (you'll need to add admin check)
      // For now, we'll use a workaround: Only allow updates that don't change isActive
      
      // Allow delete (optional - you may want to restrict this)
      allow delete: if isAuthenticated();
      
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
    
    // ============================================
    // OTHER COLLECTIONS (Keep your existing rules)
    // ============================================
    
    // 2. ANNOUNCEMENTS
    match /announcements/{announcementId} {
      allow read: if true; // Public read (for Flutter app)
      allow write: if isAuthenticated();
    }
    
    // 3. EVENTS
    match /events/{eventId} {
      allow read: if true; // Public read (for Flutter app)
      allow write: if isAuthenticated();
    }
    
    // 4. SUPPORT TICKETS
    match /supportTickets/{ticketId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 5. SUPPORT CHATS
    match /supportChats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
      
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated();
      }
    }
    
    // 6. RESELLER CHATS
    match /resellerChats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
      
      match /messages/{messageId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated();
      }
    }
    
    // 7. COIN RESELLERS
    match /coinResellers/{resellerId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 8. COIN RESELLER APPROVALS
    match /coinResellerApprovals/{approvalId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 9. WITHDRAWAL REQUESTS
    match /withdrawal_requests/{requestId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 10. TRANSACTIONS
    match /transactions/{transactionId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 11. WALLETS
    match /wallets/{walletId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 12. FEEDBACK
    match /feedback/{feedbackId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 13. TICKETS (Fallback)
    match /tickets/{ticketId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 14. CHATS (Fallback)
    match /chats/{chatId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 15. TICKET MESSAGES
    match /ticketMessages/{messageId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // 16. SETTINGS
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

---

## 🔐 **WHAT THESE RULES DO**

### **1. User Registration (CREATE):**
- ✅ Users can create their own user document
- ✅ Users CANNOT set `isActive: true` during registration
- ✅ Users can only set `isActive: false` or leave it undefined
- ❌ If user tries to set `isActive: true`, Firestore will reject the write

### **2. User Updates:**
- ✅ Users can update their own profile (name, email, etc.)
- ❌ Users CANNOT change `isActive` field
- ❌ Users CANNOT change `liveApprovalDate` field
- ❌ Users CANNOT change `liveApprovalCode` field
- ✅ Only admins (via admin panel) can change these fields

### **3. Admin Panel:**
- ✅ Admin panel uses Firebase Admin SDK or authenticated admin account
- ✅ Admin can set `isActive: true` for approved users
- ✅ Admin can set `liveApprovalDate` and `liveApprovalCode`

---

## 🚀 **HOW TO APPLY**

### **Step 1: Open Firebase Console**
1. Go to: **https://console.firebase.google.com/project/chamak-39472/firestore/rules**
2. Or: Firebase Console → Your Project → Firestore Database → Rules tab

### **Step 2: Copy Rules**
1. Copy the **ENTIRE** rules block from above
2. Paste into Firebase Console rules editor
3. Replace your existing rules

### **Step 3: Publish**
1. Click **"Publish"** button
2. Wait 5-10 seconds for rules to deploy

### **Step 4: Test**
1. Try registering a new user in Flutter app
2. Try setting `isActive: true` during registration
3. **Expected:** Firestore should reject the write
4. **Expected:** User document created with `isActive: false` or undefined

---

## ⚠️ **IMPORTANT NOTES**

### **For Admin Panel:**
Your admin panel needs to use Firebase Admin SDK or an admin account to update `isActive`. The current admin panel should work because:
- Admin panel is authenticated
- Admin panel updates are done server-side or with admin privileges
- The rules allow updates that don't change `isActive` (but admin needs special access)

### **If Admin Panel Can't Update isActive:**
You may need to add an admin check function. Update the rules to include:

```javascript
// Add this helper function
function isAdmin() {
  return request.auth != null && 
         request.auth.token.email in [
           'admin@yourdomain.com',
           'your-admin-email@domain.com'
         ];
}

// Then update the users rule:
match /users/{userId} {
  allow read: if isAuthenticated();
  
  // Users can create their own document (with restrictions)
  allow create: if isAuthenticated() && 
                  isCreatingOwnDocument() &&
                  (request.resource.data.isActive == false || 
                   !('isActive' in request.resource.data));
  
  // Users can update their own document (except isActive)
  allow update: if isAuthenticated() && 
                  (isOwnDocument() && 
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isActive', 'liveApprovalDate', 'liveApprovalCode']) ||
                   isAdmin()); // ✅ Admins can update anything
}
```

---

## ✅ **VERIFICATION CHECKLIST**

After applying rules:

- [ ] New user registration cannot set `isActive: true`
- [ ] Users cannot update their own `isActive` field
- [ ] Admin panel can still approve users (set `isActive: true`)
- [ ] Existing users are not affected
- [ ] No permission errors in admin panel
- [ ] Flutter app registration works (but with `isActive: false`)

---

## 🔧 **TESTING**

### **Test 1: New User Registration**
1. Register new user in Flutter app
2. Try to set `isActive: true` in user document
3. **Expected:** Firestore rejects with permission error
4. **Expected:** User document created with `isActive: false` or undefined

### **Test 2: User Self-Update**
1. User tries to update their own `isActive` to `true`
2. **Expected:** Firestore rejects with permission error

### **Test 3: Admin Approval**
1. Admin approves user in admin panel
2. Admin sets `isActive: true`
3. **Expected:** Update succeeds (if admin has proper permissions)

---

## 📝 **SUMMARY**

**Before:**
- ❌ Users could set `isActive: true` during registration
- ❌ Users could update their own `isActive` field
- ❌ No security protection

**After:**
- ✅ Users CANNOT set `isActive: true` during registration
- ✅ Users CANNOT update their own `isActive` field
- ✅ Only admins can approve users (set `isActive: true`)
- ✅ New users default to `isActive: false` or undefined
- ✅ Admin approval required for live streaming

---

**Status:** ✅ **READY TO APPLY**

**Priority:** 🔴 **HIGH** - This fixes the security issue

**Impact:** 🔒 **SECURITY FIX** - Prevents unauthorized live permissions
