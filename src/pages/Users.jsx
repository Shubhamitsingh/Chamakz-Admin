import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, Eye, Ban, CheckCircle, Users as UsersIcon, AlertCircle, Video, VideoOff, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import { collection, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { fixIncorrectNewUserPermissions } from '../firebase/users'
import UserAvatar from '../components/UserAvatar'

const Users = () => {
  const appContext = useApp()
  const showToast = appContext?.showToast || (() => {})
  const markUsersAsSeen = appContext?.markUsersAsSeen || (() => {})
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterLiveApproval, setFilterLiveApproval] = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fixingPermissions, setFixingPermissions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [activeUsersCount, setActiveUsersCount] = useState(0) // Real-time currently active users (last 5 minutes)

  // Manual approval function - Only admin can approve/disapprove users for live streaming
  // Automatic fixing removed to prevent permission errors

  // Fetch users from Firebase
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true
    
    const fetchUsers = async () => {
      try {
        if (!db) {
          throw new Error('Firebase database not initialized')
        }
        
        const usersCollection = collection(db, 'users')
        
        // Real-time listener: Automatically updates when any user document changes
        // This includes changes to ucoin, coins, or any other field
        unsubscribe = onSnapshot(
          usersCollection,
          (snapshot) => {
            if (!isMounted) return
            
            try {
              const usersData = []
              
              snapshot.forEach((docSnapshot) => {
                try {
                  if (!docSnapshot.exists()) return
                  
                  const data = docSnapshot.data()
                  if (!data) return
                  
                  let joinDate = 'N/A'
                  let lastActive = 'N/A'
                  
                  // Parse dates safely
                  if (data.createdAt) {
                    try {
                      const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
                      if (!isNaN(date.getTime())) {
                        joinDate = date.toLocaleDateString()
                      }
                    } catch (e) {
                      console.warn('Date parse error for createdAt:', e)
                    }
                  }
                  
                  if (data.lastActive) {
                    try {
                      const date = data.lastActive.toDate ? data.lastActive.toDate() : new Date(data.lastActive)
                      if (!isNaN(date.getTime())) {
                        // Store the date object for better formatting
                        lastActive = date
                      }
                    } catch (e) {
                      console.warn('Date parse error for lastActive:', e)
                    }
                  }
                  
                  // Determine role: if user has liveApprovalCode, they are a Host
                  const userRole = data.role || (data.liveApprovalCode ? 'Host' : 'User')
                  
                  // IMPORTANT: New users default to isActive: false (NOT approved for live streaming)
                  // Only admin can approve users manually via the approve/disapprove buttons
                  // If isActive field doesn't exist or is false/undefined → user is NOT approved
                  const isActive = data.isActive === true // Only explicitly true means approved
                  
                  // Get coins - check ucoin first (real user coins), then fallback to coins
                  // Real-time: This will update automatically when ucoin or coins field changes
                  const userCoins = Number(data.ucoin ?? data.coins ?? 0)
                  
                  // Get phone number - try multiple field name variations
                  const userPhone = data.phone || data.phoneNumber || data.userPhone || data.user_phone || data.mobile || data.mobileNumber || ''
                  
                  usersData.push({
                    id: docSnapshot.id,
                    numericUserId: data.numericUserId || 'N/A',
                    name: data.name || data.displayName || data.userName || 'Unknown User',
                    email: data.email || 'No email', // Keep for backward compatibility
                    role: userRole,
                    status: data.blocked ? 'Blocked' : 'Active',
                    coins: userCoins,
                    joinDate: joinDate,
                    lastActive: lastActive,
                    phone: userPhone || 'No phone',
                    region: data.region || '',
                    isActive: isActive // Live streaming approval: false by default, only admin can approve
                  })
                } catch (e) {
                  console.error('Error processing document:', docSnapshot.id, e)
                }
              })
              
              // Note: Users with incorrect permissions are detected but NOT automatically fixed
              // Admin must manually approve/disapprove users using the approve/disapprove buttons
              // This prevents Firebase permission errors
              
              if (isMounted) {
                setUsers(usersData)
                
                // Calculate currently active users (lastActive within last 5 minutes)
                const now = new Date()
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
                let activeCount = 0
                
                usersData.forEach(user => {
                  if (user.lastActive && user.lastActive instanceof Date) {
                    if (user.lastActive >= fiveMinutesAgo) {
                      activeCount++
                    }
                  }
                })
                
                setActiveUsersCount(activeCount)
                setLoading(false)
                setError(null)
              }
            } catch (error) {
              console.error('Error processing snapshot:', error)
              if (isMounted) {
                setError(error.message || 'Error processing users data')
                setLoading(false)
              }
            }
          },
          (error) => {
            console.error('Firebase error:', error)
            if (isMounted) {
              setError(error.message || 'Error loading users from Firebase')
              setLoading(false)
            }
          }
        )
      } catch (error) {
        console.error('Error setting up listener:', error)
        if (isMounted) {
          setError(error.message || 'Error setting up Firebase connection')
          setLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Mark users as seen
  useEffect(() => {
    if (!loading && markUsersAsSeen && typeof markUsersAsSeen === 'function') {
      try {
        markUsersAsSeen()
      } catch (e) {
        console.error('Error marking users as seen:', e)
        // Ignore errors - non-critical
      }
    }
  }, [loading, markUsersAsSeen])

  // Update user function
  const handleUpdateUser = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }
      
      if (updates.status !== undefined) {
        updateData.blocked = updates.status === 'Blocked'
      }
      
      await updateDoc(userRef, updateData)
      if (showToast) {
        showToast(`User ${updates.status === 'Blocked' ? 'blocked' : 'activated'} successfully`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      if (showToast) {
        showToast('Error updating user', 'error')
      }
    }
  }

  // Manual toggle live streaming approval - Only admin can approve/disapprove
  const handleToggleLiveApproval = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId)
      const newStatus = !currentStatus
      
      // Prepare update data
      const updateData = {
        isActive: newStatus,
        updatedAt: serverTimestamp()
      }
      
      // If approving, set liveApprovalDate
      if (newStatus === true) {
        updateData.liveApprovalDate = serverTimestamp()
      } else {
        // If disapproving, clear approval date
        updateData.liveApprovalDate = null
      }
      
      await updateDoc(userRef, updateData)
      
      if (showToast) {
        showToast(
          `User ${newStatus ? 'approved' : 'disapproved'} for live streaming`,
          'success'
        )
      }
    } catch (error) {
      console.error('Error updating live streaming approval:', error)
      if (showToast) {
        showToast(`Error updating live streaming approval: ${error.message}`, 'error')
      }
    }
  }

  // Manual fix function for incorrect permissions
  const handleFixIncorrectPermissions = async () => {
    setFixingPermissions(true)
    try {
      const result = await fixIncorrectNewUserPermissions(7) // Check last 7 days
      if (result.success) {
        if (showToast) {
          showToast(result.message || `Fixed ${result.fixedCount} user(s)`, 'success')
        }
      } else {
        if (showToast) {
          showToast(result.error || 'Error fixing permissions', 'error')
        }
      }
    } catch (error) {
      console.error('Error fixing permissions:', error)
      if (showToast) {
        showToast('Error fixing permissions', 'error')
      }
    } finally {
      setFixingPermissions(false)
    }
  }



  // Filter users
  const filteredUsers = users.filter(user => {
    if (!user) return false
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.phone || '').toLowerCase().includes(searchLower) ||
      (user.numericUserId || '').toLowerCase().includes(searchLower)
    
    // Filter by status (includes Active, Blocked, Currently Using App)
    let matchesStatusFilter = true
    if (filterStatus !== 'All') {
      if (filterStatus === 'Active' || filterStatus === 'Blocked') {
        matchesStatusFilter = user.status === filterStatus
      } else if (filterStatus === 'Currently Using App') {
        // User must have lastActive and it must be within last 5 minutes
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
        matchesStatusFilter = user.lastActive && 
                             user.lastActive instanceof Date && 
                             user.lastActive >= fiveMinutesAgo
      }
    }
    
    const matchesLiveFilter = filterLiveApproval === 'All' || 
      (filterLiveApproval === 'Approved' && user.isActive === true) ||
      (filterLiveApproval === 'Not Approved' && user.isActive !== true)
    
    return matchesSearch && matchesStatusFilter && matchesLiveFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterLiveApproval])

  // Calculate stats
  const liveApprovalStats = {
    total: users.length,
    approved: users.filter(u => u.isActive === true).length,
    notApproved: users.filter(u => u.isActive !== true).length
  }

  // Define columns (must be defined before use in JSX)
  const columns = [
    {
      header: 'Numeric User ID',
      accessor: 'numericUserId',
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded block">
            {row?.numericUserId || 'N/A'}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            Doc: {(row?.id || '').substring(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => {
        const name = row?.name || 'Unknown'
        const phone = row?.phone || 'No phone'
        const phoneDisplay = phone !== 'No phone' ? `Ph: ${phone}` : phone
        const userId = row?.id || row?.numericUserId || name
        
        return (
          <div className="flex items-center gap-3">
            <UserAvatar 
              userId={userId} 
              name={name} 
              size="md"
            />
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-xs text-gray-500">{phoneDisplay}</p>
            </div>
          </div>
        )
      },
    },
    { 
      header: 'Role', 
      accessor: 'role',
      render: (row) => {
        const role = row?.role || 'User'
        const isHost = role === 'Host'
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isHost 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {isHost && '🎥 '}
            {role}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const status = row?.status || 'Active'
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'Active' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {status}
          </span>
        )
      },
    },
    {
      header: 'Live Streaming',
      accessor: 'isActive',
      render: (row) => {
        const isApproved = row?.isActive === true // Only true means approved, everything else is not approved
        return (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              isApproved 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isApproved ? (
                <>
                  <Video className="w-3 h-3" />
                  Approved
                </>
              ) : (
                <>
                  <VideoOff className="w-3 h-3" />
                  Not Approved
                </>
              )}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Coins',
      accessor: 'coins',
      render: (row) => <span className="font-semibold">{((row?.coins) || 0).toLocaleString()}</span>,
    },
    { 
      header: 'Join Date', 
      accessor: 'joinDate',
      render: (row) => row?.joinDate || 'N/A'
    },
    { 
      header: 'Last Active', 
      accessor: 'lastActive',
      render: (row) => {
        if (!row?.lastActive || row.lastActive === 'N/A') {
          return (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span className="text-sm text-gray-500">Never</span>
            </div>
          )
        }
        
        // If lastActive is a Date object, format it
        let lastActiveDate
        if (row.lastActive instanceof Date) {
          lastActiveDate = row.lastActive
        } else if (typeof row.lastActive === 'string') {
          // If it's already a formatted string, try to parse it
          try {
            lastActiveDate = new Date(row.lastActive)
            if (isNaN(lastActiveDate.getTime())) {
              return row.lastActive // Return as-is if can't parse
            }
          } catch (e) {
            return row.lastActive // Return as-is if error
          }
        } else {
          return 'N/A'
        }
        
        // Calculate time difference
        const now = new Date()
        const diffMs = now - lastActiveDate
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        
        // Determine status and display text
        let status = 'inactive'
        let displayText = ''
        
        if (diffMins < 5) {
          status = 'online'
          displayText = 'Currently Active'
        } else if (diffMins < 60) {
          status = 'recent'
          displayText = `${diffMins} mins ago`
        } else if (diffHours < 24) {
          status = 'recent'
          displayText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else if (diffDays < 7) {
          status = 'away'
          displayText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else {
          status = 'inactive'
          displayText = `Last seen: ${lastActiveDate.toLocaleDateString()}`
        }
        
        return (
          <div className="flex items-center gap-2" title={lastActiveDate.toLocaleString()}>
            <span 
              className={`w-2 h-2 rounded-full ${
                status === 'online' ? 'bg-green-500 animate-pulse' :
                status === 'recent' ? 'bg-yellow-500' :
                status === 'away' ? 'bg-orange-500' :
                'bg-gray-400'
              }`}
            ></span>
            <span className="text-sm">{displayText}</span>
          </div>
        )
      }
    },
    {
      header: 'Actions',
      render: (row) => {
        if (!row) return null
        const isApproved = row?.isActive === true // Only true means approved
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedUser(row)
                setShowUserModal(true)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="View Profile"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const newStatus = row.status === 'Active' ? 'Blocked' : 'Active'
                handleUpdateUser(row.id, { status: newStatus })
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={row.status === 'Active' ? 'Block' : 'Activate'}
            >
              {row.status === 'Active' ? (
                <Ban className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </button>
            <button
              onClick={() => handleToggleLiveApproval(row.id, isApproved)}
              className={`p-2 rounded-lg transition-colors ${
                isApproved
                  ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}
              title={isApproved ? 'Disapprove Live Streaming' : 'Approve Live Streaming'}
            >
              {isApproved ? (
                <VideoOff className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
            </button>
          </div>
        )
      },
    },
  ]

  // Show loading state
  if (loading && !error) {
    return (
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary-500" />
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </motion.div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-primary-500" />
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts, permissions, and live streaming access</p>
        </motion.div>
        <ErrorState
          error={new Error(error)}
          context="loading users"
          onRetry={() => {
            setError(null)
            setLoading(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 relative -mt-6">
      {/* 2D Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-pink-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-300 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between relative z-10"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts, permissions, and live streaming access</p>
        </div>
        <button
          onClick={handleFixIncorrectPermissions}
          disabled={fixingPermissions || loading}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          title="Fix new users who incorrectly have live permission enabled"
        >
          {fixingPermissions ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              Fix Permissions
            </>
          )}
        </button>
      </motion.div>

      {/* Stats Cards - 2D Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <UsersIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold">{liveApprovalStats.total}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
            <Video className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Live Approved</p>
            <p className="text-2xl font-bold">{liveApprovalStats.approved}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <VideoOff className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Not Approved</p>
            <p className="text-2xl font-bold">{liveApprovalStats.notApproved}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-primary-400 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            <p className="text-2xl font-bold">{activeUsersCount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">currently using app</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 relative z-10"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by name, phone number, or numeric user ID..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Currently Using App">Currently Using App</option>
            </select>
            <select
              value={filterLiveApproval}
              onChange={(e) => setFilterLiveApproval(e.target.value)}
              className="input-field"
            >
              <option value="All">All Live Status</option>
              <option value="Approved">Live Approved</option>
              <option value="Not Approved">Not Approved</option>
            </select>
            <ExportButton
              data={filteredUsers}
              columns={columns}
              filename="users"
              disabled={filteredUsers.length === 0}
            />
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 relative z-10"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="w-1 h-6 bg-pink-500 rounded-full"></div>
            All Users ({filteredUsers.length})
          </h2>
        </div>
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={users.length === 0 ? 'No users found' : 'No users match your search criteria'}
            description={users.length === 0
              ? 'Users will appear here once they register in the app.'
              : 'Try adjusting your search or filter settings to find users.'}
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedUsers} />
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage)
                    setCurrentPage(1)
                  }}
                />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar 
                userId={selectedUser.id || selectedUser.numericUserId || selectedUser.name} 
                name={selectedUser.name || 'User'} 
                size="lg"
                className="rounded-2xl"
              />
              <div>
                <h3 className="text-2xl font-bold">{selectedUser.name || 'Unknown User'}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedUser.phone && selectedUser.phone !== 'No phone' 
                    ? `Ph: ${selectedUser.phone}` 
                    : 'No phone'}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-mono font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded inline-block">
                    User ID: {selectedUser.numericUserId || 'N/A'}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    Doc ID: {selectedUser.id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                <p className="font-medium">{selectedUser.role || 'User'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-medium">{selectedUser.status || 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                <p className="font-medium">{((selectedUser.coins) || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                <p className="font-medium">{selectedUser.joinDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
                <div className="flex items-center gap-2">
                  {selectedUser.lastActive && selectedUser.lastActive !== 'N/A' && selectedUser.lastActive instanceof Date ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <p className="font-medium">
                        {(() => {
                          const now = new Date()
                          const diffMs = now - selectedUser.lastActive
                          const diffMins = Math.floor(diffMs / 60000)
                          const diffHours = Math.floor(diffMs / 3600000)
                          const diffDays = Math.floor(diffMs / 86400000)
                          
                          if (diffMins < 5) return 'Currently Active'
                          if (diffMins < 60) return `${diffMins} mins ago`
                          if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                          if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
                          return `Last seen: ${selectedUser.lastActive.toLocaleDateString()}`
                        })()}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium">N/A</p>
                  )}
                </div>
                {selectedUser.lastActive && selectedUser.lastActive instanceof Date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUser.lastActive.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Live Streaming Approval</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    selectedUser.isActive === true
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {selectedUser.isActive === true ? (
                      <>
                        <Video className="w-3 h-3" />
                        Approved
                      </>
                    ) : (
                      <>
                        <VideoOff className="w-3 h-3" />
                        Not Approved
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  const newStatus = selectedUser.status === 'Active' ? 'Blocked' : 'Active'
                  handleUpdateUser(selectedUser.id, { status: newStatus })
                  setShowUserModal(false)
                }}
                className={`${selectedUser.status === 'Active' ? 'btn-danger' : 'btn-primary'} flex-1`}
              >
                {selectedUser.status === 'Active' ? 'Block User' : 'Activate User'}
              </button>
              <button
                onClick={() => {
                  const currentApproval = selectedUser.isActive === true
                  handleToggleLiveApproval(selectedUser.id, currentApproval)
                  // Update local state to reflect change immediately
                  setSelectedUser({
                    ...selectedUser,
                    isActive: !currentApproval
                  })
                }}
                className={`${
                  selectedUser.isActive === true
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {selectedUser.isActive === true ? (
                  <>
                    <VideoOff className="w-4 h-4" />
                    Disapprove Live
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    Approve Live
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default Users
