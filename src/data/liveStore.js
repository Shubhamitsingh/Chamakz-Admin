import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'

const buckets = {}
let revision = 0
let ready = false
let loadError = ''
const listeners = new Set()

const emit = () => {
  revision += 1
  listeners.forEach((listener) => listener())
}

export const liveRows = (key) => buckets[key] || []
export const dataReady = () => ready
export const dataError = () => loadError

export const subscribeData = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useDataRevision = () => useSyncExternalStore(subscribeData, () => revision)

const label = (value) => String(value || '')
  .split('_')
  .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
  .join(' ')

const asDate = (value) => (value ? new Date(value) : null)

export async function loadAdminData() {
  if (!supabase) {
    loadError = 'Supabase is not configured.'
    ready = true
    emit()
    return
  }
  const tables = [
    'profiles', 'user_diamond_wallets', 'host_earning_wallets', 'host_applications',
    'gifts', 'gift_transfers', 'payment_orders', 'withdrawals', 'payout_methods',
    'diamond_sellers', 'seller_orders', 'live_sessions', 'tickets', 'complaints',
    'feedback', 'conversations', 'messages', 'banners', 'events', 'announcements',
    'app_config_documents', 'diamond_ledger_entries',
  ]
  const results = await Promise.all(tables.map((table) => supabase.from(table).select('*')))
  const failed = results.find((result) => result.error)
  if (failed?.error) {
    loadError = failed.error.message
    ready = true
    emit()
    return
  }
  const byName = Object.fromEntries(tables.map((table, index) => [table, results[index].data || []]))
  const wallets = Object.fromEntries(byName.user_diamond_wallets.map((row) => [row.profile_id, row]))
  const hostWallets = Object.fromEntries(byName.host_earning_wallets.map((row) => [row.profile_id, row]))
  buckets.profiles = byName.profiles.map((row) => ({
    id: row.id,
    numericId: row.numeric_id,
    name: row.display_name,
    username: row.username,
    email: row.email || '',
    phone: row.phone || '',
    gender: row.gender || '',
    dob: row.dob || '',
    country: row.country || '',
    state: row.state || '',
    city: row.city || '',
    userType: row.agency_name ? 'Agency' : row.is_host ? 'Host' : 'Viewer',
    vip: row.vip,
    status: label(row.status),
    verification: label(row.verification),
    coins: wallets[row.id]?.available || 0,
    registeredAt: asDate(row.created_at),
    lastLogin: asDate(row.last_login_at),
    lastActive: asDate(row.last_active_at),
    online: row.online,
    reported: row.reported,
    hasPhoto: row.has_photo,
    emailVerified: row.email_verified,
    locationGranted: row.location_granted,
    interests: row.interests || [],
    datingComplete: row.dating_complete,
    source: row.signup_source || '',
    platform: row.platform || '',
    appVersion: row.app_version || '',
    agency: row.agency_name || '',
    isHost: row.is_host,
    userLevel: row.user_level ?? 0,
    hostLevel: row.host_level ?? 0,
    restrictions: { live: row.restrict_live, chat: row.restrict_chat },
    notes: [],
    audit: [],
    hostWallet: hostWallets[row.id] || null,
  }))
  buckets.hostApplications = byName.host_applications.map((row) => ({
    id: row.id,
    status: label(row.status),
    category: row.category || '',
    pitch: row.pitch || '',
    experience: row.experience || '',
    appliedAt: asDate(row.created_at),
    reviewedAt: asDate(row.reviewed_at),
    reviewNote: row.review_note || '',
    rejectReason: row.reject_reason || '',
    user: { id: row.profile_id, name: row.applicant_name, email: row.email || '', numericId: row.numeric_id || '', phone: row.phone || '' },
    documents: [],
  }))
  buckets.gifts = byName.gifts
  buckets.giftTransfers = byName.gift_transfers
  buckets.payments = byName.payment_orders
  buckets.withdrawals = byName.withdrawals.map((row) => ({
    id: row.id,
    amount: Number(row.amount_inr),
    status: label(row.status),
    utr: row.utr || '',
    rejectReason: row.rejection_reason || '',
    createdAt: asDate(row.requested_at),
    host: { id: row.profile_id, name: buckets.profiles.find((user) => user.id === row.profile_id)?.name || 'Host' },
    bank: { status: 'Not Submitted' },
  }))
  buckets.sellers = byName.diamond_sellers
  buckets.liveSessions = byName.live_sessions
  buckets.tickets = byName.tickets.map((row) => ({
    id: row.id,
    subject: row.subject,
    category: row.category || '',
    priority: label(row.priority),
    status: label(row.status).replace('In Progress', 'In Progress'),
    userName: buckets.profiles.find((user) => user.id === row.profile_id)?.name || '',
    createdAt: asDate(row.created_at),
    messages: [],
  }))
  buckets.complaints = byName.complaints.map((row) => ({
    id: row.id,
    category: row.category || '',
    priority: label(row.priority),
    status: label(row.status),
    details: row.details || '',
    createdAt: asDate(row.created_at),
    reporterName: buckets.profiles.find((user) => user.id === row.reporter_id)?.name || '',
    reportedName: buckets.profiles.find((user) => user.id === row.reported_id)?.name || '',
  }))
  buckets.feedback = byName.feedback.map((row) => ({
    id: row.id,
    subject: row.subject || '',
    message: row.body || '',
    kind: row.kind || '',
    rating: row.rating,
    status: label(row.status),
    createdAt: asDate(row.created_at),
    userName: buckets.profiles.find((user) => user.id === row.profile_id)?.name || '',
  }))
  buckets.chats = byName.conversations.map((row) => ({
    id: row.id,
    subject: row.subject || 'Chat',
    status: row.status,
    unread: row.unread_by_admin,
    updatedAt: asDate(row.updated_at),
    userName: buckets.profiles.find((user) => user.id === row.profile_id)?.name || '',
    messages: byName.messages.filter((message) => message.conversation_id === row.id),
  }))
  buckets.banners = byName.banners
  buckets.events = byName.events
  buckets.announcements = byName.announcements
  buckets.config = byName.app_config_documents
  buckets.ledger = byName.diamond_ledger_entries
  loadError = ''
  ready = true
  emit()
}

