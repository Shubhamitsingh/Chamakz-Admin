const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const COMPLAINT_STATUSES = ['Pending', 'Investigating', 'Escalated', 'Resolved', 'Dismissed']
export const COMPLAINT_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
export const COMPLAINT_ADMINS = ['Unassigned', 'Admin User', 'Priya Ops', 'Rahul Mod']

export const COMPLAINT_CATEGORIES = [
  { group: 'Chat & Messaging', items: ['Abusive Messages', 'Harassment', 'Threats', 'Spam Messages', 'Inappropriate Content'] },
  { group: 'Live Streaming', items: ['Inappropriate Live Content', 'Harassment During Live', 'Nudity or Explicit Content', 'Hate Speech', 'Fake Live Activity'] },
  { group: 'Dating & Profile', items: ['Fake Profile', 'Impersonation', 'Inappropriate Profile Photo', 'Fake Information', 'Harassment or Unwanted Contact'] },
  { group: 'Gifts & Transactions', items: ['Fake Recharge Claims', 'Gift Abuse', 'Fraud or Scam', 'Payment Dispute'] },
  { group: 'Other', items: ['Privacy Violation', 'Underage User Concern', 'Suspicious Activity', 'Other'] },
]

export const ALL_CATEGORY_ITEMS = COMPLAINT_CATEGORIES.flatMap((group) => group.items)

const user = (id, numericId, name, email, status, registeredAt) => ({
  id,
  numericId,
  name,
  email,
  status,
  registeredAt,
})

const USERS = {
  u1: user('u1', '1001234', 'Rahul Sharma', 'rahul@example.com', 'Active', daysAgo(40)),
  u2: user('u2', '1002345', 'Priya Singh', 'priya@example.com', 'Active', daysAgo(28)),
  u3: user('u3', '1003456', 'Amit Kumar', 'amit@example.com', 'Active', daysAgo(90)),
  u4: user('u4', '1004567', 'Sneha Patel', 'sneha@example.com', 'Blocked', daysAgo(12)),
  u5: user('u5', '1005678', 'Vikram Mehta', 'vikram@example.com', 'Active', daysAgo(5)),
  u6: user('u6', '1006789', 'Anjali Verma', 'anjali@example.com', 'Active', daysAgo(110)),
  u7: user('u7', '1007890', 'Rohan Gupta', 'rohan@example.com', 'Active', daysAgo(1)),
  u12: user('u12', '1012345', 'Farhan Ali', 'farhan@example.com', 'Suspended', daysAgo(64)),
  u19: user('u19', '1019012', 'Riya Sen', 'riya@example.com', 'Active', daysAgo(8)),
  u20: user('u20', '1020123', 'Kabir Joshi', 'kabir@example.com', 'Blocked', daysAgo(19)),
}

const seed = [
  {
    id: 'CMP-2026-0001',
    reporter: USERS.u1,
    reported: USERS.u4,
    group: 'Chat & Messaging',
    category: 'Abusive Messages',
    reason: 'Abusive messages during chat',
    description: 'Reporter says the other user sent repeated insults in a 1:1 chat after a match.',
    priority: 'High',
    status: 'Pending',
    assigned: 'Unassigned',
    submittedAt: hoursAgo(9),
    updatedAt: hoursAgo(9),
    incidentAt: hoursAgo(10),
    evidence: {
      type: 'chat',
      messages: [
        { from: 'Sneha Patel', text: 'You are wasting my time.', at: hoursAgo(10) },
        { from: 'Rahul Sharma', text: 'Please stop messaging like that.' },
        { from: 'Sneha Patel', text: 'Reported phrase redacted for admin preview.' },
      ],
    },
    notes: [],
    timeline: [{ at: hoursAgo(9), actor: 'System', action: 'Complaint submitted' }],
  },
  {
    id: 'CMP-2026-0002',
    reporter: USERS.u2,
    reported: USERS.u5,
    group: 'Gifts & Transactions',
    category: 'Fake Recharge Claims',
    reason: 'Spam gifts / fake recharge claims',
    description: 'Host reports the viewer claiming a recharge that never reached the wallet.',
    priority: 'Medium',
    status: 'Investigating',
    assigned: 'Priya Ops',
    submittedAt: daysAgo(1),
    updatedAt: hoursAgo(6),
    incidentAt: daysAgo(1),
    evidence: { type: 'none' },
    notes: [{ at: hoursAgo(6), actor: 'Priya Ops', text: 'Checking wallet ledger against gift IDs. Sample note only.' }],
    timeline: [
      { at: daysAgo(1), actor: 'System', action: 'Complaint submitted' },
      { at: hoursAgo(18), actor: 'Priya Ops', action: 'Assigned to Priya Ops' },
      { at: hoursAgo(6), actor: 'Priya Ops', action: 'Status → Investigating' },
    ],
  },
  {
    id: 'CMP-2026-0003',
    reporter: USERS.u6,
    reported: USERS.u7,
    group: 'Live Streaming',
    category: 'Harassment During Live',
    reason: 'Inappropriate live comments',
    description: 'Host flagged repeated comments during a live session. Comment text is summarized, not a full transcript.',
    priority: 'Medium',
    status: 'Resolved',
    assigned: 'Rahul Mod',
    submittedAt: daysAgo(4),
    updatedAt: daysAgo(3),
    incidentAt: daysAgo(4),
    evidence: {
      type: 'live',
      streamId: 'LIVE-2041',
      session: 'Evening room · 186 peak viewers',
      note: 'Comment snippet stored as a moderation excerpt, not the full chat.',
    },
    notes: [{ at: daysAgo(3), actor: 'Rahul Mod', text: 'Warning issued. Sample action only.' }],
    timeline: [
      { at: daysAgo(4), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(3.5), actor: 'Rahul Mod', action: 'Assigned to Rahul Mod' },
      { at: daysAgo(3), actor: 'Rahul Mod', action: 'Warning sent · Status → Resolved' },
    ],
  },
  {
    id: 'CMP-2026-0004',
    reporter: USERS.u3,
    reported: USERS.u4,
    group: 'Chat & Messaging',
    category: 'Harassment',
    reason: 'Repeated unwanted messages after block attempt',
    description: 'Second report against the same account for chat harassment.',
    priority: 'Critical',
    status: 'Escalated',
    assigned: 'Admin User',
    submittedAt: hoursAgo(30),
    updatedAt: hoursAgo(4),
    incidentAt: hoursAgo(32),
    evidence: {
      type: 'screenshot',
      label: 'Uploaded chat screenshot (placeholder)',
      url: 'https://placehold.co/640x360/111827/ffffff?text=Chat+evidence',
    },
    notes: [{ at: hoursAgo(4), actor: 'Admin User', text: 'Pattern matches CMP-2026-0001. Escalated for review.' }],
    timeline: [
      { at: hoursAgo(30), actor: 'System', action: 'Complaint submitted' },
      { at: hoursAgo(20), actor: 'Admin User', action: 'Assigned to Admin User' },
      { at: hoursAgo(4), actor: 'Admin User', action: 'Status → Escalated' },
    ],
  },
  {
    id: 'CMP-2026-0005',
    reporter: USERS.u19,
    reported: USERS.u12,
    group: 'Live Streaming',
    category: 'Nudity or Explicit Content',
    reason: 'Explicit content reported during live',
    description: 'Viewer reported a live session. No media file is stored in this admin sample.',
    priority: 'Critical',
    status: 'Investigating',
    assigned: 'Admin User',
    submittedAt: hoursAgo(52),
    updatedAt: hoursAgo(14),
    incidentAt: hoursAgo(53),
    evidence: {
      type: 'live',
      streamId: 'LIVE-1188',
      session: 'Late night chat · ended',
      note: 'Clip not attached. Session ID only.',
    },
    notes: [],
    timeline: [
      { at: hoursAgo(52), actor: 'System', action: 'Complaint submitted' },
      { at: hoursAgo(40), actor: 'Admin User', action: 'Assigned to Admin User' },
      { at: hoursAgo(14), actor: 'Admin User', action: 'Status → Investigating' },
    ],
  },
  {
    id: 'CMP-2026-0006',
    reporter: USERS.u1,
    reported: USERS.u20,
    group: 'Dating & Profile',
    category: 'Fake Profile',
    reason: 'Profile photos do not match live appearance',
    description: 'Reporter believes the dating profile uses someone else’s photos.',
    priority: 'High',
    status: 'Pending',
    assigned: 'Unassigned',
    submittedAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    incidentAt: hoursAgo(5),
    evidence: {
      type: 'profile',
      note: 'Reported profile photo is referenced by ID only. Image file is not shown here.',
    },
    notes: [],
    timeline: [{ at: hoursAgo(3), actor: 'System', action: 'Complaint submitted' }],
  },
  {
    id: 'CMP-2026-0007',
    reporter: USERS.u5,
    reported: USERS.u12,
    group: 'Live Streaming',
    category: 'Hate Speech',
    reason: 'Hate speech during live comments',
    description: 'Second live-related report against Farhan Ali.',
    priority: 'High',
    status: 'Escalated',
    assigned: 'Priya Ops',
    submittedAt: daysAgo(2),
    updatedAt: hoursAgo(8),
    incidentAt: daysAgo(2),
    evidence: { type: 'none' },
    notes: [{ at: hoursAgo(8), actor: 'Priya Ops', text: 'Multiple live reports on this host.' }],
    timeline: [
      { at: daysAgo(2), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(1), actor: 'Priya Ops', action: 'Assigned to Priya Ops' },
      { at: hoursAgo(8), actor: 'Priya Ops', action: 'Status → Escalated' },
    ],
  },
  {
    id: 'CMP-2026-0008',
    reporter: USERS.u7,
    reported: USERS.u3,
    group: 'Gifts & Transactions',
    category: 'Gift Abuse',
    reason: 'Gift spam during live',
    description: 'Viewer says gifts were sent then disputed as accidental spam.',
    priority: 'Low',
    status: 'Dismissed',
    assigned: 'Rahul Mod',
    submittedAt: daysAgo(6),
    updatedAt: daysAgo(5),
    incidentAt: daysAgo(6),
    evidence: { type: 'none' },
    notes: [{ at: daysAgo(5), actor: 'Rahul Mod', text: 'No wallet anomaly in sample ledger. Dismissed.' }],
    timeline: [
      { at: daysAgo(6), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(5), actor: 'Rahul Mod', action: 'Dismissed · no evidence' },
    ],
  },
  {
    id: 'CMP-2026-0009',
    reporter: USERS.u2,
    reported: USERS.u19,
    group: 'Dating & Profile',
    category: 'Harassment or Unwanted Contact',
    reason: 'Unwanted contact after match declined',
    description: 'Dating chat continued after the reporter asked to stop.',
    priority: 'Medium',
    status: 'Investigating',
    assigned: 'Rahul Mod',
    submittedAt: hoursAgo(20),
    updatedAt: hoursAgo(2),
    incidentAt: hoursAgo(22),
    evidence: {
      type: 'chat',
      messages: [
        { from: 'Priya Singh', text: 'Please do not message me.' },
        { from: 'Riya Sen', text: 'Follow-up message (excerpt).' },
      ],
    },
    notes: [],
    timeline: [
      { at: hoursAgo(20), actor: 'System', action: 'Complaint submitted' },
      { at: hoursAgo(12), actor: 'Rahul Mod', action: 'Assigned to Rahul Mod' },
      { at: hoursAgo(2), actor: 'Rahul Mod', action: 'Status → Investigating' },
    ],
  },
  {
    id: 'CMP-2026-0010',
    reporter: USERS.u6,
    reported: USERS.u5,
    group: 'Gifts & Transactions',
    category: 'Fraud or Scam',
    reason: 'Off-app payment request',
    description: 'User asked to move a recharge off the app. Second report on Vikram Mehta.',
    priority: 'High',
    status: 'Pending',
    assigned: 'Unassigned',
    submittedAt: hoursAgo(55),
    updatedAt: hoursAgo(55),
    incidentAt: hoursAgo(56),
    evidence: { type: 'none' },
    notes: [],
    timeline: [{ at: hoursAgo(55), actor: 'System', action: 'Complaint submitted' }],
  },
  {
    id: 'CMP-2026-0011',
    reporter: USERS.u1,
    reported: USERS.u20,
    group: 'Dating & Profile',
    category: 'Impersonation',
    reason: 'Using another creator’s name',
    description: 'Duplicate-style report: same reported account as CMP-2026-0006.',
    priority: 'Medium',
    status: 'Pending',
    assigned: 'Priya Ops',
    submittedAt: hoursAgo(2),
    updatedAt: hoursAgo(1),
    incidentAt: hoursAgo(6),
    evidence: { type: 'none' },
    notes: [],
    timeline: [
      { at: hoursAgo(2), actor: 'System', action: 'Complaint submitted' },
      { at: hoursAgo(1), actor: 'Priya Ops', action: 'Assigned to Priya Ops' },
    ],
  },
  {
    id: 'CMP-2026-0012',
    reporter: USERS.u3,
    reported: USERS.u12,
    group: 'Other',
    category: 'Suspicious Activity',
    reason: 'Unusual login pattern reported by viewer',
    description: 'Third complaint against Farhan Ali in this sample set.',
    priority: 'Low',
    status: 'Investigating',
    assigned: 'Admin User',
    submittedAt: daysAgo(3),
    updatedAt: hoursAgo(11),
    incidentAt: daysAgo(3),
    evidence: { type: 'none' },
    notes: [],
    timeline: [
      { at: daysAgo(3), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(2), actor: 'Admin User', action: 'Assigned to Admin User' },
    ],
  },
  {
    id: 'CMP-2026-0013',
    reporter: USERS.u19,
    reported: USERS.u7,
    group: 'Chat & Messaging',
    category: 'Spam Messages',
    reason: 'Repeated promotional messages',
    description: 'Spam-like copy-paste messages in chat.',
    priority: 'Low',
    status: 'Resolved',
    assigned: 'Priya Ops',
    submittedAt: daysAgo(8),
    updatedAt: daysAgo(7),
    incidentAt: daysAgo(8),
    evidence: {
      type: 'chat',
      messages: [{ from: 'Rohan Gupta', text: 'Promotional message excerpt (redacted).' }],
    },
    notes: [{ at: daysAgo(7), actor: 'Priya Ops', text: 'Content flagged; warning recorded in sample timeline.' }],
    timeline: [
      { at: daysAgo(8), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(7), actor: 'Priya Ops', action: 'Status → Resolved' },
    ],
  },
  {
    id: 'CMP-2026-0014',
    reporter: USERS.u2,
    reported: USERS.u4,
    group: 'Other',
    category: 'Privacy Violation',
    reason: 'Asked for phone number off-app',
    description: 'Third report against Sneha Patel in this sample directory.',
    priority: 'Medium',
    status: 'Dismissed',
    assigned: 'Admin User',
    submittedAt: daysAgo(9),
    updatedAt: daysAgo(8),
    incidentAt: daysAgo(9),
    evidence: { type: 'none' },
    notes: [{ at: daysAgo(8), actor: 'Admin User', text: 'Insufficient detail. Dismissed in sample queue.' }],
    timeline: [
      { at: daysAgo(9), actor: 'System', action: 'Complaint submitted' },
      { at: daysAgo(8), actor: 'Admin User', action: 'Status → Dismissed' },
    ],
  },
]

const cloneList = () => seed.map((item) => ({
  ...item,
  reporter: { ...item.reporter },
  reported: { ...item.reported },
  notes: [...item.notes],
  timeline: [...item.timeline],
  evidence: { ...item.evidence, messages: item.evidence.messages ? [...item.evidence.messages] : undefined },
}))

let directory = cloneList()

export const resetComplaints = () => {
  directory = cloneList()
}

export const listComplaints = () => directory.map((item) => enrich(item))

const enrich = (item) => {
  const against = directory.filter((row) => row.reported.id === item.reported.id)
  const fromReporter = directory.filter((row) => row.reporter.id === item.reporter.id)
  const similar = against.filter((row) => row.id !== item.id && (row.category === item.category || row.reported.id === item.reported.id))
  const openHours = (Date.now() - new Date(item.submittedAt).getTime()) / 3600000
  const isOpen = item.status === 'Pending' || item.status === 'Investigating' || item.status === 'Escalated'
  return {
    ...item,
    reportsAgainstUser: against.length,
    reportsByReporter: fromReporter.length,
    duplicate: similar.some((row) => row.category === item.category),
    multiReport: against.length > 1,
    ageHours: Math.round(openHours),
    overdue: isOpen && openHours > 48,
  }
}

export const getComplaint = (id) => listComplaints().find((item) => item.id === id) || null

