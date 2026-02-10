import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Upload, CheckCircle, Clock, XCircle, Eye, Search, Filter, Coins } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import { useApp } from '../context/AppContext'
import { collection, getDocs, doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const Transactions = () => {
  const { showToast, markTransactionsAsSeen } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Fetch withdrawal requests from Firebase
  useEffect(() => {
    console.log('💰 [Transactions] Starting to load withdrawal requests from Firebase...')
    console.log('💰 [Transactions] Collection: withdrawal_requests')
    
    const unsubscribe = onSnapshot(
      collection(db, 'withdrawal_requests'),
      async (snapshot) => {
        console.log(`✅ [Transactions] Firebase snapshot received: ${snapshot.size} documents`)
        
        if (snapshot.empty) {
          console.warn('⚠️ [Transactions] Collection is EMPTY - No withdrawal requests found!')
          console.warn('⚠️ [Transactions] Check if:')
          console.warn('   1. Collection name is correct: "withdrawal_requests"')
          console.warn('   2. Documents exist in Firebase Console')
          console.warn('   3. Firebase rules allow read access')
          setWithdrawals([])
          setLoading(false)
          return
        }
        
        // Log first document structure for debugging
        if (snapshot.docs.length > 0) {
          const firstDoc = snapshot.docs[0]
          const firstData = firstDoc.data()
          console.log('📄 [Transactions] Sample document structure:', {
            id: firstDoc.id,
            fields: Object.keys(firstData),
            sampleData: firstData
          })
        }
        
        const withdrawalsDataPromises = snapshot.docs.map(async (docSnapshot, index) => {
          const data = docSnapshot.data()
          const createdAt = data.createdAt || data.created_at || data.timestamp || data.requestDate
          const createdAtDate = createdAt 
            ? (createdAt.toDate ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : new Date(createdAt)))
            : null
          
          // Get hostId/userId
          const hostId = data.hostId || data.userId || data.user_id || ''
          
          // Get numericUserId - first try from withdrawal data, then fetch from user document
          let numericUserId = data.numericUserId || data.numeric_user_id || 'N/A'
          
          // If numericUserId is not in withdrawal data, fetch from users collection
          if (numericUserId === 'N/A' && hostId) {
            try {
              const userRef = doc(db, 'users', hostId)
              const userSnap = await getDoc(userRef)
              if (userSnap.exists()) {
                const userData = userSnap.data()
                numericUserId = userData.numericUserId || userData.numeric_user_id || userData.userNumericId || 'N/A'
              }
            } catch (error) {
              console.log('Could not fetch numericUserId from users collection:', error)
            }
          }
          
          const mappedData = {
            id: docSnapshot.id,
            hostName: data.hostName || data.userName || data.name || data.host_name || 'Unknown Host',
            hostId: hostId,
            numericUserId: numericUserId,
            coins: data.coins || data.coinsAmount || data.coins_amount || data.amount || 0,
            amount: data.amount || data.withdrawalAmount || data.withdrawal_amount || data.requestedAmount || 0,
            accountNumber: data.accountNumber || data.bankAccount || data.bank_account || data.account_number || 'N/A',
            bankName: data.bankName || data.bank_name || 'N/A',
            accountHolder: data.accountHolder || data.accountHolderName || data.account_holder || data.account_holder_name || data.hostName || data.userName || 'N/A',
            ifscCode: data.ifscCode || data.ifsc || data.ifsc_code || 'N/A',
            upiId: data.upiId || data.upi || data.upi_id || 'N/A',
            paymentMethod: data.paymentMethod || data.payment_method || data.method || 'Bank Transfer',
            status: (data.status || 'pending').toLowerCase().trim(),
            requestDate: createdAtDate ? createdAtDate.toLocaleDateString() : 'N/A',
            requestTime: createdAtDate ? createdAtDate.toLocaleString() : 'N/A',
            paymentProof: data.paymentProof || data.paymentScreenshot || data.payment_proof || data.payment_screenshot || '',
            approvedBy: data.approvedBy || data.approved_by || '',
            approvedAt: data.approvedAt 
              ? (data.approvedAt.toDate ? new Date(data.approvedAt.toDate()).toLocaleString() : new Date(data.approvedAt).toLocaleString())
              : '',
            createdAt: createdAtDate,
            ...data
          }
          
          // Log each mapped document for debugging
          if (index === 0) {
            console.log('🔍 [Transactions] First mapped document:', mappedData)
          }
          
          return mappedData
        })
        
        const withdrawalsData = await Promise.all(withdrawalsDataPromises)
        
        const sortedWithdrawals = withdrawalsData.sort((a, b) => {
          const dateA = a.createdAt
          const dateB = b.createdAt
          if (!dateA) return 1
          if (!dateB) return -1
          return dateB.getTime() - dateA.getTime()
        })
        
        console.log(`✅ [Transactions] Successfully mapped ${sortedWithdrawals.length} withdrawal requests`)
        console.log(`📊 [Transactions] Status breakdown:`, {
          all: sortedWithdrawals.length,
          pending: sortedWithdrawals.filter(w => w.status === 'pending').length,
          paid: sortedWithdrawals.filter(w => ['paid', 'approved', 'completed'].includes(w.status)).length,
          rejected: sortedWithdrawals.filter(w => w.status === 'rejected').length,
          other: sortedWithdrawals.filter(w => !['pending', 'paid', 'approved', 'completed', 'rejected'].includes(w.status)).length
        })
        
        setWithdrawals(sortedWithdrawals)
        setLoading(false)
        
        // Mark transactions as seen when page loads
        if (markTransactionsAsSeen) {
          markTransactionsAsSeen()
        }
      },
      (error) => {
        console.error('❌ [Transactions] ERROR loading withdrawals:', error)
        console.error('❌ [Transactions] Error code:', error.code)
        console.error('❌ [Transactions] Error message:', error.message)
        console.error('❌ [Transactions] Full error:', error)
        
        showToast(`Error loading withdrawal requests: ${error.message}`, 'error')
        setWithdrawals([])
        setLoading(false)
      }
    )

    return () => {
      console.log('🔄 [Transactions] Unsubscribing from withdrawal_requests collection')
      unsubscribe()
    }
  }, [showToast])

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error')
        return
      }
      
      setPaymentScreenshot(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleApprovePayment = async () => {
    if (!selectedWithdrawal) return

    setProcessing(true)
    setUploading(false)

    try {
      let proofUrl = selectedWithdrawal.paymentProof || ''

      // Upload screenshot if provided
      if (paymentScreenshot) {
        setUploading(true)
        const timestamp = Date.now()
        const filename = `payment_proofs/${timestamp}_${paymentScreenshot.name}`
        const storageRef = ref(storage, filename)
        
        await uploadBytes(storageRef, paymentScreenshot)
        proofUrl = await getDownloadURL(storageRef)
        setUploading(false)
      }

      // Update withdrawal request status
      const withdrawalRef = doc(db, 'withdrawal_requests', selectedWithdrawal.id)
      await updateDoc(withdrawalRef, {
        status: 'paid',
        paymentProof: proofUrl,
        paymentScreenshot: proofUrl,
        approvedBy: 'admin',
        approvedAt: serverTimestamp(),
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      showToast('Payment approved successfully!', 'success')
      setShowModal(false)
      setPaymentScreenshot(null)
      setScreenshotPreview(null)
    } catch (error) {
      showToast(`Error approving payment: ${error.message}`, 'error')
    }
    setProcessing(false)
    setUploading(false)
  }

  const handleRejectPayment = async () => {
    if (!selectedWithdrawal) return
    setShowRejectConfirm(true)
  }

  const confirmRejectPayment = async () => {
    if (!selectedWithdrawal) return
    
    setProcessing(true)
    setShowRejectConfirm(false)
    try {
      const withdrawalRef = doc(db, 'withdrawal_requests', selectedWithdrawal.id)
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectedBy: 'admin',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      showToast('Withdrawal request rejected', 'error')
      setShowModal(false)
    } catch (error) {
      showToast('Error rejecting request', 'error')
    }
    setProcessing(false)
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'paid':
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const filteredWithdrawals = withdrawals.filter(w => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      w.hostName.toLowerCase().includes(searchLower) ||
      w.numericUserId.toLowerCase().includes(searchLower) ||
      w.accountNumber.toLowerCase().includes(searchLower) ||
      (w.coins && w.coins.toString().includes(searchLower)) ||
      (w.amount && w.amount.toString().includes(searchLower))
    
    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && w.status === filterStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  const statusCounts = {
    all: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    paid: withdrawals.filter(w => ['paid', 'approved', 'completed'].includes(w.status)).length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length
  }

  const columns = [
    {
      header: 'Request ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-pink-600 dark:text-pink-400">
          #{row.id.substring(0, 8).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Host',
      accessor: 'hostName',
      render: (row) => (
        <div>
          <p className="font-medium">{row.hostName}</p>
          <p className="text-xs text-pink-600 dark:text-pink-400 font-mono font-bold">
            ID: {row.numericUserId}
          </p>
        </div>
      )
    },
    {
      header: 'Coins',
      accessor: 'coins',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          <div>
            <span className="font-bold text-pink-600 dark:text-pink-400">
              {row.coins ? row.coins.toLocaleString() : 'N/A'}
            </span>
            <span className="text-xs text-gray-500 ml-1">coins</span>
          </div>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className="font-bold text-lg text-green-600 dark:text-green-400">
          ₹{row.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.paymentMethod}</p>
          {row.paymentMethod === 'UPI' && row.upiId !== 'N/A' && (
            <p className="text-xs text-gray-500">{row.upiId}</p>
          )}
        </div>
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
      header: 'Request Date',
      accessor: 'requestDate'
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedWithdrawal(row)
            setPaymentScreenshot(null)
            setScreenshotPreview(row.paymentProof || null)
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
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-300 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          Transactions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage withdrawal requests and payment processing
        </p>
      </motion.div>

      {/* Status Cards - 2D Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
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
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold">{statusCounts.paid}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 flex items-center gap-4 relative overflow-hidden"
          style={{ boxShadow: 'none' }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 rounded-t-2xl"></div>
          <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(5deg)' }}>
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
        style={{ boxShadow: 'none', overflow: 'visible' }}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between" style={{ overflow: 'visible' }}>
          <SearchBar
            placeholder="Search by host name, ID, or account..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 items-center" style={{ position: 'relative', zIndex: 10001 }}>
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
            <ExportButton
              data={filteredWithdrawals}
              columns={columns}
              filename="withdrawal_requests"
              disabled={filteredWithdrawals.length === 0}
            />
          </div>
        </div>
      </motion.div>

      {/* Withdrawals Table */}
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
            Withdrawal Requests ({filteredWithdrawals.length})
          </h2>
        </div>
        {filteredWithdrawals.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title={withdrawals.length === 0 
              ? 'No withdrawal requests found' 
              : 'No requests match your search criteria'}
            description={withdrawals.length === 0 
              ? 'Withdrawal requests will appear here when hosts request payments from their earnings.'
              : 'Try adjusting your search or filter settings to find withdrawal requests.'}
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedWithdrawals} />
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredWithdrawals.length}
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

      {/* Withdrawal Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setPaymentScreenshot(null)
          setScreenshotPreview(null)
        }}
        title="Withdrawal Request Details"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize ${getStatusColor(selectedWithdrawal.status)}`}>
                  {selectedWithdrawal.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Coins</p>
                <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                  {selectedWithdrawal.coins ? selectedWithdrawal.coins.toLocaleString() : 'N/A'} coins
                </p>
                <p className="text-xs text-gray-500 mb-1 mt-2">Amount</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{selectedWithdrawal.amount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Host Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-3">Host Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-medium">{selectedWithdrawal.hostName}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="font-bold text-pink-600 dark:text-pink-400 font-mono">
                    {selectedWithdrawal.numericUserId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Request Date</p>
                  <p className="font-medium">{selectedWithdrawal.requestTime}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium">{selectedWithdrawal.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-3">Withdrawal Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Coins Requested</p>
                  <p className="font-bold text-lg text-pink-600 dark:text-pink-400">
                    {selectedWithdrawal.coins ? selectedWithdrawal.coins.toLocaleString() : 'N/A'} coins
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Withdrawal Amount</p>
                  <p className="font-bold text-lg text-green-600 dark:text-green-400">
                    ₹{selectedWithdrawal.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                {selectedWithdrawal.paymentMethod === 'UPI' ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">UPI ID</p>
                    <p className="font-mono font-bold text-pink-600 dark:text-pink-400">
                      {selectedWithdrawal.upiId}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Account Holder</p>
                      <p className="font-medium">{selectedWithdrawal.accountHolder}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Bank Name</p>
                      <p className="font-medium">{selectedWithdrawal.bankName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Account Number</p>
                      <p className="font-mono font-bold">{selectedWithdrawal.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">IFSC Code</p>
                      <p className="font-mono font-bold">{selectedWithdrawal.ifscCode}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upload Payment Screenshot */}
            {selectedWithdrawal.status === 'pending' && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="font-semibold mb-3 text-green-800 dark:text-green-400">
                  Upload Payment Proof
                </h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="input-field mb-2"
                  disabled={processing || uploading}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Upload screenshot of payment confirmation (optional but recommended)
                </p>

                {screenshotPreview && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                    <img 
                      src={screenshotPreview} 
                      alt="Payment Proof" 
                      className="w-full h-40 object-contain bg-white rounded-lg border"
                    />
                  </div>
                )}

                {uploading && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    ⏳ Uploading screenshot...
                  </p>
                )}
              </div>
            )}

            {/* Show Payment Proof if Paid */}
            {selectedWithdrawal.paymentProof && selectedWithdrawal.status === 'paid' && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Proof</h4>
                <img 
                  src={selectedWithdrawal.paymentProof} 
                  alt="Payment Proof" 
                  className="w-full h-48 object-contain bg-white rounded-lg border cursor-pointer"
                  onClick={() => window.open(selectedWithdrawal.paymentProof, '_blank')}
                />
                <p className="text-xs text-gray-500 mt-2">Click to view full size</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                disabled={processing}
              >
                Cancel
              </button>
              
              {selectedWithdrawal.status === 'pending' ? (
                <>
                  <button
                    onClick={handleRejectPayment}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    disabled={processing || uploading}
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprovePayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={processing || uploading}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Mark as Paid'}
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center py-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedWithdrawal.status === 'paid' 
                    ? `✅ Paid on ${selectedWithdrawal.approvedAt}` 
                    : `❌ Rejected`}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        title="Confirm Rejection"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reject this withdrawal request? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowRejectConfirm(false)}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmRejectPayment}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={processing}
            >
              {processing ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Transactions


