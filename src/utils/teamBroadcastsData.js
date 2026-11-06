const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const TEAM_AUDIENCES = ['All users', 'Hosts', 'Viewers']
export const TEAM_PRIORITIES = ['High', 'Medium', 'Low']
export const TEAM_STATUSES = ['Draft', 'Published']

let seq = 5

export const POSTERS = {
  gifts: { emoji: '🎁', label: 'Gift drop', className: 'from-pink-500 via-rose-500 to-orange-400' },
  safety: { emoji: '🛡️', label: 'Safety', className: 'from-emerald-500 to-teal-600' },
  coins: { emoji: '🪙', label: 'Coins', className: 'from-amber-400 to-orange-500' },
  diwali: { emoji: '✨', label: 'Live night', className: 'from-violet-600 via-fuchsia-500 to-amber-400' },
}

let directory = [
  {
    id: 'TM-2026-0001',
    title: 'Weekend gift drop',
    body: 'Welcome to Chamakz. Sample notice about a weekend gift drop. This copy is not delivered to devices.',
    audience: 'All users',
    priority: 'Medium',
    status: 'Published',
    author: 'Admin User',
    poster: 'gifts',
    image: null,
    imageName: '',
    createdAt: daysAgo(2),
  },
  {
    id: 'TM-2026-0002',
    title: 'Host safety reminder',
    body: 'Hosts: keep rooms family-safe. Reports are reviewed daily in this sample queue.',
    audience: 'Hosts',
    priority: 'High',
    status: 'Published',
    author: 'Admin User',
    poster: 'safety',
    image: null,
    imageName: '',
    createdAt: hoursAgo(10),
  },
  {
    id: 'TM-2026-0003',
    title: 'Viewer coin tip',
    body: 'Draft tip for first-time gifters. Still a draft in this admin inbox.',
    audience: 'Viewers',
    priority: 'Low',
    status: 'Draft',
    author: 'Admin User',
    poster: 'coins',
    image: null,
    imageName: '',
    createdAt: hoursAgo(3),
  },
  {
    id: 'TM-2026-0004',
    title: 'Diwali live night teaser',
    body: 'Sample teaser for Diwali Live Night. Saved here only — not pushed to the app.',
    audience: 'All users',
    priority: 'Medium',
    status: 'Draft',
    author: 'Admin User',
    poster: 'diwali',
    image: null,
    imageName: '',
    createdAt: hoursAgo(1),
  },
]

const clone = (row) => ({ ...row, createdAt: new Date(row.createdAt) })

export const listTeamBroadcasts = () => directory
  .map(clone)
  .sort((a, b) => b.createdAt - a.createdAt)

export const createTeamBroadcast = ({ title, body, audience, priority, status, image, imageName, poster }) => {
  seq += 1
  const row = {
    id: `TM-2026-${String(seq).padStart(4, '0')}`,
    title: title.trim(),
    body: (body || '').trim(),
    audience,
    priority,
    status,
    author: 'Admin User',
    poster: poster || null,
    image: image || null,
    imageName: imageName || '',
    createdAt: new Date(),
  }
  directory = [row, ...directory]
  return clone(row)
}

export const deleteTeamBroadcast = (id) => {
  directory = directory.filter((row) => row.id !== id)
}

export const statusTone = (status) => (status === 'Published' ? 'success' : 'warning')
export const priorityTone = (priority) => {
  if (priority === 'High') return 'danger'
  if (priority === 'Medium') return 'warning'
  return 'success'
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
