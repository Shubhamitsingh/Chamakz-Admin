import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchBar from '../components/SearchBar'
import Table from '../components/Table'

const Approvals = () => {
  const { data, approveAccount, rejectAccount } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')

  const filteredApprovals = data.pendingApprovals.filter(approval => {
    const matchesSearch = approval.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.id.toString().includes(searchTerm)
    const matchesFilter = filterType === 'All' || approval.type === filterType
    return matchesSearch && matchesFilter && approval.status === 'pending'
  })

  const columns = [
    {
      header: 'User ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
          {row.id}
        </span>
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
            onClick={() => approveAccount(row.id)}
            className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => rejectAccount(row.id)}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Reject"
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
              <p className="text-sm text-gray-600 dark:text-gray-400">User Registrations</p>
              <p className="text-2xl font-bold">
                {data.pendingApprovals.filter(a => a.type === 'User').length}
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
                {data.pendingApprovals.filter(a => a.type === 'Reseller').length}
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
    </div>
  )
}

export default Approvals


