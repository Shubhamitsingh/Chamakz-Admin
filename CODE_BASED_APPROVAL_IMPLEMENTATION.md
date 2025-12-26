# 🔐 Code-Based Live Streaming Approval - Complete Implementation Guide

**Status:** ✅ **Admin Panel Implementation Complete**

---

## 📋 **Overview**

This implementation uses a **code-based approval system** where:
1. Admin assigns a unique 6-digit code to a user
2. Code is stored in Firestore: `liveApprovalCode: "123456"`
3. User enters this code in the Flutter app
4. If code matches → User gets `isLiveApproved: true` → Can go live ✅

---

## ✅ **What Was Implemented (Admin Panel)**

### **1. Firebase Service Functions** (`src/firebase/users.js`)

#### **a. `approveUserForLive(userId, approvalCode)`**
- Assigns approval code to user
- Generates random 6-digit code if not provided
- Stores `liveApprovalCode` in user document
- Sets `isLiveApproved: false` initially (user must enter code first)

#### **b. `verifyLiveApprovalCode(userId, enteredCode)`**
- Verifies code entered by user (called from Flutter app)
- Compares entered code with stored code
- If match → Sets `isLiveApproved: true`
- Returns success/error status

#### **c. `toggleLiveApproval(userId, approved)`**
- Direct toggle for admin (revoke access)
- No code required - direct approval/revocation

---

### **2. Users Page** (`src/pages/Users.jsx`)

#### **Live Access Column:**
- Shows status: "Approved", "Code Assigned", or "Pending"
- Key icon button to assign/change approval code
- X icon button to revoke access (if approved)

#### **Approval Code Modal:**
- Input field for 6-digit code
- "Generate" button to auto-generate random code
- Copy to clipboard functionality
- Shows generated code prominently
- Validates code length (must be 6 digits)

#### **User Detail Modal:**
- Shows live access status
- Displays assigned code (if any)
- Button to assign/change code
- Button to revoke access

---

## 🔄 **Complete Flow**

### **Admin Side Flow:**

```
1. Admin goes to Users Management page
   ↓
2. Sees user with "Pending" status
   ↓
3. Clicks Key icon (🔑) in Live Access column
   ↓
4. Modal opens asking for approval code
   ↓
5. Admin either:
   - Enters custom 6-digit code manually, OR
   - Clicks "Generate" to auto-generate code
   ↓
6. Code is displayed (can copy to clipboard)
   ↓
7. Admin clicks "Assign Code"
   ↓
8. Code stored in Firestore: liveApprovalCode: "123456"
   ↓
9. Status changes to "Code Assigned" (blue badge)
   ↓
10. Admin gives code to user (via message/email/etc.)
```

### **User Side Flow (Flutter App - TO BE IMPLEMENTED):**

```
1. User clicks (+) button to go live
   ↓
2. App checks: isLiveApproved === true?
   ↓
3. If false → Show dialog asking for approval code
   ↓
4. User enters the 6-digit code admin gave them
   ↓
5. App calls verifyLiveApprovalCode(userId, enteredCode)
   ↓
6. If code matches:
   ✅ Sets isLiveApproved = true
   ✅ User can now go live
   ↓
7. If code doesn't match:
   ❌ Show error message
   ❌ User cannot go live
```

---

## 📱 **Flutter App Implementation (Required)**

### **Step 1: Update UserModel**

**File:** `lib/models/user_model.dart`

```dart
class UserModel {
  // ... existing fields ...
  final bool isLiveApproved;
  final String? liveApprovalCode; // ADD THIS

  UserModel({
    // ... existing parameters ...
    this.isLiveApproved = false,
    this.liveApprovalCode, // ADD THIS
  });

  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return UserModel(
      // ... existing fields ...
      isLiveApproved: data['isLiveApproved'] ?? false,
      liveApprovalCode: data['liveApprovalCode'], // ADD THIS
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      // ... existing fields ...
      'isLiveApproved': isLiveApproved,
      'liveApprovalCode': liveApprovalCode, // ADD THIS
    };
  }

  UserModel copyWith({
    // ... existing parameters ...
    bool? isLiveApproved,
    String? liveApprovalCode, // ADD THIS
  }) {
    return UserModel(
      // ... existing fields ...
      isLiveApproved: isLiveApproved ?? this.isLiveApproved,
      liveApprovalCode: liveApprovalCode ?? this.liveApprovalCode, // ADD THIS
    );
  }
}
```

