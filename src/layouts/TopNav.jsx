import { useState, useEffect } from 'react'
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const TopNav = () => {
  const { darkMode, toggleDarkMode, toggleSidebar, user, newUsersCount, openTicketsCount } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

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
    const usersUnsubscribe = onSnapshot(
      query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(3)
      ),
      (snapshot) => {
        const userNotifs = snapshot.docs.map(doc => {
          const data = doc.data()
          const timeAgo = data.createdAt ? getTimeAgo(data.createdAt.toDate()) : 'Recently'
          return {
            id: `user-${doc.id}`,
            text: `New user: ${data.name || data.email || 'Unknown'}`,
            time: timeAgo,
            unread: false,
            type: 'user'
          }
        })
        updateNotifications(userNotifs, 'users')
      },
      (error) => console.log('Error fetching user notifications:', error)
    )

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
      ticketsUnsubscribe()
      usersUnsubscribe()
    }
  }, [user])

  // Update unread count from context (includes new users and tickets)
  useEffect(() => {
    setUnreadCount(newUsersCount + openTicketsCount)
  }, [newUsersCount, openTicketsCount])

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  return (
    <nav className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, tickets, transactions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 transition-all"
            />
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
          <div className="relative">
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
                            notif.unread ? 'bg-primary-50 dark:bg-primary-900/20' : ''
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
                      className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:underline py-2"
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
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@chamakadmin.com'}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNav
