import { dataReady, liveRows } from '../data/liveStore'

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days, hour = 14) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  date.setHours(hour, 20, 0, 0)
  return date
}

export const SELLER_STATUSES = ['Active', 'Inactive']
export const REQUEST_STATUSES = ['Pending', 'Accepted', 'Processing', 'Completed', 'Rejected', 'Cancelled']
export const PAYOUT_STATUSES = ['Pending', 'Approved', 'Processing', 'Paid', 'Rejected']
export const ACCEPTED_STATUSES = ['Accepted', 'Processing', 'Completed']

const log = (action, at, actor = 'Admin User', note = '') => ({ action, actor, at, note })

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100

export const inr = (value) => `₹${round2(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const isValidWhatsapp = (value) => /^\+\d{10,15}$/.test(String(value).replace(/[\s-]/g, ''))
export const isValidUpi = (value) => /^[\w.-]{2,}@[a-z]{2,}$/i.test(String(value).trim())

export const inDateRange = (value, preset, from = '', to = '') => {
  if (!value) return false
  if (preset === 'all') return true
  const time = new Date(value).getTime()
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (preset === 'today') return time >= startToday
  if (preset === '7d') return time >= Date.now() - 7 * 86400000
  if (preset === '30d') return time >= Date.now() - 30 * 86400000
  if (preset === '90d') return time >= Date.now() - 90 * 86400000
  if (preset === 'month') return time >= new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  if (preset === 'custom') {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
    const end = to ? new Date(`${to}T23:59:59`).getTime() : Infinity
    return time >= start && time <= end
  }
  return true
}

export const SELLER_COMMISSION_PCT = 5

export const sellerCut = (amount, pct = SELLER_COMMISSION_PCT) => round2((Number(amount) || 0) * (Number(pct) || 0) / 100)

const splitCommission = (amount, sellerPct = SELLER_COMMISSION_PCT) => {
  const pct = Number(sellerPct) || SELLER_COMMISSION_PCT
  const sellerCommission = sellerCut(amount, pct)
  return {
    commissionPct: pct,
    sellerCommission,
    companyCommission: round2(amount - sellerCommission),
  }
}

let defaultRates = { sellerPct: SELLER_COMMISSION_PCT, companyPct: round2(100 - SELLER_COMMISSION_PCT) }
let sellerSeq = 4
let requestSeq = 16
let payoutSeq = 3

let directory = [
  {
    id: 'DS-2026-0001',
    name: 'Meera Diamonds',
    whatsapp: '+91 98765 43110',
    upiId: 'meeradiamonds@okaxis',
    status: 'Active',
    live: true,
    sellerCommissionPct: 5,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(2, 11),
    history: [
      log('Seller Created', daysAgo(18), 'Admin User'),
      log('Seller Activated', daysAgo(18), 'Admin User'),
      log('Commission Rate Changed', daysAgo(10), 'Admin User', '5%'),
      log('Seller Details Updated', daysAgo(2, 11), 'Admin User'),
    ],
  },
  {
    id: 'DS-2026-0002',
    name: 'Kothari Gems',
    whatsapp: '+91 98200 11882',
    upiId: 'kotharigems@upi',
    status: 'Inactive',
    live: false,
    sellerCommissionPct: 5,
    createdAt: daysAgo(14),
    updatedAt: hoursAgo(30),
    history: [
      log('Seller Created', daysAgo(14), 'Admin User'),
      log('Seller Activated', daysAgo(14), 'Admin User'),
      log('Commission Rate Changed', daysAgo(8), 'Admin User', '5%'),
      log('Seller Deactivated', hoursAgo(30), 'Admin User'),
    ],
  },
  {
    id: 'DS-2026-0003',
    name: 'Surat Sparkle Co',
    whatsapp: '+91 90990 44221',
    upiId: 'suratsparkle@paytm',
    status: 'Active',
    live: true,
    sellerCommissionPct: 5,
    createdAt: daysAgo(11),
    updatedAt: hoursAgo(8),
    history: [
      log('Seller Created', daysAgo(11), 'Admin User'),
      log('Seller Activated', daysAgo(11), 'Admin User'),
    ],
  },
  {
    id: 'DS-2026-0004',
    name: 'Jaipur Jewel Hub',
    whatsapp: '+91 94140 22011',
    upiId: 'jaipurjewel@ibl',
    status: 'Inactive',
    live: false,
    sellerCommissionPct: 5,
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(5),
    history: [
      log('Seller Created', daysAgo(6), 'Admin User'),
      log('Seller Deactivated', hoursAgo(5), 'Admin User'),
    ],
  },
]

const complete = (amount, pct, at) => {
  const split = splitCommission(amount, pct)
  return { ...split, completedAt: at, transactionId: true }
}

let requests = [
  { id: 'DR-1001', userId: 'U-2041', userName: 'Rahul', sellerId: 'DS-2026-0001', packageName: '450 Diamonds', amount: 450, status: 'Accepted', requestedAt: daysAgo(4, 10), acceptedAt: daysAgo(4, 11), completedAt: null, ...splitCommission(0, 5), sellerCommission: null, companyCommission: null, commissionPct: null, transactionId: null },
  { id: 'DR-1002', userId: 'U-1188', userName: 'Priya', sellerId: 'DS-2026-0001', packageName: '1,000 Diamonds', amount: 1000, status: 'Completed', requestedAt: daysAgo(6, 9), acceptedAt: daysAgo(6, 10), ...complete(1000, 5, daysAgo(5, 16)), transactionId: 'TX-1002' },
  { id: 'DR-1003', userId: 'U-3302', userName: 'Amit', sellerId: 'DS-2026-0002', packageName: '2,000 Diamonds', amount: 2000, status: 'Pending', requestedAt: daysAgo(1, 18), acceptedAt: null, completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1004', userId: 'U-4410', userName: 'Sneha', sellerId: 'DS-2026-0001', packageName: '500 Diamonds', amount: 500, status: 'Rejected', requestedAt: daysAgo(3, 12), acceptedAt: null, completedAt: null, rejectedAt: daysAgo(3, 13), commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1005', userId: 'U-1188', userName: 'Priya', sellerId: 'DS-2026-0001', packageName: '2,000 Diamonds', amount: 2000, status: 'Completed', requestedAt: daysAgo(12, 11), acceptedAt: daysAgo(12, 12), ...complete(2000, 5, daysAgo(11, 15)), transactionId: 'TX-1005' },
  { id: 'DR-1006', userId: 'U-5521', userName: 'Karan', sellerId: 'DS-2026-0001', packageName: '450 Diamonds', amount: 450, status: 'Processing', requestedAt: hoursAgo(20), acceptedAt: hoursAgo(18), completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1007', userId: 'U-6610', userName: 'Anjali', sellerId: 'DS-2026-0003', packageName: '1,000 Diamonds', amount: 1000, status: 'Completed', requestedAt: daysAgo(8, 13), acceptedAt: daysAgo(8, 14), ...complete(1000, 5, daysAgo(7, 17)), transactionId: 'TX-1007' },
  { id: 'DR-1008', userId: 'U-2041', userName: 'Rahul', sellerId: 'DS-2026-0003', packageName: '2,000 Diamonds', amount: 2000, status: 'Accepted', requestedAt: daysAgo(2, 9), acceptedAt: daysAgo(2, 10), completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1009', userId: 'U-7733', userName: 'Neha', sellerId: 'DS-2026-0003', packageName: '500 Diamonds', amount: 500, status: 'Pending', requestedAt: hoursAgo(6), acceptedAt: null, completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1010', userId: 'U-3302', userName: 'Amit', sellerId: 'DS-2026-0002', packageName: '1,000 Diamonds', amount: 1000, status: 'Completed', requestedAt: daysAgo(9, 10), acceptedAt: daysAgo(9, 11), ...complete(1000, 5, daysAgo(8, 19)), transactionId: 'TX-1010' },
  { id: 'DR-1011', userId: 'U-8844', userName: 'Vikram', sellerId: 'DS-2026-0002', packageName: '450 Diamonds', amount: 450, status: 'Cancelled', requestedAt: daysAgo(5, 8), acceptedAt: daysAgo(5, 9), completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1012', userId: 'U-4410', userName: 'Sneha', sellerId: 'DS-2026-0004', packageName: '1,000 Diamonds', amount: 1000, status: 'Completed', requestedAt: daysAgo(4, 15), acceptedAt: daysAgo(4, 16), ...complete(1000, 5, daysAgo(3, 18)), transactionId: 'TX-1012' },
  { id: 'DR-1013', userId: 'U-5521', userName: 'Karan', sellerId: 'DS-2026-0004', packageName: '450 Diamonds', amount: 450, status: 'Rejected', requestedAt: daysAgo(2, 19), acceptedAt: null, completedAt: null, rejectedAt: daysAgo(2, 20), commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
  { id: 'DR-1014', userId: 'U-6610', userName: 'Anjali', sellerId: 'DS-2026-0001', packageName: '3,000 Diamonds', amount: 3000, status: 'Completed', requestedAt: daysAgo(1, 8), acceptedAt: daysAgo(1, 9), ...complete(3000, 5, hoursAgo(10)), transactionId: 'TX-1014' },
  { id: 'DR-1015', userId: 'U-7733', userName: 'Neha', sellerId: 'DS-2026-0003', packageName: '450 Diamonds', amount: 450, status: 'Completed', requestedAt: daysAgo(15, 12), acceptedAt: daysAgo(15, 13), ...complete(450, 5, daysAgo(14, 16)), transactionId: 'TX-1015' },
  { id: 'DR-1016', userId: 'U-8844', userName: 'Vikram', sellerId: 'DS-2026-0003', packageName: '2,000 Diamonds', amount: 2000, status: 'Processing', requestedAt: daysAgo(0, 11), acceptedAt: hoursAgo(4), completedAt: null, commissionPct: null, sellerCommission: null, companyCommission: null, transactionId: null },
]

let payouts = [
  {
    id: 'PO-3001',
    sellerId: 'DS-2026-0001',
    periodLabel: '1–15 Oct 2026',
    periodStart: daysAgo(22),
    periodEnd: daysAgo(12),
    eligibleAmount: 3000,
    commissionPct: 5,
    commissionAmount: 150,
    paidAmount: 150,
    remainingAmount: 0,
    status: 'Paid',
    paymentDate: daysAgo(10, 16),
    paymentRef: 'NEFT-CHMK-4412',
    paymentProof: '',
    paymentProofName: 'meera-oct-payout.png',
    createdAt: daysAgo(11),
  },
  {
    id: 'PO-3002',
    sellerId: 'DS-2026-0003',
    periodLabel: '1–31 Oct 2026',
    periodStart: daysAgo(20),
    periodEnd: daysAgo(7),
    eligibleAmount: 1450,
    commissionPct: 5,
    commissionAmount: 72.5,
    paidAmount: 0,
    remainingAmount: 72.5,
    status: 'Approved',
    paymentDate: null,
    paymentRef: '',
    paymentProof: '',
    paymentProofName: '',
    createdAt: daysAgo(6),
  },
  {
    id: 'PO-3003',
    sellerId: 'DS-2026-0001',
    periodLabel: '16 Oct – 7 Nov 2026',
    periodStart: daysAgo(11),
    periodEnd: hoursAgo(1),
    eligibleAmount: 4000,
    commissionPct: 5,
    commissionAmount: 200,
    paidAmount: 0,
    remainingAmount: 200,
    status: 'Pending',
    paymentDate: null,
    paymentRef: '',
    paymentProof: '',
    paymentProofName: '',
    createdAt: hoursAgo(12),
  },
]

const cloneDate = (value) => (value ? new Date(value) : null)

const cloneSeller = (row) => ({
  ...row,
  createdAt: cloneDate(row.createdAt),
  updatedAt: cloneDate(row.updatedAt),
  history: row.history.map((item) => ({ ...item, at: cloneDate(item.at) })),
})

const cloneRequest = (row) => ({
  ...row,
  requestedAt: cloneDate(row.requestedAt),
  acceptedAt: cloneDate(row.acceptedAt),
  completedAt: cloneDate(row.completedAt),
  rejectedAt: cloneDate(row.rejectedAt),
})

const clonePayout = (row) => ({
  ...row,
  periodStart: cloneDate(row.periodStart),
  periodEnd: cloneDate(row.periodEnd),
  paymentDate: cloneDate(row.paymentDate),
  createdAt: cloneDate(row.createdAt),
})

const stampSeller = (row, action, note = '') => ({
  ...row,
  updatedAt: new Date(),
  history: [log(action, new Date(), 'Admin User', note), ...row.history],
})

const sellerName = (id) => directory.find((row) => row.id === id)?.name || id

const USER_PRESENCE = {
  'U-2041': { live: true, online: true, account: 'Active' },
  'U-1188': { live: true, online: true, account: 'Active' },
  'U-3302': { live: false, online: false, account: 'Active' },
  'U-4410': { live: false, online: false, account: 'Blocked' },
  'U-5521': { live: false, online: true, account: 'Active' },
  'U-6610': { live: false, online: true, account: 'Active' },
  'U-7733': { live: true, online: true, account: 'Active' },
  'U-8844': { live: false, online: false, account: 'Active' },
}

const userPresence = (userId) => USER_PRESENCE[userId] || { live: false, online: false, account: 'Active' }

export const requestMetrics = (rows) => {
  const list = rows || []
  const of = (status) => list.filter((row) => row.status === status)
  const sum = (items) => round2(items.reduce((total, row) => total + Number(row.amount || 0), 0))
  const accepted = list.filter((row) => ACCEPTED_STATUSES.includes(row.status))
  const completed = of('Completed')
  const pending = of('Pending')
  const rejected = of('Rejected')
  const cancelled = of('Cancelled')
  const processing = of('Processing')
  const acceptedOpen = list.filter((row) => row.status === 'Accepted' || row.status === 'Processing')
  return {
    total: list.length,
    accepted: accepted.length,
    pending: pending.length,
    completed: completed.length,
    rejected: rejected.length,
    cancelled: cancelled.length,
    processing: processing.length,
    acceptedAmount: sum(accepted),
    completedAmount: sum(completed),
    pendingAmount: sum(pending),
    openAcceptedAmount: sum(acceptedOpen),
    rejectedAmount: sum(rejected),
    cancelledAmount: sum(cancelled),
    sellerCommission: round2(completed.reduce((total, row) => total + sellerCut(row.amount, row.commissionPct ?? SELLER_COMMISSION_PCT), 0)),
    companyCommission: round2(sum(completed) - round2(completed.reduce((total, row) => total + sellerCut(row.amount, row.commissionPct ?? SELLER_COMMISSION_PCT), 0))),
    acceptanceRate: list.length ? round2((accepted.length / list.length) * 100) : 0,
    completionRate: accepted.length ? round2((completed.length / accepted.length) * 100) : 0,
    averageAmount: list.length ? round2(sum(list) / list.length) : 0,
  }
}

const payoutPaid = (sellerId) => round2(
  payouts.filter((row) => row.sellerId === sellerId && row.status === 'Paid').reduce((total, row) => total + Number(row.paidAmount || 0), 0)
)

export const decorateSeller = (row) => {
  const metrics = requestMetrics(requests.filter((item) => item.sellerId === row.id))
  const commissionPaid = payoutPaid(row.id)
  return {
    ...cloneSeller(row),
    live: Boolean(row.live ?? row.status === 'Active'),
    metrics: {
      ...metrics,
      commissionPaid,
      remainingPayable: round2(metrics.sellerCommission - commissionPaid),
    },
  }
}

export const getDefaultRates = () => ({ ...defaultRates })

export const setDefaultRates = (sellerPct) => {
  const pct = round2(sellerPct)
  if (pct < 0 || pct > 100) return getDefaultRates()
  defaultRates = { sellerPct: pct, companyPct: round2(100 - pct) }
  return getDefaultRates()
}

export const listDiamondSellers = () => (dataReady() ? liveRows('sellers') : [])

export const getDiamondSeller = (id) => {
  const row = directory.find((item) => item.id === id)
  return row ? decorateSeller(row) : null
}

export const listActiveDiamondSellers = () => listDiamondSellers().filter((row) => row.status === 'Active')

export const createDiamondSeller = (payload) => {
  sellerSeq += 1
  const now = new Date()
  const pct = payload.sellerCommissionPct == null ? defaultRates.sellerPct : round2(payload.sellerCommissionPct)
  const row = {
    id: `DS-2026-${String(sellerSeq).padStart(4, '0')}`,
    name: payload.name.trim(),
    whatsapp: payload.whatsapp.trim(),
    upiId: payload.upiId.trim(),
    status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
    live: payload.status !== 'Inactive',
    sellerCommissionPct: pct,
    createdAt: now,
    updatedAt: now,
    history: [
      log('Seller Created', now),
      log(payload.status === 'Inactive' ? 'Seller Deactivated' : 'Seller Activated', now),
      log('Commission Rate Changed', now, 'Admin User', `${pct}%`),
    ],
  }
  directory = [row, ...directory]
  return decorateSeller(row)
}

export const updateDiamondSeller = (id, payload) => {
  directory = directory.map((row) => (
    row.id === id
      ? stampSeller({
        ...row,
        name: payload.name.trim(),
        whatsapp: payload.whatsapp.trim(),
        upiId: payload.upiId.trim(),
        status: payload.status === 'Inactive' ? 'Inactive' : 'Active',
        live: payload.status !== 'Inactive',
      }, 'Seller Details Updated')
      : row
  ))
  return getDiamondSeller(id)
}

export const setDiamondSellerStatus = (id, status) => {
  const live = status === 'Active'
  directory = directory.map((row) => (
    row.id === id
      ? stampSeller({ ...row, status, live }, live ? 'Seller set Live' : 'Seller set Offline')
      : row
  ))
  return getDiamondSeller(id)
}

export const setSellerCommissionPct = (id, sellerPct) => {
  const pct = round2(sellerPct)
  directory = directory.map((row) => (
    row.id === id
      ? stampSeller({ ...row, sellerCommissionPct: pct }, 'Commission Rate Changed', `${pct}%`)
      : row
  ))
  return getDiamondSeller(id)
}

export const deleteDiamondSeller = (id) => {
  directory = directory.filter((row) => row.id !== id)
}

export const listRequests = () => [].map((row) => {
  const presence = userPresence(row.userId)
  return {
    ...cloneRequest(row),
    sellerName: sellerName(row.sellerId),
    userLive: presence.live,
    userOnline: presence.online,
    userAccount: presence.account,
    userPresence: presence.live ? 'Live' : presence.online ? 'Online' : 'Offline',
  }
}).sort((a, b) => b.requestedAt - a.requestedAt)

export const listTransactions = () => listRequests()
  .filter((row) => row.status === 'Completed')
  .map((row) => ({
    id: row.transactionId || `TX-${row.id}`,
    requestId: row.id,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    userId: row.userId,
    userName: row.userName,
    completedAmount: row.amount,
    completedAt: row.completedAt,
    commissionPct: row.commissionPct,
    sellerCommission: row.sellerCommission,
    companyCommission: row.companyCommission,
  }))

export const setRequestStatus = (id, status) => {
  requests = requests.map((row) => {
    if (row.id !== id) return row
    const seller = directory.find((item) => item.id === row.sellerId)
    const next = { ...row, status }
    if ((status === 'Accepted' || status === 'Processing' || status === 'Completed') && !next.acceptedAt) next.acceptedAt = new Date()
    if (status === 'Completed') {
      next.completedAt = next.completedAt || new Date()
      if (next.sellerCommission == null) {
        const split = splitCommission(row.amount, seller?.sellerCommissionPct ?? SELLER_COMMISSION_PCT)
        next.commissionPct = split.commissionPct
        next.sellerCommission = split.sellerCommission
        next.companyCommission = split.companyCommission
        next.transactionId = next.transactionId || `TX-${row.id}`
      }
    }
    if (status === 'Rejected') next.rejectedAt = next.rejectedAt || new Date()
    const action = status === 'Completed' ? 'Request Completed' : status === 'Accepted' ? 'Request Accepted' : `Request ${status}`
    directory = directory.map((item) => (item.id === row.sellerId ? stampSeller(item, action, row.id) : item))
    return next
  })
}

export const listPayouts = () => [].map((row) => ({
  ...clonePayout(row),
  sellerName: sellerName(row.sellerId),
})).sort((a, b) => b.createdAt - a.createdAt)

export const setPayoutStatus = (id, payload) => {
  payouts = payouts.map((row) => {
    if (row.id !== id) return row
    const next = { ...row, status: payload.status }
    if (payload.status === 'Paid') {
      next.paidAmount = round2(payload.paidAmount ?? row.commissionAmount)
      next.remainingAmount = round2(row.commissionAmount - next.paidAmount)
      next.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date()
      next.paymentRef = payload.paymentRef || row.paymentRef
      next.paymentProof = payload.paymentProof || row.paymentProof
      next.paymentProofName = payload.paymentProofName || row.paymentProofName
      directory = directory.map((item) => (item.id === row.sellerId ? stampSeller(item, 'Commission Paid', next.id) : item))
    } else if (payload.status === 'Approved') {
      directory = directory.map((item) => (item.id === row.sellerId ? stampSeller(item, 'Commission Approved', row.id) : item))
    } else if (payload.status === 'Rejected') {
      next.paidAmount = 0
      next.remainingAmount = row.commissionAmount
    }
    return next
  })
}

export const createPayout = (payload) => {
  payoutSeq += 1
  const commissionAmount = round2(payload.commissionAmount)
  const row = {
    id: `PO-${3000 + payoutSeq}`,
    sellerId: payload.sellerId,
    periodLabel: payload.periodLabel,
    periodStart: payload.periodStart ? new Date(payload.periodStart) : new Date(),
    periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : new Date(),
    eligibleAmount: round2(payload.eligibleAmount),
    commissionPct: round2(payload.commissionPct),
    commissionAmount,
    paidAmount: 0,
    remainingAmount: commissionAmount,
    status: 'Pending',
    paymentDate: null,
    paymentRef: '',
    paymentProof: '',
    paymentProofName: '',
    createdAt: new Date(),
  }
  payouts = [row, ...payouts]
  return clonePayout(row)
}

export const recentlyAddedCount = (rows) => {
  const cut = Date.now() - 7 * 24 * 60 * 60 * 1000
  return rows.filter((row) => new Date(row.createdAt).getTime() >= cut).length
}

export const overviewMetrics = (requestRows) => {
  const sellers = listDiamondSellers()
  const metrics = requestMetrics(requestRows || requests)
  return {
    sellers: sellers.length,
    active: sellers.filter((row) => row.status === 'Active').length,
    inactive: sellers.filter((row) => row.status === 'Inactive').length,
    ...metrics,
  }
}

const bucketStart = (date, grain) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  if (grain === 'monthly') {
    value.setDate(1)
    return value
  }
  if (grain === 'weekly') {
    const offset = (value.getDay() + 6) % 7
    value.setDate(value.getDate() - offset)
  }
  return value
}

const bucketLabel = (date, grain) => {
  if (grain === 'monthly') return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  if (grain === 'weekly') return `Wk ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const growthSeries = (rows, grain) => {
  const map = new Map()
  rows.forEach((row) => {
    const start = bucketStart(row.requestedAt, grain)
    const key = start.getTime()
    if (!map.has(key)) {
      map.set(key, {
        label: bucketLabel(start, grain),
        requests: 0,
        accepted: 0,
        acceptedAmount: 0,
        volume: 0,
        completedValue: 0,
      })
    }
    const point = map.get(key)
    point.requests += 1
    point.volume += Number(row.amount || 0)
    if (ACCEPTED_STATUSES.includes(row.status)) {
      point.accepted += 1
      point.acceptedAmount = round2(point.acceptedAmount + Number(row.amount || 0))
    }
    if (row.status === 'Completed') point.completedValue = round2(point.completedValue + Number(row.amount || 0))
  })
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1])
}

