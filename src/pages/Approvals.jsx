import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Filter, Loader as LoaderIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { subscribeToCoinResellerApprovals, approveCoinReseller, rejectCoinReseller } from '../firebase/coinResellers'

const Approvals = () => {
  const { showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [approvalToReject, setApprovalToReject] = useState(null)

  // Fetch approvals from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToCoinResellerApprovals((approvalsData) => {
      const processedApprovals = approvalsData
        .filter(approval => approval.status === 'pending')
        .map(approval => {
          const data = approval
          return {
            id: approval.id,
            name: data.name || data.userName || 'Unknown',
            email: data.email || 'No email',
            type: 'Reseller', // All approvals are for coin resellers
            appliedDate: data.createdAt ? (data.createdAt.toDate ? new Date(data.createdAt.toDate()).toLocaleDateString() : new Date(data.createdAt).toLocaleDateString()) : 'N/A',
            documents: data.documentsVerified ? 'Verified' : 'Pending',
            status: data.status || 'pending',
            numericUserId: data.numericUserId || 'N/A',
            phone: data.phone || '',
            region: data.region || ''
          }
        })
      setApprovals(processedApprovals)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleApprove = async (approvalId) => {
    setProcessing(true)
    try {
      const result = await approveCoinReseller(approvalId)
      if (result.success) {
        showToast('Account approved successfully!', 'success')
      } else {
        showToast(result.error || 'Error approving account', 'error')
      }
    } catch (error) {
      console.error('Error approving:', error)
      showToast('Error approving account', 'error')
    }
    setProcessing(false)
  }

  const handleReject = (approvalId) => {
    setApprovalToReject(approvalId)
    setShowRejectConfirm(true)
  }

  const confirmReject = async () => {
    if (!approvalToReject) return
    
    setProcessing(true)
    setShowRejectConfirm(false)
    try {
      const result = await rejectCoinReseller(approvalToReject)
      if (result.success) {
        showToast('Account rejected', 'success')
        setApprovalToReject(null)
      } else {
        showToast(result.error || 'Error rejecting account', 'error')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      showToast('Error rejecting account', 'error')
    }
    setProcessing(false)
  }

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (approval.numericUserId && approval.numericUserId.toString().includes(searchTerm))
    const matchesFilter = filterType === 'All' || approval.type === filterType
    return matchesSearch && matchesFilter && approval.status === 'pending'
  })

  const columns = [
    {
      header: 'User ID',
      accessor: 'numericUserId',
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400 block">
            {row.numericUserId || 'N/A'}
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
    {
      header: 'Account Type',
      accessor: 'type',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.type === 'Reseller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {row.type}
        </span>
      ),
    },
    { header: 'Applied Date', accessor: 'appliedDate' },
    {
      header: 'Documents',
      accessor: 'documents',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.documents === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.documents}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(row.id)}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50"
            title="Approve"
            disabled={processing}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleReject(row.id)}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
            title="Reject"
            disabled={processing}
          >
            <XCircle className="w-4 h-4" />
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
        <h1 className="text-3xl font-bold mb-2">Account Approvals</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve pending account registrations</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
              <p className="text-2xl font-bold">{filteredApprovals.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold">
                {approvals.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏪</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reseller Applications</p>
              <p className="text-2xl font-bold">
                {approvals.filter(a => a.type === 'Reseller').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search by User ID, name or email..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="All">All Types</option>
              <option value="User">Users</option>
              <option value="Reseller">Resellers</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Approvals Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Pending Approvals ({filteredApprovals.length})</h2>
          {filteredApprovals.length > 0 ? (
            <Table columns={columns} data={filteredApprovals} />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-medium mb-2">All caught up!</p>
              <p className="text-gray-600 dark:text-gray-400">No pending approvals at the moment.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => {
          setShowRejectConfirm(false)
          setApprovalToReject(null)
        }}
        title="Confirm Rejection"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reject this account request? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowRejectConfirm(false)
                setApprovalToReject(null)
              }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
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

export default Approvals


