import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, Eye, Ban, CheckCircle, Users as UsersIcon, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const Users = () => {
  const appContext = useApp()
  const showToast = appContext?.showToast || (() => {})
  const markUsersAsSeen = appContext?.markUsersAsSeen || (() => {})
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
                        lastActive = date.toLocaleDateString()
                      }
                    } catch (e) {
                      console.warn('Date parse error for lastActive:', e)
                    }
                  }
                  
                  // Determine role: if user has liveApprovalCode, they are a Host
                  const userRole = data.role || (data.liveApprovalCode ? 'Host' : 'User')
                  
                  usersData.push({
                    id: docSnapshot.id,
                    numericUserId: data.numericUserId || 'N/A',
                    name: data.name || data.displayName || data.userName || 'Unknown User',
                    email: data.email || 'No email',
                    role: userRole,
                    status: data.blocked ? 'Blocked' : 'Active',
                    coins: Number(data.coins) || 0,
                    joinDate: joinDate,
                    lastActive: lastActive,
                    phone: data.phone || '',
                    region: data.region || ''
                  })
                } catch (e) {
                  console.error('Error processing document:', docSnapshot.id, e)
                }
              })
              
              if (isMounted) {
                setUsers(usersData)
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
      await updateDoc(userRef, {
        ...updates,
        blocked: updates.status === 'Blocked'
      })
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



  // Filter users
  const filteredUsers = users.filter(user => {
    if (!user) return false
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.numericUserId || '').toLowerCase().includes(searchLower)
    
    const matchesFilter = filterStatus === 'All' || user.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // Show loading state
  if (loading && !error) {
    return (
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
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
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        </motion.div>
        <div className="card">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Error Loading Users</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  window.location.reload()
                }}
                className="btn-primary"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                }}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Define columns
  const columns = [
    {
      header: 'Numeric User ID',
      accessor: 'numericUserId',
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400 block">
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
        const email = row?.email || 'No email'
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-xs text-gray-500">{email}</p>
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
      render: (row) => row?.lastActive || 'N/A'
    },
    {
      header: 'Actions',
      render: (row) => {
        if (!row) return null
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
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Users Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all users and their activities</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search by name, email, or numeric user ID..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="All">All Users</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Users ({filteredUsers.length})</h2>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {users.length === 0 ? 'No users found' : 'No users match your search criteria'}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={filteredUsers} />
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
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {(selectedUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedUser.name || 'Unknown User'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.email || 'No email'}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">
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
                <p className="font-medium">{selectedUser.lastActive || 'N/A'}</p>
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
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default Users
