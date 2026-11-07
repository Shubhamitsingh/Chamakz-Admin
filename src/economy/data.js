const NAMES = ['Aarav Mehta', 'Diya Shah', 'Kabir Nair', 'Ananya Iyer', 'Vihaan Rao', 'Myra Kapoor', 'Arjun Das', 'Sara Khan', 'Reyansh Gill', 'Ishita Bose', 'Aditya Jain', 'Kiara Malhotra', 'Dev Patel', 'Aisha Reddy', 'Harsh Vardhan', 'Meera Joshi', 'Rohan Gupta', 'Pari Singh', 'Nikhil Rao', 'Zara Qureshi', 'Yash Verma', 'Navya Chopra', 'Kunal Sethi', 'Aanya Bhatt', 'Omar Sheikh', 'Tara Menon', 'Vivaan Kulkarni', 'Saanvi Desai', 'Rahul Sharma', 'Priya Singh']

const GIFTS = [
  { name: 'Rose', diamonds: 50 },
  { name: 'Heart', diamonds: 100 },
  { name: 'Star', diamonds: 200 },
  { name: 'Crown', diamonds: 500 },
  { name: 'Rocket', diamonds: 1000 },
  { name: 'Diamond', diamonds: 2000 },
]

const DEFAULT_SETTINGS = {
  inrPerDiamondPurchase: 10,
  inrValuePerEarnedDiamond: 0.1,
  hostSharePct: 50,
  platformSharePct: 50,
  minWithdrawal: 100,
  maxWithdrawal: 50000,
  minEligibleEarnings: 200,
  manualCreditAllowed: true,
}

const day = (offset, hour = 12) => {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  date.setHours(hour, (offset * 7) % 60, 0, 0)
  if (date.getTime() > Date.now() - 60000) date.setTime(Date.now() - (offset + 1) * 60 * 60 * 1000)
  return date.toISOString()
}

const rand = (seed) => {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)]

