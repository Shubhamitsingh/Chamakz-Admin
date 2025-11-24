# 🔄 Rename Firebase Collection: withdrawalRequests → payments

## ⚠️ IMPORTANT: You Need to Rename the Collection in Firebase Console

The code has been updated to use the `payments` collection instead of `withdrawalRequests`. 

**You must rename the collection in Firebase Console for the Payment page to work!**

---

## 📋 Step-by-Step Guide:

### Option 1: Manual Rename (Recommended)

#### Step 1: Export Data from `withdrawalRequests`
```
1. Go to Firebase Console
2. Open Firestore Database
3. Click on "withdrawalRequests" collection
4. Select all documents (or export via Firebase CLI)
5. Copy all document data
```

#### Step 2: Create New `payments` Collection
```
1. In Firestore, click "+ Start collection"
2. Collection ID: payments
3. Click "Next"
4. Don't add a document yet, just create the collection
```

#### Step 3: Copy Documents to `payments`
```
1. For each document in withdrawalRequests:
   - Click on the document
   - Copy all fields
   - Go to payments collection
   - Click "+ Add document"
   - Paste the same Document ID (or let Firebase generate new one)
   - Paste all fields
   - Click "Save"
```

#### Step 4: Delete Old Collection (After Testing)
```
1. Make sure payments collection works correctly
2. Test the Payment page in admin panel
3. Once confirmed, delete withdrawalRequests collection
```

---

### Option 2: Using Firebase CLI (Faster)

If you have Firebase CLI installed:

```bash
# 1. Export withdrawalRequests collection
firebase firestore:export --collection-ids withdrawalRequests

# 2. Import to payments collection (modify the export file)
# Change collection name in the export file from withdrawalRequests to payments

# 3. Import back
firebase firestore:import <modified-export-file>
```

---

### Option 3: Quick Migration Script (Node.js)

Create a migration script:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCollection() {
  console.log('🔄 Starting migration...');
  
  // Get all documents from withdrawalRequests
  const oldCollection = await db.collection('withdrawalRequests').get();
  
  console.log(`📦 Found ${oldCollection.size} documents`);
  
  // Copy each document to payments collection
  const batch = db.batch();
  let count = 0;
  
  oldCollection.forEach(doc => {
    const data = doc.data();
    const newRef = db.collection('payments').doc(doc.id);
    batch.set(newRef, data);
    count++;
  });
  
  await batch.commit();
  console.log(`✅ Migrated ${count} documents to payments collection`);
  console.log('⚠️  Now delete withdrawalRequests collection manually');
}

migrateCollection().catch(console.error);
```

---

## ✅ After Migration:

1. **Test the Payment Page:**
   - Go to admin panel
   - Click "Payment" menu
   - ✅ Should show all withdrawal requests

2. **Update Flutter App:**
   - Change `withdrawalRequests` to `payments` in Flutter code
   - Update all collection references

3. **Delete Old Collection:**
   - Once everything works, delete `withdrawalRequests` collection

---

## 🎯 Quick Check:

After renaming, verify:
- ✅ Payment page loads withdrawal requests
- ✅ Can approve payments
- ✅ Can reject payments
- ✅ Payment proof uploads work
- ✅ Flutter app can read from `payments` collection

---

## 📝 Updated Code References:

All code has been updated:
- ✅ `src/pages/Transactions.jsx` → Uses `payments` collection
- ✅ `TRANSACTIONS_GUIDE.md` → Updated Flutter examples
- ✅ All Firebase queries → Now use `payments`

**Just rename the collection in Firebase Console and you're done!** 🚀



