import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Eye, Ban, UserX, CheckCircle, XCircle, Search, Filter, User, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import { collection, doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import UserAvatar from '../components/UserAvatar'

const Complaints = () => {
  const { showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [complaints, setComplaints] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Fetch complaints from Firebase
  useEffect(() => {
    console.log('📋 [Complaints] Starting to load complaints from Firebase...')
    
    const unsubscribe = onSnapshot(
      collection(db, 'complaints'),
      async (snapshot) => {
        console.log(`✅ [Complaints] Firebase snapshot received: ${snapshot.size} documents`)
        
        if (snapshot.empty) {
          console.warn('⚠️ [Complaints] Collection is EMPTY - No complaints found!')
          setComplaints([])
          setLoading(false)
          return
        }
        
        const complaintsDataPromises = snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data()
          const createdAt = data.createdAt || data.created_at || data.timestamp || data.submittedAt
          const createdAtDate = createdAt 
            ? (createdAt.toDate ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : new Date(createdAt)))
            : null
          
          // Get reporter info
          const reporterId = data.reporterId || data.reporter_id || data.userId || data.user_id || ''
          let reporterName = data.reporterName || data.reporter_name || data.userName || data.user_name || 'Unknown User'
          let reporterNumericId = data.reporterNumericId || data.reporter_numeric_id || 'N/A'
          
          // Get reported user info
          const reportedId = data.reportedId || data.reported_id || data.targetId || data.target_id || ''
          let reportedName = data.reportedName || data.reported_name || data.targetName || data.target_name || 'Unknown User'
          let reportedNumericId = data.reportedNumericId || data.reported_numeric_id || 'N/A'
          
          // Fetch reporter details if not in complaint data
          if (reporterId && reporterNumericId === 'N/A') {
            try {
              const reporterRef = doc(db, 'users', reporterId)
              const reporterSnap = await getDoc(reporterRef)
              if (reporterSnap.exists()) {
                const reporterData = reporterSnap.data()
                reporterName = reporterData.name || reporterData.displayName || reporterData.userName || reporterName
                reporterNumericId = reporterData.numericUserId || reporterData.numeric_user_id || reporterData.userNumericId || 'N/A'
              }
            } catch (error) {
              console.log('Could not fetch reporter details:', error)
            }
          }
          
          // Fetch reported user details if not in complaint data
          if (reportedId && reportedNumericId === 'N/A') {
            try {
              const reportedRef = doc(db, 'users', reportedId)
              const reportedSnap = await getDoc(reportedRef)
              if (reportedSnap.exists()) {
                const reportedData = reportedSnap.data()
                reportedName = reportedData.name || reportedData.displayName || reportedData.userName || reportedName
                reportedNumericId = reportedData.numericUserId || reportedData.numeric_user_id || reportedData.userNumericId || 'N/A'
              }
            } catch (error) {
              console.log('Could not fetch reported user details:', error)
            }
          }
          
          const mappedData = {
            id: docSnapshot.id,
            reporterId: reporterId,
            reporterName: reporterName,
            reporterNumericId: reporterNumericId,
            reportedId: reportedId,
            reportedName: reportedName,
            reportedNumericId: reportedNumericId,
            reason: data.reason || data.complaintReason || data.complaint_reason || data.description || data.message || 'No reason provided',
            category: data.category || data.complaintCategory || data.complaint_category || 'General',
            status: (data.status || 'pending').toLowerCase().trim(),
            priority: (data.priority || 'medium').toLowerCase().trim(),
            submittedAt: createdAtDate ? createdAtDate.toLocaleString() : 'N/A',
            submittedDate: createdAtDate ? createdAtDate.toLocaleDateString() : 'N/A',
            resolvedAt: data.resolvedAt 
              ? (data.resolvedAt.toDate ? new Date(data.resolvedAt.toDate()).toLocaleString() : new Date(data.resolvedAt).toLocaleString())
              : '',
            resolvedBy: data.resolvedBy || data.resolved_by || '',
            actionTaken: data.actionTaken || data.action_taken || '',
            createdAt: createdAtDate,
            ...data
          }
          
          return mappedData
        })
        
        const complaintsData = await Promise.all(complaintsDataPromises)
        
        const sortedComplaints = complaintsData.sort((a, b) => {
          const dateA = a.createdAt
          const dateB = b.createdAt
          if (!dateA) return 1
          if (!dateB) return -1
          return dateB.getTime() - dateA.getTime()
        })
        
        console.log(`✅ [Complaints] Successfully mapped ${sortedComplaints.length} complaints`)
        setComplaints(sortedComplaints)
        setLoading(false)
      },
      (error) => {
        console.error('❌ [Complaints] ERROR loading complaints:', error)
        showToast(`Error loading complaints: ${error.message}`, 'error')
        setComplaints([])
        setLoading(false)
      }
    )

    return () => {
      console.log('🔄 [Complaints] Unsubscribing from complaints collection')
      unsubscribe()
    }
  }, [showToast])

  // Fetch user details for modal
  const fetchUserDetails = async (userId) => {
    if (!userId) return null
    
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData = userSnap.data()
        return {
          id: userSnap.id,
          name: userData.name || userData.displayName || userData.userName || 'Unknown User',
          email: userData.email || 'No email',
          phone: userData.phone || userData.phoneNumber || userData.userPhone || userData.user_phone || userData.mobile || userData.mobileNumber || 'No phone',
          numericUserId: userData.numericUserId || userData.numeric_user_id || userData.userNumericId || 'N/A',
          role: userData.role || (userData.liveApprovalCode ? 'Host' : 'User'),
          status: userData.blocked ? 'Blocked' : 'Active',
          coins: Number(userData.ucoin) || Number(userData.coins) || 0,
          joinDate: userData.createdAt 
            ? (userData.createdAt.toDate ? userData.createdAt.toDate().toLocaleDateString() : new Date(userData.createdAt).toLocaleDateString())
            : 'N/A',
          isActive: userData.isActive === true,
          ...userData
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      return null
    }
  }

  const handleViewUser = async (userId) => {
    const userDetails = await fetchUserDetails(userId)
    if (userDetails) {
      setSelectedUser(userDetails)
      setShowUserModal(true)
    } else {
      showToast('Could not fetch user details', 'error')
    }
  }

  const handleResolveComplaint = async (action) => {
    if (!selectedComplaint) return

    setProcessing(true)
    try {
      const complaintRef = doc(db, 'complaints', selectedComplaint.id)
      await updateDoc(complaintRef, {
        status: 'resolved',
        resolvedBy: 'admin',
        resolvedAt: serverTimestamp(),
        actionTaken: action,
        updatedAt: serverTimestamp()
      })

      showToast('Complaint resolved successfully!', 'success')
      setShowModal(false)
    } catch (error) {
      showToast(`Error resolving complaint: ${error.message}`, 'error')
    }
    setProcessing(false)
  }

  const handleBlockUser = async () => {
    if (!selectedComplaint || !selectedComplaint.reportedId) return

    setProcessing(true)
    try {
      // Block the reported user
      const userRef = doc(db, 'users', selectedComplaint.reportedId)
      await updateDoc(userRef, {
        blocked: true,
        blockedAt: serverTimestamp(),
        blockedBy: 'admin',
        blockedReason: `Blocked due to complaint: ${selectedComplaint.id}`
      })

      // Resolve the complaint
      const complaintRef = doc(db, 'complaints', selectedComplaint.id)
      await updateDoc(complaintRef, {
        status: 'resolved',
        resolvedBy: 'admin',
        resolvedAt: serverTimestamp(),
        actionTaken: 'User Blocked',
        updatedAt: serverTimestamp()
      })

      showToast('User blocked and complaint resolved!', 'success')
      setShowModal(false)
    } catch (error) {
      showToast(`Error blocking user: ${error.message}`, 'error')
    }
    setProcessing(false)
  }

  const handleSuspendUser = async () => {
    if (!selectedComplaint || !selectedComplaint.reportedId) return

    setProcessing(true)
    try {
      // Suspend the reported user (add suspended flag)
      const userRef = doc(db, 'users', selectedComplaint.reportedId)
      await updateDoc(userRef, {
        suspended: true,
        suspendedAt: serverTimestamp(),
        suspendedBy: 'admin',
        suspendedReason: `Suspended due to complaint: ${selectedComplaint.id}`
      })

      // Resolve the complaint
      const complaintRef = doc(db, 'complaints', selectedComplaint.id)
      await updateDoc(complaintRef, {
        status: 'resolved',
        resolvedBy: 'admin',
        resolvedAt: serverTimestamp(),
        actionTaken: 'User Suspended',
        updatedAt: serverTimestamp()
      })

      showToast('User suspended and complaint resolved!', 'success')
      setShowModal(false)
    } catch (error) {
      showToast(`Error suspending user: ${error.message}`, 'error')
    }
    setProcessing(false)
  }

  const handleRejectComplaint = async () => {
    if (!selectedComplaint) return

    setProcessing(true)
    try {
      const complaintRef = doc(db, 'complaints', selectedComplaint.id)
      await updateDoc(complaintRef, {
        status: 'rejected',
        resolvedBy: 'admin',
        resolvedAt: serverTimestamp(),
        actionTaken: 'Complaint Rejected',
        updatedAt: serverTimestamp()
      })

      showToast('Complaint rejected', 'success')
      setShowModal(false)
    } catch (error) {
      showToast(`Error rejecting complaint: ${error.message}`, 'error')
    }
    setProcessing(false)
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'resolved':
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'investigating':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const filteredComplaints = complaints.filter(c => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      c.reporterName.toLowerCase().includes(searchLower) ||
      c.reportedName.toLowerCase().includes(searchLower) ||
      c.reporterNumericId.toLowerCase().includes(searchLower) ||
      c.reportedNumericId.toLowerCase().includes(searchLower) ||
      c.reason.toLowerCase().includes(searchLower) ||
      c.category.toLowerCase().includes(searchLower)
    
    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && c.status === filterStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  const statusCounts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'completed').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    investigating: complaints.filter(c => c.status === 'investigating').length
  }

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-pink-600 dark:text-pink-400">
          #{row.id.substring(0, 8).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Reporter',
      accessor: 'reporterName',
      render: (row) => (
        <div className="flex items-center gap-2">
          <UserAvatar 
            userId={row.reporterId || row.reporterNumericId} 
            name={row.reporterName} 
            size="sm"
          />
          <div>
            <p className="font-medium text-sm">{row.reporterName}</p>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-mono">
              ID: {row.reporterNumericId}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Reported User',
      accessor: 'reportedName',
      render: (row) => (
        <div className="flex items-center gap-2">
          <UserAvatar 
            userId={row.reportedId || row.reportedNumericId} 
            name={row.reportedName} 
            size="sm"
          />
          <div>
            <p className="font-medium text-sm">{row.reportedName}</p>
            <p className="text-xs text-pink-600 dark:text-pink-400 font-mono">
              ID: {row.reportedNumericId}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => (
        <div className="max-w-xs">
          <p className="text-sm font-medium truncate" title={row.reason}>
            {row.reason.length > 50 ? `${row.reason.substring(0, 50)}...` : row.reason}
          </p>
          <p className="text-xs text-gray-500 mt-1">{row.category}</p>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Submitted',
      accessor: 'submittedDate'
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedComplaint(row)
            setShowModal(true)
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-8 relative -mt-6">
      {/* 2D Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-pink-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-red-300 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          Complaints
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage user complaints and take appropriate actions
        </p>
      </motion.div>

      {/* Status Cards - 2D Style */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <Eye className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Investigating</p>
            <p className="text-2xl font-bold">{statusCounts.investigating}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            <p className="text-2xl font-bold">{statusCounts.resolved}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <XCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-bold">{statusCounts.rejected}</p>
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
          <SearchBar
            placeholder="Search by reporter, reported user, reason, or ID..."
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
              <option value="all">All Complaints</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ExportButton
              data={filteredComplaints}
              columns={columns}
              filename="complaints"
              disabled={filteredComplaints.length === 0}
            />
          </div>
        </div>
      </motion.div>

      {/* Complaints Table */}
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
            Complaints ({filteredComplaints.length})
          </h2>
        </div>
        {filteredComplaints.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={complaints.length === 0 
              ? 'No complaints found' 
              : 'No complaints match your search criteria'}
            description={complaints.length === 0 
              ? 'Complaints submitted by users will appear here.'
              : 'Try adjusting your search or filter settings to find complaints.'}
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedComplaints} />
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredComplaints.length}
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

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Complaint Details"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${getStatusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${getPriorityColor(selectedComplaint.priority)}`}>
                  {selectedComplaint.priority}
                </span>
              </div>
            </div>

            {/* Reporter Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Reporter Information
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar 
                  userId={selectedComplaint.reporterId || selectedComplaint.reporterNumericId} 
                  name={selectedComplaint.reporterName} 
                  size="lg"
                />
                <div>
                  <p className="font-medium">{selectedComplaint.reporterName}</p>
                  <p className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                    ID: {selectedComplaint.reporterNumericId}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Submitted</p>
                  <p className="font-medium">{selectedComplaint.submittedAt}</p>
                </div>
                <div>
                  <button
                    onClick={() => handleViewUser(selectedComplaint.reporterId)}
                    className="text-pink-600 dark:text-pink-400 hover:underline text-sm font-medium"
                  >
                    View Reporter Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Reported User Information */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Reported User
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar 
                  userId={selectedComplaint.reportedId || selectedComplaint.reportedNumericId} 
                  name={selectedComplaint.reportedName} 
                  size="lg"
                />
                <div>
                  <p className="font-medium">{selectedComplaint.reportedName}</p>
                  <p className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                    ID: {selectedComplaint.reportedNumericId}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Category</p>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <button
                    onClick={() => handleViewUser(selectedComplaint.reportedId)}
                    className="text-pink-600 dark:text-pink-400 hover:underline text-sm font-medium"
                  >
                    View Reported User Profile →
                  </button>
                </div>
              </div>
            </div>

            {/* Complaint Details */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-3">Complaint Reason</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedComplaint.reason}
              </p>
            </div>

            {/* Action Taken (if resolved) */}
            {selectedComplaint.status === 'resolved' && selectedComplaint.actionTaken && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2">Action Taken</h4>
                <p className="text-sm font-medium">{selectedComplaint.actionTaken}</p>
                {selectedComplaint.resolvedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resolved on: {selectedComplaint.resolvedAt}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {selectedComplaint.status === 'pending' || selectedComplaint.status === 'investigating' ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleViewUser(selectedComplaint.reportedId)}
                    className="px-4 py-2.5 border-2 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors font-semibold flex items-center justify-center gap-2"
                    disabled={processing}
                  >
                    <Eye className="w-4 h-4" />
                    View Reported User
                  </button>
                  <button
                    onClick={() => handleResolveComplaint('No Action Required')}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Resolve (No Action)'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleSuspendUser}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={processing}
                  >
                    <UserX className="w-4 h-4" />
                    {processing ? 'Processing...' : 'Suspend User'}
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={processing}
                  >
                    <Ban className="w-4 h-4" />
                    {processing ? 'Processing...' : 'Block User'}
                  </button>
                  <button
                    onClick={handleRejectComplaint}
                    className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Reject Complaint'}
                  </button>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                  disabled={processing}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleViewUser(selectedComplaint.reportedId)}
                  className="flex-1 px-4 py-2.5 border-2 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Reported User
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* User Profile Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="User Profile"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <UserAvatar 
                userId={selectedUser.id || selectedUser.numericUserId} 
                name={selectedUser.name} 
                size="xl"
              />
              <div>
                <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                <p className="text-sm text-pink-600 dark:text-pink-400 font-mono">
                  ID: {selectedUser.numericUserId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                <p className="font-medium">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className={`font-medium ${selectedUser.status === 'Blocked' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedUser.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coins</p>
                <p className="font-medium">{selectedUser.coins.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
                <p className="font-medium">{selectedUser.joinDate}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  window.location.href = `/users?search=${selectedUser.numericUserId}`
                }}
                className="w-full px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
              >
                View Full Profile in Users Page
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Complaints
