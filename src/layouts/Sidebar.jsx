import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  UsersRound,
  UserCheck,
  Gift,
  Video,
  Landmark,
  SlidersHorizontal,
  Wallet,
  BarChart3,
  LifeBuoy,
  Megaphone,
  Smartphone,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import useMediaQuery from '../hooks/useMediaQuery'
import { USER_ANALYTICS_PATH, USER_SEGMENTS } from '../utils/userManagementData'

const pathMatches = (pathname, target, exact) => (
  exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`)
)

const groupActive = (pathname, item) => (
  (item.match && pathMatches(pathname, item.match))
  || item.children.some((child) => pathMatches(pathname, child.path, child.exact))
)

const Sidebar = () => {
  const { 
    sidebarOpen,
    toggleSidebar,
    mobileNavOpen,
    closeMobileNav,
    logout, 
    openTicketsCount, 
    newUsersCount, 
    unreadChatsCount,
    pendingHostApplicationsCount,
    pendingTransactionsCount,
    newFeedbackCount
  } = useApp()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const showLabels = isDesktop ? sidebarOpen : true
  const [openGroups, setOpenGroups] = useState({})

  useEffect(() => {
    closeMobileNav()
  }, [location.pathname, closeMobileNav])
  
  // Debug: Log badge count
  useEffect(() => {
    console.log('🔔 [Sidebar] Unread chats count:', unreadChatsCount)
  }, [unreadChatsCount])

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
      path: '/users',
      match: '/users',
      icon: Users,
      label: 'User Management',
      badge: newUsersCount,
      children: [...USER_SEGMENTS.map((item) => ({ ...item, exact: item.path === '/users' })), { id: 'analytics', path: USER_ANALYTICS_PATH, label: 'User Analytics' }, { id: 'follows', path: '/app/follows', label: 'Follows' }],
    },
    { path: '/host-applications', icon: UserCheck, label: 'Host Applications', badge: pendingHostApplicationsCount },
    { path: '/live-streaming', icon: Video, label: 'Live rooms' },
    { path: '/app/calls', icon: Video, label: 'Private call log' },
    { path: '/chats', icon: MessageSquare, label: 'Chats', badge: unreadChatsCount },
    { path: '/gifts', icon: Gift, label: 'Gift catalog' },
    {
      path: '/economy',
      icon: Landmark,
      label: 'Wallet & Diamond Economy',
      children: [
        { id: 'sellers', path: '/diamond-sellers', label: 'Diamond Sellers' },
        { id: 'market', path: '/diamond-marketplace', label: 'Diamond Marketplace' },
        { id: 'overview', path: '/economy', label: 'Finance Overview', exact: true },
        { id: 'purchases', path: '/economy/purchases', label: 'Diamond Purchases' },
        { id: 'user-wallets', path: '/economy/user-wallets', label: 'User Wallets' },
        { id: 'host-wallets', path: '/economy/host-wallets', label: 'Host Earning Wallets' },
        { id: 'gift-transfers', path: '/economy/gifts', label: 'Gift transfers' },
        { id: 'revenue', path: '/economy/revenue', label: 'Earnings & Revenue Share' },
        { id: 'circulation', path: '/economy/circulation', label: 'Diamond Circulation' },
        { id: 'reports', path: '/economy/reports', label: 'Financial Reports' },
        { id: 'ledger-audit', path: '/economy/audit', label: 'Ledger audit' },
      ],
    },
    {
      path: '/transactions',
      icon: Wallet,
      label: 'Finance & payouts',
      badge: pendingTransactionsCount,
      children: [
        { id: 'bank', path: '/transactions', label: 'Bank transactions', exact: true },
      ],
    },
    {
      path: '/leaderboard',
      icon: BarChart3,
      label: 'Reports & rankings',
      children: [
        { id: 'ranks', path: '/leaderboard', label: 'Leaderboard & Rankings', exact: true },
        { id: 'geo', path: '/geo-analytics', label: 'Geography' },
        { id: 'nearby', path: '/app/nearby', label: 'Nearby' },
      ],
    },
    {
      path: '/tickets',
      icon: LifeBuoy,
      label: 'Support & moderation',
      badge: openTicketsCount,
      children: [
        { id: 'tickets', path: '/tickets', label: 'Tickets / Support', exact: true, badge: openTicketsCount },
        { id: 'complaints', path: '/complaints', label: 'Complaints' },
        { id: 'feedback', path: '/feedback', label: 'Feedback', badge: newFeedbackCount },
      ],
    },
    {
      path: '/banners',
      icon: Megaphone,
      label: 'Marketing',
      children: [
        { id: 'banners', path: '/banners', label: 'Banners', exact: true },
        { id: 'events', path: '/events', label: 'Events' },
      ],
    },
    {
      path: '/control',
      icon: SlidersHorizontal,
      label: 'Super Admin Control Center',
      children: [
        { id: 'home', path: '/control', label: 'Control overview', exact: true },
        { id: 'calls', path: '/control/calls', label: 'Video Call Pricing' },
        { id: 'withdrawal-rules', path: '/control/withdrawals', label: 'Withdrawal rules' },
        { id: 'diamonds', path: '/control/diamonds', label: 'App diamond rates' },
        { id: 'payments', path: '/control/payments', label: 'Payment Gateways' },
        { id: 'users-app', path: '/control/users', label: 'App accounts' },
        { id: 'live-config', path: '/control/live', label: 'Live room rules' },
        { id: 'notes', path: '/control/notifications', label: 'Notifications' },
        { id: 'notification-switches', path: '/app/notification-switches', label: 'User notification switches' },
        { id: 'safety-config', path: '/control/safety', label: 'Safety' },
        { id: 'flags', path: '/control/features', label: 'Feature Flags' },
        { id: 'app-config', path: '/control/app', label: 'App Settings' },
        { id: 'roles', path: '/control/roles', label: 'Roles' },
        { id: 'history', path: '/control/history', label: 'Config History' },
      ],
    },
    {
      path: '/app/warnings',
      icon: Smartphone,
      label: 'User app',
      children: [
        { id: 'warnings', path: '/app/warnings', label: 'Warnings' },
        { id: 'levels', path: '/app/levels', label: 'Levels' },
        { id: 'referrals', path: '/app/referrals', label: 'Referrals' },
        { id: 'blocks', path: '/app/blocks', label: 'Blocks' },
        { id: 'private-chats', path: '/app/private-chats', label: 'Private chats' },
        { id: 'kyc', path: '/app/kyc', label: 'KYC review' },
        { id: 'host-performance', path: '/app/host-performance', label: 'Host performance' },
        { id: 'coin-packs', path: '/app/coin-packs', label: 'Coin packs' },
        { id: 'telegram', path: '/app/telegram', label: 'Telegram popup' },
      ],
    },
    { path: '/chamakz-team', icon: UsersRound, label: 'Team accounts' },
    { path: '/settings', icon: Settings, label: 'Admin preferences' },
  ]

  useEffect(() => {
    setOpenGroups((groups) => {
      const next = { ...groups }
      menuItems.forEach((item) => {
        if (item.children && groupActive(location.pathname, item)) next[item.path] = true
      })
      return next
    })
  }, [location.pathname])

  return (
    <>
      <motion.aside
        initial={false}
        animate={isDesktop
          ? { width: sidebarOpen ? 256 : 72, x: 0 }
          : { width: 256, x: mobileNavOpen ? 0 : -288 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-30 h-screen border-r border-gray-200 bg-white transition-all dark:border-gray-700 dark:bg-gray-800 max-[1024px]:z-40"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle Button */}
          <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <motion.div
              initial={false}
              animate={{ opacity: showLabels ? 1 : 0, width: showLabels ? 'auto' : 0 }}
              className="flex items-center gap-2 relative z-10 overflow-hidden"
            >
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src="/adminlogo.png" 
                  alt="Chamakz Admin Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {showLabels && <span className="font-semibold text-sm whitespace-nowrap">Chamakz Admin</span>}
            </motion.div>
            
            {/* Toggle Button */}
            {isDesktop ? (
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
            ) : (
              <button
                type="button"
                onClick={closeMobileNav}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => {
              const parentActive = item.children
                ? groupActive(location.pathname, item)
                : location.pathname === item.path
              return (
                <div key={index}>
                  {item.children ? (
                    <div className={`flex items-center mx-2 mb-0.5 rounded-lg ${parentActive && !showLabels ? 'bg-pink-500 text-white' : ''}`}>
                      <NavLink
                        to={item.path}
                        onClick={closeMobileNav}
                        className={`flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg transition-all relative ${
                          parentActive && !item.children
                            ? 'bg-pink-500 text-white'
                            : parentActive
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {showLabels && <span className="text-sm font-medium truncate">{item.label}</span>}
                        {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                          showLabels ? (
                            <span className="ml-auto bg-red-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md min-w-[18px] text-center z-10">
                              {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                            </span>
                          ) : (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold w-4 h-4 rounded-md flex items-center justify-center z-10">
                              {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                            </span>
                          )
                        )}
                      </NavLink>
                      {showLabels && (
                        <button
                          type="button"
                          className="px-2 py-2 text-gray-500"
                          onClick={() => setOpenGroups((groups) => ({ ...groups, [item.path]: !groups[item.path] }))}
                          aria-label={`Toggle ${item.label}`}
                        >
                          <ChevronDown className={`h-4 w-4 transition ${openGroups[item.path] ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={closeMobileNav}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg transition-all mb-0.5 relative ${
                          isActive
                            ? 'bg-pink-500 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {showLabels && <span className="text-sm font-medium truncate">{item.label}</span>}
                      {item.badge !== undefined && item.badge !== null && Number(item.badge) > 0 && (
                        showLabels ? (
                          <span className="ml-auto bg-red-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md min-w-[18px] text-center z-10">
                            {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                          </span>
                        ) : (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold w-4 h-4 rounded-md flex items-center justify-center z-10">
                            {Number(item.badge) > 99 ? '99+' : Number(item.badge)}
                          </span>
                        )
                      )}
                    </NavLink>
                  )}
                  {item.children && showLabels && openGroups[item.path] && (
                    <div className="mb-1 ml-6 mr-2">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.id}
                          to={child.path}
                          end={Boolean(child.exact)}
                          onClick={closeMobileNav}
                          className={({ isActive }) =>
                            `flex items-center justify-between gap-2 truncate rounded-md px-2 py-1 text-[11px] ${
                              isActive
                                ? 'bg-pink-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60'
                            }`
                          }
                        >
                          <span className="truncate">{child.label}</span>
                          {child.badge > 0 && <span className="rounded bg-red-600 px-1 text-[10px] text-white">{child.badge > 99 ? '99+' : child.badge}</span>}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {showLabels && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar


