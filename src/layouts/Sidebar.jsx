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
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 z-30 transition-all"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b-2 border-gray-200 dark:border-gray-700 relative overflow-hidden">
            {/* 2D Decorative Element */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-200 dark:bg-pink-900/20 rounded-full blur-2xl opacity-30"></div>
            <motion.div
              initial={false}
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="flex items-center gap-2 relative z-10"
            >
              <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center border-2 border-pink-600 overflow-hidden" style={{ transform: 'rotate(-5deg)', boxShadow: 'none' }}>
                <img 
                  src="/adminlogo.png" 
                  alt="Chamakz Admin Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {sidebarOpen && <span className="font-bold text-xl">Chamakz Admin</span>}
            </motion.div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all mb-1 relative border-2 ${
                    isActive
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-pink-50 dark:hover:bg-pink-900/10 hover:border-pink-200 dark:hover:border-pink-800'
                  }`
                }
                style={({ isActive }) => isActive ? { boxShadow: 'none', transform: 'translateX(4px)' } : {}}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {/* Badge - Show when count > 0 */}
                {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                  <>
                    {sidebarOpen ? (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-xl min-w-[20px] text-center border-2 border-red-600 z-10" style={{ boxShadow: 'none' }}>
                        {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                      </span>
                    ) : (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-xl flex items-center justify-center border-2 border-white dark:border-gray-800 z-10" style={{ boxShadow: 'none' }}>
                        {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700">
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border-2 border-transparent hover:border-red-200 dark:hover:border-red-800"
              style={{ boxShadow: 'none' }}
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


