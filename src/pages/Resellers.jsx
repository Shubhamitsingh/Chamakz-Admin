import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Search, AlertCircle, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, getDocs, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const Resellers = () => {
  const { user: adminUser, showToast } = useApp()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Fetch reseller chats from Firebase
  useEffect(() => {
    console.log('💬 Loading reseller chats from Firebase...')
    
    // Set up listener for resellerChats collection
    const unsubscribe = onSnapshot(
      collection(db, 'resellerChats'),
      (snapshot) => {
        console.log(`✅ Found ${snapshot.size} reseller chats`)
        
        const chatsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            username: data.userName || data.username || data.name || 'Unknown User',
            userId: data.userId || data.uid || '',
            numericUserId: data.numericUserId || 'N/A',
            resellerName: data.resellerName || data.reseller || 'Reseller',
            resellerId: data.resellerId || '',
            avatar: (data.userName || data.username || 'U').charAt(0).toUpperCase(),
            lastMessage: data.lastMessage || 'No messages yet',
            time: data.lastMessageTime ? new Date(data.lastMessageTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
            unread: data.unreadByAdmin || 0,
            status: data.status || 'active',
            ...data
          }
        }).sort((a, b) => {
          const timeA = a.lastMessageTime
          const timeB = b.lastMessageTime
          if (!timeA) return 1
          if (!timeB) return -1
          return timeB.toDate() - timeA.toDate()
        })
        
        setChats(chatsData)
        setLoading(false)
        
        // Auto-select first chat if available
        if (chatsData.length > 0 && !selectedChat) {
          setSelectedChat(chatsData[0])
        }
      },
      (error) => {
        console.error('Error loading reseller chats:', error)
        setChats([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    console.log('📨 Loading messages for reseller chat:', selectedChat.id)

    const tryMessageCollections = async () => {
      try {
        const messagesRef = collection(db, 'resellerChats', selectedChat.id, 'messages')
        const unsubscribe = onSnapshot(
          query(messagesRef, orderBy('timestamp', 'asc')),
          (snapshot) => {
            const messagesData = snapshot.docs.map(doc => {
              const data = doc.data()
              return {
                id: doc.id,
                text: data.text || data.message || data.content || '',
                sender: data.senderType === 'admin' || data.isAdmin ? 'admin' : 'user',
                senderName: data.senderName || (data.senderType === 'admin' ? 'Admin' : selectedChat.username),
                time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
                ...data
              }
            })
            
            setMessages(messagesData)
            scrollToBottom()
          },
          (error) => {
            console.error('Error fetching messages:', error)
            setMessages([])
          }
        )
        
        return () => unsubscribe()
      } catch (error) {
        console.log('Could not load messages:', error)
        setMessages([])
      }
    }

    tryMessageCollections()
  }, [selectedChat])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return

    setSending(true)
    try {
      // Add message to subcollection
      const messagesRef = collection(db, 'resellerChats', selectedChat.id, 'messages')
      await addDoc(messagesRef, {
        text: message.trim(),
        message: message.trim(),
        content: message.trim(),
        senderType: 'admin',
        isAdmin: true,
        senderId: adminUser?.uid || 'admin',
        senderName: 'Admin',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      // Update last message in chat document
      const chatRef = doc(db, 'resellerChats', selectedChat.id)
      await updateDoc(chatRef, {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageBy: 'admin',
        unreadByUser: true
      })

      console.log('✅ Message sent successfully')
      setMessage('')
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      showToast('Error sending message. Please try again.', 'error')
    }
    setSending(false)
  }

  const filteredChats = chats.filter(chat =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.numericUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.resellerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Reseller Chat</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage coin purchase requests from users ({chats.length} active conversations)
        </p>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-0 overflow-hidden"
        style={{ height: 'calc(100vh - 280px)' }}
      >
        <div className="flex h-full">
          {/* Chat List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users or resellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            </div>

            {/* Chat List Items */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No reseller chats found</p>
                  <p className="text-xs mt-1">Users will appear here when they message resellers</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{chat.username}</p>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                          Reseller: {chat.resellerName}
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold mb-1">
                          ID: {chat.numericUserId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                            {chat.unread} new
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedChat.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{selectedChat.username}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                        Reseller: {selectedChat.resellerName}
                      </p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
                        ID: {selectedChat.numericUserId}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedChat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedChat.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg ${
                              msg.sender === 'admin'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                                : msg.isSystemMessage
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <p className={`text-xs font-semibold mb-1 ${
                              msg.sender === 'admin' ? 'text-white/80' : msg.isSystemMessage ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                            }`}>
                              {msg.senderName}
                            </p>
                            <p className={`text-sm leading-relaxed ${
                              msg.isSystemMessage ? 'text-blue-700 dark:text-blue-300' : ''
                            }`}>{msg.text}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender === 'admin' ? 'text-white/70' : msg.isSystemMessage ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'
                            }`}>
                              {msg.time}
                            </p>
                          </div>
                        </motion.div>
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
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type your reply..."
                      className="flex-1 input-field"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Chat Selected</p>
                  <p className="text-sm">Select a conversation from the list to view and reply</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Resellers
