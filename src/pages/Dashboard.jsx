import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Coins, Ticket, MessageSquare, UserCheck } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'

const Dashboard = () => {
  const { data, showToast } = useApp()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoins: 0,
    activeTickets: 0,
    ongoingChats: 0,
    pendingApprovals: 0
  })
  const [recentActivity, setRecentActivity] = useState([])

  // Fetch real statistics from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch total users count
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        // Fetch total coins (sum all wallet balances)
        let totalCoins = 0
        try {
          const walletsSnapshot = await getDocs(collection(db, 'wallets'))
          walletsSnapshot.forEach(doc => {
            totalCoins += doc.data().balance || 0
          })
        } catch (error) {
          console.log('Wallets collection may not exist yet')
        }

        // Fetch active tickets count
        let activeTickets = 0
        try {
          const ticketsQuery = query(
            collection(db, 'tickets'),
            where('status', 'in', ['open', 'in-progress'])
          )
          const ticketsSnapshot = await getDocs(ticketsQuery)
          activeTickets = ticketsSnapshot.size
        } catch (error) {
          console.log('Tickets collection may not exist yet')
        }

        // Fetch ongoing chats count
        let ongoingChats = 0
        try {
          const chatsSnapshot = await getDocs(collection(db, 'chats'))
          ongoingChats = chatsSnapshot.size
        } catch (error) {
          console.log('Chats collection may not exist yet')
        }

        // Fetch pending approvals count
        let pendingApprovals = 0
        try {
          const approvalsQuery = query(
            collection(db, 'approvals'),
            where('status', '==', 'pending')
          )
          const approvalsSnapshot = await getDocs(approvalsQuery)
          pendingApprovals = approvalsSnapshot.size
        } catch (error) {
          console.log('Approvals collection may not exist yet')
        }

        // Fetch recent users as activity
        const recentUsersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const recentUsersSnapshot = await getDocs(recentUsersQuery)
        const activities = recentUsersSnapshot.docs.map(doc => {
          const userData = doc.data()
          return {
            id: doc.id,
            user: userData.name || userData.email || 'Unknown User',
            action: 'New user registered',
            type: 'login',
            time: userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'Recently'
          }
        })

        setStats({
          totalUsers,
          totalCoins,
          activeTickets,
          ongoingChats,
          pendingApprovals
        })
        setRecentActivity(activities)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        showToast('Error loading dashboard data', 'error')
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'primary',
      trend: { positive: true, value: `${stats.totalUsers}`, label: 'registered users' },
    },
    {
      title: 'Total Coins in Circulation',
      value: stats.totalCoins.toLocaleString(),
      icon: Coins,
      color: 'secondary',
      trend: { positive: true, value: `${stats.totalCoins}`, label: 'total coins' },
    },
    {
      title: 'Active Tickets',
      value: stats.activeTickets,
      icon: Ticket,
      color: 'orange',
      trend: { positive: false, value: `${stats.activeTickets}`, label: 'need attention' },
    },
    {
      title: 'Ongoing Chats',
      value: stats.ongoingChats,
      icon: MessageSquare,
      color: 'purple',
      trend: { positive: true, value: `${stats.ongoingChats}`, label: 'active chats' },
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: UserCheck,
      color: 'pink',
      trend: { positive: false, value: `${stats.pendingApprovals}`, label: 'awaiting review' },
    },
  ]

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
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, Admin! Here's what's happening today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
          <p className="text-sm font-medium">Just now</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} delay={index * 0.1} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">User Activity (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.chartData.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="active" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Coin Transactions Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Coin Transactions (Monthly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData.coinTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="credits" fill="#22c55e" />
              <Bar dataKey="debits" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity yet</p>
          ) : (
            recentActivity.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.type === 'purchase' ? 'bg-green-100 text-green-600' :
                activity.type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                activity.type === 'login' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'ticket' ? 'bg-orange-100 text-orange-600' :
                activity.type === 'security' ? 'bg-red-100 text-red-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {activity.type === 'purchase' && '💰'}
                {activity.type === 'withdrawal' && '💸'}
                {activity.type === 'login' && '🔐'}
                {activity.type === 'ticket' && '🎫'}
                {activity.type === 'security' && '🚫'}
                {activity.type === 'referral' && '👥'}
                {activity.type === 'update' && '✏️'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.user}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
              </div>
              <div className="text-sm text-gray-500">{activity.time}</div>
            </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard






