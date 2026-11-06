const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const WD_STATUSES = ['Pending', 'Approved', 'Processing', 'Paid', 'Rejected', 'On Hold']
export const PAYMENT_METHOD = 'Bank Transfer'
export const BANK_STATUSES = ['Not Submitted', 'Pending Verification', 'Verified', 'Rejected', 'Update Requested']

const bank = ({
  holder,
  account,
  bankName,
  ifsc,
  branch,
  accountType,
  status,
  submittedAt,
  updatedAt,
  documentName,
  documentUrl,
  documentKind,
  history,
}) => ({
  holder,
  account,
  confirmAccount: account,
  bankName,
  ifsc,
  branch,
  accountType,
  status,
  submittedAt,
  updatedAt,
  documentName,
  documentUrl,
  documentKind,
  history,
})

const host = (id, numericId, name, email, phone, verified, status, registeredAt, earned, withdrawn, available, promo, rate, bankAccount) => ({
  id,
  numericId,
  name,
  email,
  phone,
  verified,
  status,
  registeredAt,
  earned,
  withdrawn,
  available,
  promo,
  other: Math.max(earned - Math.round(earned * 0.82), 0),
  gifts: Math.round(earned * 0.82),
  rate,
  bank: bankAccount,
})

const cheque = (label) => `https://placehold.co/720x420/0f172a/ffffff?text=${encodeURIComponent(label)}`

const HOSTS = {
  u2: host(
    'u2', '1002345', 'Priya Singh', 'priya@example.com', '9876543211', 'Verified', 'Active', daysAgo(28),
    18400, 7200, 8900, 2300, 0.9,
    bank({
      holder: 'Priya Singh',
      account: '3210987652345',
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001234',
      branch: 'Bandra West, Mumbai',
      accountType: 'Savings',
      status: 'Verified',
      submittedAt: daysAgo(20),
      updatedAt: daysAgo(18),
      documentName: 'priya-cancelled-cheque.jpg',
      documentUrl: cheque('Cancelled cheque · SBI'),
      documentKind: 'Cancelled cheque',
      history: [
        { at: daysAgo(20), actor: 'Priya Singh', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(18), actor: 'Admin User', action: 'Bank details verified', status: 'Verified' },
      ],
    }),
  ),
  u3: host(
    'u3', '1003456', 'Amit Kumar', 'amit@example.com', '9876543212', 'Pending', 'Active', daysAgo(90),
    22100, 9800, 10300, 2000, 0.85,
    bank({
      holder: 'Amit Kumar',
      account: '4455667788990',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0002210',
      branch: 'Connaught Place, Delhi',
      accountType: 'Savings',
      status: 'Pending Verification',
      submittedAt: daysAgo(2),
      updatedAt: daysAgo(2),
      documentName: 'amit-bank-statement.pdf',
      documentUrl: cheque('Bank statement · HDFC'),
      documentKind: 'Bank statement',
      history: [
        { at: daysAgo(2), actor: 'Amit Kumar', action: 'Updated bank details submitted', status: 'Pending Verification' },
      ],
    }),
  ),
  u6: host(
    'u6', '1006789', 'Anjali Verma', 'anjali@example.com', '9876543215', 'Verified', 'Active', daysAgo(110),
    31200, 14800, 14200, 2200, 0.92,
    bank({
      holder: 'Anjali Verma',
      account: '5566778899001',
      bankName: 'ICICI Bank',
      ifsc: 'ICIC0002211',
      branch: 'Koramangala, Bengaluru',
      accountType: 'Current',
      status: 'Verified',
      submittedAt: daysAgo(40),
      updatedAt: daysAgo(38),
      documentName: 'anjali-cancelled-cheque.jpg',
      documentUrl: cheque('Cancelled cheque · ICICI'),
      documentKind: 'Cancelled cheque',
      history: [
        { at: daysAgo(40), actor: 'Anjali Verma', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(38), actor: 'Rahul Mod', action: 'Bank details verified', status: 'Verified' },
      ],
    }),
  ),
  u15: host(
    'u15', '1015678', 'Pooja Desai', 'pooja@example.com', '9876543223', 'Verified', 'Active', daysAgo(55),
    16800, 4100, 10900, 1800, 0.88,
    bank({
      holder: 'Pooja Desai',
      account: '2299887766554',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0004455',
      branch: 'Navrangpura, Ahmedabad',
      accountType: 'Savings',
      status: 'Verified',
      submittedAt: daysAgo(30),
      updatedAt: daysAgo(28),
      documentName: 'pooja-cancelled-cheque.jpg',
      documentUrl: cheque('Cancelled cheque · HDFC'),
      documentKind: 'Cancelled cheque',
      history: [
        { at: daysAgo(30), actor: 'Pooja Desai', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(28), actor: 'Admin User', action: 'Bank details verified', status: 'Verified' },
      ],
    }),
  ),
  u21: host(
    'u21', '1021234', 'Tanya Gill', 'tanya@example.com', '9876543228', 'Verified', 'Active', daysAgo(142),
    24600, 9100, 13200, 2300, 0.9,
    bank({
      holder: 'Tanya Gill',
      account: '6677889900112',
      bankName: 'Punjab National Bank',
      ifsc: 'PUNB0123400',
      branch: 'Sector 17, Chandigarh',
      accountType: 'Savings',
      status: 'Update Requested',
      submittedAt: daysAgo(50),
      updatedAt: hoursAgo(8),
      documentName: 'tanya-old-statement.jpg',
      documentUrl: cheque('Bank statement · PNB'),
      documentKind: 'Bank statement',
      history: [
        { at: daysAgo(50), actor: 'Tanya Gill', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(48), actor: 'Priya Ops', action: 'Bank details verified', status: 'Verified' },
        { at: hoursAgo(8), actor: 'Priya Ops', action: 'Requested updated bank information', status: 'Update Requested' },
      ],
    }),
  ),
  u12: host(
    'u12', '1012345', 'Farhan Ali', 'farhan@example.com', '9876543220', 'Rejected', 'Suspended', daysAgo(64),
    6400, 900, 4200, 1300, 0.8,
    bank({
      holder: 'Farhan Ali',
      account: '9988776655443',
      bankName: 'Axis Bank',
      ifsc: 'UTIB0003321',
      branch: 'Andheri East, Mumbai',
      accountType: 'Savings',
      status: 'Rejected',
      submittedAt: daysAgo(10),
      updatedAt: daysAgo(8),
      rejectReason: 'Account holder name did not match KYC documents in sample review.',
      documentName: 'farhan-cheque.jpg',
      documentUrl: cheque('Cancelled cheque · Axis'),
      documentKind: 'Cancelled cheque',
      history: [
        { at: daysAgo(10), actor: 'Farhan Ali', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(8), actor: 'Admin User', action: 'Bank details rejected · name mismatch', status: 'Rejected' },
      ],
    }),
  ),
}

const money = (coins, rate) => Math.round(coins * rate)

const snapshotBank = (hostRecord) => ({ ...hostRecord.bank })

const seed = [
  {
    id: 'WD-2026-0001',
    host: HOSTS.u2,
    coins: 5000,
    rate: 0.9,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u2),
    status: 'Pending',
    submittedAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
    eligibleBefore: 8900,
    timeline: [{ at: hoursAgo(4), from: null, actor: 'Priya Singh', action: 'Request submitted', status: 'Pending' }],
  },
  {
    id: 'WD-2026-0002',
    host: HOSTS.u3,
    coins: 8000,
    rate: 0.85,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: {
      ...snapshotBank(HOSTS.u3),
      status: 'Verified',
      updatedAt: daysAgo(12),
      history: [
        { at: daysAgo(14), actor: 'Amit Kumar', action: 'Bank details submitted', status: 'Pending Verification' },
        { at: daysAgo(12), actor: 'Admin User', action: 'Bank details verified', status: 'Verified' },
      ],
    },
    status: 'Paid',
    submittedAt: daysAgo(3),
    updatedAt: daysAgo(1),
    eligibleBefore: 18300,
    paidAmount: 6800,
    utr: 'UTR8A21K903',
    paidAt: daysAgo(1),
    paidBy: 'Admin User',
    proofName: 'amit-neft-receipt.jpg',
    proofUrl: cheque('NEFT receipt'),
    payNote: 'Company NEFT from operations account. Sample only.',
    timeline: [
      { at: daysAgo(3), from: null, actor: 'Amit Kumar', action: 'Request submitted', status: 'Pending' },
      { at: daysAgo(2.5), from: 'Pending', actor: 'Admin User', action: 'Approved', status: 'Approved' },
      { at: daysAgo(2), from: 'Approved', actor: 'Admin User', action: 'Payment processing started', status: 'Processing' },
      { at: daysAgo(1), from: 'Processing', actor: 'Admin User', action: 'Marked paid · UTR8A21K903', status: 'Paid' },
    ],
  },
  {
    id: 'WD-2026-0003',
    host: HOSTS.u6,
    coins: 2500,
    rate: 0.92,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u6),
    status: 'Rejected',
    submittedAt: daysAgo(6),
    updatedAt: daysAgo(5),
    eligibleBefore: 16700,
    rejectReason: 'Requested coins exceeded remaining eligible balance after a gift reversal in sample review.',
    timeline: [
      { at: daysAgo(6), from: null, actor: 'Anjali Verma', action: 'Request submitted', status: 'Pending' },
      { at: daysAgo(5), from: 'Pending', actor: 'Rahul Mod', action: 'Rejected · eligibility check', status: 'Rejected' },
    ],
  },
  {
    id: 'WD-2026-0004',
    host: HOSTS.u2,
    coins: 1200,
    rate: 0.9,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u2),
    status: 'Processing',
    submittedAt: daysAgo(1),
    updatedAt: hoursAgo(6),
    eligibleBefore: 10100,
    timeline: [
      { at: daysAgo(1), from: null, actor: 'Priya Singh', action: 'Request submitted', status: 'Pending' },
      { at: hoursAgo(10), from: 'Pending', actor: 'Priya Ops', action: 'Approved', status: 'Approved' },
      { at: hoursAgo(6), from: 'Approved', actor: 'Priya Ops', action: 'Payment processing started', status: 'Processing' },
    ],
  },
  {
    id: 'WD-2026-0005',
    host: HOSTS.u15,
    coins: 3600,
    rate: 0.88,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u15),
    status: 'Approved',
    submittedAt: hoursAgo(18),
    updatedAt: hoursAgo(5),
    eligibleBefore: 10900,
    timeline: [
      { at: hoursAgo(18), from: null, actor: 'Pooja Desai', action: 'Request submitted', status: 'Pending' },
      { at: hoursAgo(5), from: 'Pending', actor: 'Admin User', action: 'Approved', status: 'Approved' },
    ],
  },
  {
    id: 'WD-2026-0006',
    host: HOSTS.u21,
    coins: 4100,
    rate: 0.9,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u21),
    status: 'On Hold',
    submittedAt: daysAgo(2),
    updatedAt: hoursAgo(8),
    eligibleBefore: 13200,
    holdReason: 'Updated bank information requested. Do not approve until the new account is verified.',
    timeline: [
      { at: daysAgo(2), from: null, actor: 'Tanya Gill', action: 'Request submitted', status: 'Pending' },
      { at: hoursAgo(8), from: 'Pending', actor: 'Priya Ops', action: 'Placed on hold · bank update requested', status: 'On Hold' },
    ],
  },
  {
    id: 'WD-2026-0007',
    host: HOSTS.u6,
    coins: 5400,
    rate: 0.92,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u6),
    status: 'Paid',
    submittedAt: daysAgo(20),
    updatedAt: daysAgo(18),
    eligibleBefore: 19600,
    paidAmount: 4968,
    utr: 'UTR4N77Q110',
    paidAt: daysAgo(18),
    paidBy: 'Admin User',
    proofName: 'anjali-neft-receipt.pdf',
    proofUrl: cheque('NEFT receipt · ICICI'),
    timeline: [
      { at: daysAgo(20), from: null, actor: 'Anjali Verma', action: 'Request submitted', status: 'Pending' },
      { at: daysAgo(19), from: 'Pending', actor: 'Admin User', action: 'Approved', status: 'Approved' },
      { at: daysAgo(18.5), from: 'Approved', actor: 'Admin User', action: 'Payment processing started', status: 'Processing' },
      { at: daysAgo(18), from: 'Processing', actor: 'Admin User', action: 'Marked paid · UTR4N77Q110', status: 'Paid' },
    ],
  },
  {
    id: 'WD-2026-0008',
    host: HOSTS.u12,
    coins: 900,
    rate: 0.8,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u12),
    status: 'Pending',
    submittedAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    eligibleBefore: 4200,
    timeline: [{ at: hoursAgo(2), from: null, actor: 'Farhan Ali', action: 'Request submitted', status: 'Pending' }],
  },
  {
    id: 'WD-2026-0009',
    host: HOSTS.u21,
    coins: 2800,
    rate: 0.9,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: {
      ...snapshotBank(HOSTS.u21),
      status: 'Verified',
      updatedAt: daysAgo(4),
    },
    status: 'Approved',
    submittedAt: hoursAgo(30),
    updatedAt: hoursAgo(12),
    eligibleBefore: 16000,
    timeline: [
      { at: hoursAgo(30), from: null, actor: 'Tanya Gill', action: 'Request submitted', status: 'Pending' },
      { at: hoursAgo(12), from: 'Pending', actor: 'Rahul Mod', action: 'Approved', status: 'Approved' },
    ],
  },
  {
    id: 'WD-2026-0010',
    host: HOSTS.u15,
    coins: 1500,
    rate: 0.88,
    deductions: 0,
    method: PAYMENT_METHOD,
    bank: snapshotBank(HOSTS.u15),
    status: 'On Hold',
    submittedAt: daysAgo(4),
    updatedAt: daysAgo(3),
    eligibleBefore: 12400,
    holdReason: 'Waiting on host to confirm coin eligibility after a gift reversal.',
    timeline: [
      { at: daysAgo(4), from: null, actor: 'Pooja Desai', action: 'Request submitted', status: 'Pending' },
      { at: daysAgo(3), from: 'Pending', actor: 'Admin User', action: 'Placed on hold', status: 'On Hold' },
    ],
  },
]

const cloneList = () => seed.map((item) => ({
  ...item,
  host: { ...item.host, bank: { ...item.host.bank, history: [...(item.host.bank.history || [])] } },
  bank: { ...item.bank, history: [...(item.bank.history || [])] },
  timeline: [...item.timeline],
}))

let directory = cloneList()

const enrich = (item) => {
  const gross = money(item.coins, item.rate)
  const payable = Math.max(gross - (item.deductions || 0), 0)
  const remaining = Math.max(item.eligibleBefore - item.coins, 0)
  return {
    ...item,
    method: PAYMENT_METHOD,
    gross,
    payable,
    remaining,
    gifts: item.host.gifts,
    promo: item.host.promo,
    restricted: item.host.promo,
    withdrawable: Math.max(item.host.available - item.host.promo, 0),
    bankVerified: item.bank?.status === 'Verified',
  }
}

export const listWithdrawals = () => directory.map(enrich)

export const getWithdrawal = (id) => listWithdrawals().find((item) => item.id === id) || null

export const hostHistory = (hostId, exceptId) =>
  listWithdrawals().filter((item) => item.host.id === hostId && item.id !== exceptId)

export const canApproveWithdrawal = (row) => row?.bank?.status === 'Verified'

export const mutateWithdrawal = (id, patch, timelineEntry) => {
  directory = directory.map((item) => {
    if (item.id !== id) return item
    const next = {
      ...item,
      ...patch,
      method: PAYMENT_METHOD,
      rate: item.rate,
      coins: item.coins,
      deductions: item.deductions,
      bank: patch.bank ? { ...item.bank, ...patch.bank } : item.bank,
      updatedAt: new Date(),
      timeline: timelineEntry
        ? [{ ...timelineEntry, from: timelineEntry.from ?? item.status, at: timelineEntry.at || new Date() }, ...item.timeline]
        : item.timeline,
    }
    return next
  })
  return getWithdrawal(id)
}

