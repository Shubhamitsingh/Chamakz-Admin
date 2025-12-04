# 💬 Chat System Implementation Guide

This guide explains how to implement the support chat system in your user app so users can chat with admin from the user app.

## 📋 Overview

The chat system uses Firebase Firestore with the following structure:
- **Collection**: `supportChats`
- **Subcollection**: `supportChats/{chatId}/messages`
- **Real-time updates**: Using Firebase `onSnapshot`

## 🏗️ Firebase Structure

```
supportChats/
  {chatId}/
    - userId: "user123"
    - numericUserId: "780297153945425"
    - userName: "John Doe"
    - email: "john@example.com"
    - status: "active"
    - lastMessage: "Hello admin"
    - lastMessageTime: Timestamp
    - lastMessageBy: "user" | "admin"
    - unreadByAdmin: 0
    - unreadByUser: 0
    - createdAt: Timestamp
    - updatedAt: Timestamp
    messages/
      {messageId}/
        - text: "Hello admin"
        - senderType: "user" | "admin"
        - isAdmin: false | true
        - senderId: "user123"
        - senderName: "John Doe"
        - timestamp: Timestamp
        - createdAt: Timestamp
```

## 📱 User App Implementation

### Step 1: Install Dependencies

Make sure you have Firebase installed in your user app:

```bash
npm install firebase
```

### Step 2: Copy Firebase Helper File

Copy the `src/firebase/supportChat.js` file to your user app's Firebase folder.

### Step 3: Initialize Firebase

```javascript
// firebase/config.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  // Your Firebase config
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

### Step 4: Create Chat Component

```javascript
// components/SupportChat.jsx
import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import {
  createOrGetSupportChat,
  sendUserMessage,
  subscribeToUserChatMessages,
  markMessagesAsReadByUser
} from '../firebase/supportChat'
import { useAuth } from '../context/AuthContext' // Your auth context

const SupportChat = () => {
  const { user } = useAuth() // Get current user
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return

      try {
        const result = await createOrGetSupportChat({
          userId: user.uid,
          numericUserId: user.numericUserId || 'N/A',
          name: user.displayName || user.name || 'User',
          email: user.email || ''
        })

        if (result.success) {
          setChatId(result.chatId)
          setLoading(false)
        } else {
          console.error('Error initializing chat:', result.error)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        setLoading(false)
      }
    }

    initializeChat()
  }, [user])

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return

    const unsubscribe = subscribeToUserChatMessages(chatId, (messagesData) => {
      setMessages(messagesData)
      scrollToBottom()
      
      // Mark messages as read when user views them
      markMessagesAsReadByUser(chatId)
    })

    return () => unsubscribe()
  }, [chatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || sending) return

    setSending(true)
    try {
      const result = await sendUserMessage(chatId, message, {
        userId: user.uid,
        name: user.displayName || user.name || 'User'
      })

      if (result.success) {
        setMessage('')
        scrollToBottom()
      } else {
        alert('Error sending message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message. Please try again.')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Support Chat</h3>
            <p className="text-sm text-white/80">Chat with our support team</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation with our support team!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-lg ${
                    msg.sender === 'admin'
                      ? 'bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1 ${
                    msg.sender === 'admin' ? 'text-gray-500' : 'text-white/80'
                  }`}>
                    {msg.senderName}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'admin' ? 'text-gray-400' : 'text-white/70'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

export default SupportChat
```

### Step 5: Add to Your App

```javascript
// App.jsx or your main component
import SupportChat from './components/SupportChat'

function App() {
  return (
    <div>
      {/* Your app content */}
      <SupportChat />
    </div>
  )
}
```

## 🔧 Key Functions

### `createOrGetSupportChat(userData)`
Creates a new support chat or returns existing one for the user.

**Parameters:**
- `userData`: Object with `userId`, `numericUserId`, `name`, `email`

**Returns:**
```javascript
{
  success: true,
  chatId: "chat123",
  isNew: true/false,
  chat: { /* chat data */ }
}
```

### `sendUserMessage(chatId, messageText, userData)`
Sends a message from user to admin.

**Parameters:**
- `chatId`: Chat document ID
- `messageText`: Message content
- `userData`: Object with `userId`, `name`

### `subscribeToUserChatMessages(chatId, callback)`
Subscribes to real-time message updates.

**Parameters:**
- `chatId`: Chat document ID
- `callback`: Function that receives messages array

**Returns:** Unsubscribe function

### `markMessagesAsReadByUser(chatId)`
Marks all messages as read by the user.

## 📊 Admin Dashboard

The admin dashboard already has the chat system implemented in `src/pages/Chats.jsx`. Admins can:
- View all support chats
- See unread message counts
- Send replies to users
- View chat history

## 🎨 Styling Tips

- Use Tailwind CSS classes (as shown in example)
- Make messages visually distinct (admin vs user)
- Add loading states
- Show typing indicators (optional)
- Add message timestamps
- Show read/unread status

## 🔔 Push Notifications (Optional)

You can add push notifications when admin sends a message:

```javascript
// In your user app
useEffect(() => {
  if (!chatId) return

  const unsubscribe = subscribeToUserSupportChat(user.uid, (chat) => {
    if (chat && chat.unreadByUser > 0) {
      // Show notification
      showNotification('New message from admin!')
    }
  })

  return () => unsubscribe()
}, [chatId, user])
```

## ✅ Testing Checklist

- [ ] User can create/access support chat
- [ ] User can send messages
- [ ] Admin receives messages in real-time
- [ ] Admin can reply to user
- [ ] User receives admin replies in real-time
- [ ] Unread counts work correctly
- [ ] Messages persist after refresh
- [ ] Multiple users can chat simultaneously
- [ ] Chat works offline (with Firebase offline persistence)

## 🐛 Troubleshooting

### Messages not appearing
- Check Firebase rules allow read/write
- Verify chatId is correct
- Check console for errors

### Real-time updates not working
- Ensure `onSnapshot` is properly set up
- Check Firebase connection
- Verify collection/subcollection paths

### Permission errors
- Update Firebase Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /supportChats/{chatId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## 📝 Notes

- Each user has one support chat (reused if exists)
- Messages are stored in subcollection for better organization
- Real-time updates work automatically with Firebase
- Admin dashboard already handles admin-side chat

## 🚀 Next Steps

1. Copy `supportChat.js` to your user app
2. Create the SupportChat component
3. Add it to your app navigation
4. Test with admin dashboard
5. Add push notifications (optional)
6. Add typing indicators (optional)
7. Add file/image sharing (optional)





