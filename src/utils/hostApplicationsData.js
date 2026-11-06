const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const HOST_APP_STATUSES = ['Pending', 'Approved', 'Rejected']
export const HOST_APP_CATEGORIES = ['Entertainment', 'Gaming', 'Music', 'Talk', 'Lifestyle']

const user = (id, numericId, name, email, phone, city) => ({ id, numericId, name, email, phone, city })

const USERS = {
  u4: user('u4', '1004567', 'Sneha Patel', 'sneha@example.com', '9876543213', 'Ahmedabad'),
  u5: user('u5', '1005678', 'Vikram Mehta', 'vikram@example.com', '9876543214', 'Pune'),
  u7: user('u7', '1007890', 'Rohan Gupta', 'rohan@example.com', '9876543216', 'Lucknow'),
  u8: user('u8', '1008901', 'Kavya Reddy', 'kavya@example.com', '9876543217', 'Hyderabad'),
  u10: user('u10', '1010123', 'Arjun Nair', 'arjun@example.com', '9876543218', 'Kochi'),
  u12: user('u12', '1012345', 'Farhan Ali', 'farhan@example.com', '9876543220', 'Kolkata'),
}

const item = (partial) => ({
  documents: [
    { label: 'Profile photo', name: 'selfie.jpg', state: 'Sample file' },
    { label: 'ID proof', name: 'id-front.jpg', state: 'Sample file' },
  ],
  reviewNote: '',
  reviewedAt: null,
  reviewedBy: null,
  rejectReason: '',
  ...partial,
})

let directory = [
  item({
    id: 'HA-2026-0001',
    user: USERS.u7,
    status: 'Pending',
    category: 'Entertainment',
    reason: 'I host dance streams and want to go live on Chamakz.',
    experience: '2 years of Instagram lives',
    bio: 'Dancer and lifestyle creator from Lucknow.',
    appliedAt: hoursAgo(6),
  }),
  item({
    id: 'HA-2026-0002',
    user: USERS.u5,
    status: 'Pending',
    category: 'Gaming',
    reason: 'I already have a following and want host tools.',
    experience: 'Weekly gaming streams',
    bio: 'Casual gamer, Pune.',
    appliedAt: daysAgo(1),
  }),
  item({
    id: 'HA-2026-0003',
    user: USERS.u10,
    status: 'Pending',
    category: 'Talk',
    reason: 'Want to run evening talk rooms.',
    experience: 'College radio',
    bio: 'New creator, profile still filling out.',
    appliedAt: hoursAgo(14),
    documents: [
      { label: 'Profile photo', name: '—', state: 'Missing in this sample' },
      { label: 'ID proof', name: '—', state: 'Missing in this sample' },
    ],
  }),
  item({
    id: 'HA-2026-0004',
    user: USERS.u8,
    status: 'Approved',
    category: 'Music',
    reason: 'Music and talk shows',
    experience: 'Radio intern',
    bio: 'Singer based in Hyderabad.',
    appliedAt: daysAgo(8),
    reviewedAt: daysAgo(6),
    reviewedBy: 'Admin User',
    reviewNote: 'Approved in this sample queue.',
  }),
  item({
    id: 'HA-2026-0005',
    user: USERS.u12,
    status: 'Pending',
    category: 'Talk',
    reason: 'Comedy lives. Account is currently suspended on the user list.',
    experience: 'Open-mic clips',
    bio: 'Comedy host.',
    appliedAt: daysAgo(2),
  }),
  item({
    id: 'HA-2026-0006',
    user: USERS.u4,
    status: 'Rejected',
    category: 'Lifestyle',
    reason: 'Want to go live',
    experience: 'None',
    bio: 'New user.',
    appliedAt: daysAgo(10),
    reviewedAt: daysAgo(9),
    reviewedBy: 'Admin User',
    rejectReason: 'Sample reject: profile incomplete and account is blocked.',
  }),
]

const clone = (row) => ({
  ...row,
  user: { ...row.user },
  documents: row.documents.map((doc) => ({ ...doc })),
  appliedAt: new Date(row.appliedAt),
  reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
})

export const listHostApplications = () => directory
  .map(clone)
  .sort((a, b) => b.appliedAt - a.appliedAt)

export const getHostApplication = (id) => {
  const row = directory.find((item) => item.id === id)
  return row ? clone(row) : null
}

export const mutateHostApplication = (id, patch) => {
  directory = directory.map((row) => (row.id === id ? { ...row, ...patch } : row))
  return getHostApplication(id)
}

export const approveHostApplication = (id, note = '') => mutateHostApplication(id, {
  status: 'Approved',
  reviewedAt: new Date(),
  reviewedBy: 'Admin User',
  reviewNote: note || 'Approved in this sample queue.',
  rejectReason: '',
})

export const rejectHostApplication = (id, reason) => mutateHostApplication(id, {
  status: 'Rejected',
  reviewedAt: new Date(),
  reviewedBy: 'Admin User',
  rejectReason: reason || 'Rejected in this sample queue.',
})

export const statusTone = (status) => {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'danger'
  return 'warning'
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
