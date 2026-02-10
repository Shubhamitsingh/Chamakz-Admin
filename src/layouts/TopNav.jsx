import { useState, useEffect, useRef } from 'react'
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, onSnapshot, where, getDocs, doc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const TopNav = () => {
  const { darkMode, toggleDarkMode, toggleSidebar, user, newUsersCount, openTicketsCount, logout } = useApp()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState({ users: [], tickets: [], transactions: [] })
  const [searching, setSearching] = useState(false)
  const [adminAvatar, setAdminAvatar] = useState(null)
  const [adminName, setAdminName] = useState('Admin User')
  const notificationDropdownRef = useRef(null)
  const searchDropdownRef = useRef(null)

  // Fetch real-time notifications from Firebase
  useEffect(() => {
    if (!user) return

    const notifs = []
    
    // Listen to recent tickets (last 5)
    const ticketsUnsubscribe = onSnapshot(
      query(
        collection(db, 'supportTickets'),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(5)
      ),
      (snapshot) => {
        const ticketNotifs = snapshot.docs.map(doc => {
          const data = doc.data()
          const timeAgo = data.createdAt ? getTimeAgo(data.createdAt.toDate()) : 'Recently'
          return {
            id: `ticket-${doc.id}`,
            text: `New ticket: ${data.subject || data.issue || 'Support request'}`,
            time: timeAgo,
            unread: true,
            type: 'ticket'
          }
        })
        updateNotifications(ticketNotifs, 'tickets')
      },
      (error) => console.log('Error fetching ticket notifications:', error)
    )

    // Listen to recent users (last 3)
    let usersUnsubscribe = null
    try {
      usersUnsubscribe = onSnapshot(
        query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(3)
        ),
        (snapshot) => {
          const userNotifs = snapshot.docs.map(doc => {
            const data = doc.data()
            
            // Get user name - match the same logic as Users page and Dashboard
            const userName = data.name || data.displayName || data.userName || data.email || 'Unknown'
            
            // Get time ago - handle both Timestamp and Date objects
            let timeAgo = 'Recently'
            if (data.createdAt) {
              try {
                if (data.createdAt.toDate) {
                  timeAgo = getTimeAgo(data.createdAt.toDate())
                } else if (data.createdAt instanceof Date) {
                  timeAgo = getTimeAgo(data.createdAt)
                } else {
                  timeAgo = getTimeAgo(new Date(data.createdAt))
                }
              } catch (e) {
                console.warn('Date parse error for notification:', e)
              }
            }
            
            return {
              id: `user-${doc.id}`,
              text: `New user: ${userName}`,
              time: timeAgo,
              unread: false,
              type: 'user'
            }
          })
          updateNotifications(userNotifs, 'users')
        },
        (error) => {
          console.log('Error fetching user notifications (trying fallback):', error)
          // Fallback: fetch all users and sort manually
          getDocs(collection(db, 'users')).then(snapshot => {
            const allUsers = snapshot.docs
              .map(doc => ({ id: doc.id, data: doc.data(), doc }))
              .filter(item => item.data.createdAt)
              .sort((a, b) => {
                try {
                  const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate() : new Date(a.data.createdAt)
                  const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate() : new Date(b.data.createdAt)
                  return bTime - aTime
                } catch (e) {
                  return 0
                }
              })
              .slice(0, 3)
            
            const userNotifs = allUsers.map(item => {
              const data = item.data
              const userName = data.name || data.displayName || data.userName || data.email || 'Unknown'
              
              let timeAgo = 'Recently'
              try {
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                timeAgo = getTimeAgo(createdAt)
              } catch (e) {
                console.warn('Date parse error:', e)
              }
              
              return {
                id: `user-${item.id}`,
                text: `New user: ${userName}`,
                time: timeAgo,
                unread: false,
                type: 'user'
              }
            })
            updateNotifications(userNotifs, 'users')
          }).catch(err => {
            console.error('Error in fallback user notifications:', err)
          })
        }
      )
    } catch (error) {
      console.log('Error setting up user notifications listener:', error)
    }

    const allNotifications = {}
    
    const updateNotifications = (newNotifs, type) => {
      allNotifications[type] = newNotifs
      const combined = [
        ...(allNotifications.tickets || []),
        ...(allNotifications.users || [])
      ]
      setNotifications(combined)
    }

    return () => {
      if (ticketsUnsubscribe) ticketsUnsubscribe()
      if (usersUnsubscribe) usersUnsubscribe()
    }
  }, [user])

  // Update unread count from context (includes new users and tickets)
  useEffect(() => {
    setUnreadCount(newUsersCount + openTicketsCount)
  }, [newUsersCount, openTicketsCount])

  // Listen to admin avatar and profile updates
  useEffect(() => {
    // Check initial Firebase Auth photoURL
    if (auth.currentUser?.photoURL) {
      setAdminAvatar(auth.currentUser.photoURL)
    }
    if (auth.currentUser?.displayName) {
      setAdminName(auth.currentUser.displayName)
    }

    // Listen to Firebase Auth photoURL changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser?.photoURL) {
        setAdminAvatar(currentUser.photoURL)
      }
      if (currentUser?.displayName) {
        setAdminName(currentUser.displayName)
      }
    })

    // Listen to settings document for admin avatar and name
    const settingsRef = doc(db, 'settings', 'general')
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.adminAvatar) {
          setAdminAvatar(data.adminAvatar)
        }
        if (data.adminName) {
          setAdminName(data.adminName)
        }
      }
    }, (error) => {
      console.log('Error fetching admin settings:', error)
    })

    return () => {
      unsubscribeAuth()
      unsubscribeSettings()
    }
  }, [])

  // Global search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setShowSearchResults(false)
        setSearchResults({ users: [], tickets: [], transactions: [] })
        return
      }

      setSearching(true)
      setShowSearchResults(true)

      try {
        const searchLower = searchTerm.toLowerCase()
        const results = { users: [], tickets: [], transactions: [] }

        // Search users
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'))
          usersSnapshot.forEach(doc => {
            const data = doc.data()
            // Get user name - match the same logic as Users page
            const userName = data.name || data.displayName || data.userName || ''
            const name = userName.toLowerCase()
            const email = (data.email || '').toLowerCase()
            const numericId = (data.numericUserId || '').toString()
            
            if (name.includes(searchLower) || email.includes(searchLower) || numericId.includes(searchTerm)) {
              results.users.push({
                id: doc.id,
                name: userName || 'Unknown',
                email: data.email || '',
                numericUserId: data.numericUserId || 'N/A',
                type: 'user'
              })
            }
          })
        } catch (error) {
          console.log('Error searching users:', error)
        }

        // Search tickets
        try {
          const ticketsSnapshot = await getDocs(collection(db, 'supportTickets'))
          ticketsSnapshot.forEach(doc => {
            const data = doc.data()
            const issue = (data.subject || data.issue || '').toLowerCase()
            const username = (data.userName || data.username || '').toLowerCase()
            
            if (issue.includes(searchLower) || username.includes(searchLower)) {
              results.tickets.push({
                id: doc.id,
                issue: data.subject || data.issue || 'No subject',
                username: data.userName || data.username || 'Unknown',
                type: 'ticket'
              })
            }
          })
        } catch (error) {
          console.log('Error searching tickets:', error)
        }

        // Search transactions (withdrawal requests)
        try {
          // Try withdrawal_requests collection first (as used in Transactions page)
          let transactionsSnapshot
          try {
            transactionsSnapshot = await getDocs(collection(db, 'withdrawal_requests'))
          } catch (error) {
            // Fallback to transactions collection
            try {
              transactionsSnapshot = await getDocs(collection(db, 'transactions'))
            } catch (fallbackError) {
              console.log('Transactions collection may not exist')
              transactionsSnapshot = { forEach: () => {} } // Empty snapshot
            }
          }
          
          transactionsSnapshot.forEach(doc => {
            const data = doc.data()
            const userName = (data.userName || data.userEmail || data.name || '').toLowerCase()
            const reason = (data.reason || data.description || '').toLowerCase()
            const amount = (data.amount || '').toString()
            
            if (userName.includes(searchLower) || reason.includes(searchLower) || amount.includes(searchTerm)) {
              results.transactions.push({
                id: doc.id,
                user: data.userName || data.userEmail || data.name || 'Unknown',
                amount: data.amount || 0,
                transactionType: data.type || data.status || 'Pending',
                type: 'transaction'
              })
            }
          })
        } catch (error) {
          console.log('Error searching transactions:', error)
        }

        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
      }

      setSearching(false)
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSearchResultClick = (result) => {
    if (result.type === 'user') {
      navigate('/users')
      setSearchTerm('')
      setShowSearchResults(false)
    } else if (result.type === 'ticket') {
      navigate('/tickets')
      setSearchTerm('')
      setShowSearchResults(false)
    } else if (result.type === 'transaction') {
      navigate('/transactions')
      setSearchTerm('')
      setShowSearchResults(false)
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="h-full px-6 flex items-center gap-4 w-full">
        {/* Left Side */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative flex-1 max-w-md" ref={searchDropdownRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && setShowSearchResults(true)}
              placeholder="Search users, tickets, transactions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 transition-all"
            />
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
            {showSearchResults && searchTerm.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto"
              >
                  {searching && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm mt-2">Searching...</p>
                    </div>
                  )}
                  
                  {!searching && (
                    <>
                      {searchResults.users.length === 0 && searchResults.tickets.length === 0 && searchResults.transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No results found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      ) : (
                        <>
                          {searchResults.users.length > 0 && (
                            <div className="p-2">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Users</p>
                              {searchResults.users.slice(0, 5).map(user => (
                                <div
                                  key={user.id}
                                  onClick={() => handleSearchResultClick(user)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                                >
                                  <p className="font-medium text-sm">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {searchResults.tickets.length > 0 && (
                            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Tickets</p>
                              {searchResults.tickets.slice(0, 5).map(ticket => (
                                <div
                                  key={ticket.id}
                                  onClick={() => handleSearchResultClick(ticket)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                                >
                                  <p className="font-medium text-sm">{ticket.issue}</p>
                                  <p className="text-xs text-gray-500">By: {ticket.username}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {searchResults.transactions.length > 0 && (
                            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Transactions</p>
                              {searchResults.transactions.slice(0, 5).map(transaction => (
                                <div
                                  key={transaction.id}
                                  onClick={() => handleSearchResultClick(transaction)}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                                >
                                  <p className="font-medium text-sm">{transaction.user}</p>
                                  <p className="text-xs text-gray-500">{transaction.transactionType}: {transaction.amount} coins</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setShowSearchResults(false)
                          }}
                          className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                        >
                          Clear search
                        </button>
                      </div>
                    </>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationDropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{unreadCount} unread notifications</p>
                    )}
                    
                    {/* Summary */}
                    {(newUsersCount > 0 || openTicketsCount > 0) && (
                      <div className="mt-3 space-y-1">
                        {newUsersCount > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {newUsersCount} new user registration{newUsersCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {openTicketsCount > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {openTicketsCount} new support ticket{openTicketsCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                            notif.unread ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notif.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                            {notif.unread && (
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      className="w-full text-center text-sm text-pink-600 dark:text-pink-400 hover:underline py-2"
                      onClick={() => setShowNotifications(false)}
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-gray-500">{user?.email || auth.currentUser?.email || 'admin@chamakzadmin.com'}</p>
            </div>
            {adminAvatar ? (
              <img 
                src={adminAvatar} 
                alt="Admin Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-500 cursor-pointer"
                onError={() => setAdminAvatar(null)}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                {adminName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNav
