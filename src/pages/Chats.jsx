import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, Ban, AlertCircle, CheckCircle, Filter, X, ChevronDown, User, Calendar, Clock, ChevronRight, Info, MessageSquare } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Loader from '../components/Loader'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const Chats = () => {
  const { user: adminUser, showToast } = useApp()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [chatFilter, setChatFilter] = useState('all') // 'all', 'unread', 'active', 'closed'
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Helper functions for date formatting
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear()
  }

  const isYesterday = (date) => {
    if (!date) return false
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return isSameDay(date, yesterday)
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(d, today)) return 'Today'
    if (isSameDay(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Group messages by date and sender
  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return []
    
    const grouped = []
    let currentGroup = null
    let lastDate = null

    messages.forEach((msg, index) => {
      const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : (msg.timestamp ? new Date(msg.timestamp) : new Date())
      const prevMsg = messages[index - 1]
      
      // Check if we need a date separator
      const needsDateSeparator = !lastDate || !isSameDay(lastDate, msgDate)
      
      if (needsDateSeparator) {
        if (currentGroup) {
          grouped.push(currentGroup)
        }
        grouped.push({
          type: 'date',
          date: msgDate
        })
        lastDate = msgDate
        currentGroup = null
      }

      // Check if we should group with previous message
      const prevMsgDate = prevMsg?.timestamp?.toDate ? prevMsg.timestamp.toDate() : (prevMsg?.timestamp ? new Date(prevMsg.timestamp) : null)
      const sameSender = prevMsg && prevMsg.sender === msg.sender
      const sameDate = prevMsgDate && isSameDay(prevMsgDate, msgDate)
      const within5Mins = prevMsgDate && (msgDate - prevMsgDate) < 5 * 60 * 1000

      if (sameSender && sameDate && within5Mins && currentGroup) {
        // Add to current group
        currentGroup.messages.push(msg)
      } else {
        // Start new group
        if (currentGroup) {
          grouped.push(currentGroup)
        }
        currentGroup = {
          type: 'message',
          sender: msg.sender,
          senderName: msg.senderName,
          date: msgDate,
          messages: [msg]
        }
      }
    })

    if (currentGroup) {
      grouped.push(currentGroup)
    }

    return grouped
  }

  // Fetch support chats from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'supportChats'),
      (snapshot) => {
        const chatsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            username: data.userName || data.username || data.name || 'Unknown User',
            userId: data.userId || data.uid || '',
            numericUserId: data.numericUserId || 'N/A',
            avatar: (data.userName || data.username || 'U').charAt(0).toUpperCase(),
            lastMessage: data.lastMessage || 'No messages yet',
            time: data.lastMessageTime ? new Date(data.lastMessageTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
            lastMessageTime: data.lastMessageTime,
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
        console.error('Error loading chats:', error)
        setChats([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Mark chat as read function
  const markChatAsRead = async (chatId) => {
    if (!chatId) return
    
    try {
      const chatRef = doc(db, 'supportChats', chatId)
      const chatDoc = await getDoc(chatRef)
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data()
        // Only mark as read if there are unread messages
        if (chatData.unreadByAdmin && chatData.unreadByAdmin > 0) {
          await updateDoc(chatRef, {
            unreadByAdmin: 0,
            lastReadByAdmin: serverTimestamp(),
            readAt: serverTimestamp()
          })
          console.log('✅ Chat marked as read:', chatId, '- Count decreased')
        }
      }
    } catch (error) {
      console.error('Error marking chat as read:', error)
    }
  }

  // Fetch messages for selected chat and mark as read
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    // Mark chat as read when admin opens/selects it
    markChatAsRead(selectedChat.id)

    // Fetch messages
    const tryMessageCollections = async () => {
      try {
        const messagesRef = collection(db, 'supportChats', selectedChat.id, 'messages')
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
                timestamp: data.timestamp,
                time: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
                ...data
              }
            })
            
            setMessages(messagesData)
            
            // Mark as read when messages are loaded (admin is viewing)
            // This ensures count decreases when admin views messages
            if (messagesData.length > 0) {
              markChatAsRead(selectedChat.id)
            }
            
            setTimeout(() => scrollToBottom(), 100)
          },
          (error) => {
            console.error('Error fetching messages:', error)
            setMessages([])
          }
        )
        
        return () => unsubscribe()
      } catch (error) {
        setMessages([])
      }
    }

    tryMessageCollections()
  }, [selectedChat])

  // Check scroll position for scroll button
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return

    setSending(true)
    try {
      const messagesRef = collection(db, 'supportChats', selectedChat.id, 'messages')
      
      // Create message data compatible with user app
      const messageData = {
        text: message.trim(),
        message: message.trim(),
        content: message.trim(),
        senderType: 'admin',
        isAdmin: true,
        senderId: adminUser?.uid || 'admin',
        senderName: 'Admin',
        sender: 'admin', // Add this for user app compatibility
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        date: serverTimestamp(), // Some apps use 'date' field
        type: 'text', // Message type
        read: false, // Message read status
        unreadByUser: true // User hasn't read this message yet
      }
      
      await addDoc(messagesRef, messageData)

      // Update chat document with last message info
      const chatRef = doc(db, 'supportChats', selectedChat.id)
      await updateDoc(chatRef, {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageBy: 'admin',
        lastMessageByAdmin: true,
        unreadByUser: true, // User has unread message from admin
        updatedAt: serverTimestamp()
      })

      setMessage('')
      showToast('Message sent successfully!', 'success')
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error('Error sending message:', error)
      showToast(`Error sending message: ${error.message}`, 'error')
    }
    setSending(false)
  }

  // Filter chats
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.numericUserId.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    switch (chatFilter) {
      case 'unread':
        return chat.unread > 0
      case 'active':
        return chat.status === 'active'
      case 'closed':
        return chat.status === 'closed'
      default:
        return true
    }
  })

  const groupedMessages = groupMessages(messages)

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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Support Chat</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chat with users in real-time ({chats.length} active conversations)
          </p>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-0 overflow-hidden"
        style={{ height: 'calc(100vh - 280px)' }}
      >
        <div className="flex h-full relative">
          {/* Chat List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-sm"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: chats.length },
                  { value: 'unread', label: 'Unread', count: chats.filter(c => c.unread > 0).length },
                  { value: 'active', label: 'Active', count: chats.filter(c => c.status === 'active').length },
                  { value: 'closed', label: 'Closed', count: chats.filter(c => c.status === 'closed').length }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setChatFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      chatFilter === filter.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label} {filter.count > 0 && `(${filter.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat List Items */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium mb-1">No chats found</p>
                  <p className="text-xs text-gray-400">
                    {searchTerm || chatFilter !== 'all' 
                      ? 'Try adjusting your search or filter'
                      : 'Users will appear here when they contact support'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all ${
                      selectedChat?.id === chat.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                          {chat.avatar}
                        </div>
                        {chat.status === 'active' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate text-sm">{chat.username}</p>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{chat.time}</span>
                        </div>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold mb-1">
                          ID: {chat.numericUserId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold shadow-sm">
                            {chat.unread} new
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col relative">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {selectedChat.avatar}
                      </div>
                      {selectedChat.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{selectedChat.username}</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
                        ID: {selectedChat.numericUserId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowUserInfo(!showUserInfo)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="User Info"
                    >
                      <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedChat.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {selectedChat.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 relative"
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-10 h-10 text-primary-500" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No messages yet</p>
                        <p className="text-sm text-gray-500">Start the conversation by sending a message below</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {groupedMessages.map((group, index) => {
                        if (group.type === 'date') {
                          return (
                            <div key={`date-${index}`} className="flex items-center gap-4 my-6">
                              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                                {formatDate(group.date)}
                              </span>
                              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                          )
                        }

                        return (
                          <motion.div
                            key={`group-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${group.sender === 'admin' ? 'justify-end' : 'justify-start'} mb-2`}
                          >
                            <div className={`max-w-[75%] ${group.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                              {/* Sender name and time for first message in group */}
                              <div className={`flex items-center gap-2 mb-1 px-1 ${group.sender === 'admin' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                  {group.senderName}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatTime(group.messages[0].timestamp?.toDate ? group.messages[0].timestamp.toDate() : new Date(group.messages[0].timestamp))}
                                </span>
                              </div>
                              
                              {/* Message bubbles */}
                              <div className="space-y-1">
                                {group.messages.map((msg, msgIndex) => (
                                  <div
                                    key={msg.id}
                                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                      msg.sender === 'admin'
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                                    } ${msgIndex === group.messages.length - 1 ? '' : 'mb-1'}`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {msg.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}

                  {/* Scroll to Bottom Button */}
                  <AnimatePresence>
                    {showScrollButton && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-6 right-6 p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-10"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
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
                      className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                    <span>💡 Press Enter to send</span>
                    <span>•</span>
                    <span>Shift+Enter for new line</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-12 h-12 text-primary-500" />
                  </div>
                  <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Chat Selected</p>
                  <p className="text-sm text-gray-500 mb-4">Select a conversation from the list to view messages and reply to users</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Info className="w-4 h-4" />
                    <span>Click on any chat to start</span>
                  </div>
                </div>
              </div>
            )}

            {/* User Info Panel */}
            <AnimatePresence>
              {showUserInfo && selectedChat && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowUserInfo(false)}
                    className="fixed inset-0 bg-black/20 z-40"
                  />
                  <motion.div
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-50 shadow-2xl overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">User Information</h3>
                        <button
                          onClick={() => setShowUserInfo(false)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {selectedChat.avatar}
                          </div>
                          <p className="font-semibold text-lg">{selectedChat.username}</p>
                          <p className="text-sm text-primary-600 dark:text-primary-400 font-mono font-bold mt-1">
                            ID: {selectedChat.numericUserId}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500 uppercase">User ID</span>
                            </div>
                            <p className="text-sm font-mono">{selectedChat.userId || 'N/A'}</p>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500 uppercase">Last Message</span>
                            </div>
                            <p className="text-sm">{selectedChat.time}</p>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              selectedChat.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {selectedChat.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                          </div>

                          {selectedChat.unread > 0 && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Unread Messages</span>
                              </div>
                              <p className="text-lg font-bold text-red-600 dark:text-red-400">{selectedChat.unread}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Chats
