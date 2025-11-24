import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins, Plus, Minus, TrendingUp, TrendingDown, Search, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/StatCard'
import Table from '../components/Table'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import Loader from '../components/Loader'
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, onSnapshot, serverTimestamp, increment, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

const Wallet = () => {
  const { showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState('Credit')
  const [userId, setUserId] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const [transactions, setTransactions] = useState([])
  const [totalCoins, setTotalCoins] = useState(0)
  const [totalCredits, setTotalCredits] = useState(0)
  const [totalDebits, setTotalDebits] = useState(0)

  // Fetch transactions with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            user: data.userName || data.userEmail || 'Unknown User',
            userId: data.userId,
            type: data.type || 'Credit',
            amount: data.amount || 0,
            reason: data.reason || 'N/A',
            date: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'N/A',
            time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString() : 'N/A',
            ...data
          }
        }).sort((a, b) => {
          // Sort by date, newest first
          if (!a.createdAt) return 1
          if (!b.createdAt) return -1
          return b.createdAt.toDate() - a.createdAt.toDate()
        })
        
        setTransactions(transactionsData)
        
        // Calculate totals
        const credits = transactionsData
          .filter(t => t.type === 'Credit')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const debits = transactionsData
          .filter(t => t.type === 'Debit')
          .reduce((sum, t) => sum + t.amount, 0)
        
        setTotalCredits(credits)
        setTotalDebits(debits)
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching transactions:', error)
        showToast('Error loading transactions', 'error')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [showToast])

  // Fetch total coins from all wallets
  useEffect(() => {
    const fetchTotalCoins = async () => {
      try {
        // First, try to fetch from wallets collection
        const walletsSnapshot = await getDocs(collection(db, 'wallets'))
        if (walletsSnapshot.size > 0) {
          let total = 0
          walletsSnapshot.forEach(doc => {
            total += doc.data().balance || 0
          })
          setTotalCoins(total)
        } else {
          // If no wallets collection, sum from users
          const usersSnapshot = await getDocs(collection(db, 'users'))
          let total = 0
          usersSnapshot.forEach(doc => {
            total += doc.data().coins || 0
          })
          setTotalCoins(total)
        }
      } catch (error) {
        console.error('Error fetching total coins:', error)
      }
    }

    fetchTotalCoins()
  }, [transactions]) // Refetch when transactions change

  const filteredTransactions = transactions.filter(transaction =>
    transaction.user.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { header: 'Transaction ID', render: (row) => <span className="font-mono text-xs">#{row.id.substring(0, 8)}</span> },
    { header: 'User', accessor: 'user' },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.type === 'Credit' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`font-medium ${row.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
            {row.type}
          </span>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-bold ${row.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'Credit' ? '+' : '-'}{row.amount.toLocaleString()}
        </span>
      ),
    },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time' },
  ]

  const handleSearchUser = async () => {
    if (!userId || !userId.trim()) {
      showToast('Please enter a Numeric User ID', 'error')
      return
    }

    setProcessing(true)
    try {
      // Search by numericUserId field (try both string and number format)
      const usersRef = collection(db, 'users')
      const searchValue = userId.trim()
      
      // Try as string first
      let q = query(usersRef, where('numericUserId', '==', searchValue))
      let querySnapshot = await getDocs(q)
      
      // If not found, try as number (in case it's stored as number in Firebase)
      if (querySnapshot.empty && !isNaN(searchValue)) {
        q = query(usersRef, where('numericUserId', '==', Number(searchValue)))
        querySnapshot = await getDocs(q)
      }

      if (!querySnapshot.empty) {
        // User found
        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()
        const userCoins = userData.coins || 0
        
        // Check if wallet exists and sync if needed
        try {
          const walletsRef = collection(db, 'wallets')
          const walletQuery = query(walletsRef, where('userId', '==', userDoc.id))
          const walletSnapshot = await getDocs(walletQuery)
          
          if (walletSnapshot.empty) {
            // Create wallet if it doesn't exist (sync with user coins)
            await addDoc(walletsRef, {
              userId: userDoc.id,
              numericUserId: userData.numericUserId || userId.trim(),
              userName: userData.name || userData.displayName || 'Unknown User',
              userEmail: userData.email || 'No email',
              balance: userCoins,
              coins: userCoins,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            console.log(`✅ Created wallet for user ${userDoc.id} with ${userCoins} coins`)
          } else {
            // Update wallet if coins don't match
            const walletDoc = walletSnapshot.docs[0]
            const walletData = walletDoc.data()
            if (walletData.balance !== userCoins || walletData.coins !== userCoins) {
              await updateDoc(doc(db, 'wallets', walletDoc.id), {
                balance: userCoins,
                coins: userCoins,
                updatedAt: serverTimestamp()
              })
              console.log(`✅ Synced wallet for user ${userDoc.id}: ${userCoins} coins`)
            }
          }
        } catch (walletError) {
          console.log('Wallet sync skipped:', walletError.message)
        }
        
        setFoundUser({
          id: userDoc.id,
          numericUserId: userData.numericUserId || userId.trim(),
          name: userData.name || userData.displayName || 'Unknown User',
          email: userData.email || 'No email',
          role: userData.role || 'User',
          status: userData.blocked ? 'Blocked' : 'Active',
          coins: userCoins,
          ...userData
        })
        showToast('User found successfully!', 'success')
      } else {
        // Also try searching by document ID as fallback
        try {
          const userRef = doc(db, 'users', userId.trim())
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            const userData = userSnap.data()
            const userCoins = userData.coins || 0
            
            // Check if wallet exists and sync if needed
            try {
              const walletsRef = collection(db, 'wallets')
              const walletQuery = query(walletsRef, where('userId', '==', userSnap.id))
              const walletSnapshot = await getDocs(walletQuery)
              
              if (walletSnapshot.empty) {
                // Create wallet if it doesn't exist
                await addDoc(walletsRef, {
                  userId: userSnap.id,
                  numericUserId: userData.numericUserId || userId.trim(),
                  userName: userData.name || userData.displayName || 'Unknown User',
                  userEmail: userData.email || 'No email',
                  balance: userCoins,
                  coins: userCoins,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                })
                console.log(`✅ Created wallet for user ${userSnap.id} with ${userCoins} coins`)
              } else {
                // Sync wallet if coins don't match
                const walletDoc = walletSnapshot.docs[0]
                const walletData = walletDoc.data()
                if (walletData.balance !== userCoins || walletData.coins !== userCoins) {
                  await updateDoc(doc(db, 'wallets', walletDoc.id), {
                    balance: userCoins,
                    coins: userCoins,
                    updatedAt: serverTimestamp()
                  })
                  console.log(`✅ Synced wallet for user ${userSnap.id}: ${userCoins} coins`)
                }
              }
            } catch (walletError) {
              console.log('Wallet sync skipped:', walletError.message)
            }
            
            setFoundUser({
              id: userSnap.id,
              numericUserId: userData.numericUserId || userId.trim(),
              name: userData.name || userData.displayName || 'Unknown User',
              email: userData.email || 'No email',
              role: userData.role || 'User',
              status: userData.blocked ? 'Blocked' : 'Active',
              coins: userCoins,
              ...userData
            })
            showToast('User found successfully!', 'success')
          } else {
            setFoundUser(null)
            showToast('User not found. Please check the Numeric User ID.', 'error')
          }
        } catch (fallbackError) {
          setFoundUser(null)
          showToast('User not found. Please check the Numeric User ID.', 'error')
        }
      }
    } catch (error) {
      console.error('Error searching user:', error)
      showToast('Error searching user. Please try again.', 'error')
      setFoundUser(null)
    }
    setProcessing(false)
  }

  const handleAddTransaction = async () => {
    if (!foundUser || !amount || !reason) {
      showToast('Please search user and fill all fields', 'error')
      return
    }

    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    setProcessing(true)
    try {
      const userRef = doc(db, 'users', foundUser.id)
      
      // Get current user data to check if coins field exists
      const userSnap = await getDoc(userRef)
      const currentUserData = userSnap.data()
      const currentCoins = currentUserData?.coins || 0
      
      // Calculate new coin balance
      const newCoins = transactionType === 'Credit' 
        ? currentCoins + amountNum 
        : Math.max(0, currentCoins - amountNum) // Prevent negative coins
      
      // Update user's coins in users collection
      await updateDoc(userRef, {
        coins: newCoins,
        updatedAt: serverTimestamp()
      })
      
      console.log(`✅ Updated user ${foundUser.id}: ${currentCoins} → ${newCoins} coins`)

      // ALWAYS create/update wallets collection (required for app)
      try {
        const walletsRef = collection(db, 'wallets')
        const walletQuery = query(walletsRef, where('userId', '==', foundUser.id))
        const walletSnapshot = await getDocs(walletQuery)
        
        if (!walletSnapshot.empty) {
          // Update existing wallet
          const walletDoc = walletSnapshot.docs[0]
          await updateDoc(doc(db, 'wallets', walletDoc.id), {
            balance: newCoins,
            coins: newCoins, // Also add coins field for compatibility
            updatedAt: serverTimestamp()
          })
          console.log(`✅ Updated wallet for user ${foundUser.id}: ${newCoins} coins`)
        } else {
          // Create new wallet document (REQUIRED for app to work)
          await addDoc(walletsRef, {
            userId: foundUser.id,
            numericUserId: foundUser.numericUserId || 'N/A',
            userName: foundUser.name,
            userEmail: foundUser.email,
            balance: newCoins,
            coins: newCoins, // Both balance and coins for compatibility
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          console.log(`✅ Created new wallet for user ${foundUser.id}: ${newCoins} coins`)
        }
      } catch (walletError) {
        // Log error but don't fail the transaction
        console.error('⚠️ Wallet update error (non-critical):', walletError)
        // Still show success since user coins were updated
      }

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: foundUser.id,
        numericUserId: foundUser.numericUserId || 'N/A',
        userName: foundUser.name,
        userEmail: foundUser.email,
        type: transactionType,
        amount: amountNum,
        reason: reason,
        previousBalance: currentCoins,
        newBalance: newCoins,
        createdAt: serverTimestamp(),
        createdBy: 'admin'
      })

      console.log(`✅ Transaction recorded: ${transactionType} ${amountNum} coins`)
      showToast(`${transactionType} of ${amountNum} coins successful! New balance: ${newCoins}`, 'success')
      setShowTransactionModal(false)
      resetForm()
    } catch (error) {
      console.error('❌ Error adding transaction:', error)
      showToast(`Error processing transaction: ${error.message}`, 'error')
    }
    setProcessing(false)
  }

  const resetForm = () => {
    setUserId('')
    setFoundUser(null)
    setAmount('')
    setReason('')
  }

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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet & Coin Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage coin transactions and user wallets</p>
        </div>
        <button
          onClick={() => setShowTransactionModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Coins in System"
          value={totalCoins.toLocaleString()}
          icon={Coins}
          color="primary"
        />
        <StatCard
          title="Total Credits"
          value={totalCredits.toLocaleString()}
          icon={TrendingUp}
          color="secondary"
        />
        <StatCard
          title="Total Debits"
          value={totalDebits.toLocaleString()}
          icon={TrendingDown}
          color="orange"
        />
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <SearchBar
          placeholder="Search transactions by user..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Transaction History ({filteredTransactions.length})</h2>
        {filteredTransactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No transactions yet</p>
        ) : (
          <Table columns={columns} data={filteredTransactions} />
        )}
      </motion.div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          resetForm()
        }}
        title="Add New Transaction"
      >
        <div className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Transaction Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setTransactionType('Credit')}
                className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                  transactionType === 'Credit'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                Credit (Add Coins)
              </button>
              <button
                onClick={() => setTransactionType('Debit')}
                className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                  transactionType === 'Debit'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Minus className="w-5 h-5 mx-auto mb-1" />
                Debit (Remove Coins)
              </button>
            </div>
          </div>

          {/* User ID Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Enter Numeric User ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter unique Numeric User ID (e.g., 176197744680457)"
                className="input-field flex-1"
                disabled={processing}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchUser()
                  }
                }}
              />
              <button
                onClick={handleSearchUser}
                className="btn-primary flex items-center gap-2 px-4"
                disabled={processing}
              >
                <Search className="w-4 h-4" />
                {processing ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the unique Numeric User ID (e.g., 176197744680457) that appears in the Users page
            </p>
          </div>

          {/* User Profile Display */}
          {foundUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-4 rounded-lg border-2 border-primary-200 dark:border-primary-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{foundUser.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{foundUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="font-bold ml-2 text-primary-600 font-mono">{foundUser.numericUserId}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Role:</span>
                  <span className="font-semibold ml-2">{foundUser.role}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Current Coins:</span>
                  <span className="font-semibold ml-2 text-primary-600">{foundUser.coins.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-semibold ml-2 ${foundUser.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                    {foundUser.status}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Amount Input - Only show if user is found */}
          {foundUser && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field"
                  disabled={processing}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                  disabled={processing}
                >
                  <option value="">Select reason...</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Referral">Referral</option>
                  <option value="Reward">Reward</option>
                  <option value="Adjustment">Admin Adjustment</option>
                  <option value="Refund">Refund</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <button 
              onClick={() => {
                setShowTransactionModal(false)
                resetForm()
              }} 
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={processing}
            >
              Cancel
            </button>
            <button 
              onClick={handleAddTransaction} 
              className="btn-primary flex-1"
              disabled={!foundUser || processing}
            >
              {processing ? 'Processing...' : 'Add Transaction'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Wallet
