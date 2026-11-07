const TYPES = {
  recharge: 'ADMIN_RECHARGE',
  transfer: 'SELLER_TRANSFER',
  adjustment: 'ADMIN_ADJUSTMENT',
  reversal: 'REVERSAL',
}

const LIMITS = {
  perTransfer: 100000,
  dailySeller: 500000,
}

const clone = (value) => {
  if (value == null || typeof value !== 'object') return value
  if (typeof value.toDate === 'function') {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds || 0, toDate: value.toDate }
  }
  if (Array.isArray(value)) return value.map(clone)
  const copy = {}
  Object.entries(value).forEach(([key, nested]) => {
    copy[key] = typeof nested === 'function' ? nested : clone(nested)
  })
  return copy
}

const COLLECTIONS = ['diamond_wallets', 'diamond_transactions', 'notifications', 'admin_audit_logs', 'idempotency']

export const ensureLedger = (store) => {
  COLLECTIONS.forEach((key) => {
    if (!store[key]) store[key] = {}
  })
  if (!store.users) store.users = {}
  return store
}

const nowIso = () => new Date().toISOString()

const txId = () => `DM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

export const createLedgerStore = (users = {}) => ({
  users: clone(users),
  diamond_wallets: {},
  diamond_transactions: {},
  notifications: {},
  admin_audit_logs: {},
  idempotency: {},
})

const balanceOf = (user) => {
  const value = Number(user?.ucoin ?? user?.uCoins ?? user?.coins ?? 0)
  return Number.isFinite(value) ? value : 0
}

const writeBalance = (user, next) => {
  user.ucoin = next
  user.uCoins = next
  user.coins = next
}

const walletIdFor = (userId) => `wallet_${userId}`

const ensureWallet = (store, userId) => {
  const id = walletIdFor(userId)
  const user = store.users[userId]
  if (!user) throw Object.assign(new Error('User not found'), { code: 'user_not_found' })
  if (!store.diamond_wallets[id]) {
    const balance = balanceOf(user)
    store.diamond_wallets[id] = {
      walletId: id,
      userId,
      available: balance,
      totalCredited: balance,
      totalDebited: 0,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
  }
  const wallet = store.diamond_wallets[id]
  wallet.available = balanceOf(user)
  return wallet
}

export const findUser = (store, query) => {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return null
  const direct = store.users[needle] || store.users[query]
  if (direct) return { id: Object.keys(store.users).find((id) => store.users[id] === direct) || query, ...direct, docId: Object.keys(store.users).find((id) => store.users[id] === direct) }
  const entry = Object.entries(store.users).find(([, user]) => {
    const numeric = String(user.numericUserId || user.userId || '').toLowerCase()
    return numeric === needle || String(user.phone || '') === needle
  })
  if (!entry) return null
  return { docId: entry[0], id: entry[0], ...entry[1] }
}

const accountType = (user) => {
  if (user.diamondSellerStatus === 'approved') return 'Diamond Seller'
  if (user.role === 'Admin' || user.isAdmin) return 'Admin'
  if (user.isHost || user.role === 'Host') return 'Host'
  return 'User'
}

const eligible = (user) => {
  if (!user) return 'User not found'
  if (user.blocked || user.accountStatus === 'blocked') return 'This account is blocked'
  if (user.accountStatus === 'deleted') return 'This account is closed'
  return ''
}

const notify = (store, userId, title, body) => {
  const id = `ntf_${txId()}`
  store.notifications[id] = {
    id,
    userId,
    title,
    body,
    read: false,
    createdAt: nowIso(),
  }
}

const audit = (store, action, actorId, detail) => {
  const id = `aud_${txId()}`
  store.admin_audit_logs[id] = { id, action, actorId, detail, createdAt: nowIso() }
}

const commit = (store, work) => {
  ensureLedger(store)
  const snapshot = clone({
    users: store.users,
    diamond_wallets: store.diamond_wallets,
    diamond_transactions: store.diamond_transactions,
    notifications: store.notifications,
    admin_audit_logs: store.admin_audit_logs,
    idempotency: store.idempotency,
  })
  try {
    const result = work()
    return result
  } catch (error) {
    store.users = snapshot.users
    store.diamond_wallets = snapshot.diamond_wallets
    store.diamond_transactions = snapshot.diamond_transactions
    store.notifications = snapshot.notifications
    store.admin_audit_logs = snapshot.admin_audit_logs
    store.idempotency = snapshot.idempotency
    throw error
  }
}

const reject = (code, message) => {
  const error = new Error(message)
  error.code = code
  throw error
}

const positiveInt = (amount) => {
  const value = Number(amount)
  if (!Number.isInteger(value) || value <= 0) reject('invalid_amount', 'Enter a whole number of diamonds greater than zero')
  return value
}

export const adminRecharge = (store, input) => commit(store, () => {
  const key = String(input.idempotencyKey || '').trim()
  if (!key) reject('idempotency', 'Missing confirmation key')
  if (store.idempotency[key]) return { replayed: true, transaction: store.diamond_transactions[store.idempotency[key]] }

  const user = findUser(store, input.userQuery)
  if (!user?.docId) reject('user_not_found', 'No account matches that User ID')
  const blocked = eligible(user)
  if (blocked) reject('ineligible', blocked)
  if (accountType(user) === 'Admin' && input.actorRole !== 'superadmin') {
    reject('permission', 'Recharging an admin account needs Super Admin permission')
  }

  const amount = positiveInt(input.amount)
  const reason = String(input.reason || '').trim()
  if (!reason) reject('reason', 'A recharge reason is required')

  const record = store.users[user.docId]
  const wallet = ensureWallet(store, user.docId)
  if (input.failBeforeWrite) reject('forced_failure', 'Recharge stopped before any balance change')

  const previous = balanceOf(record)
  const next = previous + amount
  writeBalance(record, next)
  wallet.available = next
  wallet.totalCredited += amount
  wallet.updatedAt = nowIso()

  const id = txId()
  const transaction = {
    id,
    type: TYPES.recharge,
    senderUserId: input.actorId || 'admin',
    receiverUserId: user.docId,
    receiverNumericId: record.numericUserId || '',
    receiverName: record.name || record.displayName || 'User',
    quantity: amount,
    previousSenderBalance: null,
    newSenderBalance: null,
    previousReceiverBalance: previous,
    newReceiverBalance: next,
    initiatedBy: input.actorId || 'admin',
    status: 'completed',
    description: reason,
    createdAt: nowIso(),
  }
  store.diamond_transactions[id] = transaction
  store.idempotency[key] = id
  notify(store, user.docId, 'Diamonds received', `${amount.toLocaleString()} diamonds were added to your Chamak wallet.`)
  audit(store, TYPES.recharge, input.actorId || 'admin', { transactionId: id, userId: user.docId, amount })
  return { replayed: false, transaction, user: { ...record, docId: user.docId } }
})

const sellerDayTotal = (store, sellerId) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return Object.values(store.diamond_transactions).reduce((sum, row) => {
    if (row.type !== TYPES.transfer || row.senderUserId !== sellerId || row.status !== 'completed') return sum
    if (new Date(row.createdAt) < start) return sum
    return sum + row.quantity
  }, 0)
}

export const sellerTransfer = (store, input) => commit(store, () => {
  const key = String(input.idempotencyKey || '').trim()
  if (!key) reject('idempotency', 'Missing confirmation key')
  if (store.idempotency[key]) return { replayed: true, transaction: store.diamond_transactions[store.idempotency[key]] }

  const seller = findUser(store, input.sellerQuery)
  if (!seller?.docId) reject('seller_not_found', 'Seller account was not found')
  const sellerUser = store.users[seller.docId]
  if (sellerUser.diamondSellerStatus !== 'approved') reject('not_seller', 'Only an approved seller can transfer diamonds')
  if (sellerUser.diamondSellerStatus === 'suspended' || sellerUser.sellerSuspended) reject('suspended', 'This seller is suspended')
  const sellerWallet = ensureWallet(store, seller.docId)
  if (sellerWallet.status === 'frozen') reject('frozen', 'This wallet is frozen')

  const recipient = findUser(store, input.recipientQuery)
  if (!recipient?.docId) reject('user_not_found', 'No account matches that User ID')
  if (recipient.docId === seller.docId) reject('self', 'A seller cannot transfer diamonds to the same account')
  const blocked = eligible(store.users[recipient.docId])
  if (blocked) reject('ineligible', blocked)
  if (accountType(store.users[recipient.docId]) === 'Admin' && input.actorRole !== 'superadmin') {
    reject('permission', 'Transfers to an admin account need Super Admin permission')
  }

  const amount = positiveInt(input.amount)
  if (amount > LIMITS.perTransfer) reject('limit', `A transfer cannot exceed ${LIMITS.perTransfer.toLocaleString()} diamonds`)
  if (sellerDayTotal(store, seller.docId) + amount > LIMITS.dailySeller) reject('limit', 'This transfer is over the daily seller limit')
  const senderBalance = balanceOf(sellerUser)
  if (amount > senderBalance) reject('insufficient', 'Transfer rejected. The seller wallet does not have enough diamonds.')

  const receiverUser = store.users[recipient.docId]
  const receiverWallet = ensureWallet(store, recipient.docId)
  const previousReceiver = balanceOf(receiverUser)

  writeBalance(sellerUser, senderBalance - amount)
  if (input.failAfterDebit) reject('forced_failure', 'Transfer failed after the debit was prepared')
  writeBalance(receiverUser, previousReceiver + amount)

  sellerWallet.available = balanceOf(sellerUser)
  sellerWallet.totalDebited += amount
  sellerWallet.updatedAt = nowIso()
  receiverWallet.available = balanceOf(receiverUser)
  receiverWallet.totalCredited += amount
  receiverWallet.updatedAt = nowIso()

  const id = txId()
  const transaction = {
    id,
    type: TYPES.transfer,
    senderUserId: seller.docId,
    senderNumericId: sellerUser.numericUserId || '',
    senderName: sellerUser.name || 'Seller',
    receiverUserId: recipient.docId,
    receiverNumericId: receiverUser.numericUserId || '',
    receiverName: receiverUser.name || 'User',
    quantity: amount,
    previousSenderBalance: senderBalance,
    newSenderBalance: balanceOf(sellerUser),
    previousReceiverBalance: previousReceiver,
    newReceiverBalance: balanceOf(receiverUser),
    initiatedBy: seller.docId,
    status: 'completed',
    description: input.note || 'Seller transfer',
    createdAt: nowIso(),
  }
  store.diamond_transactions[id] = transaction
  store.idempotency[key] = id
  notify(store, recipient.docId, 'Diamonds received', `${sellerUser.name || 'A seller'} sent ${amount.toLocaleString()} diamonds.`)
  notify(store, seller.docId, 'Diamond transfer completed', `${amount.toLocaleString()} diamonds were sent to ${receiverUser.name || 'the recipient'}.`)
  audit(store, TYPES.transfer, seller.docId, { transactionId: id, amount })
  return { replayed: false, transaction }
})

export const setWalletFrozen = (store, input) => commit(store, () => {
  const user = findUser(store, input.userQuery)
  if (!user?.docId) reject('user_not_found', 'No account matches that User ID')
  const wallet = ensureWallet(store, user.docId)
  wallet.status = input.frozen ? 'frozen' : 'active'
  wallet.updatedAt = nowIso()
  store.users[user.docId].walletFrozen = Boolean(input.frozen)
  const title = input.frozen ? 'Wallet frozen' : 'Wallet unfrozen'
  notify(store, user.docId, title, input.frozen ? 'New diamond transfers from this wallet are paused.' : 'This wallet can transfer diamonds again.')
  audit(store, input.frozen ? 'WALLET_FROZEN' : 'WALLET_UNFROZEN', input.actorId || 'admin', { userId: user.docId })
  return wallet
})

export const setSellerStatus = (store, input) => commit(store, () => {
  const user = findUser(store, input.userQuery)
  if (!user?.docId) reject('user_not_found', 'No account matches that User ID')
  const status = input.status
  if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) reject('status', 'Unknown seller status')
  const record = store.users[user.docId]
  record.diamondSellerStatus = status
  record.sellerSuspended = status === 'suspended'
  ensureWallet(store, user.docId)
  audit(store, 'SELLER_STATUS', input.actorId || 'admin', { userId: user.docId, status })
  notify(store, user.docId, 'Seller account updated', `Seller status is now ${status}.`)
  return { ...record, docId: user.docId }
})

export const profileOf = (store, query) => {
  const user = findUser(store, query)
  if (!user?.docId) return null
  ensureLedger(store)
  const wallet = store.diamond_wallets[walletIdFor(user.docId)]
  const rows = Object.values(store.diamond_transactions).filter((row) => row.senderUserId === user.docId || row.receiverUserId === user.docId)
  const received = rows.filter((row) => row.receiverUserId === user.docId && row.status === 'completed').reduce((sum, row) => sum + row.quantity, 0)
  const transferred = rows.filter((row) => row.senderUserId === user.docId && row.type === TYPES.transfer && row.status === 'completed').reduce((sum, row) => sum + row.quantity, 0)
  const last = rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  return {
    docId: user.docId,
    name: user.name || user.displayName || 'User',
    numericUserId: user.numericUserId || user.docId,
    photo: user.photoURL || user.profileImage || '',
    accountType: accountType(user),
    phoneVerified: Boolean(user.verified || user.phoneVerified),
    accountStatus: user.blocked ? 'Blocked' : 'Active',
    sellerStatus: user.diamondSellerStatus || 'none',
    balance: balanceOf(store.users[user.docId]),
    received,
    transferred,
    lastTransaction: last?.createdAt || null,
    walletStatus: wallet?.status || (user.walletFrozen ? 'frozen' : 'active'),
  }
}

export const summarize = (store) => {
  ensureLedger(store)
  const rows = Object.values(store.diamond_transactions)
  const completed = rows.filter((row) => row.status === 'completed')
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const today = completed.filter((row) => new Date(row.createdAt) >= start)
  const sum = (list, type) => list.filter((row) => !type || row.type === type).reduce((total, row) => total + row.quantity, 0)
  const circulation = Object.values(store.users).reduce((total, user) => total + balanceOf(user), 0)
  return {
    circulation,
    creditedByAdmin: sum(completed, TYPES.recharge),
    transferred: sum(completed, TYPES.transfer),
    receivedByUsers: sum(completed, TYPES.recharge) + sum(completed, TYPES.transfer),
    sellers: Object.values(store.users).filter((user) => user.diamondSellerStatus === 'approved').length,
    transactions: rows.length,
    todayRecharge: sum(today, TYPES.recharge),
    todayTransfer: sum(today, TYPES.transfer),
    pending: rows.filter((row) => row.status === 'pending').length,
    failed: rows.filter((row) => row.status === 'failed').length,
    rows,
  }
}

export const LIMITS_PUBLIC = LIMITS
export const TX_TYPES = TYPES
