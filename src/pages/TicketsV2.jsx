import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Filter, Eye, CheckCircle, Clock, AlertCircle, Trash2, Ticket } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, collectionGroup, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const TicketsV2 = () => {
  const { markTicketsAsSeen, showToast } = useApp()
  const [activeTab, setActiveTab] = useState('in-progress') // 'in-progress' or 'resolved'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [tickets, setTickets] = useState([])
  const [foundIn, setFoundIn] = useState('')

  useEffect(() => {
    const fetchTickets = async () => {
      console.log('🔍 Searching for tickets in Firebase...')
      setLoading(true)
      
      try {
        // Method 1: Try root collections
        const rootCollections = [
          'supportTickets',      // Found in user's Firebase!
          'tickets', 'support', 'supportRequests', 'support_requests',
          'contactSupport', 'contact_support', 'helpdesk', 'complaints',
          'feedback', 'queries', 'issues', 'help'
        ]
        
        for (const collName of rootCollections) {
          try {
            const snapshot = await getDocs(collection(db, collName))
            if (snapshot.size > 0) {
              console.log(`✅ Found ${snapshot.size} tickets in root collection: ${collName}`)
              setFoundIn(`Root collection: ${collName}`)
              const ticketsData = await processTickets(snapshot)
              setTickets(ticketsData)
              setLoading(false)
              return
            }
          } catch (error) {
            // Continue to next collection
          }
        }

        // Method 2: Try collection groups (subcollections across all users)
        console.log('🔍 Trying collection groups (subcollections)...')
        const subCollectionNames = [
          'tickets', 'support', 'supportRequests', 'support_requests',
          'contactSupport', 'contact_support', 'helpdesk', 'userTickets'
        ]
        
        for (const collName of subCollectionNames) {
          try {
            const q = query(collectionGroup(db, collName))
            const snapshot = await getDocs(q)
            if (snapshot.size > 0) {
              console.log(`✅ Found ${snapshot.size} tickets in subcollection: ${collName}`)
              console.log('📄 Sample data:', snapshot.docs[0]?.data())
              setFoundIn(`Subcollection: ${collName} (under users)`)
              const ticketsData = await processTickets(snapshot)
              setTickets(ticketsData)
              setLoading(false)
              return
            }
          } catch (error) {
            console.log(`Could not access collection group: ${collName}`)
          }
        }

        // Method 3: Check under specific user paths
        console.log('🔍 Checking user subcollections...')
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'))
          let allTickets = []
          
          for (const userDoc of usersSnapshot.docs.slice(0, 5)) { // Check first 5 users
            for (const subColl of ['tickets', 'support', 'supportRequests']) {
              try {
                const ticketsRef = collection(db, 'users', userDoc.id, subColl)
                const ticketsSnapshot = await getDocs(ticketsRef)
                if (ticketsSnapshot.size > 0) {
                  console.log(`✅ Found tickets under users/${userDoc.id}/${subColl}`)
                  setFoundIn(`users/{userId}/${subColl}`)
                  allTickets = [...allTickets, ...ticketsSnapshot.docs]
                }
              } catch (error) {
                // Continue
              }
            }
          }
          
          if (allTickets.length > 0) {
            const ticketsData = await processTickets({ docs: allTickets })
            setTickets(ticketsData)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error checking user subcollections:', error)
        }

        console.log('⚠️ No tickets found anywhere')
        setTickets([])
        setLoading(false)
        
      } catch (error) {
        console.error('Error fetching tickets:', error)
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // Mark tickets as seen when page loads
  useEffect(() => {
    if (!loading && tickets.length >= 0) {
      // Mark all current tickets as seen
      markTicketsAsSeen()
    }
  }, [loading])

  const processTickets = async (snapshot) => {
    const ticketsPromises = snapshot.docs.map(async (ticketDoc) => {
      const data = ticketDoc.data()
      console.log('Processing ticket:', ticketDoc.id, data)
      
      const userId = data.userId || data.uid || data.user_id || ''
      let numericUserId = data.numericUserId || data.numeric_user_id || data.userNumericId || 'N/A'
      
      // If ticket has userId but no numericUserId, fetch it from users collection
      if (userId && numericUserId === 'N/A') {
        try {
          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            numericUserId = userData.numericUserId || 'N/A'
            console.log('Fetched numericUserId for user:', userId, numericUserId)
          }
        } catch (error) {
          console.log('Could not fetch user data:', error)
        }
      }
      
      return {
        id: ticketDoc.id,
        path: ticketDoc.ref.path,
        ticketId: ticketDoc.id.substring(0, 8).toUpperCase(),
        username: data.userName || data.username || data.name || data.userDisplayName || data.fullName || data.user || 'Unknown User',
        email: data.userEmail || data.email || data.emailAddress || data.contactEmail || 'N/A',
        userId: userId,
        numericUserId: numericUserId,
        issue: data.subject || data.issue || data.title || data.topic || data.issueType || data.ticketTitle || 'No subject',
        description: data.description || data.message || data.details || data.body || data.content || data.query || data.ticketMessage || 'No description',
        status: (data.status || data.ticketStatus || data.state || 'open').toLowerCase(),
        priority: (data.priority || data.ticketPriority || data.urgency || 'medium').toLowerCase(),
        category: data.category || data.type || data.issueCategory || 'General',
        assignedTo: data.assignedTo || data.handler || 'Unassigned',
        created: formatDate(data.createdAt || data.createdDate || data.timestamp || data.created_at),
        createdTime: formatDateTime(data.createdAt || data.createdDate || data.timestamp || data.created_at),
        ...data
      }
    })
    
    const ticketsData = await Promise.all(ticketsPromises)
    
    return ticketsData.sort((a, b) => {
      const dateA = a.createdAt || a.createdDate || a.timestamp || a.created_at
      const dateB = b.createdAt || b.createdDate || b.timestamp || b.created_at
      if (!dateA) return 1
      if (!dateB) return -1
      return dateB.toDate() - dateA.toDate()
    })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      return new Date(timestamp.toDate()).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      return new Date(timestamp.toDate()).toLocaleString()
    } catch {
      return 'N/A'
    }
  }

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case 'open':
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in-progress':
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'resolved':
      case 'closed':
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    const priorityLower = priority.toLowerCase()
    switch (priorityLower) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
      case 'normal':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getCategoryColor = (category) => {
    const categoryLower = (category || 'general').toLowerCase()
    switch (categoryLower) {
      case 'technical':
      case 'tech':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'payment':
      case 'billing':
      case 'transaction':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'account':
      case 'profile':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'bug':
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'feature':
      case 'request':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setProcessing(true)
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId)
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'resolved' && { resolvedAt: serverTimestamp() }),
        ...(newStatus === 'closed' && { closedAt: serverTimestamp() })
      })
      
      console.log('✅ Ticket status updated to:', newStatus)
      
      // Close modal and switch to resolved tab if resolved
      if (newStatus === 'resolved') {
        setShowTicketModal(false)
        setActiveTab('resolved')
      }
    } catch (error) {
      showToast('Error updating ticket status', 'error')
    }
    setProcessing(false)
  }

  const handleDeleteTicket = (ticketId) => {
    setTicketToDelete(ticketId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return

    setProcessing(true)
    setShowDeleteConfirm(false)
    try {
      const ticketRef = doc(db, 'supportTickets', ticketToDelete)
      await deleteDoc(ticketRef)
      setShowTicketModal(false)
      setTicketToDelete(null)
      showToast('Ticket deleted successfully!', 'success')
    } catch (error) {
      showToast('Error deleting ticket', 'error')
    }
    setProcessing(false)
  }

  // Separate tickets based on status
  const inProgressTickets = tickets.filter(ticket => {
    const isInProgress = !['resolved', 'closed', 'completed'].includes(ticket.status.toLowerCase())
    return isInProgress
  })

  const resolvedTickets = tickets.filter(ticket => {
    const isResolved = ['resolved', 'closed', 'completed'].includes(ticket.status.toLowerCase())
    return isResolved
  })

  // Filter based on active tab and search
  const currentTabTickets = activeTab === 'in-progress' ? inProgressTickets : resolvedTickets
  
  const filteredTickets = currentTabTickets.filter(ticket => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      ticket.username.toLowerCase().includes(searchLower) ||
      ticket.ticketId.toLowerCase().includes(searchLower) ||
      ticket.issue.toLowerCase().includes(searchLower) ||
      ticket.email.toLowerCase().includes(searchLower) ||
      (ticket.category || 'general').toLowerCase().includes(searchLower)
    
    return matchesSearch
  })

  const statusCounts = {
    all: tickets.length,
    inProgress: inProgressTickets.length,
    resolved: resolvedTickets.length,
  }

  const columns = [
    { 
      header: 'Ticket ID', 
      accessor: 'ticketId',
      render: (row) => (
        <span className="font-mono font-semibold text-pink-600 dark:text-pink-400">
          #{row.ticketId}
        </span>
      )
    },
    {
      header: 'User',
      accessor: 'username',
      render: (row) => (
        <div>
          <p className="font-medium">{row.username}</p>
          <p className="text-xs text-pink-600 dark:text-pink-400 font-mono font-bold">
            ID: {row.numericUserId}
          </p>
          {row.email !== 'N/A' && (
            <p className="text-xs text-gray-500">{row.email}</p>
          )}
        </div>
      ),
    },
    { 
      header: 'Issue', 
      accessor: 'issue',
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium">{row.issue}</p>
          <p className="text-xs text-gray-500 truncate">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(row.category)}`}>
          {row.category || 'General'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(row.priority)}`}>
          {row.priority}
        </span>
      ),
    },
    { header: 'Created', accessor: 'created' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTicket(row)
              setShowTicketModal(true)
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(row.status === 'resolved' || row.status === 'closed') && (
            <button
              onClick={() => handleDeleteTicket(row.id)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      ),
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
    <div className="space-y-8 relative -mt-4">
      {/* 2D Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-orange-300 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <Ticket className="w-6 h-6 text-white" />
          </div>
          Tickets / Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and resolve customer support tickets</p>
        {foundIn && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✅ Tickets loaded from: {foundIn}
          </p>
        )}
      </motion.div>

      {/* Status Cards - 2D Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <AlertCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
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
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold">{statusCounts.inProgress}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            <p className="text-2xl font-bold">{statusCounts.resolved}</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 relative z-10"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'in-progress'
                ? 'text-pink-600 dark:text-pink-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            In Progress
            <span className="ml-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
              {statusCounts.inProgress}
            </span>
            {activeTab === 'in-progress' && (
              <motion.div
                layoutId="ticketTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'resolved'
                ? 'text-pink-600 dark:text-pink-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Resolved
            <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
              {statusCounts.resolved}
            </span>
            {activeTab === 'resolved' && (
              <motion.div
                layoutId="ticketTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"
              />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4">
          <SearchBar
            placeholder="Search by ticket ID, user, or issue..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }} 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 relative z-10"
        style={{ boxShadow: 'none' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            {activeTab === 'in-progress' ? 'In Progress Tickets' : 'Resolved Tickets'} ({filteredTickets.length})
          </h2>
        </div>
        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={activeTab === 'in-progress' ? Clock : CheckCircle}
            title={activeTab === 'in-progress' 
              ? 'No pending tickets' 
              : 'No resolved tickets'}
            description={activeTab === 'in-progress' 
              ? 'Great job! All tickets have been resolved. New support tickets will appear here when users submit them.'
              : 'Resolved tickets will appear here once you mark tickets as resolved.'}
          />
        ) : (
          <Table columns={columns} data={filteredTickets} />
        )}
      </motion.div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Ticket Details"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedTicket.issue}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ticket #{selectedTicket.ticketId}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selectedTicket.path}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">User Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 font-medium">{selectedTicket.username}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="ml-2 font-bold text-pink-600 dark:text-pink-400 font-mono">
                    {selectedTicket.numericUserId}
                  </span>
                </div>
                {selectedTicket.email !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium">{selectedTicket.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="ml-2 font-medium">{selectedTicket.createdTime}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="ml-2 font-medium">{selectedTicket.category}</span>
                </div>
              </div>
            </div>

            {/* Issue Description - Prominent Container */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Issue Description</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 min-h-[100px]">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Resolved Status Message */}
            {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Ticket Resolved
                </div>
              </div>
            )}

            {/* Bottom Actions - Clean Row */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowTicketModal(false)} 
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                disabled={processing}
              >
                Cancel
              </button>
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                <button 
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={processing}
                >
                  <CheckCircle className="w-5 h-5" />
                  Resolved
                </button>
              ) : (
                <button 
                  onClick={() => handleDeleteTicket(selectedTicket.id)} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={processing}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setTicketToDelete(null)
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this ticket? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setTicketToDelete(null)
              }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTicket}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TicketsV2

