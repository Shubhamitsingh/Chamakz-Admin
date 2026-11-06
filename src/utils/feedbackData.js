const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const FB_STATUSES = ['New', 'Reviewed', 'Actioned', 'Archived']
export const FB_CATEGORIES = [
  'Live Streaming',
  'App Experience',
  'Payments',
  'Matching / Dating',
  'Gifts & Coins',
  'Host Experience',
  'Customer Support',
  'Account & Profile',
]
export const FB_TYPES = ['Praise', 'Suggestion', 'Issue', 'Question']

export const RATING_LEVELS = [
  { star: 5, emoji: '🤩', label: 'Excellent', bar: 'bg-emerald-500', track: 'bg-emerald-100 dark:bg-emerald-950/40' },
  { star: 4, emoji: '😍', label: 'Very Good', bar: 'bg-sky-500', track: 'bg-sky-100 dark:bg-sky-950/40' },
  { star: 3, emoji: '🙂', label: 'Good', bar: 'bg-amber-400', track: 'bg-amber-100 dark:bg-amber-950/40' },
  { star: 2, emoji: '😕', label: 'Needs Improvement', bar: 'bg-orange-500', track: 'bg-orange-100 dark:bg-orange-950/40' },
  { star: 1, emoji: '😡', label: 'Poor', bar: 'bg-rose-600', track: 'bg-rose-100 dark:bg-rose-950/40' },
]

export const MOOD_THEMES = {
  Excellent: {
    hero: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/25',
    kicker: 'text-emerald-700 dark:text-emerald-400',
    label: 'text-emerald-800 dark:text-emerald-300',
    emojiWrap: 'bg-emerald-100 dark:bg-emerald-900/50',
    chip: 'bg-emerald-600 text-white',
    header: 'bg-emerald-600',
    headerMuted: 'text-emerald-100',
    quote: 'bg-emerald-50 dark:bg-emerald-950/20',
    link: 'text-emerald-700 dark:text-emerald-400',
    btn: 'bg-emerald-600 text-white',
  },
  'Very Good': {
    hero: 'border-sky-200 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/25',
    kicker: 'text-sky-700 dark:text-sky-400',
    label: 'text-sky-800 dark:text-sky-300',
    emojiWrap: 'bg-sky-100 dark:bg-sky-900/50',
    chip: 'bg-sky-600 text-white',
    header: 'bg-sky-600',
    headerMuted: 'text-sky-100',
    quote: 'bg-sky-50 dark:bg-sky-950/20',
    link: 'text-sky-700 dark:text-sky-400',
    btn: 'bg-sky-600 text-white',
  },
  Good: {
    hero: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/25',
    kicker: 'text-amber-700 dark:text-amber-400',
    label: 'text-amber-800 dark:text-amber-300',
    emojiWrap: 'bg-amber-100 dark:bg-amber-900/50',
    chip: 'bg-amber-500 text-white',
    header: 'bg-amber-500',
    headerMuted: 'text-amber-50',
    quote: 'bg-amber-50 dark:bg-amber-950/20',
    link: 'text-amber-700 dark:text-amber-400',
    btn: 'bg-amber-500 text-white',
  },
  'Needs Improvement': {
    hero: 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/25',
    kicker: 'text-orange-700 dark:text-orange-400',
    label: 'text-orange-800 dark:text-orange-300',
    emojiWrap: 'bg-orange-100 dark:bg-orange-900/50',
    chip: 'bg-orange-500 text-white',
    header: 'bg-orange-500',
    headerMuted: 'text-orange-50',
    quote: 'bg-orange-50 dark:bg-orange-950/20',
    link: 'text-orange-700 dark:text-orange-400',
    btn: 'bg-orange-500 text-white',
  },
  Poor: {
    hero: 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/25',
    kicker: 'text-rose-700 dark:text-rose-400',
    label: 'text-rose-800 dark:text-rose-300',
    emojiWrap: 'bg-rose-100 dark:bg-rose-900/50',
    chip: 'bg-rose-600 text-white',
    header: 'bg-rose-600',
    headerMuted: 'text-rose-100',
    quote: 'bg-rose-50 dark:bg-rose-950/20',
    link: 'text-rose-700 dark:text-rose-400',
    btn: 'bg-rose-600 text-white',
  },
}

