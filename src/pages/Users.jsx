import { useState, useEffect } from 'react'
import { Eye, Ban, CheckCircle, Users as UsersIcon, AlertCircle, Video, VideoOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
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
      
      // If approving, set all host-related fields (CRITICAL for user app to show hosts)
      if (newStatus === true) {
        updateData.liveApprovalDate = serverTimestamp()
        updateData.role = 'Host'  // CRITICAL: User app queries hosts by role field
        updateData.isHost = true  // For user app compatibility
        updateData.hostStatus = 'approved'  // Status tracking
      } else {
        // If disapproving, clear approval date and reset role to User
        updateData.liveApprovalDate = null
        updateData.role = 'User'  // Reset role when disapproved
        updateData.isHost = false  // Remove host status
        updateData.hostStatus = null  // Clear status
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
      (user.email || '').toLowerCase().includes(searchLower) ||
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
          <span className="font-mono text-xs font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md block">
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
      header: 'Email',
      accessor: 'email',
      render: (row) => {
        const email = row?.email || 'No email'
        return (
          <div>
            <p className="text-sm font-medium">{email !== 'No email' ? email : <span className="text-gray-400 italic">No email</span>}</p>
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
          <StatusBadge tone={isHost ? 'info' : 'neutral'}>{role}</StatusBadge>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const status = row?.status || 'Active'
        return (
          <StatusBadge tone={status === 'Active' ? 'success' : 'danger'}>{status}</StatusBadge>
        )
      },
    },
    {
      header: 'Live Streaming',
      accessor: 'isActive',
      render: (row) => {
        const isApproved = row?.isActive === true // Only true means approved, everything else is not approved
        return (
          <StatusBadge tone={isApproved ? 'success' : 'danger'} icon={isApproved ? Video : VideoOff}>
            {isApproved ? 'Approved' : 'Not approved'}
          </StatusBadge>
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
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title="View Profile"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const newStatus = row.status === 'Active' ? 'Blocked' : 'Active'
                handleUpdateUser(row.id, { status: newStatus })
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              title={row.status === 'Active' ? 'Block' : 'Activate'}
            >
              {row.status === 'Active' ? (
                <Ban className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </button>
            <button
              onClick={() => handleToggleLiveApproval(row.id, isApproved)}
              className={`p-1.5 rounded-md ${
                isApproved
                  ? 'hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700'
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

  if (loading && !error) {
    return (
      <div className="page-shell">
        <PageHeader title="Users" description="Loading users..." />
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell">
        <PageHeader title="Users" description="Manage accounts, permissions, and live streaming access." />
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
    <div className="page-shell">
      <PageHeader
        title="Users"
        description="Manage accounts, permissions, and live streaming access."
        actions={
          <button
            type="button"
            onClick={handleFixIncorrectPermissions}
            disabled={fixingPermissions || loading}
            className="btn-secondary"
            title="Fix new users who incorrectly have live permission enabled"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {fixingPermissions ? 'Fixing...' : 'Fix permissions'}
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiCard title="Total users" value={liveApprovalStats.total} icon={UsersIcon} />
        <KpiCard title="Live approved" value={liveApprovalStats.approved} icon={Video} />
        <KpiCard title="Not approved" value={liveApprovalStats.notApproved} icon={VideoOff} />
        <KpiCard title="Online now" value={activeUsersCount.toLocaleString()} icon={CheckCircle} hint="last 5 minutes" />
      </div>

      <div className="filter-bar">
        <SearchBar
          placeholder="Search name, email, phone, or user ID"
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border rounded-md px-2 py-1.5 bg-transparent">
          <option value="All">All status</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
          <option value="Currently Using App">Currently using app</option>
        </select>
        <select value={filterLiveApproval} onChange={(e) => setFilterLiveApproval(e.target.value)} className="text-xs border rounded-md px-2 py-1.5 bg-transparent">
          <option value="All">All live status</option>
          <option value="Approved">Live approved</option>
          <option value="Not Approved">Not approved</option>
        </select>
        <ExportButton data={filteredUsers} columns={columns} filename="users" disabled={filteredUsers.length === 0} />
      </div>

      <Panel title="All users" action={<span className="text-[11px] text-gray-500">{filteredUsers.length} shown</span>} padded={false}>
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={users.length === 0 ? 'No users found' : 'No users match your search'}
            description={users.length === 0
              ? 'Users will appear here once they register in the app.'
              : 'Try adjusting search or filters.'}
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedUsers} />
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
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
          </>
        )}
      </Panel>

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
                <h3 className="text-sm font-semibold">{selectedUser.name || 'Unknown User'}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedUser.email && selectedUser.email !== 'No email' 
                    ? selectedUser.email 
                    : 'No email'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser.phone && selectedUser.phone !== 'No phone' 
                    ? `Ph: ${selectedUser.phone}` 
                    : 'No phone'}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md inline-block">
                    User ID: {selectedUser.numericUserId || 'N/A'}
                  </p>
                  <p className="text-xs font-mono text-gray-500">
                    Doc ID: {selectedUser.id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Email</p>
                <p className="font-medium">{selectedUser.email && selectedUser.email !== 'No email' ? selectedUser.email : 'No email'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Phone</p>
                <p className="font-medium">{selectedUser.phone && selectedUser.phone !== 'No phone' ? selectedUser.phone : 'No phone'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Role</p>
                <p className="font-medium">{selectedUser.role || 'User'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Status</p>
                <p className="font-medium">{selectedUser.status || 'Active'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Coins</p>
                <p className="font-medium">{((selectedUser.coins) || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Join date</p>
                <p className="font-medium">{selectedUser.joinDate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Last active</p>
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
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Live streaming</p>
                <StatusBadge tone={selectedUser.isActive === true ? 'success' : 'danger'} icon={selectedUser.isActive === true ? Video : VideoOff}>
                  {selectedUser.isActive === true ? 'Approved' : 'Not approved'}
                </StatusBadge>
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
                className={`${selectedUser.isActive === true ? 'btn-danger' : 'btn-primary'} flex-1`}
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