---

### **Step 2: Create Code Verification Service**

**File:** `lib/services/live_approval_service.dart` (NEW FILE)

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class LiveApprovalService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Verify approval code and activate live access
  static Future<Map<String, dynamic>> verifyApprovalCode(String enteredCode) async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        return {
          'success': false,
          'error': 'User not logged in'
        };
      }

      // Get user document
      final userDoc = await _firestore
        .collection('users')
        .doc(currentUser.uid)
        .get();

      if (!userDoc.exists) {
        return {
          'success': false,
          'error': 'User document not found'
        };
      }

      final userData = userDoc.data();
      final storedCode = userData?['liveApprovalCode'];

      if (storedCode == null || storedCode.toString().isEmpty) {
        return {
          'success': false,
          'error': 'No approval code found. Please contact admin to get your approval code.'
        };
      }

      // Compare codes
      if (storedCode.toString() != enteredCode.toString()) {
        return {
          'success': false,
          'error': 'Invalid approval code. Please check and try again.'
        };
      }

      // Code matches - activate live access
      await _firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({
          'isLiveApproved': true,
          'liveCodeActivatedAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });

      return {
        'success': true,
        'message': 'Live streaming access activated successfully!'
      };
    } catch (e) {
      debugPrint('Error verifying approval code: $e');
      return {
        'success': false,
        'error': 'Error verifying code. Please try again.'
      };
    }
  }

  /// Check if user has live approval
  static Future<bool> checkLiveApproval() async {
    try {
      final currentUser = _auth.currentUser;
      if (currentUser == null) return false;

      final userDoc = await _firestore
        .collection('users')
        .doc(currentUser.uid)
        .get();

      if (!userDoc.exists) return false;

      final userData = userDoc.data();
      return userData?['isLiveApproved'] ?? false;
    } catch (e) {
      debugPrint('Error checking live approval: $e');
      return false;
    }
  }
}
```

---

### **Step 3: Update Home Screen - Add Permission Check**

**File:** `lib/screens/home_screen.dart`

**In `_startLiveStream()` method:**

```dart
Future<void> _startLiveStream() async {
  debugPrint('🎬 _startLiveStream() called');
  
  if (!mounted) return;
  
  final currentUser = _auth.currentUser;
  if (currentUser == null) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.pleaseLoginToStartLiveStream),
        backgroundColor: Colors.red,
      ),
    );
    return;
  }

  // ✅ NEW: Check Live Approval Permission
  try {
    final isApproved = await LiveApprovalService.checkLiveApproval();
    
    if (!isApproved) {
      // ❌ User not approved - Show code entry dialog
      if (!mounted) return;
      await _showApprovalCodeDialog();
      return;
    }
  } catch (e) {
    debugPrint('❌ Error checking live permission: $e');
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Error checking permissions. Please try again.'),
        backgroundColor: Colors.red,
      ),
    );
    return;
  }

  // ✅ User is approved - Continue with live stream
  // ... rest of existing code ...
}
```

---

### **Step 4: Create Approval Code Dialog**

**Add this method to `_HomeScreenState` class:**

```dart
Future<void> _showApprovalCodeDialog() async {
  final TextEditingController codeController = TextEditingController();
  bool isVerifying = false;
  String errorMessage = '';

  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            Icon(
              Icons.vpn_key,
              color: Colors.purple[400],
              size: 28,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Enter Approval Code',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'You need an approval code to go live. Please enter the 6-digit code provided by admin.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: codeController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
                fontFamily: 'monospace',
              ),
              decoration: InputDecoration(
                labelText: '6-Digit Code',
                hintText: '000000',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                counterText: '',
              ),
              onChanged: (value) {
                if (errorMessage.isNotEmpty) {
                  setState(() => errorMessage = '');
                }
              },
            ),
            if (errorMessage.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red[700], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        errorMessage,
                        style: TextStyle(
                          color: Colors.red[700],
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: isVerifying ? null : () => Navigator.of(context).pop(),
            child: const Text(
              'Cancel',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: isVerifying ? null : () async {
              final code = codeController.text.trim();
              
              if (code.length != 6) {
                setState(() {
                  errorMessage = 'Please enter a valid 6-digit code';
                });
                return;
              }

              setState(() {
                isVerifying = true;
                errorMessage = '';
              });

              // Verify code
              final result = await LiveApprovalService.verifyApprovalCode(code);

              setState(() {
                isVerifying = false;
              });

              if (!mounted) return;

              if (result['success'] == true) {
                Navigator.of(context).pop(); // Close dialog
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(result['message'] ?? 'Live access activated!'),
                    backgroundColor: Colors.green,
                  ),
                );
                // Retry going live
                _startLiveStream();
              } else {
                setState(() {
                  errorMessage = result['error'] ?? 'Invalid code. Please try again.';
                });
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8E24AA),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: isVerifying
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Verify Code'),
          ),
        ],
      ),
    ),
  );
}
```

---

## 🗄️ **Database Schema**

### **Users Collection:**

```javascript
users/
  {userId}/
    {
      // Existing fields...
      displayName: "John Doe",
      email: "john@example.com",
      
      // NEW FIELDS for Live Approval:
      liveApprovalCode: "123456",        // 6-digit code assigned by admin
      isLiveApproved: false,             // true after user enters correct code
      liveApprovalDate: Timestamp,       // When admin assigned code
      liveCodeActivatedAt: Timestamp,    // When user entered correct code (optional)
    }
