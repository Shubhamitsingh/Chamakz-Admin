import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins, Eye, Search, TrendingUp, DollarSign, Users, Filter, Plus, CheckCircle, XCircle, Clock, UserPlus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import { collection, getDocs, doc, getDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  createCoinResellerApproval,
  subscribeToCoinResellerApprovals,
  approveCoinReseller,
  rejectCoinReseller,
  subscribeToCoinResellers,
  deleteCoinReseller
} from '../firebase/coinResellers'

const CoinReseller = () => {
  const { showToast } = useApp()
  const [activeTab, setActiveTab] = useState('approved') // 'approved' or 'pending'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedReseller, setSelectedReseller] = useState(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [resellerToReject, setResellerToReject] = useState(null)
  const [resellerToDelete, setResellerToDelete] = useState(null)
  const [showResellerModal, setShowResellerModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [resellers, setResellers] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({
    totalResellers: 0,
    totalCoinsSold: 0,
    totalRevenue: 0,
    activeResellers: 0,
    pendingApprovals: 0
  })

  // Form state for adding new reseller
  const [newReseller, setNewReseller] = useState({
    name: '',
    email: '',
    password: ''
  })

  // Fetch coin resellers from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToCoinResellers((resellersData) => {
      const processedResellers = resellersData.map(reseller => ({
        ...reseller,
        coinsSold: reseller.coinsSold || 0,
        revenue: reseller.revenue || 0,
        status: reseller.status || 'Active',
        performance: calculatePerformance(reseller.coinsSold || 0)
      }))
      
      setResellers(processedResellers)
      
      // Calculate statistics
      const totalResellers = processedResellers.length
      const totalCoinsSold = processedResellers.reduce((sum, r) => sum + (r.coinsSold || 0), 0)
      const totalRevenue = processedResellers.reduce((sum, r) => sum + (r.revenue || 0), 0)
      const activeResellers = processedResellers.filter(r => r.status === 'Active').length
      
      setStats(prev => ({
        ...prev,
        totalResellers,
        totalCoinsSold,
        totalRevenue,
        activeResellers
      }))
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch pending approvals
  useEffect(() => {
    const unsubscribe = subscribeToCoinResellerApprovals((approvals) => {
      const pending = approvals.filter(a => a.status === 'pending')
      setPendingApprovals(pending)
      setStats(prev => ({
        ...prev,
        pendingApprovals: pending.length
      }))
    })

    return () => unsubscribe()
  }, [])

  const calculatePerformance = (coinsSold) => {
    if (coinsSold >= 50000) return 'Excellent'
    if (coinsSold >= 30000) return 'Good'
    if (coinsSold >= 10000) return 'Average'
    return 'New'
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'Good':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Average':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'blocked':
      case 'inactive':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      if (timestamp.toDate) {
        return new Date(timestamp.toDate()).toLocaleDateString()
      }
      return new Date(timestamp).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  const handleAddReseller = async () => {
    if (!newReseller.name || !newReseller.email || !newReseller.password) {
      showToast('Please fill all required fields', 'error')
      return
    }

    if (newReseller.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    setProcessing(true)
    try {
      const result = await createCoinResellerApproval({
        name: newReseller.name,
        email: newReseller.email,
        password: newReseller.password
      })

      if (result.success) {
        showToast('Coin reseller added successfully! Waiting for approval.', 'success')
        setShowAddModal(false)
        setNewReseller({
          name: '',
          email: '',
          password: ''
        })
        setActiveTab('pending')
      } else {
        showToast(result.error || 'Error adding coin reseller', 'error')
      }
    } catch (error) {
      console.error('Error adding coin reseller:', error)
      showToast('Error adding coin reseller', 'error')
    }
    setProcessing(false)
  }

  const handleApprove = async (approvalId) => {
    setProcessing(true)
    try {
      const result = await approveCoinReseller(approvalId)
      if (result.success) {
        showToast('Coin reseller approved successfully!', 'success')
        setActiveTab('approved')
      } else {
        showToast(result.error || 'Error approving coin reseller', 'error')
      }
    } catch (error) {
      console.error('Error approving coin reseller:', error)
      showToast('Error approving coin reseller', 'error')
    }
    setProcessing(false)
  }

  const handleReject = (approvalId) => {
    setResellerToReject(approvalId)
    setShowRejectConfirm(true)
  }

  const confirmReject = async () => {
    if (!resellerToReject) return

    setProcessing(true)
    setShowRejectConfirm(false)
    try {
      const result = await rejectCoinReseller(resellerToReject)
      if (result.success) {
        showToast('Coin reseller rejected', 'success')
        setResellerToReject(null)
      } else {
        showToast(result.error || 'Error rejecting coin reseller', 'error')
      }
    } catch (error) {
      showToast('Error rejecting coin reseller', 'error')
    }
    setProcessing(false)
  }

  const handleDeleteReseller = (resellerId, numericUserId, resellerName) => {
    setResellerToDelete({ id: resellerId, numericUserId, name: resellerName })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteReseller = async () => {
    if (!resellerToDelete) return

    setProcessing(true)
    setShowDeleteConfirm(false)
    const { id, numericUserId, name } = resellerToDelete

    try {
      const result = await deleteCoinReseller(id, numericUserId)
      if (result.success) {
        showToast('Coin reseller deleted successfully', 'success')
        setResellerToDelete(null)
      } else {
        showToast(result.error || 'Error deleting coin reseller', 'error')
      }
    } catch (error) {
      showToast('Error deleting coin reseller', 'error')
    }
    setProcessing(false)
  }

  const filteredResellers = resellers.filter(reseller => {
    if (!reseller) return false
    
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      (reseller.name || '').toLowerCase().includes(searchLower) ||
      (reseller.email || '').toLowerCase().includes(searchLower) ||
      (reseller.numericUserId || '').toString().toLowerCase().includes(searchLower) ||
      (reseller.region || '').toLowerCase().includes(searchLower)
    
    const matchesFilter = filterStatus === 'All' || reseller.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const filteredApprovals = pendingApprovals.filter(approval => {
    const matchesSearch = 
      approval.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  const resellerColumns = [
    {
      header: 'Reseller',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
            ID: {row.numericUserId || 'N/A'}
          </p>
          {row.email && (
            <p className="text-xs text-gray-500">{row.email}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Region',
      accessor: 'region',
    },
    {
      header: 'Coins Sold',
      accessor: 'coinsSold',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">{row.coinsSold?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      header: 'Revenue',
      accessor: 'revenue',
      render: (row) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-semibold">₹{row.revenue?.toLocaleString() || 0}</span>
        </div>
      ),
    },
    {
      header: 'Performance',
      accessor: 'performance',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(row.performance)}`}>
          {row.performance}
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
      header: 'Join Date',
      accessor: 'joinDate',
      render: (row) => formatDate(row.joinDate),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedReseller(row)
              setShowResellerModal(true)
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteReseller(row.id, row.numericUserId, row.name)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            title="Delete Reseller"
            disabled={processing}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  const approvalColumns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
            {row.name?.charAt(0) || 'R'}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => row.phone || 'N/A',
    },
    {
      header: 'Region',
      accessor: 'region',
      render: (row) => row.region || 'N/A',
    },
    {
      header: 'Applied Date',
      accessor: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleApprove(row.id)}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            title="Approve"
            disabled={processing}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleReject(row.id)}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Coin Resellers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track coin reseller agents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Add Coin Reseller
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Resellers</p>
            <p className="text-2xl font-bold">{stats.totalResellers}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Coins Sold</p>
            <p className="text-2xl font-bold">{stats.totalCoinsSold.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Resellers</p>
            <p className="text-2xl font-bold">{stats.activeResellers}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
            <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
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
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'approved'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Approved Resellers
            <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
              {resellers.length}
            </span>
            {activeTab === 'approved' && (
              <motion.div
                layoutId="coinResellerTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            Pending Approvals
            <span className="ml-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
              {pendingApprovals.length}
            </span>
            {activeTab === 'pending' && (
              <motion.div
                layoutId="coinResellerTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-4">
          <SearchBar
            placeholder={activeTab === 'approved' ? "Search by name, email, Numeric ID, or region..." : "Search by name or email..."}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
      </motion.div>

      {/* Content based on active tab */}
      {activeTab === 'approved' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Approved Coin Resellers ({filteredResellers.length})</h2>
            {filterStatus !== 'All' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          {filteredResellers.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No approved coin resellers found</p>
            </div>
          ) : (
            <Table columns={resellerColumns} data={filteredResellers} />
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Pending Approvals ({filteredApprovals.length})</h2>
          </div>
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No pending approvals. All caught up!</p>
            </div>
          ) : (
            <Table columns={approvalColumns} data={filteredApprovals} />
          )}
        </motion.div>
      )}

      {/* Add Reseller Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setNewReseller({
            name: '',
            email: '',
            password: ''
          })
        }}
        title="Add New Coin Reseller"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={newReseller.name}
              onChange={(e) => setNewReseller({ ...newReseller, name: e.target.value })}
              placeholder="Enter reseller name"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              value={newReseller.email}
              onChange={(e) => setNewReseller({ ...newReseller, email: e.target.value })}
              placeholder="Enter email address"
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">This will be used for login</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input
              type="password"
              value={newReseller.password}
              onChange={(e) => setNewReseller({ ...newReseller, password: e.target.value })}
              placeholder="Enter password (min 6 characters)"
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowAddModal(false)
                setNewReseller({
                  name: '',
                  email: '',
                  password: ''
                })
              }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handleAddReseller}
              disabled={processing || !newReseller.name || !newReseller.email || !newReseller.password}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add Reseller'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reseller Detail Modal */}
      <Modal
        isOpen={showResellerModal}
        onClose={() => setShowResellerModal(false)}
        title="Reseller Details"
      >
        {selectedReseller && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{selectedReseller.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coin Reseller Profile</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedReseller.status)}`}>
                  {selectedReseller.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(selectedReseller.performance)}`}>
                  {selectedReseller.performance}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 font-medium">{selectedReseller.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="ml-2 font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {selectedReseller.numericUserId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="ml-2 font-medium">{selectedReseller.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                  <span className="ml-2 font-medium">{selectedReseller.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Region:</span>
                  <span className="ml-2 font-medium">{selectedReseller.region || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Join Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedReseller.joinDate)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Coins Sold</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {selectedReseller.coinsSold?.toLocaleString() || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ₹{selectedReseller.revenue?.toLocaleString() || 0}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {selectedReseller.totalTransactions || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowResellerModal(false)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => {
          setShowRejectConfirm(false)
          setResellerToReject(null)
        }}
        title="Confirm Rejection"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reject this coin reseller application? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowRejectConfirm(false)
                setResellerToReject(null)
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setResellerToDelete(null)
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "{resellerToDelete?.name}"? This action cannot be undone and will remove the reseller from all collections.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setResellerToDelete(null)
              }}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteReseller}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CoinReseller