export const SENTIMENT_THEME = {
  Positive: {
    card: 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900/50',
    active: 'ring-2 ring-emerald-500',
    value: 'text-emerald-700 dark:text-emerald-300',
    kpi: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30',
  },
  Neutral: {
    card: 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900/50',
    active: 'ring-2 ring-amber-500',
    value: 'text-amber-700 dark:text-amber-300',
    kpi: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30',
  },
  Negative: {
    card: 'bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:ring-rose-900/50',
    active: 'ring-2 ring-rose-500',
    value: 'text-rose-700 dark:text-rose-300',
    kpi: 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30',
  },
}

export const ratingTone = (rating) => {
  if (rating >= 5) return { border: 'border-emerald-200', stars: 'text-emerald-600', avatar: 'bg-emerald-600', header: 'bg-emerald-600', quote: 'bg-emerald-50 dark:bg-emerald-950/20' }
  if (rating >= 4) return { border: 'border-sky-200', stars: 'text-sky-600', avatar: 'bg-sky-600', header: 'bg-sky-600', quote: 'bg-sky-50 dark:bg-sky-950/20' }
  if (rating >= 3) return { border: 'border-amber-200', stars: 'text-amber-600', avatar: 'bg-amber-500', header: 'bg-amber-500', quote: 'bg-amber-50 dark:bg-amber-950/20' }
  if (rating >= 2) return { border: 'border-orange-200', stars: 'text-orange-600', avatar: 'bg-orange-500', header: 'bg-orange-500', quote: 'bg-orange-50 dark:bg-orange-950/20' }
  return { border: 'border-rose-200', stars: 'text-rose-600', avatar: 'bg-rose-600', header: 'bg-rose-600', quote: 'bg-rose-50 dark:bg-rose-950/20' }
}

export const categoryTone = (avg) => {
  if (avg >= 4) return 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20'
  if (avg >= 3) return 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20'
  return 'border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20'
}

export const emojiForRating = (rating) => RATING_LEVELS.find((item) => item.star === rating) || RATING_LEVELS[2]

export const emojiForAverage = (avg) => {
  if (avg >= 4.5) return { emoji: '🤩', label: 'Excellent', theme: MOOD_THEMES.Excellent }
  if (avg >= 3.5) return { emoji: '😍', label: 'Very Good', theme: MOOD_THEMES['Very Good'] }
  if (avg >= 2.5) return { emoji: '🙂', label: 'Good', theme: MOOD_THEMES.Good }
  if (avg >= 1.5) return { emoji: '😕', label: 'Needs Improvement', theme: MOOD_THEMES['Needs Improvement'] }
  return { emoji: '😡', label: 'Poor', theme: MOOD_THEMES.Poor }
}

export const sentimentOf = (rating) => {
  if (rating >= 4) return 'Positive'
  if (rating === 3) return 'Neutral'
  return 'Negative'
}

const user = (id, numericId, name, email, role) => ({ id, numericId, name, email, role })

const USERS = {
  u1: user('u1', '1001234', 'Rahul Sharma', 'rahul@example.com', 'User'),
  u2: user('u2', '1002345', 'Priya Singh', 'priya@example.com', 'Host'),
  u5: user('u5', '1005678', 'Vikram Mehta', 'vikram@example.com', 'User'),
  u6: user('u6', '1006789', 'Anjali Verma', 'anjali@example.com', 'Host'),
  u7: user('u7', '1007890', 'Rohan Gupta', 'rohan@example.com', 'User'),
  u8: user('u8', '1008901', 'Kavya Reddy', 'kavya@example.com', 'User'),
  u15: user('u15', '1015678', 'Pooja Desai', 'pooja@example.com', 'Host'),
  u21: user('u21', '1021234', 'Tanya Gill', 'tanya@example.com', 'Host'),
}