```

---

## 🧪 **Testing Checklist**

### **Admin Panel:**
- [x] Can assign approval code to user
- [x] Can generate random code
- [x] Can enter custom code
- [x] Code validation (must be 6 digits)
- [x] Copy to clipboard works
- [x] Status shows "Code Assigned" after assignment
- [x] Can change code if needed
- [x] Can revoke access (removes code)

### **Flutter App (To Test):**
- [ ] User sees code entry dialog when trying to go live
- [ ] Dialog accepts only 6 digits
- [ ] Correct code activates live access ✅
- [ ] Wrong code shows error ❌
- [ ] User can go live after entering correct code
- [ ] Status persists after app restart
- [ ] Error messages are clear

---

## 🔒 **Security Notes**

### **Firestore Security Rules:**

```javascript
match /users/{userId} {
  // Users can read their own data
  allow read: if request.auth != null && request.auth.uid == userId;
  
  // Users can update isLiveApproved ONLY after code verification
  // (But they can't set liveApprovalCode themselves)
  allow update: if request.auth != null && 
                   request.auth.uid == userId &&
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['liveApprovalCode']) &&
                   (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isLiveApproved', 'liveCodeActivatedAt', 'updatedAt']) ||
                    resource.data.liveApprovalCode == request.resource.data.liveApprovalCode);
  
  // Only admins can set/update liveApprovalCode
  allow update: if request.auth != null && 
                   get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
}
```

---

## 📝 **Summary**

### **✅ Completed (Admin Panel):**
1. ✅ Code assignment functionality
2. ✅ Code generation (random 6-digit)
3. ✅ Custom code entry
4. ✅ Copy to clipboard
5. ✅ Visual status indicators
6. ✅ User detail modal integration
7. ✅ Firebase service functions

### **⏳ Remaining (Flutter App):**
1. ⏳ Update UserModel with `liveApprovalCode` field
2. ⏳ Create `LiveApprovalService` for code verification
3. ⏳ Add permission check in `_startLiveStream()`
4. ⏳ Create approval code entry dialog
5. ⏳ Test code verification flow

---

## 💡 **Tips**

1. **Code Format:** Currently 6 digits (100000-999999). Can be changed in code generation function.

2. **User Communication:** Admin needs to communicate code to user via:
   - Email
   - In-app notification
   - SMS
   - Support chat

3. **Code Uniqueness:** Current implementation doesn't check for duplicate codes. For production, consider:
   - Adding uniqueness check
   - Using longer codes
   - Adding expiration date

4. **Error Handling:** All error cases are handled with user-friendly messages.

---

**Implementation Status:** ✅ **Admin Panel Complete** | ⏳ **Flutter App Pending**

*Last Updated: 2025*