export const createEconomy = () => {
  const rng = rand(20261107)
  const settings = { ...DEFAULT_SETTINGS }
  const users = NAMES.map((name, index) => ({
    id: `CHK${1001 + index}`,
    name,
    role: index < 10 ? 'Host' : 'User',
    isHost: index < 10,
    phoneVerified: rng() > 0.15,
    walletStatus: 'active',
    kyc: index < 10 ? (rng() > 0.2 ? 'Verified' : 'Pending') : 'Not required',
  }))
  const hosts = users.filter((user) => user.isHost)
  const payments = []
  const balances = Object.fromEntries(users.map((user) => [user.id, 0]))

  for (let i = 0; i < 50; i += 1) {
    const user = users[i % users.length]
    const inr = [100, 200, 500, 1000, 2000, 5000][Math.floor(rng() * 6)]
    const roll = rng()
    const status = roll > 0.82 ? 'failed' : roll > 0.74 ? 'pending' : roll > 0.68 ? 'refunded' : 'success'
    const diamonds = inr * settings.inrPerDiamondPurchase
    if (status === 'success') balances[user.id] += diamonds
    if (status === 'refunded' && balances[user.id] >= diamonds) balances[user.id] -= diamonds
    const finalStatus = status === 'refunded' && balances[user.id] + diamonds < diamonds ? 'failed' : status
    if (status === 'refunded' && finalStatus === 'failed') {
      // refund could not be applied because the purchase was never credited
    }
    payments.push({
      id: `PAY-${String(i + 1).padStart(4, '0')}`,
      userId: user.id,
      userName: user.name,
      inr,
      diamonds: finalStatus === 'failed' || finalStatus === 'pending' ? 0 : diamonds,
      listedDiamonds: diamonds,
      rate: settings.inrPerDiamondPurchase,
      gateway: pick(rng, ['Razorpay', 'Cashfree']),
      method: pick(rng, ['UPI', 'Card', 'Netbanking']),
      status: finalStatus,
      createdAt: day(Math.floor(rng() * 40), 8 + (i % 12)),
    })
  }

  payments.forEach((payment) => {
    if (payment.status === 'refunded') {
      payment.diamonds = payment.listedDiamonds
    }
  })

  const issued = {}
  users.forEach((user) => { issued[user.id] = 0 })
  payments.forEach((payment) => {
    if (payment.status === 'success') issued[payment.userId] += payment.diamonds
    if (payment.status === 'refunded') issued[payment.userId] -= payment.diamonds
  })
  users.forEach((user) => {
    const mine = payments.filter((row) => row.userId === user.id && row.status === 'refunded')
    mine.forEach((row) => {
      if (issued[user.id] < 0) {
        issued[user.id] += row.diamonds
        row.status = 'failed'
        row.diamonds = 0
      }
    })
    balances[user.id] = Math.max(0, issued[user.id])
  })

  const gifts = []
  let guard = 0
  while (gifts.length < 100 && guard < 5000) {
    guard += 1
    const sender = pick(rng, users)
    const host = pick(rng, hosts)
    if (sender.id === host.id) continue
    const gift = pick(rng, GIFTS.filter((item) => item.diamonds <= balances[sender.id]))
    if (!gift) continue
    const gross = Number((gift.diamonds * settings.inrValuePerEarnedDiamond).toFixed(2))
    const hostInr = Number((gross * settings.hostSharePct / 100).toFixed(2))
    const platformInr = Number((gross - hostInr).toFixed(2))
    balances[sender.id] -= gift.diamonds
    gifts.push({
      id: `GFT-${String(gifts.length + 1).padStart(4, '0')}`,
      senderId: sender.id,
      senderName: sender.name,
      hostId: host.id,
      hostName: host.name,
      giftName: gift.name,
      diamonds: gift.diamonds,
      sessionId: `LIVE-${1000 + (gifts.length % 25)}`,
      valuationRate: settings.inrValuePerEarnedDiamond,
      hostSharePct: settings.hostSharePct,
      platformSharePct: settings.platformSharePct,
      grossInr: gross,
      hostInr,
      platformInr,
      status: 'success',
      createdAt: day(Math.floor(rng() * 35), 10 + (gifts.length % 10)),
    })
  }

  const debitUser = users.find((user) => !user.isHost && balances[user.id] >= 200) || users.find((user) => balances[user.id] >= 200)
  const adjustments = [
    { id: 'ADJ-0001', userId: 'CHK1020', type: 'credit', diamonds: 500, reason: 'Support compensation', createdAt: day(6, 11), adminId: 'admin' },
    { id: 'ADJ-0002', userId: debitUser?.id || 'CHK1022', type: 'debit', diamonds: 100, reason: 'Duplicate credit correction', createdAt: day(4, 15), adminId: 'admin' },
  ]
  adjustments.forEach((row) => {
    if (row.type === 'credit') balances[row.userId] += row.diamonds
    if (row.type === 'debit' && balances[row.userId] >= row.diamonds) balances[row.userId] -= row.diamonds
    else if (row.type === 'debit') row.diamonds = 0
  })

  const withdrawals = []
  hosts.forEach((host, index) => {
    const earned = gifts.filter((gift) => gift.hostId === host.id).reduce((sum, gift) => sum + gift.hostInr, 0)
    if (earned < settings.minWithdrawal) return
    const amount = Math.min(400, Math.max(settings.minWithdrawal, Math.round(earned * 0.25)))
    const statuses = ['pending', 'under_review', 'approved', 'rejected', 'processing', 'paid']
    withdrawals.push({
      id: `WDR-${String(withdrawals.length + 1).padStart(4, '0')}`,
      hostId: host.id,
      hostName: host.name,
      amount: Math.min(amount, Math.floor(earned)),
      status: statuses[index % statuses.length],
      reason: statuses[index % statuses.length] === 'rejected' ? 'KYC document mismatch' : '',
      utr: statuses[index % statuses.length] === 'paid' ? `UTR${880000 + index}` : '',
      kyc: host.kyc,
      createdAt: day(3 + index, 16),
    })
  })
  let spins = 0
  while (withdrawals.length < 15 && spins < hosts.length * 4) {
    const host = hosts[spins % hosts.length]
    spins += 1
    const earned = gifts.filter((gift) => gift.hostId === host.id).reduce((sum, gift) => sum + gift.hostInr, 0)
    const already = withdrawals.filter((row) => row.hostId === host.id && row.status !== 'rejected').reduce((sum, row) => sum + row.amount, 0)
    const room = Math.floor(earned - already)
    if (room < settings.minWithdrawal) continue
    withdrawals.push({
      id: `WDR-${String(withdrawals.length + 1).padStart(4, '0')}`,
      hostId: host.id,
      hostName: host.name,
      amount: Math.min(room, 100),
      status: 'pending',
      reason: '',
      utr: '',
      kyc: host.kyc,
      createdAt: day(1 + (withdrawals.length % 8), 18),
    })
  }

  const audits = [
    ...adjustments.map((row) => ({
      id: `AUD-${row.id}`,
      adminId: 'admin',
      action: row.type === 'credit' ? 'Manual Diamond Credit' : 'Manual Diamond Debit',
      targetId: row.userId,
      previousValue: '—',
      newValue: `${row.diamonds} diamonds`,
      reason: row.reason,
      createdAt: row.createdAt,
    })),
    ...withdrawals.slice(0, 12).map((row, index) => ({
      id: `AUD-W-${row.id}`,
      adminId: 'admin',
      action: row.status === 'rejected' ? 'Withdrawal Rejection' : 'Withdrawal Approval',
      targetId: row.hostId,
      previousValue: 'pending',
      newValue: row.status,
      reason: row.reason || 'Demo review',
      createdAt: day(index % 10, 9),
    })),
    { id: 'AUD-SET-1', adminId: 'admin', action: 'Revenue Setting Change', targetId: 'settings', previousValue: 'Host 50%', newValue: 'Host 50%', reason: 'Initial demo policy', createdAt: day(20, 10) },
    { id: 'AUD-FR-1', adminId: 'admin', action: 'Wallet Freeze', targetId: 'CHK1018', previousValue: 'active', newValue: 'frozen', reason: 'Demo risk review', createdAt: day(2, 13) },
    { id: 'AUD-UF-1', adminId: 'admin', action: 'Wallet Unfreeze', targetId: 'CHK1018', previousValue: 'frozen', newValue: 'active', reason: 'Demo review cleared', createdAt: day(1, 13) },
  ]
  while (audits.length < 22) {
    const payment = payments[audits.length % payments.length]
    audits.push({
      id: `AUD-P-${audits.length}`,
      adminId: 'admin',
      action: payment.status === 'refunded' ? 'Transaction Reversal' : 'Payment Review',
      targetId: payment.userId,
      previousValue: 'recorded',
      newValue: payment.status,
      reason: 'Demo ledger review',
      createdAt: day(audits.length % 12, 8),
    })
  }

  users.find((user) => user.id === 'CHK1018').walletStatus = 'active'

  return { users, payments, gifts, withdrawals, adjustments, audits, settings }
}

