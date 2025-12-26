import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Copy, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { getUserById, approveUserForLive } from '../firebase/users'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const AccountApproval = () => {
  const { showToast } = useApp()
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  
  // Approval code modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalCode, setApprovalCode] = useState('')
  const [processingApproval, setProcessingApproval] = useState(false)
  
  // Total approved accounts count
  const [totalApproved, setTotalApproved] = useState(0)

  // Search user by ID
  const handleSearchUser = async () => {
    if (!userInput.trim()) {
      showToast('Please enter a user ID', 'error')
      return
    }

    setLoading(true)
    setError(null)
    setUser(null)

    try {
      // Try to find user by numericUserId first
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('numericUserId', '==', userInput.trim()))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // User found by numericUserId
        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()
        
        // Format user data
        let joinDate = 'N/A'
        let lastActive = 'N/A'
        
        if (userData.createdAt) {
          try {
            const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
            if (!isNaN(date.getTime())) {
              joinDate = date.toLocaleDateString()
            }
          } catch (e) {
            console.warn('Date parse error:', e)
          }
        }
        
        if (userData.lastActive) {
          try {
            const date = userData.lastActive.toDate ? userData.lastActive.toDate() : new Date(userData.lastActive)
            if (!isNaN(date.getTime())) {
              lastActive = date.toLocaleDateString()
            }
          } catch (e) {
            console.warn('Date parse error:', e)
          }
        }

        setUser({
          id: userDoc.id,
          numericUserId: userData.numericUserId || 'N/A',
          name: userData.name || userData.displayName || userData.userName || 'Unknown User',
          email: userData.email || 'No email',
          phone: userData.phone || userData.phoneNumber || 'N/A',
          role: userData.role || (userData.liveApprovalCode ? 'Host' : 'User'),
          status: userData.blocked ? 'Blocked' : 'Active',
          coins: Number(userData.coins) || 0,
          isLiveApproved: userData.isLiveApproved ?? false,
          liveApprovalCode: userData.liveApprovalCode || null,
          joinDate: joinDate,
          lastActive: lastActive,
          region: userData.region || 'N/A'
        })
      } else {
        // Try to find by document ID as fallback
        try {
          const result = await getUserById(userInput.trim())
          if (result.success && result.user) {
            const userData = result.user
            
            let joinDate = 'N/A'
            let lastActive = 'N/A'
            
            if (userData.createdAt) {
              try {
                const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
                if (!isNaN(date.getTime())) {
                  joinDate = date.toLocaleDateString()
                }
              } catch (e) {
                console.warn('Date parse error:', e)
              }
            }
            
            if (userData.lastActive) {
              try {
                const date = userData.lastActive.toDate ? userData.lastActive.toDate() : new Date(userData.lastActive)
                if (!isNaN(date.getTime())) {
                  lastActive = date.toLocaleDateString()
                }
              } catch (e) {
                console.warn('Date parse error:', e)
              }
            }

            setUser({
              id: userData.id,
              numericUserId: userData.numericUserId || 'N/A',
              name: userData.name || userData.displayName || userData.userName || 'Unknown User',
              email: userData.email || 'No email',
              phone: userData.phone || userData.phoneNumber || 'N/A',
              role: userData.role || (userData.liveApprovalCode ? 'Host' : 'User'),
              status: userData.blocked ? 'Blocked' : 'Active',
              coins: Number(userData.coins) || 0,
              isLiveApproved: userData.isLiveApproved ?? false,
              liveApprovalCode: userData.liveApprovalCode || null,
              joinDate: joinDate,
              lastActive: lastActive,
              region: userData.region || 'N/A'
            })
          } else {
            setError('User not found. Please check the user ID and try again.')
          }
        } catch (err) {
          setError('User not found. Please check the user ID and try again.')
        }
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setError('Error searching for user. Please try again.')
      showToast('Error searching for user', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Open approval modal
  const handleOpenApprovalModal = () => {
    setApprovalCode('')
    setShowApprovalModal(true)
  }

  // Approve user with code
  const handleApproveWithCode = async () => {
    if (!user) return
    
    if (!approvalCode || approvalCode.trim().length === 0) {
      showToast('Please enter a valid numeric ID', 'error')
      return
    }

    setProcessingApproval(true)
    try {
      const result = await approveUserForLive(user.id, approvalCode)
      if (result.success) {
        showToast(`User approved! Approval code: ${result.approvalCode}`, 'success')
        setShowApprovalModal(false)
        setApprovalCode('')
        // Refresh user data (count will update automatically via real-time listener)
        handleSearchUser()
      } else {
        showToast(result.error || 'Error approving user', 'error')
      }
    } catch (error) {
      console.error('Error approving user:', error)
      showToast('Error approving user', 'error')
    }
    setProcessingApproval(false)
  }

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (approvalCode) {
      navigator.clipboard.writeText(approvalCode)
      showToast('Code copied to clipboard!', 'success')
    }
  }

  // Real-time listener for total approved accounts count
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
          
          snapshot.forEach(doc => {
            const userData = doc.data()
            // Count users who have approval code assigned (approved by admin)
            if (userData.liveApprovalCode) {
              approvedCount++
            }
          })
          
          setTotalApproved(approvedCount)
        },
        (error) => {
          console.error('Error listening to approved count:', error)
          if (isMounted) {
            setTotalApproved(0)
          }
        }
      )
    } catch (error) {
      console.error('Error setting up approved count listener:', error)
    }

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Account Approval</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter user ID to find and approve account for live streaming
          </p>
        </div>
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <p className="text-white text-sm font-medium">Total Approved</p>
              <p className="text-white text-2xl font-bold">{totalApproved}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Enter User ID (Numeric User ID)
            </label>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchUser()
                }
              }}
              placeholder="Enter 7-digit user ID (e.g., 1765027)"
              className="input-field w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearchUser}
              disabled={loading || !userInput.trim()}
              className="btn-primary flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search User'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {/* User Profile Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">User Profile</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.isLiveApproved
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : user.liveApprovalCode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {user.isLiveApproved ? 'Live Approved' : user.liveApprovalCode ? 'Code Assigned' : 'Not Approved'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Avatar & Basic Info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{user.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                <div className="space-y-1">
                  <p className="text-sm font-mono font-bold text-primary-600 dark:text-primary-400">
                    User ID: {user.numericUserId}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    Doc ID: {user.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                    user.role === 'Host'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {user.role === 'Host' && '🎥 '}
                    {user.role || 'User'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium">{user.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                  <p className="font-medium">{user.coins.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                  <p className="font-medium">{user.joinDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Active</p>
                  <p className="font-medium">{user.lastActive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Code Display */}
          {user.liveApprovalCode && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                    Assigned Approval Code:
                  </p>
                  <p className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100 tracking-wider">
                    {user.liveApprovalCode}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user.liveApprovalCode)
                    showToast('Code copied to clipboard!', 'success')
                  }}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                  title="Copy Code"
                >
                  <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            </div>
          )}

          {/* Approve Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!user.isLiveApproved ? (
              <button
                onClick={handleOpenApprovalModal}
                className="btn-primary flex items-center gap-2 w-full md:w-auto"
              >
                <CheckCircle className="w-5 h-5" />
                {user.liveApprovalCode ? 'Change Approval Code' : 'Approve Account'}
              </button>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Account is already approved for live streaming
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      User can now go live in the app
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Approval Code Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false)
          setApprovalCode('')
        }}
        title="Assign Live Streaming Approval Code"
        size="md"
      >
        <div className="space-y-4">
          {user && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                User: <span className="font-semibold">{user.name}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter a unique numeric ID (digits only) that the user will need to enter in the app to activate live streaming access.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Unique Numeric ID
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={approvalCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setApprovalCode(value)
              }}
              placeholder="Enter unique numeric ID (digits only)"
              className="input-field w-full font-mono text-lg tracking-wider text-center"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter a unique numeric ID that will be assigned to this user for live streaming approval.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> The user will need to enter this numeric ID in the app to activate their live streaming access. Make sure this ID is unique.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowApprovalModal(false)
                setApprovalCode('')
              }}
              className="btn-secondary flex-1"
              disabled={processingApproval}
            >
              Cancel
            </button>
            <button
              onClick={handleApproveWithCode}
              className="btn-primary flex-1"
              disabled={processingApproval || !approvalCode || approvalCode.length === 0}
            >
              {processingApproval ? 'Assigning...' : 'Approve Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AccountApproval