export const mutateComplaint = (id, patch, timelineEntry) => {
  directory = directory.map((item) => {
    if (item.id !== id) return item
    return {
      ...item,
      ...patch,
      updatedAt: new Date(),
      notes: patch.notes || item.notes,
      timeline: timelineEntry ? [timelineEntry, ...item.timeline] : item.timeline,
    }
  })
  return getComplaint(id)
}

export const addComplaintNote = (id, text, actor = 'Admin User') => {
  const item = directory.find((row) => row.id === id)
  if (!item) return null
  const note = { at: new Date(), actor, text }
  return mutateComplaint(id, { notes: [note, ...item.notes] }, { at: new Date(), actor, action: 'Internal note added' })
}

export const workload = () => {
  const counts = {}
  COMPLAINT_ADMINS.forEach((name) => { counts[name] = 0 })
  directory.forEach((item) => {
    if (item.status === 'Resolved' || item.status === 'Dismissed') return
    counts[item.assigned] = (counts[item.assigned] || 0) + 1
  })
  return counts
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const statusTone = (status) => {
  if (status === 'Resolved') return 'success'
  if (status === 'Dismissed') return 'neutral'
  if (status === 'Escalated') return 'danger'
  if (status === 'Investigating') return 'info'
  return 'warning'
}

export const priorityTone = (priority) => {
  if (priority === 'Critical') return 'danger'
  if (priority === 'High') return 'warning'
  if (priority === 'Medium') return 'info'
  return 'success'
}