export const economyFromLive = () => {
  const config = liveRows('config')
  const diamondDoc = config.find((row) => row.category_key === 'diamonds')?.document || {}
  const withdrawalDoc = config.find((row) => row.category_key === 'withdrawals')?.document || {}
  const profiles = liveRows('profiles')
  const rawStatus = (value) => String(value || '').toLowerCase().replace(/ /g, '_')
  return {
    users: profiles.map((user) => ({ id: user.id, name: user.name, isHost: user.isHost, walletStatus: 'active', kyc: user.verification })),
    payments: (buckets.payments || []).map((row) => ({
      id: row.id,
      userId: row.profile_id,
      userName: profiles.find((user) => user.id === row.profile_id)?.name || '',
      inr: Number(row.inr),
      diamonds: row.diamonds_issued,
      listedDiamonds: row.diamonds_issued,
      rate: Number(row.rate_snapshot),
      status: row.status,
      createdAt: row.created_at,
    })),
    gifts: (buckets.giftTransfers || []).map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      hostId: row.host_id,
      diamonds: row.diamonds,
      status: row.status,
      grossInr: Number(row.gross_inr),
      hostInr: Number(row.host_inr),
      platformInr: Number(row.platform_inr),
      valuationRate: Number(row.valuation_rate),
      hostSharePct: Number(row.host_share_pct),
      platformSharePct: Number(row.platform_share_pct),
      createdAt: row.created_at,
    })),
    withdrawals: liveRows('withdrawals').map((row) => ({
      id: row.id,
      hostId: row.host?.id,
      hostName: row.host?.name,
      amount: row.amount,
      status: rawStatus(row.status),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    })),
    adjustments: (buckets.ledger || []).filter((row) => row.entry_type === 'admin_credit' || row.entry_type === 'admin_debit').map((row) => ({
      id: row.id,
      userId: row.profile_id,
      type: row.entry_type === 'admin_credit' ? 'credit' : 'debit',
      diamonds: Math.abs(row.diamonds),
      reason: row.reason || '',
      createdAt: row.created_at,
    })),
    audits: [],
    settings: {
      inrPerDiamondPurchase: Number(diamondDoc.diamondsPerInr ?? 10),
      inrValuePerEarnedDiamond: Number(diamondDoc.giftValuation ?? 0.1),
      hostSharePct: Number(withdrawalDoc.hostShare ?? 50),
      platformSharePct: Number(withdrawalDoc.platformShare ?? 50),
      minWithdrawal: Number(withdrawalDoc.minWithdrawal ?? 500),
      maxWithdrawal: Number(withdrawalDoc.maxWithdrawal ?? 50000),
      minEligibleEarnings: Number(withdrawalDoc.minEligible ?? 500),
      manualCreditAllowed: diamondDoc.manualCredit !== false,
    },
  }
}