const item = (partial) => ({
  notes: [],
  timeline: [{ at: partial.submittedAt, actor: partial.user.name, action: 'Feedback submitted', status: 'New' }],
  updatedAt: partial.submittedAt,
  platform: 'Android',
  appVersion: '2.4.1',
  status: 'New',
  ...partial,
})

const seed = [
  item({ id: 'FB-2026-0001', user: USERS.u8, subject: 'Love the new live layout', message: 'Gifts feel smoother than before. The gift tray is easier to tap during a busy room.', category: 'Live Streaming', type: 'Praise', rating: 5, submittedAt: hoursAgo(8) }),
  item({ id: 'FB-2026-0002', user: USERS.u1, subject: 'Matching is slow', message: 'It takes too long to find nearby people. Discover keeps spinning for 10–15 seconds.', category: 'Matching / Dating', type: 'Issue', rating: 3, submittedAt: daysAgo(1) }),
  item({
    id: 'FB-2026-0003',
    user: USERS.u6,
    subject: 'Co-host invite',
    message: 'Need a co-host invite from the live room so a moderator can help during peak hours.',
    category: 'Host Experience',
    type: 'Suggestion',
    rating: 4,
    status: 'Reviewed',
    platform: 'iOS',
    appVersion: '2.4.0',
    submittedAt: daysAgo(4),
    updatedAt: daysAgo(3),
    notes: [{ at: daysAgo(3), actor: 'Admin User', text: 'Logged as a product request in this sample.' }],
    timeline: [
      { at: daysAgo(4), actor: 'Anjali Verma', action: 'Feedback submitted', status: 'New' },
      { at: daysAgo(3), actor: 'Admin User', action: 'Marked reviewed', status: 'Reviewed' },
    ],
  }),
  item({
    id: 'FB-2026-0004',
    user: USERS.u2,
    subject: 'Withdrawal status is unclear',
    message: 'After requesting a payout the app only says Processing. A bank reference on the screen would help.',
    category: 'Payments',
    type: 'Suggestion',
    rating: 3,
    status: 'Actioned',
    submittedAt: daysAgo(6),
    updatedAt: daysAgo(5),
    notes: [{ at: daysAgo(5), actor: 'Admin User', text: 'Sample note: show UTR after paid.' }],
    timeline: [
      { at: daysAgo(6), actor: 'Priya Singh', action: 'Feedback submitted', status: 'New' },
      { at: daysAgo(5), actor: 'Admin User', action: 'Marked actioned', status: 'Actioned' },
    ],
  }),
  item({ id: 'FB-2026-0005', user: USERS.u15, subject: 'Gift sound is too loud', message: 'Rocket and Crown overlays blast audio over my live mic.', category: 'Gifts & Coins', type: 'Issue', rating: 2, platform: 'iOS', submittedAt: hoursAgo(3) }),
  item({
    id: 'FB-2026-0006',
    user: USERS.u5,
    subject: 'Dark mode contrast',
    message: 'Chat bubbles are hard to read on OLED in dark mode.',
    category: 'App Experience',
    type: 'Issue',
    rating: 4,
    status: 'Reviewed',
    appVersion: '2.3.9',
    submittedAt: daysAgo(2),
    updatedAt: hoursAgo(10),
    timeline: [
      { at: daysAgo(2), actor: 'Vikram Mehta', action: 'Feedback submitted', status: 'New' },
      { at: hoursAgo(10), actor: 'Admin User', action: 'Marked reviewed', status: 'Reviewed' },
    ],
  }),
  item({ id: 'FB-2026-0007', user: USERS.u21, subject: 'Pin comments during live', message: 'Want to pin a welcome comment so new viewers see room rules.', category: 'Live Streaming', type: 'Suggestion', rating: 5, submittedAt: hoursAgo(1) }),
  item({
    id: 'FB-2026-0008',
    user: USERS.u7,
    subject: 'Profile photo crop is off',
    message: 'The circular crop cuts the top of my photo after save.',
    category: 'Account & Profile',
    type: 'Issue',
    rating: 2,
    status: 'Actioned',
    platform: 'iOS',
    appVersion: '2.4.0',
    submittedAt: daysAgo(8),
    updatedAt: daysAgo(7),
    notes: [{ at: daysAgo(7), actor: 'Admin User', text: 'Sample bug logged against profile editor.' }],
    timeline: [
      { at: daysAgo(8), actor: 'Rohan Gupta', action: 'Feedback submitted', status: 'New' },
      { at: daysAgo(7), actor: 'Admin User', action: 'Marked actioned', status: 'Actioned' },
    ],
  }),
  item({
    id: 'FB-2026-0009',
    user: USERS.u1,
    subject: 'Too many recharge banners',
    message: 'Wallet screen shows three banners stacked. Hard to reach Buy coins.',
    category: 'Payments',
    type: 'Issue',
    rating: 3,
    status: 'Archived',
    appVersion: '2.3.8',
    submittedAt: daysAgo(20),
    updatedAt: daysAgo(12),
    timeline: [
      { at: daysAgo(20), actor: 'Rahul Sharma', action: 'Feedback submitted', status: 'New' },
      { at: daysAgo(12), actor: 'Admin User', action: 'Archived', status: 'Archived' },
    ],
  }),
  item({
    id: 'FB-2026-0010',
    user: USERS.u2,
    subject: 'Live quality on 4G',
    message: 'Stream pixelates on 4G even when the room is small.',
    category: 'Live Streaming',
    type: 'Issue',
    rating: 3,
    status: 'Reviewed',
    submittedAt: daysAgo(3),
    updatedAt: daysAgo(2),
    timeline: [
      { at: daysAgo(3), actor: 'Priya Singh', action: 'Feedback submitted', status: 'New' },
      { at: daysAgo(2), actor: 'Admin User', action: 'Marked reviewed', status: 'Reviewed' },
    ],
  }),
  item({ id: 'FB-2026-0011', user: USERS.u8, subject: 'Support reply was clear', message: 'Ticket about wallet delay was explained in plain language. Felt looked after.', category: 'Customer Support', type: 'Praise', rating: 5, submittedAt: daysAgo(5) }),
  item({ id: 'FB-2026-0012', user: USERS.u21, subject: 'Host earnings screen', message: 'Coin breakdown on the host wallet is easier to trust now.', category: 'Host Experience', type: 'Praise', rating: 5, submittedAt: daysAgo(7) }),
  item({ id: 'FB-2026-0013', user: USERS.u5, subject: 'Match filters reset', message: 'Age filter jumps back after leaving Discover.', category: 'Matching / Dating', type: 'Issue', rating: 2, submittedAt: daysAgo(9) }),
  item({ id: 'FB-2026-0014', user: USERS.u15, subject: 'How do I change payout bank?', message: 'Could not find bank update in Host wallet. A short hint would help.', category: 'Customer Support', type: 'Question', rating: 4, submittedAt: daysAgo(11) }),
  item({ id: 'FB-2026-0015', user: USERS.u7, subject: 'Account delete is buried', message: 'Had to hunt Settings for a long time to find delete account.', category: 'Account & Profile', type: 'Suggestion', rating: 3, submittedAt: daysAgo(14) }),
  item({ id: 'FB-2026-0016', user: USERS.u6, subject: 'Rose gift animation', message: 'The rose burst looks premium without covering the host face.', category: 'Gifts & Coins', type: 'Praise', rating: 5, submittedAt: daysAgo(16) }),
]

