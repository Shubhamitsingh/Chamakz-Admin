import { dataReady, liveRows } from '../data/liveStore'

const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000)
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const user = (id, numericId, name, email, role) => ({ id, numericId, name, email, role })

const USERS = {
  u1: user('u1', '1001234', 'Rahul Sharma', 'rahul@example.com', 'User'),
  u2: user('u2', '1002345', 'Priya Singh', 'priya@example.com', 'Host'),
  u3: user('u3', '1003456', 'Amit Kumar', 'amit@example.com', 'Host'),
  u8: user('u8', '1008901', 'Kavya Reddy', 'kavya@example.com', 'User'),
  u15: user('u15', '1015678', 'Pooja Desai', 'pooja@example.com', 'Host'),
}

const item = (partial) => ({
  status: 'active',
  unread: 0,
  topic: 'General',
  platform: 'Android',
  ...partial,
  lastMessage: partial.messages?.[partial.messages.length - 1]?.text || partial.lastMessage || '',
  lastMessageAt: partial.messages?.[partial.messages.length - 1]?.at || partial.lastMessageAt || new Date(),
})

let directory = [
  item({
    id: 'CH-2026-0001',
    user: USERS.u1,
    topic: 'Withdrawal',
    unread: 2,
    platform: 'Android',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Rahul Sharma', text: 'Hello, I need help with my withdrawal.', at: hoursAgo(1) },
      { id: 'm2', sender: 'admin', senderName: 'Admin User', text: 'Hi Rahul — I can check the sample payout queue. What is the request ID?', at: minutesAgo(55) },
      { id: 'm3', sender: 'user', senderName: 'Rahul Sharma', text: 'WD-2026-1008. It has been pending for two days.', at: minutesAgo(50) },
      { id: 'm4', sender: 'user', senderName: 'Rahul Sharma', text: 'When will my withdrawal be processed?', at: minutesAgo(5) },
    ],
  }),
  item({
    id: 'CH-2026-0002',
    user: USERS.u2,
    topic: 'Host live',
    unread: 0,
    platform: 'iOS',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Priya Singh', text: 'Got it, thanks for approving live.', at: hoursAgo(2) },
      { id: 'm2', sender: 'admin', senderName: 'Admin User', text: 'You are all set to go live on this sample account.', at: hoursAgo(1) },
    ],
  }),
  item({
    id: 'CH-2026-0003',
    user: USERS.u3,
    topic: 'Gifts & coins',
    status: 'closed',
    unread: 0,
    platform: 'Android',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Amit Kumar', text: 'Need more coin inventory for tonight.', at: hoursAgo(3) },
      { id: 'm2', sender: 'admin', senderName: 'Admin User', text: 'Logged as a sample request. Closing this thread — open a ticket if stock is still short.', at: hoursAgo(2) },
    ],
  }),
  item({
    id: 'CH-2026-0004',
    user: USERS.u8,
    topic: 'Matching',
    unread: 1,
    platform: 'iOS',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Kavya Reddy', text: 'Discover keeps spinning. Is matching down?', at: minutesAgo(22) },
    ],
  }),
  item({
    id: 'CH-2026-0005',
    user: USERS.u15,
    topic: 'Live quality',
    unread: 0,
    platform: 'iOS',
    messages: [
      { id: 'm1', sender: 'user', senderName: 'Pooja Desai', text: 'Stream pixelates on 4G even in a small room.', at: daysAgo(1) },
      { id: 'm2', sender: 'admin', senderName: 'Admin User', text: 'Noted. We will keep this sample thread open while product checks bitrate.', at: hoursAgo(20) },
      { id: 'm3', sender: 'user', senderName: 'Pooja Desai', text: 'Thanks — I will try Wi-Fi tonight.', at: hoursAgo(18) },
    ],
  }),
]

const clone = (row) => ({
  ...row,
  user: { ...row.user },
  messages: row.messages.map((msg) => ({ ...msg, at: new Date(msg.at) })),
  lastMessageAt: new Date(row.lastMessageAt),
})

export const listChats = () => (dataReady() ? liveRows('chats') : [])
  .map(clone)
  .sort((a, b) => b.lastMessageAt - a.lastMessageAt)

export const getChat = (id) => {
  const row = directory.find((item) => item.id === id)
  return row ? clone(row) : null
}

export const markChatRead = (id) => {
  directory = directory.map((row) => (row.id === id ? { ...row, unread: 0 } : row))
  return getChat(id)
}

export const setChatStatus = (id, status) => {
  directory = directory.map((row) => (row.id === id ? { ...row, status } : row))
  return getChat(id)
}

export const sendChatMessage = (id, text, actor = 'Admin User') => {
  const row = directory.find((item) => item.id === id)
  if (!row || row.status === 'closed') return null
  const msg = {
    id: `m-${Date.now()}`,
    sender: 'admin',
    senderName: actor,
    text: text.trim(),
    at: new Date(),
  }
  directory = directory.map((item) => (
    item.id === id
      ? {
        ...item,
        messages: [...item.messages, msg],
        lastMessage: msg.text,
        lastMessageAt: msg.at,
        unread: 0,
      }
      : item
  ))
  return getChat(id)
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 172800000) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const formatClock = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const formatDay = (value) => {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
