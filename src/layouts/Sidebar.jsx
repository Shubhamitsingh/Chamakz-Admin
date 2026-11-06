import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Ticket,
  MessageSquare,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  UsersRound,
  Image as BannerIcon,
  UserCheck,
  Gift,
  AlertTriangle,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const Sidebar = () => {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    logout, 
    openTicketsCount, 
    newUsersCount, 
    unreadChatsCount,
    pendingHostApplicationsCount,
    pendingTransactionsCount,
    newFeedbackCount
  } = useApp()
  
  // Debug: Log badge count
  useEffect(() => {
    console.log('🔔 [Sidebar] Unread chats count:', unreadChatsCount)
  }, [unreadChatsCount])

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users', badge: newUsersCount },
    { path: '/host-applications', icon: UserCheck, label: 'Host Applications', badge: pendingHostApplicationsCount },
    { path: '/chats', icon: MessageSquare, label: 'Chats', badge: unreadChatsCount },
    { path: '/tickets', icon: Ticket, label: 'Tickets / Support', badge: openTicketsCount },
    { path: '/transactions', icon: DollarSign, label: 'Transactions', badge: pendingTransactionsCount },
    { path: '/chamakz-team', icon: UsersRound, label: 'Chamakz Team' },
    { path: '/banners', icon: BannerIcon, label: 'Banners' },
    { path: '/gifts', icon: Gift, label: 'Gifts' },
    { path: '/feedback', icon: MessageCircle, label: 'Feedback', badge: newFeedbackCount },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/complaints', icon: AlertTriangle, label: 'Complaints' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle Button */}
          <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <motion.div
              initial={false}
              animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? 'auto' : 0 }}
              className="flex items-center gap-2 relative z-10 overflow-hidden"
            >
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src="/adminlogo.png" 
                  alt="Chamakz Admin Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {sidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Chamakz Admin</span>}
            </motion.div>
            
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors relative z-10 flex-shrink-0"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all mb-0.5 relative ${
                    isActive
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                {/* Badge - Show when count > 0 */}
                {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                  <>
                    {sidebarOpen ? (
                      <span className="ml-auto bg-red-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md min-w-[18px] text-center z-10">
                        {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold w-4 h-4 rounded-md flex items-center justify-center z-10">
                        {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar


