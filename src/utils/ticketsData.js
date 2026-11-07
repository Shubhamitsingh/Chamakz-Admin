const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

import { dataReady, liveRows } from '../data/liveStore'

export const TICKET_STATUSES = ['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed']
export const TICKET_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']
export const TICKET_CATEGORIES = [
  'Payments & Withdrawals',
  'Account & KYC',
  'Live Streaming',
  'Gifts & Coins',
  'App / Technical',
  'Safety',
  'Other',
]
export const TICKET_ADMINS = ['Unassigned', 'Admin User', 'Priya Ops', 'Rahul Mod']

const user = (id, numericId, name, email, phone, role, status) => ({
  id,
  numericId,
  name,
  email,
  phone,
  role,
  status,
})

const USERS = {
  u1: user('u1', '1001234', 'Rahul Sharma', 'rahul@example.com', '9876543210', 'User', 'Active'),
  u2: user('u2', '1002345', 'Priya Singh', 'priya@example.com', '9876543211', 'Host', 'Active'),
  u3: user('u3', '1003456', 'Amit Kumar', 'amit@example.com', '9876543212', 'Host', 'Active'),
  u5: user('u5', '1005678', 'Vikram Mehta', 'vikram@example.com', '9876543214', 'User', 'Active'),
  u7: user('u7', '1007890', 'Rohan Gupta', 'rohan@example.com', '9876543216', 'User', 'Active'),
  u12: user('u12', '1012345', 'Farhan Ali', 'farhan@example.com', '9876543220', 'Host', 'Suspended'),
  u15: user('u15', '1015678', 'Pooja Desai', 'pooja@example.com', '9876543223', 'Host', 'Active'),
  u21: user('u21', '1021234', 'Tanya Gill', 'tanya@example.com', '9876543228', 'Host', 'Active'),
}

const seed = [
  {
    id: 'TK-2026-0001',
    user: USERS.u1,
    subject: 'Cannot withdraw coins',
    description: 'My withdrawal has been pending for two days. The app still shows Processing and I have not received any bank credit.',
    category: 'Payments & Withdrawals',
    priority: 'High',
    status: 'Open',
    assigned: 'Unassigned',
    submittedAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
    messages: [
      { at: hoursAgo(5), actor: 'Rahul Sharma', role: 'user', text: 'My withdrawal has been pending for two days. Can someone check WD status?' },
    ],
    notes: [],
    timeline: [{ at: hoursAgo(5), actor: 'Rahul Sharma', action: 'Ticket submitted', status: 'Open' }],
  },
  {
    id: 'TK-2026-0002',
    user: USERS.u2,
    subject: 'Host KYC still pending',
    description: 'Documents were uploaded yesterday. Host verification is still pending and live access is limited.',
    category: 'Account & KYC',
    priority: 'Medium',
    status: 'In Progress',
    assigned: 'Priya Ops',
    submittedAt: daysAgo(1),
    updatedAt: hoursAgo(4),
    messages: [
      { at: daysAgo(1), actor: 'Priya Singh', role: 'user', text: 'I uploaded Aadhaar and a selfie. Status is still pending.' },
      { at: hoursAgo(4), actor: 'Priya Ops', role: 'admin', text: 'Reviewing the sample KYC pack. We will update this ticket after the check.' },
    ],
    notes: [{ at: hoursAgo(4), actor: 'Priya Ops', text: 'Selfie matches. Waiting on document clarity in this sample.' }],
    timeline: [
      { at: daysAgo(1), actor: 'Priya Singh', action: 'Ticket submitted', status: 'Open' },
      { at: hoursAgo(8), actor: 'Admin User', action: 'Assigned to Priya Ops', status: 'Open' },
      { at: hoursAgo(4), actor: 'Priya Ops', action: 'Marked in progress', status: 'In Progress' },
    ],
  },
  {
    id: 'TK-2026-0003',
    user: USERS.u5,
    subject: 'Coin purchase not reflected',
    description: 'Purchased 2,000 coins. Wallet still shows the old balance. Play Store order looks successful on the phone.',
    category: 'Gifts & Coins',
    priority: 'High',
    status: 'In Progress',
    assigned: 'Rahul Mod',
    submittedAt: daysAgo(1),
    updatedAt: hoursAgo(9),
    messages: [
      { at: daysAgo(1), actor: 'Vikram Mehta', role: 'user', text: 'Paid for coins but balance did not update.' },
      { at: hoursAgo(9), actor: 'Rahul Mod', role: 'admin', text: 'Need the Play order ID from the purchase receipt to continue this sample review.' },
    ],
    notes: [],
    timeline: [
      { at: daysAgo(1), actor: 'Vikram Mehta', action: 'Ticket submitted', status: 'Open' },
      { at: hoursAgo(12), actor: 'Admin User', action: 'Assigned to Rahul Mod', status: 'Open' },
      { at: hoursAgo(9), actor: 'Rahul Mod', action: 'Asked user for order ID', status: 'In Progress' },
    ],
  },
  {
    id: 'TK-2026-0004',
    user: USERS.u7,
    subject: 'Profile name is not saving',
    description: 'Tried changing display name twice. After save it reverts to the old name.',
    category: 'App / Technical',
    priority: 'Low',
    status: 'Resolved',
    assigned: 'Admin User',
    submittedAt: daysAgo(3),
    updatedAt: daysAgo(2),
    resolvedAt: daysAgo(2),
    resolution: 'Asked the user to update from Profile → Edit and reinstall. Sample issue marked resolved.',
    messages: [
      { at: daysAgo(3), actor: 'Rohan Gupta', role: 'user', text: 'Name change is not saving.' },
      { at: daysAgo(2), actor: 'Admin User', role: 'admin', text: 'Please update from Edit profile, then force-close the app. Marking this sample ticket resolved.' },
    ],
    notes: [{ at: daysAgo(2), actor: 'Admin User', text: 'Looks like a client cache issue in this sample.' }],
    timeline: [
      { at: daysAgo(3), actor: 'Rohan Gupta', action: 'Ticket submitted', status: 'Open' },
      { at: daysAgo(2.5), actor: 'Admin User', action: 'Assigned to Admin User', status: 'In Progress' },
      { at: daysAgo(2), actor: 'Admin User', action: 'Resolved', status: 'Resolved' },
    ],
  },
  {
    id: 'TK-2026-0005',
    user: USERS.u15,
    subject: 'Live ended without warning',
    description: 'Live stream dropped twice during peak hours. Viewers could not rejoin.',
    category: 'Live Streaming',
    priority: 'Urgent',
    status: 'Waiting on User',
    assigned: 'Priya Ops',
    submittedAt: hoursAgo(14),
    updatedAt: hoursAgo(3),
    messages: [
      { at: hoursAgo(14), actor: 'Pooja Desai', role: 'user', text: 'My live ended twice. Network on my side looks fine.' },
      { at: hoursAgo(3), actor: 'Priya Ops', role: 'admin', text: 'Please send device model, app version, and a screenshot of the disconnect toast.' },
    ],
    notes: [],
    timeline: [
      { at: hoursAgo(14), actor: 'Pooja Desai', action: 'Ticket submitted', status: 'Open' },
      { at: hoursAgo(10), actor: 'Admin User', action: 'Assigned to Priya Ops', status: 'Open' },
      { at: hoursAgo(3), actor: 'Priya Ops', action: 'Waiting on user for device details', status: 'Waiting on User' },
    ],
  },
  {
    id: 'TK-2026-0006',
    user: USERS.u21,
    subject: 'Gift coins missing after live',
    description: 'Received gifts during live. Coin wallet did not increase after the stream ended.',
    category: 'Gifts & Coins',
    priority: 'High',
    status: 'Open',
    assigned: 'Unassigned',
    submittedAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    messages: [
      { at: hoursAgo(2), actor: 'Tanya Gill', role: 'user', text: 'Gifts showed on live but wallet did not update.' },
    ],
    notes: [],
    timeline: [{ at: hoursAgo(2), actor: 'Tanya Gill', action: 'Ticket submitted', status: 'Open' }],
  },
  {
    id: 'TK-2026-0007',
    user: USERS.u12,
    subject: 'Account suspended without reason',
    description: 'Cannot log in as host. App says account is suspended.',
    category: 'Safety',
    priority: 'Urgent',
    status: 'In Progress',
    assigned: 'Admin User',
    submittedAt: daysAgo(2),
    updatedAt: hoursAgo(6),
    messages: [
      { at: daysAgo(2), actor: 'Farhan Ali', role: 'user', text: 'My host account is suspended. I need the reason.' },
      { at: hoursAgo(6), actor: 'Admin User', role: 'admin', text: 'This sample account is suspended after a KYC mismatch. Hosting stays blocked until bank and KYC are verified.' },
    ],
    notes: [{ at: hoursAgo(6), actor: 'Admin User', text: 'Do not restore live access in this sample until KYC is verified.' }],
    timeline: [
      { at: daysAgo(2), actor: 'Farhan Ali', action: 'Ticket submitted', status: 'Open' },
      { at: daysAgo(1), actor: 'Admin User', action: 'Assigned to Admin User', status: 'In Progress' },
    ],
  },
  {
    id: 'TK-2026-0008',
    user: USERS.u3,
    subject: 'IFSC update on bank details',
    description: 'Need to correct IFSC on the registered payout account before the next withdrawal.',
    category: 'Payments & Withdrawals',
    priority: 'Medium',
    status: 'Waiting on User',
    assigned: 'Rahul Mod',
    submittedAt: daysAgo(4),
    updatedAt: daysAgo(3),
    messages: [
      { at: daysAgo(4), actor: 'Amit Kumar', role: 'user', text: 'Please update my IFSC. I sent the cancelled cheque in the app.' },
      { at: daysAgo(3), actor: 'Rahul Mod', role: 'admin', text: 'Updated bank details stay pending verification. Upload a clearer cheque photo in the app.' },
    ],
    notes: [],
    timeline: [
      { at: daysAgo(4), actor: 'Amit Kumar', action: 'Ticket submitted', status: 'Open' },
      { at: daysAgo(3), actor: 'Rahul Mod', action: 'Waiting on clearer bank document', status: 'Waiting on User' },
    ],
  },
  {
    id: 'TK-2026-0009',
    user: USERS.u1,
    subject: 'App crashes on Android 14',
    description: 'Chamakz closes when opening Discover after the last update.',
    category: 'App / Technical',
    priority: 'Medium',
    status: 'Closed',
    assigned: 'Priya Ops',
    submittedAt: daysAgo(8),
    updatedAt: daysAgo(6),
    resolvedAt: daysAgo(7),
    closedAt: daysAgo(6),
    resolution: 'User confirmed the hotfix build fixed Discover. Sample ticket closed.',
    messages: [
      { at: daysAgo(8), actor: 'Rahul Sharma', role: 'user', text: 'App crashes on Discover.' },
      { at: daysAgo(7), actor: 'Priya Ops', role: 'admin', text: 'Please install the latest Play build and retry Discover.' },
      { at: daysAgo(6), actor: 'Rahul Sharma', role: 'user', text: 'Working after the update. Thanks.' },
    ],
    notes: [],
    timeline: [
      { at: daysAgo(8), actor: 'Rahul Sharma', action: 'Ticket submitted', status: 'Open' },
      { at: daysAgo(7), actor: 'Priya Ops', action: 'Resolved after hotfix note', status: 'Resolved' },
      { at: daysAgo(6), actor: 'Priya Ops', action: 'Closed', status: 'Closed' },
    ],
  },
  {
    id: 'TK-2026-0010',
    user: USERS.u2,
    subject: 'How to change payout bank account',
    description: 'Want to move host payouts to a different savings account.',
    category: 'Payments & Withdrawals',
    priority: 'Low',
    status: 'Resolved',
    assigned: 'Admin User',
    submittedAt: daysAgo(5),
    updatedAt: daysAgo(4),
    resolvedAt: daysAgo(4),
    resolution: 'Shared the in-app bank update path. New details stay pending verification.',
    messages: [
      { at: daysAgo(5), actor: 'Priya Singh', role: 'user', text: 'How do I change the bank account for withdrawals?' },
      { at: daysAgo(4), actor: 'Admin User', role: 'admin', text: 'Update bank details in Host wallet → Bank account. New details are not auto-verified.' },
    ],
    notes: [],
    timeline: [
      { at: daysAgo(5), actor: 'Priya Singh', action: 'Ticket submitted', status: 'Open' },
      { at: daysAgo(4), actor: 'Admin User', action: 'Resolved with bank-update steps', status: 'Resolved' },
    ],
  },
]

const cloneList = () => seed.map((item) => ({
  ...item,
  user: { ...item.user },
  messages: [...item.messages],
  notes: [...item.notes],
  timeline: [...item.timeline],
}))

let directory = cloneList()

export const listTickets = () => (dataReady() ? liveRows('tickets') : [])

export const getTicket = (id) => listTickets().find((item) => item.id === id) || null

export const mutateTicket = (id, patch, timelineEntry) => {
  directory = directory.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      ...patch,
      updatedAt: new Date(),
      messages: patch.messages || item.messages,
      notes: patch.notes || item.notes,
      timeline: timelineEntry ? [{ ...timelineEntry, at: timelineEntry.at || new Date() }, ...item.timeline] : item.timeline,
    }
  })
  return getTicket(id)
}

export const addTicketReply = (id, text, internal = false) => {
  const item = directory.find((row) => row.id === id)
  if (!item) return null
  if (internal) {
    return mutateTicket(id, {
      notes: [{ at: new Date(), actor: 'Admin User', text }, ...item.notes],
    }, { actor: 'Admin User', action: 'Added internal note', status: item.status })
  }
  return mutateTicket(id, {
    messages: [...item.messages, { at: new Date(), actor: 'Admin User', role: 'admin', text }],
    status: item.status === 'Open' ? 'In Progress' : item.status,
  }, { actor: 'Admin User', action: 'Replied to user', status: item.status === 'Open' ? 'In Progress' : item.status })
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const statusTone = (status) => {
  if (status === 'Resolved' || status === 'Closed') return 'success'
  if (status === 'Open') return 'warning'
  if (status === 'In Progress') return 'info'
  if (status === 'Waiting on User') return 'neutral'
  return 'neutral'
}

export const priorityTone = (priority) => {
  if (priority === 'Urgent') return 'danger'
  if (priority === 'High') return 'warning'
  if (priority === 'Medium') return 'info'
  return 'neutral'
}
