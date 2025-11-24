import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, Eye, Ban, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const Users = () => {
  const { showToast, markUsersAsSeen } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch users from Firebase with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            numericUserId: data.numericUserId || 'N/A',
            name: data.name || data.displayName || 'Unknown User',
            email: data.email || 'No email',
            role: data.role || 'User',
            status: data.blocked ? 'Blocked' : 'Active',
            coins: data.coins || 0,
            joinDate: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'N/A',
            lastActive: data.lastActive ? new Date(data.lastActive.toDate()).toLocaleDateString() : 'N/A',
            ...data
          }
        })
        setUsers(usersData)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching users:', error)
        showToast('Error loading users', 'error')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [showToast])

  // Mark users as seen when page loads
  useEffect(() => {
    if (!loading && users.length >= 0) {
      markUsersAsSeen()
    }
  }, [loading])

  // Update user function
  const handleUpdateUser = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId)
      const firebaseUpdates = {
        ...updates,
        blocked: updates.status === 'Blocked'
      }
      await updateDoc(userRef, firebaseUpdates)
      showToast(`User ${updates.status === 'Blocked' ? 'blocked' : 'activated'} successfully`)
    } catch (error) {
      console.error('Error updating user:', error)
      showToast('Error updating user', 'error')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.numericUserId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'All' || user.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  const columns = [
    {
      header: 'Numeric User ID',
      accessor: 'numericUserId',
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400 block">
            {row.numericUserId}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            Doc: {row.id.substring(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Coins',
      accessor: 'coins',
      render: (row) => <span className="font-semibold">{row.coins.toLocaleString()}</span>,
    },
    { header: 'Join Date', accessor: 'joinDate' },
    { header: 'Last Active', accessor: 'lastActive' },
    {
      header: 'Actions',
      render: (row) => (
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
            {row.status === 'Active' ? <Ban className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
          </button>
        </div>
      ),
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
        <Table columns={columns} data={filteredUsers} />
      </motion.div>

      {/* User Detail Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">
                    User ID: {selectedUser.numericUserId}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    Doc ID: {selectedUser.id}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                <p className="font-medium">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-medium">{selectedUser.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                <p className="font-medium">{selectedUser.coins.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                <p className="font-medium">{selectedUser.joinDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
                <p className="font-medium">{selectedUser.lastActive}</p>
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
        )}
      </Modal>
    </div>
  )
}

export default Users


