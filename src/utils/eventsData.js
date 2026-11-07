import { dataReady, liveRows } from '../data/liveStore'

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const daysFrom = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

export const EVENT_KINDS = ['Announcement', 'Live event', 'Coin campaign', 'Host boost']
export const EVENT_STATUSES = ['Draft', 'Scheduled', 'Live', 'Ended']
export const EVENT_PRIORITIES = ['High', 'Medium', 'Low']
export const EVENT_AUDIENCES = ['All users', 'Hosts', 'Viewers']

const TONES = {
  Announcement: 'violet',
  'Live event': 'rose',
  'Coin campaign': 'amber',
  'Host boost': 'emerald',
}

let seq = 7

const item = (partial) => ({
  audience: 'All users',
  priority: 'Medium',
  participants: 0,
  accent: TONES[partial.kind] || 'slate',
  ...partial,
})

let directory = [
  item({
    id: 'EV-2026-0001',
    kind: 'Announcement',
    title: 'System maintenance',
    body: 'Sample notice: scheduled window on 15 Nov, 2:00–4:00 AM IST. Rooms may reconnect.',
    status: 'Live',
    priority: 'High',
    audience: 'All users',
    startAt: daysAgo(1),
    endAt: daysFrom(8),
    createdAt: daysAgo(1),
  }),
  item({
    id: 'EV-2026-0002',
    kind: 'Host boost',
    title: 'Host Boost Week',
    body: 'Extra discovery ranking for approved hosts in this sample campaign.',
    status: 'Live',
    priority: 'Medium',
    audience: 'Hosts',
    startAt: daysAgo(3),
    endAt: daysFrom(4),
    createdAt: daysAgo(3),
    participants: 128,
  }),
  item({
    id: 'EV-2026-0003',
    kind: 'Live event',
    title: 'Diwali Live Night',
    body: 'Gift multiplier rooms and themed overlays. Sample calendar only.',
    status: 'Scheduled',
    priority: 'High',
    audience: 'All users',
    startAt: daysFrom(6),
    endAt: daysFrom(8),
    createdAt: daysAgo(5),
    participants: 0,
  }),
  item({
    id: 'EV-2026-0004',
    kind: 'Coin campaign',
    title: 'Weekend recharge bonus',
    body: 'Sample +10% coins on first recharge of the weekend. Not billed.',
    status: 'Scheduled',
    priority: 'Medium',
    audience: 'Viewers',
    startAt: daysFrom(1),
    endAt: daysFrom(3),
    createdAt: hoursAgo(20),
  }),
  item({
    id: 'EV-2026-0005',
    kind: 'Live event',
    title: 'Creator meetup',
    body: 'Virtual meetup for hosts. Sample ended event.',
    status: 'Ended',
    priority: 'Low',
    audience: 'Hosts',
    startAt: daysAgo(17),
    endAt: daysAgo(17),
    createdAt: daysAgo(20),
    participants: 86,
  }),
  item({
    id: 'EV-2026-0006',
    kind: 'Announcement',
    title: 'New gift tray copy',
    body: 'Draft copy for the gift tray tip. Not shown in the sample app.',
    status: 'Draft',
    priority: 'Low',
    audience: 'All users',
    startAt: daysFrom(10),
    endAt: daysFrom(20),
    createdAt: hoursAgo(6),
  }),
]

const clone = (row) => ({
  ...row,
  startAt: new Date(row.startAt),
  endAt: new Date(row.endAt),
  createdAt: new Date(row.createdAt),
})

export const listEvents = () => (dataReady() ? liveRows('events') : [])
  .map(clone)
  .sort((a, b) => b.startAt - a.startAt)

export const getEvent = (id) => {
  const row = directory.find((item) => item.id === id)
  return row ? clone(row) : null
}

export const createEvent = (payload) => {
  seq += 1
  const row = item({
    id: `EV-2026-${String(seq).padStart(4, '0')}`,
    createdAt: new Date(),
    participants: 0,
    accent: TONES[payload.kind] || 'slate',
    ...payload,
    startAt: new Date(payload.startAt),
    endAt: new Date(payload.endAt),
  })
  directory = [row, ...directory]
  return clone(row)
}

export const updateEvent = (id, payload) => {
  directory = directory.map((row) => (
    row.id === id
      ? {
        ...row,
        ...payload,
        startAt: payload.startAt ? new Date(payload.startAt) : row.startAt,
        endAt: payload.endAt ? new Date(payload.endAt) : row.endAt,
        accent: TONES[payload.kind || row.kind] || row.accent,
      }
      : row
  ))
  return getEvent(id)
}

export const deleteEvent = (id) => {
  directory = directory.filter((row) => row.id !== id)
}

export const statusTone = (status) => {
  if (status === 'Live') return 'success'
  if (status === 'Scheduled') return 'info'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

export const priorityTone = (priority) => {
  if (priority === 'High') return 'danger'
  if (priority === 'Medium') return 'warning'
  return 'success'
}

export const kindTone = (kind) => TONES[kind] || 'slate'

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const toInputDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