const cloneList = () => seed.map((row) => ({
  ...row,
  user: { ...row.user },
  notes: [...(row.notes || [])],
  timeline: [...(row.timeline || [])],
}))

let directory = cloneList()

export const listFeedback = () => directory.map((row) => ({ ...row }))

export const getFeedback = (id) => listFeedback().find((row) => row.id === id) || null

export const mutateFeedback = (id, patch, timelineEntry) => {
  directory = directory.map((row) => {
    if (row.id !== id) return row
    return {
      ...row,
      ...patch,
      updatedAt: new Date(),
      notes: patch.notes || row.notes,
      timeline: timelineEntry ? [{ ...timelineEntry, at: timelineEntry.at || new Date() }, ...row.timeline] : row.timeline,
    }
  })
  return getFeedback(id)
}

export const addFeedbackNote = (id, text) => {
  const row = directory.find((item) => item.id === id)
  if (!row) return null
  return mutateFeedback(id, {
    notes: [{ at: new Date(), actor: 'Admin User', text }, ...row.notes],
  }, { actor: 'Admin User', action: 'Added internal note', status: row.status })
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const statusTone = (status) => {
  if (status === 'Actioned') return 'success'
  if (status === 'New') return 'warning'
  if (status === 'Reviewed') return 'info'
  return 'neutral'
}

export const averageRating = (rows) => {
  if (!rows.length) return 0
  return Math.round((rows.reduce((sum, row) => sum + row.rating, 0) / rows.length) * 10) / 10
}

export const inPreset = (date, preset) => {
  const at = new Date(date)
  const now = new Date()
  if (preset === 'all') return true
  if (preset === 'today') return at >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === '7d') return at >= new Date(now.getTime() - 7 * 86400000)
  if (preset === '30d') return at >= new Date(now.getTime() - 30 * 86400000)
  if (preset === 'month') return at >= new Date(now.getFullYear(), now.getMonth(), 1)
  return true
}