const startOfDay = (date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export const getRange = (preset, from, to, now = new Date()) => {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = startOfDay(now)
  if (preset === 'today') return { start, end }
  if (preset === 'yesterday') {
    const yStart = new Date(start)
    yStart.setDate(yStart.getDate() - 1)
    const yEnd = new Date(start)
    yEnd.setMilliseconds(-1)
    return { start: yStart, end: yEnd }
  }
  if (preset === '7d') {
    const next = new Date(start)
    next.setDate(next.getDate() - 6)
    return { start: next, end }
  }
  if (preset === '30d') {
    const next = new Date(start)
    next.setDate(next.getDate() - 29)
    return { start: next, end }
  }
  if (preset === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end }
  if (preset === 'custom' && from && to) {
    const customEnd = startOfDay(to)
    customEnd.setHours(23, 59, 59, 999)
    return { start: startOfDay(from), end: customEnd }
  }
  return { start: new Date(0), end }
}

export const previousRange = (range) => {
  const length = range.end.getTime() - range.start.getTime()
  return {
    start: new Date(range.start.getTime() - length - 1),
    end: new Date(range.start.getTime() - 1),
  }
}

const inRange = (iso, range) => {
  const time = new Date(iso).getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

const until = (iso, range) => new Date(iso).getTime() <= range.end.getTime()

export const inr = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const diamonds = (value) => `${Number(value || 0).toLocaleString('en-IN')} Diamonds`

const hostEntitlement = (db, hostId, range, mode) => {
  const match = (iso) => (mode === 'until' ? until(iso, range) : inRange(iso, range))
  const giftRows = db.gifts.filter((row) => row.hostId === hostId && row.status === 'success' && match(row.createdAt))
  const diamondsReceived = giftRows.reduce((sum, row) => sum + row.diamonds, 0)
  const gross = giftRows.reduce((sum, row) => sum + row.grossInr, 0)
  const hostInr = giftRows.reduce((sum, row) => sum + row.hostInr, 0)
  const platformInr = giftRows.reduce((sum, row) => sum + row.platformInr, 0)
  const requests = db.withdrawals.filter((row) => row.hostId === hostId && match(row.createdAt))
  const open = requests.filter((row) => ['pending', 'under_review', 'approved', 'processing'].includes(row.status))
  const paid = requests.filter((row) => row.status === 'paid')
  return {
    diamondsReceived,
    gross,
    hostInr,
    platformInr,
    pendingInr: open.reduce((sum, row) => sum + row.amount, 0),
    paidInr: paid.reduce((sum, row) => sum + row.amount, 0),
    availableInr: hostInr - open.reduce((sum, row) => sum + row.amount, 0) - paid.reduce((sum, row) => sum + row.amount, 0),
    gifts: giftRows,
    withdrawals: requests,
  }
}

export const userStatement = (db, userId, range) => {
  const user = db.users.find((row) => row.id === userId)
  const pays = db.payments.filter((row) => row.userId === userId && until(row.createdAt, range))
  const purchased = pays.filter((row) => row.status === 'success').reduce((sum, row) => sum + row.diamonds, 0)
  const refunded = pays.filter((row) => row.status === 'refunded').reduce((sum, row) => sum + row.diamonds, 0)
  const inrPaid = pays.filter((row) => row.status === 'success').reduce((sum, row) => sum + row.inr, 0)
  const adjustments = db.adjustments.filter((row) => row.userId === userId && until(row.createdAt, range) && row.diamonds > 0)
  const credited = adjustments.filter((row) => row.type === 'credit').reduce((sum, row) => sum + row.diamonds, 0)
  const debited = adjustments.filter((row) => row.type === 'debit').reduce((sum, row) => sum + row.diamonds, 0)
  const sent = db.gifts.filter((row) => row.senderId === userId && row.status === 'success' && until(row.createdAt, range))
  const gifted = sent.reduce((sum, row) => sum + row.diamonds, 0)
  const host = user?.isHost ? hostEntitlement(db, userId, range, 'until') : null
  return {
    user,
    purchased,
    refunded,
    adminCredit: credited,
    adminDebit: debited,
    gifted,
    available: purchased - refunded + credited - debited - gifted,
    inrPaid,
    payments: pays,
    giftsSent: sent,
    adjustments,
    host,
  }
}

export const summarize = (db, range) => {
  const pays = db.payments.filter((row) => inRange(row.createdAt, range))
  const gifts = db.gifts.filter((row) => inRange(row.createdAt, range) && row.status === 'success')
  const withdrawals = db.withdrawals.filter((row) => inRange(row.createdAt, range))
  const adjustments = db.adjustments.filter((row) => inRange(row.createdAt, range))
  const successPays = pays.filter((row) => row.status === 'success')
  const refunds = pays.filter((row) => row.status === 'refunded')
  const stock = db.users.map((user) => userStatement(db, user.id, range))
  const userAvailable = stock.reduce((sum, row) => sum + row.available, 0)
  const hostDiamonds = stock.filter((row) => row.host).reduce((sum, row) => sum + row.host.diamondsReceived, 0)
  const hostInr = stock.filter((row) => row.host).reduce((sum, row) => sum + row.host.hostInr, 0)
  const platform = stock.filter((row) => row.host).reduce((sum, row) => sum + row.host.platformInr, 0)
  const pending = db.withdrawals.filter((row) => ['pending', 'under_review', 'approved', 'processing'].includes(row.status) && until(row.createdAt, range))
  const paid = db.withdrawals.filter((row) => row.status === 'paid' && until(row.createdAt, range))
  return {
    inrCollection: successPays.reduce((sum, row) => sum + row.inr, 0),
    diamondsIssued: successPays.reduce((sum, row) => sum + row.diamonds, 0),
    adminCredits: adjustments.filter((row) => row.type === 'credit').reduce((sum, row) => sum + row.diamonds, 0),
    userWalletDiamonds: userAvailable,
    giftedDiamonds: gifts.reduce((sum, row) => sum + row.diamonds, 0),
    hostEarnedDiamonds: hostDiamonds,
    hostEntitlement: hostInr,
    pendingWithdrawals: pending.reduce((sum, row) => sum + row.amount, 0),
    paidWithdrawals: paid.reduce((sum, row) => sum + row.amount, 0),
    platformShare: platform,
    refundInr: refunds.reduce((sum, row) => sum + row.inr, 0),
    outstandingDiamonds: userAvailable + hostDiamonds,
    payments: pays,
    gifts,
    withdrawals,
    stock,
  }
}

export const circulation = (db) => {
  const all = { start: new Date(0), end: new Date() }
  const rows = db.users.map((user) => userStatement(db, user.id, all))
  const purchased = db.payments.filter((row) => row.status === 'success').reduce((sum, row) => sum + row.diamonds, 0)
  const refunded = db.payments.filter((row) => row.status === 'refunded').reduce((sum, row) => sum + row.diamonds, 0)
  const adminCredit = db.adjustments.filter((row) => row.type === 'credit').reduce((sum, row) => sum + row.diamonds, 0)
  const adminDebit = db.adjustments.filter((row) => row.type === 'debit').reduce((sum, row) => sum + row.diamonds, 0)
  const gifted = db.gifts.filter((row) => row.status === 'success').reduce((sum, row) => sum + row.diamonds, 0)
  const userAvailable = rows.reduce((sum, row) => sum + row.available, 0)
  const hostAvailable = rows.filter((row) => row.host).reduce((sum, row) => sum + row.host.diamondsReceived, 0)
  const netIssued = purchased - refunded + adminCredit - adminDebit
  const outstanding = userAvailable + hostAvailable
  return {
    purchased,
    adminCredit,
    userCredits: purchased + adminCredit,
    gifted,
    hostAvailable,
    userAvailable,
    refunded,
    adminDebit,
    netIssued,
    outstanding,
    difference: outstanding - netIssued,
  }
}

export const series = (db, range) => {
  const days = []
  const cursor = startOfDay(range.start)
  const last = startOfDay(range.end)
  while (cursor <= last && days.length < 62) {
    const start = new Date(cursor)
    const end = new Date(cursor)
    end.setHours(23, 59, 59, 999)
    const slice = { start, end }
    const pays = db.payments.filter((row) => inRange(row.createdAt, slice) && row.status === 'success')
    const gifts = db.gifts.filter((row) => inRange(row.createdAt, slice))
    days.push({
      label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      inr: pays.reduce((sum, row) => sum + row.inr, 0),
      issued: pays.reduce((sum, row) => sum + row.diamonds, 0),
      gifted: gifts.reduce((sum, row) => sum + row.diamonds, 0),
      hostInr: gifts.reduce((sum, row) => sum + row.hostInr, 0),
      platformInr: gifts.reduce((sum, row) => sum + row.platformInr, 0),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export const trend = (current, previous) => {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export { inRange }
