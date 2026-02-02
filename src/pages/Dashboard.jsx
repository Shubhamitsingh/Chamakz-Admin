import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Ticket, Key, LayoutDashboard, UserCheck, Radio, DollarSign, TrendingUp, TrendingDown, Trophy, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { collection, getDocs, query, where, orderBy, limit, Timestamp, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const Dashboard = () => {
  const { data, showToast } = useApp()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTickets: 0,
    ongoingChats: 0,
    approvedHosts: 0,
    activeUsers: 0 // Currently active users (last 5 minutes)
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [chartData, setChartData] = useState({
    userActivity: []
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [liveStreams, setLiveStreams] = useState([])
  const [stoppingStream, setStoppingStream] = useState(null)
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    coinsPurchasedToday: 0,
    coinsSpentToday: 0,
    topEarningHost: { name: 'N/A', amount: 0 }
  })

  // Fetch real statistics from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch total users count
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        // Fetch active tickets count
        let activeTickets = 0
        try {
          // Try supportTickets first (as used in TicketsV2 page)
          const ticketsQuery = query(
            collection(db, 'supportTickets'),
            where('status', 'in', ['open', 'in-progress', 'pending'])
          )
          const ticketsSnapshot = await getDocs(ticketsQuery)
          activeTickets = ticketsSnapshot.size
        } catch (error) {
          // Fallback to 'tickets' collection if supportTickets doesn't exist
          try {
            const ticketsQuery = query(
              collection(db, 'tickets'),
              where('status', 'in', ['open', 'in-progress'])
            )
            const ticketsSnapshot = await getDocs(ticketsQuery)
            activeTickets = ticketsSnapshot.size
          } catch (fallbackError) {
            console.log('Tickets collection may not exist yet')
          }
        }

        // Fetch ongoing chats count
        let ongoingChats = 0
        try {
          // Use supportChats collection (as used in Chats page)
          const chatsSnapshot = await getDocs(collection(db, 'supportChats'))
          ongoingChats = chatsSnapshot.size
        } catch (error) {
          // Fallback to 'chats' collection if supportChats doesn't exist
          try {
            const chatsSnapshot = await getDocs(collection(db, 'chats'))
            ongoingChats = chatsSnapshot.size
          } catch (fallbackError) {
            console.log('Chats collection may not exist yet')
          }
        }

        // Fetch user activity data for last 7 days
        const userActivityData = []
        const last7Days = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          last7Days.push({
            date: new Date(date.setHours(0, 0, 0, 0)),
            name: date.toLocaleDateString('en-US', { weekday: 'short' })
          })
        }

        for (const day of last7Days) {
          const nextDay = new Date(day.date)
          nextDay.setDate(nextDay.getDate() + 1)
          
          try {
            const dayStart = Timestamp.fromDate(day.date)
            const dayEnd = Timestamp.fromDate(nextDay)
            
            const usersQuery = query(
              collection(db, 'users'),
              where('createdAt', '>=', dayStart),
              where('createdAt', '<', dayEnd)
            )
            const usersSnapshot = await getDocs(usersQuery)
            const newUsers = usersSnapshot.size

            // Get active users (users who logged in that day) - simplified
            let activeUsers = 0
            try {
              const activeUsersQuery = query(
                collection(db, 'users'),
                where('lastActive', '>=', dayStart),
                where('lastActive', '<', dayEnd)
              )
              const activeSnapshot = await getDocs(activeUsersQuery)
              activeUsers = activeSnapshot.size
            } catch (error) {
              // lastActive field might not exist, use new users as proxy
              activeUsers = Math.floor(newUsers * 0.7) // Estimate 70% active
            }

            userActivityData.push({
              name: day.name,
              users: newUsers,
              active: activeUsers
            })
          } catch (error) {
            userActivityData.push({
              name: day.name,
              users: 0,
              active: 0
            })
          }
        }

        // Fetch recent users as activity
        let recentUsersSnapshot
        try {
          // Try to order by createdAt first
          const recentUsersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
          recentUsersSnapshot = await getDocs(recentUsersQuery)
        } catch (error) {
          // If createdAt index doesn't exist, fetch all users and sort manually
          console.log('createdAt index not available, fetching all users:', error)
          const allUsersSnapshot = await getDocs(collection(db, 'users'))
          const allUsers = allUsersSnapshot.docs
            .map(doc => ({ id: doc.id, data: doc.data(), doc }))
            .filter(item => item.data.createdAt) // Only include users with createdAt
            .sort((a, b) => {
              try {
                const aTime = a.data.createdAt?.toDate ? a.data.createdAt.toDate() : new Date(a.data.createdAt)
                const bTime = b.data.createdAt?.toDate ? b.data.createdAt.toDate() : new Date(b.data.createdAt)
                return bTime - aTime
              } catch (e) {
                return 0
              }
            })
            .slice(0, 10)
          
          // Create a mock snapshot-like object
          recentUsersSnapshot = {
            docs: allUsers.map(item => item.doc)
          }
        }
        const activities = recentUsersSnapshot.docs.map(doc => {
          const userData = doc.data()
          
          // Get user name - match the same logic as Users page
          const userName = userData.name || userData.displayName || userData.userName || userData.email || 'Unknown User'
          
          // Get numeric user ID
          const numericUserId = userData.numericUserId || userData.numeric_user_id || userData.userNumericId || 'N/A'
          
          // Get timestamp - handle both Timestamp and Date objects
          let timestamp = 'Recently'
          if (userData.createdAt) {
            try {
              if (userData.createdAt.toDate) {
                timestamp = new Date(userData.createdAt.toDate()).toLocaleString()
              } else if (userData.createdAt instanceof Date) {
                timestamp = userData.createdAt.toLocaleString()
              } else {
                timestamp = new Date(userData.createdAt).toLocaleString()
              }
            } catch (e) {
              console.warn('Date parse error for createdAt:', e)
            }
          }
          
          return {
            id: doc.id,
            user: userName,
            numericUserId: numericUserId,
            action: 'New user registered',
            type: 'login',
            time: timestamp
          }
        })

        setStats(prevStats => ({
          totalUsers,
          activeTickets,
          ongoingChats,
          approvedHosts: prevStats.approvedHosts || 0, // Keep existing value, will be updated by real-time listener
          activeUsers: prevStats.activeUsers || 0 // Keep existing value, will be updated by real-time listener
        }))
        setRecentActivity(activities)
        setChartData({
          userActivity: userActivityData.length > 0 ? userActivityData : [
            { name: 'Mon', users: 0, active: 0 },
            { name: 'Tue', users: 0, active: 0 },
            { name: 'Wed', users: 0, active: 0 },
            { name: 'Thu', users: 0, active: 0 },
            { name: 'Fri', users: 0, active: 0 },
            { name: 'Sat', users: 0, active: 0 },
            { name: 'Sun', users: 0, active: 0 }
          ]
        })
        setLastUpdated(new Date())
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        showToast('Error loading dashboard data', 'error')
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Real-time listener for recent activity (new user registrations)
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true
    
    try {
      const usersCollection = collection(db, 'users')
      
      unsubscribe = onSnapshot(
        usersCollection,
        (snapshot) => {
          if (!isMounted) return
          
          try {
            // Get recent users (last 10)
            const allUsers = []
            snapshot.forEach((doc) => {
              const userData = doc.data()
              if (userData.createdAt) {
                allUsers.push({
                  id: doc.id,
                  data: userData,
                  createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
                })
              }
            })
            
            // Sort by createdAt descending and take top 10
            allUsers.sort((a, b) => b.createdAt - a.createdAt)
            const recentUsers = allUsers.slice(0, 10)
            
            // Map to activity format
            const activities = recentUsers.map(item => {
              const userData = item.data
              
              // Get user name - match the same logic as Users page
              const userName = userData.name || userData.displayName || userData.userName || userData.email || 'Unknown User'
              
              // Get numeric user ID
              const numericUserId = userData.numericUserId || userData.numeric_user_id || userData.userNumericId || 'N/A'
              
              // Get timestamp
              let timestamp = 'Recently'
              try {
                timestamp = item.createdAt.toLocaleString()
              } catch (e) {
                console.warn('Date parse error:', e)
              }
              
              return {
                id: item.id,
                user: userName,
                numericUserId: numericUserId,
                action: 'New user registered',
                type: 'login',
                time: timestamp
              }
            })
            
            setRecentActivity(activities)
            setLastUpdated(new Date())
          } catch (error) {
            console.error('Error processing recent activity:', error)
          }
        },
        (error) => {
          console.error('Error listening to recent activity:', error)
        }
      )
    } catch (error) {
      console.error('Error setting up recent activity listener:', error)
    }

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Real-time listener for approved hosts count
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true
    
    try {
      const usersCollection = collection(db, 'users')
      
      unsubscribe = onSnapshot(
        usersCollection,
        (snapshot) => {
          if (!isMounted) return
          
          let approvedCount = 0
          let activeUsersCount = 0
          const now = new Date()
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
          
          snapshot.forEach(doc => {
            const userData = doc.data()
            
            // Count users who are approved for live streaming (isActive === true)
            // This matches the "Live Approved" count in Users page
            if (userData.isActive === true) {
              approvedCount++
            }
            
            // Count currently active users (lastActive within last 5 minutes)
            if (userData.lastActive) {
              try {
                const lastActiveDate = userData.lastActive.toDate ? userData.lastActive.toDate() : new Date(userData.lastActive)
                if (!isNaN(lastActiveDate.getTime()) && lastActiveDate >= fiveMinutesAgo) {
                  activeUsersCount++
                }
              } catch (e) {
                // Ignore date parsing errors
              }
            }
          })
          
          setStats(prevStats => ({
            ...prevStats,
            approvedHosts: approvedCount,
            activeUsers: activeUsersCount
          }))
        },
        (error) => {
          console.error('Error listening to users count:', error)
          if (isMounted) {
            setStats(prevStats => ({
              ...prevStats,
              approvedHosts: 0,
              activeUsers: 0
            }))
          }
        }
      )
    } catch (error) {
      console.error('Error setting up approved hosts listener:', error)
    }

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Real-time listener for live streams
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true

    const fetchLiveStreams = async () => {
      try {
        const streams = []

        // Method 1: Check live_streams collection
        try {
          const liveStreamsQuery = query(
            collection(db, 'live_streams'),
            where('status', '==', 'live')
          )
          const liveStreamsSnapshot = await getDocs(liveStreamsQuery)
          liveStreamsSnapshot.forEach(doc => {
            const data = doc.data()
            const startTime = data.startTime || data.start_time || data.createdAt
            const startDate = startTime?.toDate ? startTime.toDate() : (startTime ? new Date(startTime) : new Date())
            
            streams.push({
              id: doc.id,
              hostId: data.hostId || data.host_id || data.userId || '',
              hostName: data.hostName || data.host_name || data.userName || data.name || 'Unknown Host',
              numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
              viewCount: data.viewCount || data.view_count || data.viewers || 0,
              startTime: startDate,
              coinsPerMinute: data.coinsPerMinute || data.coins_per_minute || data.coinsPerMin || 0,
              totalCoinsEarned: data.totalCoinsEarned || data.total_coins_earned || 0,
              collection: 'live_streams'
            })
          })
        } catch (error) {
          console.log('live_streams collection not found or error:', error)
        }

        // Method 2: Check users collection for isLive === true
        try {
          const usersQuery = query(
            collection(db, 'users'),
            where('isLive', '==', true)
          )
          const usersSnapshot = await getDocs(usersQuery)
          usersSnapshot.forEach(doc => {
            const data = doc.data()
            const liveData = data.liveStreamData || data.live_stream_data || {}
            const startTime = liveData.startTime || liveData.start_time || data.liveStartTime || data.live_start_time
            const startDate = startTime?.toDate ? startTime.toDate() : (startTime ? new Date(startTime) : new Date())
            
            // Only add if not already in streams (avoid duplicates)
            if (!streams.find(s => s.hostId === doc.id)) {
              streams.push({
                id: doc.id,
                hostId: doc.id,
                hostName: data.name || data.displayName || data.userName || 'Unknown Host',
                numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
                viewCount: liveData.viewCount || liveData.view_count || liveData.viewers || 0,
                startTime: startDate,
                coinsPerMinute: liveData.coinsPerMinute || liveData.coins_per_minute || 0,
                totalCoinsEarned: liveData.totalCoinsEarned || liveData.total_coins_earned || 0,
                collection: 'users'
              })
            }
          })
        } catch (error) {
          console.log('Error checking users for isLive:', error)
        }

        // Method 3: Check active_streams collection
        try {
          const activeStreamsQuery = query(
            collection(db, 'active_streams'),
            where('status', '==', 'live')
          )
          const activeStreamsSnapshot = await getDocs(activeStreamsQuery)
          activeStreamsSnapshot.forEach(doc => {
            const data = doc.data()
            const startTime = data.startTime || data.start_time || data.createdAt
            const startDate = startTime?.toDate ? startTime.toDate() : (startTime ? new Date(startTime) : new Date())
            
            if (!streams.find(s => s.id === doc.id)) {
              streams.push({
                id: doc.id,
                hostId: data.hostId || data.host_id || data.userId || '',
                hostName: data.hostName || data.host_name || data.userName || data.name || 'Unknown Host',
                numericUserId: data.numericUserId || data.numeric_user_id || 'N/A',
                viewCount: data.viewCount || data.view_count || data.viewers || 0,
                startTime: startDate,
                coinsPerMinute: data.coinsPerMinute || data.coins_per_minute || data.coinsPerMin || 0,
                totalCoinsEarned: data.totalCoinsEarned || data.total_coins_earned || 0,
                collection: 'active_streams'
              })
            }
          })
        } catch (error) {
          console.log('active_streams collection not found or error:', error)
        }

        if (isMounted) {
          setLiveStreams(streams)
        }
      } catch (error) {
        console.error('Error fetching live streams:', error)
        if (isMounted) {
          setLiveStreams([])
        }
      }
    }

    // Initial fetch
    fetchLiveStreams()

    // Set up real-time listener on users collection (for isLive changes)
    try {
      unsubscribe = onSnapshot(
        collection(db, 'users'),
        () => {
          fetchLiveStreams()
        },
        (error) => {
          console.error('Error listening to live streams:', error)
        }
      )
    } catch (error) {
      console.error('Error setting up live streams listener:', error)
    }

    // Refresh every 10 seconds for view count updates
    const interval = setInterval(fetchLiveStreams, 10000)

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
      clearInterval(interval)
    }
  }, [])

  // Calculate stream duration helper
  const calculateStreamDuration = (startTime) => {
    if (!startTime) return '0 min'
    const now = new Date()
    const start = startTime instanceof Date ? startTime : new Date(startTime)
    const diffMs = now - start
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just started'
    if (diffMins < 60) return `${diffMins} min`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}min`
  }

  // Force stop stream function
  const handleStopStream = async (stream) => {
    setStoppingStream(stream.id)
    try {
      if (stream.collection === 'users') {
        // Update user document
        const userRef = doc(db, 'users', stream.hostId)
        await updateDoc(userRef, {
          isLive: false,
          liveStreamData: null,
          liveEndedAt: serverTimestamp(),
          liveEndedBy: 'admin'
        })
      } else {
        // Update stream document
        const streamRef = doc(db, stream.collection, stream.id)
        await updateDoc(streamRef, {
          status: 'ended',
          endedAt: serverTimestamp(),
          endedBy: 'admin'
        })
        
        // Also update user if hostId exists
        if (stream.hostId) {
          try {
            const userRef = doc(db, 'users', stream.hostId)
            await updateDoc(userRef, {
              isLive: false,
              liveStreamData: null
            })
          } catch (e) {
            console.log('Could not update user document:', e)
          }
        }
      }
      
      showToast('Stream stopped successfully', 'success')
    } catch (error) {
      console.error('Error stopping stream:', error)
      showToast('Error stopping stream', 'error')
    }
    setStoppingStream(null)
  }

  // Fetch revenue analytics
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const now = new Date()
        const todayStart = new Date(now.setHours(0, 0, 0, 0))
        const todayEnd = new Date(now.setHours(23, 59, 59, 999))
        const todayStartTs = Timestamp.fromDate(todayStart)
        const todayEndTs = Timestamp.fromDate(todayEnd)

        let todayRevenue = 0
        let coinsPurchasedToday = 0
        let coinsSpentToday = 0
        const hostEarnings = {}

        // Try transactions collection
        try {
          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('createdAt', '>=', todayStartTs),
            where('createdAt', '<=', todayEndTs)
          )
          const transactionsSnapshot = await getDocs(transactionsQuery)
          
          transactionsSnapshot.forEach(doc => {
            const data = doc.data()
            const type = (data.type || '').toLowerCase()
            const amount = Number(data.amount) || 0
            const value = Number(data.value) || Number(data.amount) || 0

            if (type === 'purchase' || type === 'credit') {
              todayRevenue += value
              coinsPurchasedToday += amount
            } else if (type === 'spend' || type === 'debit') {
              coinsSpentToday += amount
            } else if (type === 'earn' || type === 'earning') {
              const hostId = data.hostId || data.host_id || data.userId || ''
              if (hostId) {
                hostEarnings[hostId] = (hostEarnings[hostId] || 0) + amount
              }
            }
          })
        } catch (error) {
          console.log('transactions collection not found or error:', error)
        }

        // Try coin_transactions collection
        try {
          const coinTransactionsQuery = query(
            collection(db, 'coin_transactions'),
            where('createdAt', '>=', todayStartTs),
            where('createdAt', '<=', todayEndTs)
          )
          const coinTransactionsSnapshot = await getDocs(coinTransactionsQuery)
          
          coinTransactionsSnapshot.forEach(doc => {
            const data = doc.data()
            const type = (data.type || '').toLowerCase()
            const amount = Number(data.amount) || 0
            const value = Number(data.value) || Number(data.amount) || 0

            if (type === 'purchase' || type === 'credit') {
              todayRevenue += value
              coinsPurchasedToday += amount
            } else if (type === 'spend' || type === 'debit') {
              coinsSpentToday += amount
            } else if (type === 'earn' || type === 'earning') {
              const hostId = data.hostId || data.host_id || data.userId || ''
              if (hostId) {
                hostEarnings[hostId] = (hostEarnings[hostId] || 0) + amount
              }
            }
          })
        } catch (error) {
          console.log('coin_transactions collection not found or error:', error)
        }

        // Get top earning host
        let topHost = { name: 'N/A', amount: 0 }
        if (Object.keys(hostEarnings).length > 0) {
          const topHostId = Object.keys(hostEarnings).reduce((a, b) => 
            hostEarnings[a] > hostEarnings[b] ? a : b
          )
          try {
            // Fetch user document directly
            const { getDoc } = await import('firebase/firestore')
            const hostRef = doc(db, 'users', topHostId)
            const hostSnap = await getDoc(hostRef)
            if (hostSnap.exists()) {
              const hostData = hostSnap.data()
              topHost = {
                name: hostData.name || hostData.displayName || hostData.userName || 'Unknown',
                amount: hostEarnings[topHostId]
              }
            }
          } catch (e) {
            console.log('Could not fetch top host data:', e)
          }
        }

        setRevenueStats({
          todayRevenue,
          coinsPurchasedToday,
          coinsSpentToday,
          topEarningHost: topHost
        })
      } catch (error) {
        console.error('Error fetching revenue data:', error)
      }
    }

    fetchRevenueData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchRevenueData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    if (!date) return 'Just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'primary',
      trend: { positive: true, value: `${stats.totalUsers}`, label: 'registered users' },
    },
    {
      title: 'Active Users',
      value: (stats.activeUsers || 0).toLocaleString(),
      icon: UserCheck,
      color: 'secondary',
      trend: { positive: true, value: `${stats.activeUsers || 0}`, label: 'currently using app' },
    },
    {
      title: 'Active Tickets',
      value: stats.activeTickets,
      icon: Ticket,
      color: 'orange',
      trend: { positive: false, value: `${stats.activeTickets}`, label: 'need attention' },
    },
    {
      title: 'Approved Hosts',
      value: stats.approvedHosts,
      icon: Key,
      color: 'pink',
      trend: { positive: true, value: `${stats.approvedHosts}`, label: 'approved hosts' },
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary-500" />
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of your admin panel and key metrics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {lastUpdated ? getTimeAgo(lastUpdated) : 'Just now'}
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} delay={index * 0.1} />
        ))}
      </div>

      {/* Live Streaming Panel */}
      {liveStreams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card border-2 border-red-500 dark:border-red-600"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              LIVE HOSTS ({liveStreams.length})
            </h2>
          </div>
          <div className="space-y-3">
            {liveStreams.map((stream) => (
              <div
                key={stream.id}
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg">{stream.hostName}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      👁️ <span className="font-medium">{stream.viewCount}</span> viewers
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ <span className="font-medium">{calculateStreamDuration(stream.startTime)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      🪙 <span className="font-medium">{stream.coinsPerMinute}</span> coins/min
                    </span>
                    {stream.numericUserId && stream.numericUserId !== 'N/A' && (
                      <span className="text-xs font-mono text-primary-600 dark:text-primary-400">
                        ID: {stream.numericUserId}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleStopStream(stream)}
                  disabled={stoppingStream === stream.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {stoppingStream === stream.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Stop Stream
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Revenue Analytics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Today's Revenue"
          value={`₹${revenueStats.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          trend={{ positive: true, value: "Today", label: "total revenue" }}
        />
        <StatCard
          title="Coins Purchased"
          value={revenueStats.coinsPurchasedToday.toLocaleString()}
          icon={TrendingUp}
          color="blue"
          trend={{ positive: true, value: "Today", label: "coins bought" }}
        />
        <StatCard
          title="Coins Spent"
          value={revenueStats.coinsSpentToday.toLocaleString()}
          icon={TrendingDown}
          color="orange"
          trend={{ positive: false, value: "Today", label: "coins used" }}
        />
        <StatCard
          title="Top Earning Host"
          value={revenueStats.topEarningHost.name}
          icon={Trophy}
          color="purple"
          trend={{ positive: true, value: `₹${revenueStats.topEarningHost.amount.toLocaleString()}`, label: "today" }}
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* User Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">User Activity (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.userActivity}>
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                  {activity.numericUserId && activity.numericUserId !== 'N/A' && (
                    <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                      ID: {activity.numericUserId}
                    </span>
                  )}
                </div>
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






