import { createContext, useContext, useState, useEffect } from 'react'
import { mockData } from '../utils/mockData'
import { onAuthChange, logoutAdmin } from '../firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [data, setData] = useState(mockData)
  const [notifications, setNotifications] = useState([])
  
  // Authentication state
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Ticket notification counts
  const [openTicketsCount, setOpenTicketsCount] = useState(0)
  
  // New user registration counts
  const [newUsersCount, setNewUsersCount] = useState(0)
  
  // Unread chat messages count
  const [unreadChatsCount, setUnreadChatsCount] = useState(0)

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Listen to new/unseen tickets count in real-time
  useEffect(() => {
    if (!user) return // Only run when user is logged in

    // Get last seen timestamp from localStorage
    const getLastSeenTime = () => {
      const saved = localStorage.getItem('ticketsLastSeen')
      return saved ? new Date(saved) : new Date(0) // If never seen, use epoch time
    }

    const unsubscribe = onSnapshot(
      collection(db, 'supportTickets'),
      (snapshot) => {
        const lastSeen = getLastSeenTime()
        
        // Count only NEW tickets (created after last visit AND open/pending status)
        const newTicketsCount = snapshot.docs.filter(doc => {
          const data = doc.data()
          const status = (data.status || 'open').toLowerCase()
          const isOpenOrPending = status === 'open' || status === 'new' || status === 'pending'
          
          // Check if ticket was created after last seen time
          const createdAt = data.createdAt || data.createdDate || data.timestamp
          const isNew = createdAt ? createdAt.toDate() > lastSeen : false
          
          return isOpenOrPending && isNew
        }).length
        
        setOpenTicketsCount(newTicketsCount)
        console.log('📊 New unseen tickets:', newTicketsCount)
      },
      (error) => {
        console.log('Could not fetch tickets count:', error)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Listen to new user registrations in real-time
  useEffect(() => {
    if (!user) return

    const getLastSeenUsersTime = () => {
      const saved = localStorage.getItem('usersLastSeen')
      return saved ? new Date(saved) : new Date(0)
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const lastSeen = getLastSeenUsersTime()
        
        // Count users created after last visit
        const newUsers = snapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt || data.created_at || data.timestamp
          return createdAt ? createdAt.toDate() > lastSeen : false
        }).length
        
        setNewUsersCount(newUsers)
        console.log('👥 New user registrations:', newUsers)
      },
      (error) => {
        console.log('Could not fetch new users count:', error)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Listen to unread chat messages count in real-time
  useEffect(() => {
    if (!user) {
      setUnreadChatsCount(0)
      return
    }

    console.log('🔔 Setting up unread chats listener...')
    const unsubscribe = onSnapshot(
      collection(db, 'supportChats'),
      (snapshot) => {
        // Sum all unreadByAdmin counts from all chats
        let totalUnread = 0
        snapshot.docs.forEach(doc => {
          const data = doc.data()
          // Handle both number and undefined/null cases - ensure we get a valid number
          let unread = 0
          if (typeof data.unreadByAdmin === 'number') {
            unread = data.unreadByAdmin
          } else if (data.unreadByAdmin !== undefined && data.unreadByAdmin !== null) {
            const parsed = parseInt(data.unreadByAdmin)
            unread = isNaN(parsed) ? 0 : parsed
          }
          totalUnread += Math.max(0, unread) // Ensure non-negative
          if (unread > 0) {
            console.log(`📊 Chat ${doc.id}: unreadByAdmin = ${unread}`)
          }
        })
        
        console.log('💬 Total unread chat messages:', totalUnread, '(from', snapshot.size, 'chats)')
        setUnreadChatsCount(Math.max(0, totalUnread))
      },
      (error) => {
        console.error('❌ Error fetching unread chats count:', error)
        setUnreadChatsCount(0)
      }
    )

    return () => {
      console.log('🔕 Unsubscribing from unread chats listener')
      unsubscribe()
    }
  }, [user])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const updateUser = (userId, updates) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      )
    }))
    showToast('User updated successfully')
  }

  const updateTicket = (ticketId, updates) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      )
    }))
    showToast('Ticket updated successfully')
  }

  const approveAccount = (accountId) => {
    setData(prev => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.map(account =>
        account.id === accountId ? { ...account, status: 'approved' } : account
      )
    }))
    showToast('Account approved successfully')
  }

  const rejectAccount = (accountId) => {
    setData(prev => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter(account => account.id !== accountId)
    }))
    showToast('Account rejected', 'error')
  }

  const addTransaction = (transaction) => {
    setData(prev => ({
      ...prev,
      transactions: [transaction, ...prev.transactions]
    }))
    showToast('Transaction completed')
  }

  const addBanner = (banner) => {
    setData(prev => ({
      ...prev,
      banners: [...prev.banners, { ...banner, id: Date.now() }]
    }))
    showToast('Banner added successfully')
  }

  const deleteBanner = (bannerId) => {
    setData(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== bannerId)
    }))
    showToast('Banner deleted')
  }

  const handleLogout = async () => {
    const result = await logoutAdmin()
    if (result.success) {
      setUser(null)
      showToast('Logged out successfully')
    } else {
      showToast('Logout failed', 'error')
    }
  }

  const markTicketsAsSeen = () => {
    // Save current timestamp as "last seen" time
    localStorage.setItem('ticketsLastSeen', new Date().toISOString())
    setOpenTicketsCount(0) // Reset count immediately
    console.log('✅ Tickets marked as seen')
  }

  const markUsersAsSeen = () => {
    // Save current timestamp as "last seen" time for users
    localStorage.setItem('usersLastSeen', new Date().toISOString())
    setNewUsersCount(0) // Reset count immediately
    console.log('✅ New users marked as seen')
  }

  const value = {
    // Authentication
    user,
    authLoading,
    logout: handleLogout,
    // UI State
    darkMode,
    toggleDarkMode,
    sidebarOpen,
    toggleSidebar,
    // Data & Notifications
    data,
    notifications,
    showToast,
    openTicketsCount,
    markTicketsAsSeen,
    newUsersCount,
    markUsersAsSeen,
    unreadChatsCount,
    // Actions
    updateUser,
    updateTicket,
    approveAccount,
    rejectAccount,
    addTransaction,
    addBanner,
    deleteBanner,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}





