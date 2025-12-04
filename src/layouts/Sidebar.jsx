import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Wallet,
  Ticket,
  MessageSquare,
  UserCheck,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  MessageCircle,
  Coins,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, logout, openTicketsCount, newUsersCount, unreadChatsCount } = useApp()
  
  // Debug: Log unread chat count (remove in production)
  useEffect(() => {
    console.log('🔴 Sidebar - unreadChatsCount:', unreadChatsCount, 'type:', typeof unreadChatsCount, 'badge will show:', Number(unreadChatsCount) > 0)
  }, [unreadChatsCount])

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users', badge: newUsersCount },
    { path: '/wallet', icon: Wallet, label: 'Wallet / Coins' },
    { path: '/transactions', icon: DollarSign, label: 'Payment' },
    { path: '/tickets', icon: Ticket, label: 'Tickets / Support', badge: openTicketsCount },
    { path: '/chats', icon: MessageSquare, label: 'Chats', badge: unreadChatsCount },
    { path: '/feedback', icon: MessageCircle, label: 'Feedback' },
    { path: '/approvals', icon: UserCheck, label: 'Account Approvals' },
    { path: '/coinreseller', icon: Coins, label: 'CoinReseller' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <motion.div
              initial={false}
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              {sidebarOpen && <span className="font-bold text-xl">Chamak Admin</span>}
            </motion.div>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all mb-1 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {!sidebarOpen && item.badge !== undefined && Number(item.badge) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
      
      {/* Spacer */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="flex-shrink-0"
      />
    </>
  )
}

export default Sidebar