export const buildInsights = (rows) => {
  const total = rows.length
  const avg = averageRating(rows)
  const mood = emojiForAverage(avg)
  const positive = rows.filter((row) => row.rating >= 4)
  const neutral = rows.filter((row) => row.rating === 3)
  const negative = rows.filter((row) => row.rating <= 2)
  const pct = (count) => (total ? Math.round((count / total) * 100) : 0)
  const stars = RATING_LEVELS.map((level) => {
    const count = rows.filter((row) => row.rating === level.star).length
    return { ...level, count, pct: pct(count) }
  })
  const byCategory = FB_CATEGORIES.map((category) => {
    const items = rows.filter((row) => row.category === category)
    return {
      category,
      count: items.length,
      avg: averageRating(items),
      positive: items.filter((row) => row.rating >= 4).length,
      negative: items.filter((row) => row.rating <= 2).length,
    }
  }).filter((item) => item.count > 0)
  const dayKey = (value) => new Date(value).toISOString().slice(0, 10)
  const days = [...new Set(rows.map((row) => dayKey(row.submittedAt)))].sort()
  const trend = days.map((day) => {
    const items = rows.filter((row) => dayKey(row.submittedAt) === day)
    return {
      day: day.slice(5),
      total: items.length,
      avg: averageRating(items),
      positive: items.filter((row) => row.rating >= 4).length,
      neutral: items.filter((row) => row.rating === 3).length,
      negative: items.filter((row) => row.rating <= 2).length,
    }
  })
  const praised = rows.filter((row) => row.rating >= 4).slice(0, 3)
  const problems = rows.filter((row) => row.rating <= 2).slice(0, 3)
  return {
    total,
    avg,
    mood,
    positive: positive.length,
    neutral: neutral.length,
    negative: negative.length,
    positivePct: pct(positive.length),
    neutralPct: pct(neutral.length),
    negativePct: pct(negative.length),
    stars,
    byCategory,
    trend,
    praised,
    problems,
  }
}
