# 🔐 Firebase Storage Security Rules Setup

## ⚠️ Error Fix: Storage Permission Denied

If you're getting the error:
```
Firebase Storage: User does not have permission to access 'admin_avatars/...'
```

You need to update your Firebase Storage security rules.

---

## 📋 Step-by-Step Instructions

### Option 1: Update via Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **chamak-39472**

2. **Navigate to Storage**
   - Click on **"Storage"** in the left sidebar
   - Click on the **"Rules"** tab

3. **Update the Rules**
   - Copy and paste the following rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload admin avatars
    match /admin_avatars/{userId}/{allPaths=**} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      // Allow write (upload/delete) only for the authenticated user matching the userId in path
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload payment proofs
    match /payment_proofs/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to upload other admin files
    match /admin_files/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Publish the Rules**
   - Click **"Publish"** button
   - Wait for confirmation

---

### Option 2: Update via Firebase CLI

1. **Install Firebase CLI** (if not installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init storage
   ```

4. **Deploy Rules**
   ```bash
   firebase deploy --only storage
   ```

---

## ✅ What These Rules Do

1. **Admin Avatars** (`/admin_avatars/{userId}/...`)
   - ✅ Authenticated users can read any avatar
   - ✅ Users can only upload/delete their own avatars (matching their UID)

2. **Payment Proofs** (`/payment_proofs/...`)
   - ✅ Authenticated admins can read/write payment proof images

3. **Admin Files** (`/admin_files/...`)
   - ✅ Authenticated admins can read/write admin files

4. **Default**
   - ❌ All other paths are denied for security

---

## 🔒 Security Notes

- ✅ Only authenticated users can access these folders
- ✅ Users can only modify their own avatars
- ✅ All other storage paths are protected
- ✅ Rules are versioned (rules_version = '2')

---

## 🧪 Testing

After updating the rules:

1. Try uploading an avatar again
2. Check browser console for any errors
3. Verify the image appears in your profile

---

## 📞 Need Help?

If you still get permission errors:
1. Check that you're logged in as an admin
2. Verify the Firebase project is correct
3. Make sure rules were published successfully
4. Check browser console for detailed error messages

---

**Last Updated:** 2025-01-26



