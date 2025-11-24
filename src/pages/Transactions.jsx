import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Upload, CheckCircle, Clock, XCircle, Eye, Search, Filter } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { collection, getDocs, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)

  // Fetch withdrawal requests from Firebase
  useEffect(() => {
    console.log('💰 Loading withdrawal requests...')
    
    const unsubscribe = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        console.log(`✅ Found ${snapshot.size} withdrawal requests`)
        
        const withdrawalsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            hostName: data.hostName || data.userName || data.name || 'Unknown Host',
            hostId: data.hostId || data.userId || '',
            numericUserId: data.numericUserId || 'N/A',
            amount: data.amount || 0,
            accountNumber: data.accountNumber || data.bankAccount || 'N/A',
            bankName: data.bankName || 'N/A',
            accountHolder: data.accountHolder || data.accountHolderName || data.hostName || 'N/A',
            ifscCode: data.ifscCode || data.ifsc || 'N/A',
            upiId: data.upiId || data.upi || 'N/A',
            paymentMethod: data.paymentMethod || 'Bank Transfer',
            status: (data.status || 'pending').toLowerCase(),
            requestDate: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'N/A',
            requestTime: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'N/A',
            paymentProof: data.paymentProof || data.paymentScreenshot || '',
            approvedBy: data.approvedBy || '',
            approvedAt: data.approvedAt ? new Date(data.approvedAt.toDate()).toLocaleString() : '',
            ...data
          }
        }).sort((a, b) => {
          const dateA = a.createdAt
          const dateB = b.createdAt
          if (!dateA) return 1
          if (!dateB) return -1
          return dateB.toDate() - dateA.toDate()
        })
        
        setWithdrawals(withdrawalsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading withdrawals:', error)
        setWithdrawals([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
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
        console.log('✅ Payment proof uploaded:', proofUrl)
        setUploading(false)
      }

      // Update withdrawal request status
      const withdrawalRef = doc(db, 'payments', selectedWithdrawal.id)
      await updateDoc(withdrawalRef, {
        status: 'paid',
        paymentProof: proofUrl,
        paymentScreenshot: proofUrl,
        approvedBy: 'admin',
        approvedAt: serverTimestamp(),
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log('✅ Withdrawal marked as paid')
      alert('✅ Payment approved successfully!')
      setShowModal(false)
      setPaymentScreenshot(null)
      setScreenshotPreview(null)
    } catch (error) {
      console.error('Error approving payment:', error)
      alert('❌ Error approving payment: ' + error.message)
    }
    setProcessing(false)
    setUploading(false)
  }

  const handleRejectPayment = async () => {
    if (!selectedWithdrawal) return
    if (!window.confirm('Are you sure you want to reject this withdrawal request?')) return

    setProcessing(true)
    try {
      const withdrawalRef = doc(db, 'payments', selectedWithdrawal.id)
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectedBy: 'admin',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      alert('❌ Withdrawal request rejected')
      setShowModal(false)
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('❌ Error rejecting request')
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
    const matchesSearch = 
      w.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.numericUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && w.status === filterStatus
  })

  const statusCounts = {
    all: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    paid: withdrawals.filter(w => ['paid', 'approved', 'completed'].includes(w.status)).length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length
  }

  const columns = [
    {
      header: 'Request ID',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
          #{row.id.substring(0, 8).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Host',
      render: (row) => (
        <div>
          <p className="font-medium">{row.hostName}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
            ID: {row.numericUserId}
          </p>
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Payment</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage host withdrawal requests and payments
        </p>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold">{statusCounts.paid}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-bold">{statusCounts.rejected}</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search by host name, ID, or account..."
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
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Withdrawals Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Withdrawal Requests ({filteredWithdrawals.length})
          </h2>
        </div>
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {withdrawals.length === 0 
                ? 'No withdrawal requests yet. Requests will appear here when hosts request withdrawals.' 
                : 'No requests match your filter.'}
            </p>
          </div>
        ) : (
          <Table columns={columns} data={filteredWithdrawals} />
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
                <p className="text-xs text-gray-500 mb-1">Amount</p>
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
                  <p className="font-bold text-primary-600 dark:text-primary-400 font-mono">
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

            {/* Bank Details */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                {selectedWithdrawal.paymentMethod === 'UPI' ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">UPI ID</p>
                    <p className="font-mono font-bold text-primary-600 dark:text-primary-400">
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
    </div>
  )
}

export default Transactions


