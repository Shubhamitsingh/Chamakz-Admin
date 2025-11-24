import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Eye, Trash2, Archive, CheckCircle, Clock, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, collectionGroup, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const Feedback = () => {
  const { showToast } = useApp()
  const [activeTab, setActiveTab] = useState('new') // 'new' or 'read'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [feedback, setFeedback] = useState([])
  const [foundIn, setFoundIn] = useState('')

  useEffect(() => {
    const fetchFeedback = async () => {
      console.log('🔍 Searching for feedback in Firebase...')
      setLoading(true)
      
      try {
        // Method 1: Try root collections
        const rootCollections = [
          'feedback',
          'userFeedback',
          'feedbacks',
          'user_feedback',
          'appFeedback',
          'app_feedback',
          'reviews',
          'userReviews',
          'suggestions',
          'complaints'
        ]
        
        for (const collName of rootCollections) {
          try {
            const snapshot = await getDocs(collection(db, collName))
            if (snapshot.size > 0) {
              console.log(`✅ Found ${snapshot.size} feedback entries in root collection: ${collName}`)
              setFoundIn(`Root collection: ${collName}`)
              const feedbackData = await processFeedback(snapshot)
              setFeedback(feedbackData)
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
          'feedback',
          'userFeedback',
          'feedbacks',
          'reviews',
          'suggestions'
        ]
        
        for (const collName of subCollectionNames) {
          try {
            const q = query(collectionGroup(db, collName))
            const snapshot = await getDocs(q)
            if (snapshot.size > 0) {
              console.log(`✅ Found ${snapshot.size} feedback entries in subcollection: ${collName}`)
              setFoundIn(`Subcollection: ${collName} (under users)`)
              const feedbackData = await processFeedback(snapshot)
              setFeedback(feedbackData)
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
          let allFeedback = []
          
          for (const userDoc of usersSnapshot.docs.slice(0, 5)) { // Check first 5 users
            for (const subColl of ['feedback', 'userFeedback', 'feedbacks']) {
              try {
                const feedbackRef = collection(db, 'users', userDoc.id, subColl)
                const feedbackSnapshot = await getDocs(feedbackRef)
                if (feedbackSnapshot.size > 0) {
                  console.log(`✅ Found feedback under users/${userDoc.id}/${subColl}`)
                  setFoundIn(`users/{userId}/${subColl}`)
                  allFeedback = [...allFeedback, ...feedbackSnapshot.docs]
                }
              } catch (error) {
                // Continue
              }
            }
          }
          
          if (allFeedback.length > 0) {
            const feedbackData = await processFeedback({ docs: allFeedback })
            setFeedback(feedbackData)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Error checking user subcollections:', error)
        }

        console.log('⚠️ No feedback found anywhere')
        setFeedback([])
        setLoading(false)
        
      } catch (error) {
        console.error('Error fetching feedback:', error)
        showToast('Error loading feedback', 'error')
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  const processFeedback = async (snapshot) => {
    const feedbackPromises = snapshot.docs.map(async (feedbackDoc) => {
      const data = feedbackDoc.data()
      console.log('Processing feedback:', feedbackDoc.id, data)
      
      const userId = data.userId || data.uid || data.user_id || ''
      let numericUserId = data.numericUserId || data.numeric_user_id || data.userNumericId || 'N/A'
      
      // If feedback has userId but no numericUserId, fetch it from users collection
      if (userId && numericUserId === 'N/A') {
        try {
          const userRef = doc(db, 'users', userId)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const userData = userSnap.data()
            numericUserId = userData.numericUserId || 'N/A'
          }
        } catch (error) {
          console.log('Could not fetch user data:', error)
        }
      }
      
      return {
        id: feedbackDoc.id,
        path: feedbackDoc.ref.path,
        feedbackId: feedbackDoc.id.substring(0, 8).toUpperCase(),
        username: data.userName || data.username || data.name || data.userDisplayName || data.fullName || data.user || 'Unknown User',
        email: data.userEmail || data.email || data.emailAddress || data.contactEmail || 'N/A',
        userId: userId,
        numericUserId: numericUserId,
        subject: data.subject || data.title || data.feedbackTitle || 'No Subject',
        message: data.message || data.feedback || data.description || data.content || data.body || data.text || data.comment || 'No message',
        rating: data.rating || data.starRating || null,
        category: data.category || data.type || data.feedbackType || 'General',
        status: (data.status || data.feedbackStatus || 'new').toLowerCase(),
        created: formatDate(data.createdAt || data.createdDate || data.timestamp || data.created_at),
        createdTime: formatDateTime(data.createdAt || data.createdDate || data.timestamp || data.created_at),
        ...data
      }
    })
    
    const feedbackData = await Promise.all(feedbackPromises)
    
    return feedbackData.sort((a, b) => {
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
      case 'new':
      case 'unread':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'read':
      case 'viewed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'archived':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const handleUpdateStatus = async (feedbackId, newStatus) => {
    setProcessing(true)
    try {
      // Try to find the collection name from the feedback path
      const feedbackItem = feedback.find(f => f.id === feedbackId)
      if (!feedbackItem) {
        throw new Error('Feedback not found')
      }

      // Extract collection name from path (format: collectionName/docId or users/userId/collectionName/docId)
      const pathParts = feedbackItem.path.split('/')
      const isSubcollection = pathParts.length > 2
      
      let feedbackRef
      if (isSubcollection) {
        // Subcollection: users/userId/feedback/docId
        feedbackRef = doc(db, feedbackItem.path)
      } else {
        // Root collection: feedback/docId
        const collectionName = pathParts[0]
        feedbackRef = doc(db, collectionName, feedbackId)
      }

      await updateDoc(feedbackRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'read' && { readAt: serverTimestamp() }),
        ...(newStatus === 'archived' && { archivedAt: serverTimestamp() })
      })
      
      // Update local state
      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status: newStatus } : f
      ))
      
      console.log('✅ Feedback status updated to:', newStatus)
      showToast('Feedback status updated successfully')
      
      if (newStatus === 'read') {
        setShowFeedbackModal(false)
        setActiveTab('read')
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      showToast('Error updating feedback status', 'error')
    }
    setProcessing(false)
  }

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    setProcessing(true)
    try {
      const feedbackItem = feedback.find(f => f.id === feedbackId)
      if (!feedbackItem) {
        throw new Error('Feedback not found')
      }

      const pathParts = feedbackItem.path.split('/')
      const feedbackRef = doc(db, feedbackItem.path)

      await deleteDoc(feedbackRef)
      
      // Update local state
      setFeedback(prev => prev.filter(f => f.id !== feedbackId))
      setShowFeedbackModal(false)
      showToast('Feedback deleted successfully')
    } catch (error) {
      console.error('Error deleting feedback:', error)
      showToast('Error deleting feedback', 'error')
    }
    setProcessing(false)
  }

  // Separate feedback based on status
  const newFeedback = feedback.filter(f => {
    const isNew = ['new', 'unread'].includes(f.status.toLowerCase())
    return isNew
  })

  const readFeedback = feedback.filter(f => {
    const isRead = ['read', 'viewed', 'archived'].includes(f.status.toLowerCase())
    return isRead
  })

  // Filter based on active tab and search
  const currentTabFeedback = activeTab === 'new' ? newFeedback : readFeedback
  
  const filteredFeedback = currentTabFeedback.filter(f => {
    const matchesSearch = 
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.feedbackId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const statusCounts = {
    all: feedback.length,
    new: newFeedback.length,
    read: readFeedback.length,
  }

  const columns = [
    { 
      header: 'Feedback ID', 
      accessor: 'feedbackId',
      render: (row) => (
        <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
          #{row.feedbackId}
        </span>
      )
    },
    {
      header: 'User',
      accessor: 'username',
      render: (row) => (
        <div>
          <p className="font-medium">{row.username}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
            ID: {row.numericUserId}
          </p>
          {row.email !== 'N/A' && (
            <p className="text-xs text-gray-500">{row.email}</p>
          )}
        </div>
      ),
    },
    { 
      header: 'Subject', 
      accessor: 'subject',
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium">{row.subject}</p>
          <p className="text-xs text-gray-500 truncate">{row.message}</p>
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => (
        row.rating ? (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{row.rating}/5</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
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
    { header: 'Created', accessor: 'created' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedFeedback(row)
              setShowFeedbackModal(true)
              // Auto-mark as read when viewing
              if (row.status === 'new' || row.status === 'unread') {
                handleUpdateStatus(row.id, 'read')
              }
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">User Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage user feedback and suggestions</p>
        {foundIn && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            ✅ Feedback loaded from: {foundIn}
          </p>
        )}
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">New Feedback</p>
            <p className="text-2xl font-bold">{statusCounts.new}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
            <p className="text-2xl font-bold">{statusCounts.read}</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'new'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            New Feedback
            <span className="ml-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
              {statusCounts.new}
            </span>
            {activeTab === 'new' && (
              <motion.div
                layoutId="feedbackTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'read'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Read Feedback
            <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
              {statusCounts.read}
            </span>
            {activeTab === 'read' && (
              <motion.div
                layoutId="feedbackTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4">
          <SearchBar
            placeholder="Search by feedback ID, user, subject, or message..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </motion.div>

      {/* Feedback Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {activeTab === 'new' ? 'New Feedback' : 'Read Feedback'} ({filteredFeedback.length})
          </h2>
        </div>
        {filteredFeedback.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'new' ? (
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            ) : (
              <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            )}
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'new' 
                ? 'No new feedback. Great job!' 
                : 'No read feedback yet.'}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={filteredFeedback} />
        )}
      </motion.div>

      {/* Feedback Detail Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Feedback Details"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedFeedback.subject}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Feedback #{selectedFeedback.feedbackId}</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selectedFeedback.path}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedFeedback.status)}`}>
                  {selectedFeedback.status}
                </span>
                {selectedFeedback.rating && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <span>★</span>
                    <span>{selectedFeedback.rating}/5</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">User Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 font-medium">{selectedFeedback.username}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="ml-2 font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {selectedFeedback.numericUserId}
                  </span>
                </div>
                {selectedFeedback.email !== 'N/A' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium">{selectedFeedback.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="ml-2 font-medium">{selectedFeedback.createdTime}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="ml-2 font-medium">{selectedFeedback.category}</span>
                </div>
              </div>
            </div>

            {/* Feedback Message - Prominent Container */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Feedback Message</h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 min-h-[100px]">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.message || 'No message provided'}
                </p>
              </div>
            </div>

            {/* Read Status Message */}
            {selectedFeedback.status === 'read' && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700 text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Feedback Read
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setShowFeedbackModal(false)} 
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                disabled={processing}
              >
                Close
              </button>
              {selectedFeedback.status === 'new' || selectedFeedback.status === 'unread' ? (
                <button 
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'read')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={processing}
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Read
                </button>
              ) : (
                <button 
                  onClick={() => handleDeleteFeedback(selectedFeedback.id)} 
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
    </div>
  )
}

export default Feedback