const outcomeBucket = (status) => {
  if (status === 'Pending') return 'pending'
  if (status === 'Rejected' || status === 'Cancelled') return 'rejected'
  if (ACCEPTED_STATUSES.includes(status)) return 'accepted'
  return 'pending'
}

export const analyticsView = (preset, from, to, grain = 'daily') => {
  const scoped = listRequests().filter((row) => inDateRange(row.requestedAt, preset, from, to))
  const metrics = requestMetrics(scoped)
  const completed = scoped.filter((row) => row.status === 'Completed')
  const bySeller = {}
  scoped.forEach((row) => {
    if (!bySeller[row.sellerId]) {
      bySeller[row.sellerId] = { sellerId: row.sellerId, sellerName: row.sellerName, requests: [] }
    }
    bySeller[row.sellerId].requests.push(row)
  })
  const sellerRows = Object.values(bySeller).map((item) => ({
    ...item,
    ...requestMetrics(item.requests),
  })).sort((a, b) => b.completedAmount - a.completedAmount)

  const trend = growthSeries(scoped, grain)
  const sellerBars = [...sellerRows]
    .sort((a, b) => b.accepted - a.accepted)
    .map((row) => ({
      name: row.sellerName,
      accepted: row.accepted,
      rejected: row.rejected + row.cancelled,
      pending: row.pending,
    }))
  const outcome = { accepted: 0, rejected: 0, pending: 0 }
  scoped.forEach((row) => { outcome[outcomeBucket(row.status)] += 1 })
  const outcomeTotal = outcome.accepted + outcome.rejected + outcome.pending
  const share = (count) => (outcomeTotal ? round2((count / outcomeTotal) * 100) : 0)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const slots = ['12a', '4a', '8a', '12p', '4p', '8p']
  const heat = days.map((day) => slots.map((slot) => ({ day, slot, count: 0 })))
  scoped.forEach((row) => {
    const stamp = new Date(row.requestedAt)
    const slot = Math.min(5, Math.floor(stamp.getHours() / 4))
    heat[stamp.getDay()][slot].count += 1
  })

  return {
    metrics,
    sellerRows,
    topAccepted: [...sellerRows].sort((a, b) => b.accepted - a.accepted).slice(0, 10),
    topCompleted: sellerRows.slice(0, 5),
    topCommission: [...sellerRows].sort((a, b) => b.sellerCommission - a.sellerCommission).slice(0, 5),
    trend,
    sellerBars,
    ranking: [...sellerRows].sort((a, b) => b.accepted - a.accepted).slice(0, 10).map((row) => ({
      name: row.sellerName,
      accepted: row.accepted,
      acceptedAmount: row.acceptedAmount,
    })),
    outcome: [
      { name: 'Accepted', value: outcome.accepted, percent: share(outcome.accepted) },
      { name: 'Rejected', value: outcome.rejected, percent: share(outcome.rejected) },
      { name: 'Pending', value: outcome.pending, percent: share(outcome.pending) },
    ],
    funnel: [
      { name: 'Total requests', value: metrics.total },
      { name: 'Accepted', value: metrics.accepted },
      { name: 'Completed', value: metrics.completed },
    ],
    heatmap: { days, slots, cells: heat },
    completedCount: completed.length,
  }
}

export const requestStatusTone = (status) => ({
  Pending: 'warning',
  Accepted: 'info',
  Processing: 'info',
  Completed: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
}[status] || 'neutral')

export const payoutStatusTone = (status) => ({
  Pending: 'warning',
  Approved: 'info',
  Processing: 'info',
  Paid: 'success',
  Rejected: 'danger',
}[status] || 'neutral')