export const mutateHostBank = (hostId, patch, historyEntry) => {
  directory = directory.map((item) => {
    if (item.host.id !== hostId) return item
    const current = item.host.bank
    const bankNext = {
      ...current,
      ...patch,
      updatedAt: new Date(),
      history: historyEntry ? [historyEntry, ...(current.history || [])] : current.history,
    }
    return {
      ...item,
      host: { ...item.host, bank: bankNext },
      bank: item.status === 'Paid' || item.status === 'Rejected' ? item.bank : { ...item.bank, ...patch, history: bankNext.history },
      updatedAt: new Date(),
    }
  })
}

export const maskAccount = (value) => {
  if (!value) return '—'
  const last = String(value).slice(-4)
  return `XXXX XXXX ${last}`
}

export const formatAccount = (value) => {
  if (!value) return '—'
  return String(value).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const inr = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

export const statusTone = (status) => {
  if (status === 'Paid' || status === 'Verified') return 'success'
  if (status === 'Pending' || status === 'Pending Verification') return 'warning'
  if (status === 'Processing' || status === 'Approved' || status === 'Update Requested') return 'info'
  if (status === 'Rejected') return 'danger'
  return 'neutral'
}

export const buildFinance = (rows, preset, customStart, customEnd) => {
  const now = new Date()
  let start = new Date(0)
  if (preset === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === '7d') start = new Date(now.getTime() - 7 * 86400000)
  if (preset === '30d') start = new Date(now.getTime() - 30 * 86400000)
  if (preset === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1)
  if (preset === 'custom' && customStart) start = new Date(customStart)
  const end = preset === 'custom' && customEnd ? new Date(`${customEnd}T23:59:59`) : now
  const scoped = rows.filter((row) => {
    const at = new Date(row.submittedAt)
    return at >= start && at <= end
  })
  const paid = scoped.filter((row) => row.status === 'Paid')
  const pendingMoney = scoped.filter((row) => ['Pending', 'Approved', 'Processing', 'On Hold'].includes(row.status)).reduce((sum, row) => sum + row.payable, 0)
  const rejectedMoney = scoped.filter((row) => row.status === 'Rejected').reduce((sum, row) => sum + row.payable, 0)
  return {
    coinsRequested: scoped.reduce((sum, row) => sum + row.coins, 0),
    coinsApproved: scoped.filter((row) => ['Approved', 'Processing', 'Paid'].includes(row.status)).reduce((sum, row) => sum + row.coins, 0),
    coinsPaid: paid.reduce((sum, row) => sum + row.coins, 0),
    pendingMoney,
    rejectedMoney,
    payouts: paid.length,
    average: paid.length ? Math.round(paid.reduce((sum, row) => sum + (row.paidAmount || row.payable), 0) / paid.length) : 0,
  }
}
