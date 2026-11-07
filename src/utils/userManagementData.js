import { dataReady, liveRows } from '../data/liveStore'

const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000)
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const USER_SEGMENTS = [
  { id: 'all', path: '/users', label: 'All Users' },
  { id: 'new', path: '/users/new', label: 'New Registrations' },
  { id: 'active', path: '/users/active', label: 'Active Users' },
  { id: 'inactive', path: '/users/inactive', label: 'Inactive Users' },
  { id: 'online', path: '/users/online', label: 'Online Users' },
  { id: 'verified', path: '/users/verified', label: 'Verified Users' },
  { id: 'pending-verification', path: '/users/pending-verification', label: 'Pending Verification' },
  { id: 'vip', path: '/users/vip', label: 'VIP Users' },
  { id: 'hosts', path: '/users/hosts', label: 'Hosts' },
  { id: 'viewers', path: '/users/viewers', label: 'Viewers' },
  { id: 'agency', path: '/users/agency', label: 'Agency Users' },
  { id: 'blocked', path: '/users/blocked', label: 'Blocked / Suspended' },
  { id: 'reported', path: '/users/reported', label: 'Reported Users' },
]

export const USER_ANALYTICS_PATH = '/users/analytics'

const DIRECTORY = [
  { id: 'u1', numericId: '1001234', name: 'Rahul Sharma', username: 'rahul_s', email: 'rahul@example.com', phone: '9876543210', gender: 'Male', age: 28, dob: '1998-03-12', country: 'India', state: 'Maharashtra', city: 'Mumbai', userType: 'Viewer', vip: false, status: 'Active', verification: 'Verified', coins: 1500, registeredAt: daysAgo(40), lastLogin: minutesAgo(18), lastActive: minutesAgo(2), online: true, reported: false, profileComplete: 92, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Music', 'Travel'], datingComplete: true, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
  { id: 'u2', numericId: '1002345', name: 'Priya Singh', username: 'priya_live', email: 'priya@example.com', phone: '9876543211', gender: 'Female', age: 25, dob: '2001-07-04', country: 'India', state: 'Delhi', city: 'New Delhi', userType: 'Host', vip: true, status: 'Active', verification: 'Verified', coins: 2300, registeredAt: daysAgo(28), lastLogin: minutesAgo(4), lastActive: minutesAgo(1), online: true, reported: false, profileComplete: 98, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Dance', 'Fashion'], datingComplete: true, source: 'App Store', platform: 'iOS', appVersion: '2.4.0', liveNow: true },
  { id: 'u3', numericId: '1003456', name: 'Amit Kumar', username: 'amit_host', email: 'amit@example.com', phone: '9876543212', gender: 'Male', age: 31, dob: '1995-11-21', country: 'India', state: 'Karnataka', city: 'Bengaluru', userType: 'Host', vip: false, status: 'Active', verification: 'Pending', coins: 5000, registeredAt: daysAgo(90), lastLogin: hoursAgo(3), lastActive: hoursAgo(3), online: false, reported: false, profileComplete: 74, hasPhoto: true, emailVerified: true, locationGranted: false, interests: ['Gaming'], datingComplete: false, source: 'Referral', platform: 'Android', appVersion: '2.3.8' },
  { id: 'u4', numericId: '1004567', name: 'Sneha Patel', username: 'sneha_p', email: 'sneha@example.com', phone: '9876543213', gender: 'Female', age: 24, dob: '2002-01-09', country: 'India', state: 'Gujarat', city: 'Ahmedabad', userType: 'Viewer', vip: false, status: 'Blocked', verification: 'Rejected', coins: 500, registeredAt: daysAgo(12), lastLogin: daysAgo(6), lastActive: daysAgo(6), online: false, reported: true, profileComplete: 48, hasPhoto: true, emailVerified: false, locationGranted: true, interests: [], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.2.0' },
  { id: 'u5', numericId: '1005678', name: 'Vikram Mehta', username: 'vikram_m', email: 'vikram@example.com', phone: '9876543214', gender: 'Male', age: 29, dob: '1997-05-16', country: 'India', state: 'Maharashtra', city: 'Pune', userType: 'Viewer', vip: true, status: 'Active', verification: 'Verified', coins: 3200, registeredAt: daysAgo(5), lastLogin: hoursAgo(8), lastActive: hoursAgo(8), online: false, reported: false, profileComplete: 88, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Cricket', 'Food'], datingComplete: true, source: 'App Store', platform: 'iOS', appVersion: '2.4.1' },
  { id: 'u6', numericId: '1006789', name: 'Anjali Verma', username: 'anjali_v', email: 'anjali@example.com', phone: '9876543215', gender: 'Female', age: 27, dob: '1999-09-02', country: 'India', state: 'Rajasthan', city: 'Jaipur', userType: 'Host', vip: true, status: 'Active', verification: 'Verified', coins: 7500, registeredAt: daysAgo(110), lastLogin: minutesAgo(20), lastActive: minutesAgo(12), online: true, reported: false, profileComplete: 96, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Singing'], datingComplete: true, source: 'Agency invite', platform: 'Android', appVersion: '2.4.1', agency: 'Starline Media' },
  { id: 'u7', numericId: '1007890', name: 'Rohan Gupta', username: 'rohan_g', email: 'rohan@example.com', phone: '9876543216', gender: 'Male', age: 22, dob: '2004-02-18', country: 'India', state: 'Uttar Pradesh', city: 'Lucknow', userType: 'Viewer', vip: false, status: 'Active', verification: 'None', coins: 1800, registeredAt: daysAgo(1), lastLogin: hoursAgo(20), lastActive: hoursAgo(20), online: false, reported: false, profileComplete: 36, hasPhoto: false, emailVerified: true, locationGranted: false, interests: [], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
  { id: 'u8', numericId: '1008901', name: 'Kavya Reddy', username: 'kavya_r', email: 'kavya@example.com', phone: '9876543217', gender: 'Female', age: 26, dob: '2000-06-30', country: 'India', state: 'Telangana', city: 'Hyderabad', userType: 'Viewer', vip: false, status: 'Active', verification: 'Verified', coins: 2100, registeredAt: daysAgo(18), lastLogin: hoursAgo(6), lastActive: hoursAgo(6), online: false, reported: false, profileComplete: 81, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Movies'], datingComplete: true, source: 'App Store', platform: 'iOS', appVersion: '2.3.9' },
  { id: 'u9', numericId: '1009012', name: 'Meera Iyer', username: 'meera_i', email: 'meera@example.com', phone: '', gender: 'Female', age: 23, dob: '2003-04-11', country: 'India', state: 'Tamil Nadu', city: 'Chennai', userType: 'Viewer', vip: false, status: 'Inactive', verification: 'Pending', coins: 120, registeredAt: daysAgo(48), lastLogin: daysAgo(22), lastActive: daysAgo(22), online: false, reported: false, profileComplete: 41, hasPhoto: false, emailVerified: true, locationGranted: false, interests: ['Art'], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.1.4' },
  { id: 'u10', numericId: '1010123', name: 'Arjun Nair', username: 'arjun_n', email: 'arjun@example.com', phone: '9876543218', gender: '', age: null, dob: '', country: 'India', state: 'Kerala', city: 'Kochi', userType: 'Viewer', vip: false, status: 'Active', verification: 'None', coins: 80, registeredAt: daysAgo(2), lastLogin: minutesAgo(40), lastActive: minutesAgo(9), online: true, reported: false, profileComplete: 22, hasPhoto: false, emailVerified: false, locationGranted: false, interests: [], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
  { id: 'u11', numericId: '1011234', name: 'Neha Kapoor', username: 'neha_k', email: 'neha@example.com', phone: '9876543219', gender: 'Female', age: 30, dob: '1996-12-01', country: 'India', state: 'Haryana', city: 'Gurugram', userType: 'Agency', vip: true, status: 'Active', verification: 'Verified', coins: 12600, registeredAt: daysAgo(200), lastLogin: hoursAgo(1), lastActive: minutesAgo(50), online: false, reported: false, profileComplete: 90, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Business'], datingComplete: false, source: 'Web', platform: 'Web', appVersion: '1.2.0', agency: 'North Star Agency' },
  { id: 'u12', numericId: '1012345', name: 'Farhan Ali', username: 'farhan_a', email: 'farhan@example.com', phone: '9876543220', gender: 'Male', age: 27, dob: '1999-08-19', country: 'India', state: 'West Bengal', city: 'Kolkata', userType: 'Host', vip: false, status: 'Suspended', verification: 'Verified', coins: 900, registeredAt: daysAgo(64), lastLogin: daysAgo(4), lastActive: daysAgo(4), online: false, reported: true, profileComplete: 70, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Comedy'], datingComplete: true, source: 'Play Store', platform: 'Android', appVersion: '2.3.2' },
  { id: 'u13', numericId: '1013456', name: 'Ishita Bose', username: 'ishita_b', email: 'ishita@example.com', phone: '9876543221', gender: 'Female', age: 21, dob: '2005-10-08', country: 'India', state: 'West Bengal', city: 'Kolkata', userType: 'Viewer', vip: false, status: 'Active', verification: 'Pending', coins: 640, registeredAt: daysAgo(3), lastLogin: minutesAgo(6), lastActive: minutesAgo(3), online: true, reported: false, profileComplete: 55, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Books'], datingComplete: false, source: 'App Store', platform: 'iOS', appVersion: '2.4.1' },
  { id: 'u14', numericId: '1014567', name: 'Dev Sharma', username: 'dev_s', email: 'dev@example.com', phone: '9876543222', gender: 'Male', age: 34, dob: '1992-04-27', country: 'India', state: 'Punjab', city: 'Ludhiana', userType: 'Viewer', vip: false, status: 'Inactive', verification: 'Verified', coins: 40, registeredAt: daysAgo(210), lastLogin: daysAgo(40), lastActive: daysAgo(40), online: false, reported: false, profileComplete: 63, hasPhoto: true, emailVerified: true, locationGranted: false, interests: ['Fitness'], datingComplete: true, source: 'Play Store', platform: 'Android', appVersion: '2.0.8' },
  { id: 'u15', numericId: '1015678', name: 'Pooja Desai', username: 'pooja_d', email: 'pooja@example.com', phone: '9876543223', gender: 'Female', age: 28, dob: '1998-02-14', country: 'India', state: 'Gujarat', city: 'Surat', userType: 'Host', vip: true, status: 'Active', verification: 'Verified', coins: 4100, registeredAt: daysAgo(55), lastLogin: minutesAgo(8), lastActive: minutesAgo(2), online: true, reported: false, profileComplete: 94, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Dance'], datingComplete: true, source: 'Agency invite', platform: 'iOS', appVersion: '2.4.0', agency: 'Starline Media' },
  { id: 'u16', numericId: '1016789', name: 'Nikhil Rao', username: 'nikhil_r', email: 'nikhil@example.com', phone: '', gender: 'Male', age: 26, dob: '2000-01-03', country: 'India', state: 'Andhra Pradesh', city: 'Visakhapatnam', userType: 'Viewer', vip: false, status: 'Active', verification: 'None', coins: 260, registeredAt: hoursAgo(10), lastLogin: hoursAgo(2), lastActive: hoursAgo(2), online: false, reported: false, profileComplete: 18, hasPhoto: false, emailVerified: false, locationGranted: false, interests: [], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
  { id: 'u17', numericId: '1017890', name: 'Sara Khan', username: 'sara_k', email: 'sara@example.com', phone: '9876543224', gender: 'Female', age: 24, dob: '2002-09-25', country: 'UAE', state: 'Dubai', city: 'Dubai', userType: 'Viewer', vip: true, status: 'Active', verification: 'Verified', coins: 8800, registeredAt: daysAgo(77), lastLogin: hoursAgo(5), lastActive: hoursAgo(5), online: false, reported: false, profileComplete: 86, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Travel', 'Music'], datingComplete: true, source: 'App Store', platform: 'iOS', appVersion: '2.4.1' },
  { id: 'u18', numericId: '1018901', name: 'Manish Yadav', username: 'manish_y', email: 'manish@example.com', phone: '9876543225', gender: 'Male', age: 32, dob: '1994-07-07', country: 'India', state: 'Bihar', city: 'Patna', userType: 'Agency', vip: false, status: 'Active', verification: 'Pending', coins: 2400, registeredAt: daysAgo(33), lastLogin: daysAgo(1), lastActive: hoursAgo(30), online: false, reported: false, profileComplete: 67, hasPhoto: true, emailVerified: true, locationGranted: true, interests: [], datingComplete: false, source: 'Web', platform: 'Web', appVersion: '1.2.0', agency: 'East Hub Talent' },
  { id: 'u19', numericId: '1019012', name: 'Riya Sen', username: 'riya_s', email: 'riya@example.com', phone: '9876543226', gender: 'Female', age: 22, dob: '2004-05-05', country: 'India', state: 'Assam', city: 'Guwahati', userType: 'Viewer', vip: false, status: 'Active', verification: 'None', coins: 310, registeredAt: daysAgo(8), lastLogin: minutesAgo(3), lastActive: minutesAgo(1), online: true, reported: true, profileComplete: 44, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['K-pop'], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
  { id: 'u20', numericId: '1020123', name: 'Kabir Joshi', username: 'kabir_j', email: 'kabir@example.com', phone: '9876543227', gender: 'Male', age: 29, dob: '1997-03-29', country: 'India', state: 'Madhya Pradesh', city: 'Indore', userType: 'Host', vip: false, status: 'Blocked', verification: 'Rejected', coins: 0, registeredAt: daysAgo(19), lastLogin: daysAgo(9), lastActive: daysAgo(9), online: false, reported: true, profileComplete: 58, hasPhoto: true, emailVerified: true, locationGranted: false, interests: ['Talk'], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.3.0' },
  { id: 'u21', numericId: '1021234', name: 'Tanya Gill', username: 'tanya_g', email: 'tanya@example.com', phone: '9876543228', gender: 'Female', age: 27, dob: '1999-11-11', country: 'India', state: 'Punjab', city: 'Amritsar', userType: 'Host', vip: true, status: 'Active', verification: 'Verified', coins: 5600, registeredAt: daysAgo(142), lastLogin: hoursAgo(2), lastActive: hoursAgo(2), online: false, reported: false, profileComplete: 91, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Fashion'], datingComplete: true, source: 'Agency invite', platform: 'iOS', appVersion: '2.4.0', agency: 'North Star Agency' },
  { id: 'u22', numericId: '1022345', name: 'Omar Sheikh', username: 'omar_s', email: 'omar@example.com', phone: '9876543229', gender: 'Male', age: 35, dob: '1991-06-15', country: 'United Kingdom', state: 'England', city: 'London', userType: 'Viewer', vip: true, status: 'Active', verification: 'Verified', coins: 990, registeredAt: daysAgo(15), lastLogin: daysAgo(2), lastActive: daysAgo(2), online: false, reported: false, profileComplete: 77, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Football'], datingComplete: true, source: 'App Store', platform: 'iOS', appVersion: '2.4.1' },
  { id: 'u23', numericId: '1023456', name: 'Lavanya Pillai', username: 'lavanya_p', email: 'lavanya@example.com', phone: '', gender: '', age: null, dob: '', country: 'India', state: 'Kerala', city: 'Thiruvananthapuram', userType: 'Viewer', vip: false, status: 'Inactive', verification: 'None', coins: 0, registeredAt: daysAgo(26), lastLogin: daysAgo(18), lastActive: daysAgo(18), online: false, reported: false, profileComplete: 12, hasPhoto: false, emailVerified: false, locationGranted: false, interests: [], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.0' },
  { id: 'u24', numericId: '1024567', name: 'Harsh Vardhan', username: 'harsh_v', email: 'harsh@example.com', phone: '9876543230', gender: 'Male', age: 24, dob: '2002-08-22', country: 'India', state: 'Uttar Pradesh', city: 'Noida', userType: 'Viewer', vip: false, status: 'Active', verification: 'Pending', coins: 1450, registeredAt: daysAgo(0.4), lastLogin: minutesAgo(25), lastActive: minutesAgo(4), online: true, reported: false, profileComplete: 39, hasPhoto: true, emailVerified: true, locationGranted: true, interests: ['Startups'], datingComplete: false, source: 'Play Store', platform: 'Android', appVersion: '2.4.1' },
]

const extraState = {}

const mergeUser = (user) => {
  const extra = extraState[user.id] || {}
  return {
    ...user,
    ...extra,
    notes: extra.notes || [],
    audit: extra.audit || [],
    restrictions: extra.restrictions || { live: false, chat: false },
  }
}

export const listUsers = () => (dataReady() ? liveRows('profiles').map(mergeUser) : [])

export const getUserById = (id) => listUsers().find((user) => user.id === id || user.numericId === id) || null

export const applyUserPatch = (id, patch, actor = 'Admin User') => {
  const current = extraState[id] || { notes: [], audit: [], restrictions: { live: false, chat: false } }
  const next = {
    ...current,
    ...patch,
    notes: patch.notes || current.notes || [],
    audit: [
      { id: `a-${Date.now()}`, at: new Date(), actor, action: patch.auditAction || 'Updated profile', detail: patch.auditDetail || '' },
      ...(current.audit || []),
    ],
    restrictions: patch.restrictions || current.restrictions || { live: false, chat: false },
  }
  extraState[id] = next
  return getUserById(id)
}

export const addUserNote = (id, text, actor = 'Admin User') => {
  const current = extraState[id] || { notes: [], audit: [], restrictions: { live: false, chat: false } }
  extraState[id] = {
    ...current,
    notes: [{ id: `n-${Date.now()}`, text, at: new Date(), actor }, ...(current.notes || [])],
    audit: [{ id: `a-${Date.now()}`, at: new Date(), actor, action: 'Added note', detail: text.slice(0, 80) }, ...(current.audit || [])],
  }
  return getUserById(id)
}

const inLast = (date, ms) => date && Date.now() - new Date(date).getTime() <= ms

export const matchesSegment = (user, segment) => {
  switch (segment) {
    case 'new':
      return inLast(user.registeredAt, 3 * 86400000)
    case 'active':
      return user.status === 'Active' && inLast(user.lastActive, 86400000)
    case 'inactive':
      return user.status === 'Inactive' || !inLast(user.lastActive, 14 * 86400000)
    case 'online':
      return user.online === true
    case 'verified':
      return user.verification === 'Verified'
    case 'pending-verification':
      return user.verification === 'Pending'
    case 'vip':
      return user.vip === true
    case 'hosts':
      return user.userType === 'Host'
    case 'viewers':
      return user.userType === 'Viewer'
    case 'agency':
      return user.userType === 'Agency' || Boolean(user.agency)
    case 'blocked':
      return user.status === 'Blocked' || user.status === 'Suspended'
    case 'reported':
      return user.reported === true
    default:
      return true
  }
}

export const filterUsers = ({
  segment = 'all',
  search = '',
  country = 'all',
  state = 'all',
  city = 'all',
  userType = 'all',
  status = 'all',
  verification = 'all',
  coinMin = '',
  coinMax = '',
  from = '',
  to = '',
} = {}) => {
  const q = search.trim().toLowerCase()
  return listUsers().filter((user) => {
    if (!matchesSegment(user, segment)) return false
    if (q) {
      const hay = `${user.numericId} ${user.name} ${user.username} ${user.email}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (country !== 'all' && user.country !== country) return false
    if (state !== 'all' && user.state !== state) return false
    if (city !== 'all' && user.city !== city) return false
    if (userType !== 'all' && user.userType !== userType) return false
    if (status !== 'all' && user.status !== status) return false
    if (verification !== 'all' && user.verification !== verification) return false
    if (coinMin !== '' && user.coins < Number(coinMin)) return false
    if (coinMax !== '' && user.coins > Number(coinMax)) return false
    if (from && new Date(user.registeredAt) < new Date(from)) return false
    if (to && new Date(user.registeredAt) > new Date(`${to}T23:59:59`)) return false
    return true
  })
}

export const uniqueValues = (key) => [...new Set(listUsers().map((user) => user[key]).filter(Boolean))].sort()

export const segmentCounts = () =>
  Object.fromEntries(USER_SEGMENTS.map((item) => [item.id, listUsers().filter((user) => matchesSegment(user, item.id)).length]))

const step = (label, status, at) => ({ label, status, at })

export const buildOnboarding = (user) => {
  const steps = [
    step('Account created', 'completed', user.registeredAt),
    step('Email verification', user.emailVerified ? 'completed' : 'pending', user.emailVerified ? user.registeredAt : null),
    step('Unique user ID generated', 'completed', user.registeredAt),
    step('Name added', user.name ? 'completed' : 'pending', user.registeredAt),
    step('Profile photo uploaded', user.hasPhoto ? 'completed' : 'pending', user.hasPhoto ? user.registeredAt : null),
    step('Date of birth added', user.dob ? 'completed' : 'skipped', user.dob ? user.registeredAt : null),
    step('Gender selected', user.gender ? 'completed' : 'skipped', user.gender ? user.registeredAt : null),
    step('Location permission', user.locationGranted ? 'completed' : 'pending', null),
    step('Interests selected', user.interests?.length ? 'completed' : 'pending', null),
    step('Dating profile completed', user.datingComplete ? 'completed' : 'pending', null),
  ]
  const completed = steps.filter((item) => item.status === 'completed').length
  return {
    steps,
    percent: Math.round((completed / steps.length) * 100),
    incomplete: steps.filter((item) => item.status !== 'completed'),
    source: user.source || 'Unknown',
  }
}

const seedFromId = (id) => id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

export const buildWallet = (user) => {
  const n = seedFromId(user.id)
  const purchased = Math.round(user.coins * 0.62) + (n % 80)
  const promo = Math.round(user.coins * 0.18)
  const received = Math.round(user.coins * 0.4) + (n % 40)
  const spent = purchased + promo + received - user.coins
  const giftsSent = Math.max(20, spent - 120)
  const giftsReceived = user.userType === 'Host' ? received : Math.round(received * 0.2)
  const rows = [
    { id: `tx-${user.id}-1`, type: 'Recharge', coins: 500, status: 'Success', at: daysAgo(2), party: 'UPI', ref: `RCH-${user.numericId}-01` },
    { id: `tx-${user.id}-2`, type: 'Gift sent', coins: -120, status: 'Success', at: daysAgo(1), party: 'Host 1002345', ref: `GFT-${user.numericId}-02` },
    { id: `tx-${user.id}-3`, type: 'Promo credit', coins: 50, status: 'Success', at: daysAgo(6), party: 'Campaign', ref: `PRM-${user.numericId}-03` },
    { id: `tx-${user.id}-4`, type: 'Refund', coins: user.status === 'Blocked' ? 200 : 0, status: user.status === 'Blocked' ? 'Pending' : 'None', at: daysAgo(3), party: 'Finance', ref: `RFD-${user.numericId}-04` },
  ].filter((row) => row.status !== 'None')
  return {
    balance: user.coins,
    purchased,
    promo,
    received,
    spent: Math.max(spent, 0),
    giftsSent,
    giftsReceived,
    pending: rows.filter((row) => row.status === 'Pending'),
    refunds: rows.filter((row) => row.type === 'Refund'),
    recharges: rows.filter((row) => row.type === 'Recharge'),
    table: rows,
  }
}

export const buildLive = (user) => {
  const host = user.userType === 'Host'
  if (!host && !user.liveNow) {
    return {
      sessions: 0,
      hours: 0,
      viewers: 0,
      giftsSent: 4 + (seedFromId(user.id) % 8),
      giftsReceived: 0,
      coinsOnGifts: 80,
      earnings: 0,
      liveNow: false,
      history: [],
      top: [],
    }
  }
  const sessions = host ? 12 + (seedFromId(user.id) % 9) : 1
  return {
    sessions,
    hours: host ? 18.4 + (seedFromId(user.id) % 7) : 0.4,
    viewers: host ? 2400 + seedFromId(user.id) * 3 : 12,
    giftsSent: host ? 22 : 9,
    giftsReceived: host ? 340 : 0,
    coinsOnGifts: host ? 890 : 140,
    earnings: host ? 12600 + seedFromId(user.id) : 0,
    liveNow: Boolean(user.liveNow),
    history: host
      ? [
          { id: 'ls1', title: 'Evening room', viewers: 186, gifts: 42, hours: 2.1, at: hoursAgo(8), status: user.liveNow ? 'Live' : 'Ended' },
          { id: 'ls2', title: 'Weekend special', viewers: 410, gifts: 88, hours: 3.4, at: daysAgo(2), status: 'Ended' },
          { id: 'ls3', title: 'Late night chat', viewers: 97, gifts: 19, hours: 1.2, at: daysAgo(5), status: 'Ended' },
        ]
      : [],
    top: host
      ? [
          { title: 'Weekend special', viewers: 410, gifts: 88 },
          { title: 'Evening room', viewers: 186, gifts: 42 },
        ]
      : [],
  }
}

export const buildDating = (user) => ({
  likesSent: user.datingComplete ? 34 : 2,
  likesReceived: user.datingComplete ? 19 : 0,
  matches: user.datingComplete ? 8 : 0,
  conversations: user.datingComplete ? 6 : 0,
  messages: user.datingComplete ? 124 : 3,
  views: user.hasPhoto ? 210 : 12,
  favorites: user.datingComplete ? 4 : 0,
  blockedUsers: user.reported ? 3 : 1,
  preferences: user.datingComplete
    ? { lookingFor: 'Friendship / dating', ageRange: '22–32', distance: '50 km' }
    : { lookingFor: 'Not set', ageRange: '—', distance: '—' },
  completion: user.datingComplete ? 100 : Math.min(user.profileComplete, 40),
})

export const buildGifts = (user) => [
  { id: `g1-${user.id}`, name: 'Rose', value: 10, from: user.numericId, to: '1002345', tx: `TX-${user.numericId}-11`, at: daysAgo(1), coins: -10, status: 'Success' },
  { id: `g2-${user.id}`, name: 'Crown', value: 500, from: '1005678', to: user.numericId, tx: `TX-${user.numericId}-12`, at: daysAgo(2), coins: 500, status: user.userType === 'Host' ? 'Success' : 'N/A' },
  { id: `g3-${user.id}`, name: 'Heart', value: 50, from: user.numericId, to: '1006789', tx: `TX-${user.numericId}-13`, at: daysAgo(4), coins: -50, status: 'Success' },
].filter((row) => row.status !== 'N/A')

export const buildLogins = (user) => [
  { id: 'l1', at: user.lastLogin, method: 'OTP', device: user.platform === 'iOS' ? 'iPhone 14' : user.platform === 'Web' ? 'Chrome' : 'Pixel 7', os: user.platform, app: user.appVersion, location: `${user.city}, ${user.country}`, active: user.lastActive, alert: false },
  { id: 'l2', at: daysAgo(3), method: 'Passwordless', device: user.platform === 'iOS' ? 'iPhone 14' : 'Pixel 7', os: user.platform, app: user.appVersion, location: `${user.city}, ${user.country}`, active: daysAgo(3), alert: false },
  { id: 'l3', at: daysAgo(9), method: 'OTP', device: 'Unknown Android', os: 'Android', app: '2.3.0', location: 'Approximate · India', active: daysAgo(9), alert: user.status === 'Blocked' },
]

export const buildKyc = (user) => ({
  status: user.verification,
  documentType: user.verification === 'None' ? 'Not submitted' : 'Government ID (type only)',
  submittedAt: user.verification === 'None' ? null : daysAgo(20),
  review: user.verification === 'Verified' ? 'Approved' : user.verification === 'Rejected' ? 'Rejected' : user.verification === 'Pending' ? 'In review' : 'Not started',
  reason: user.verification === 'Rejected' ? 'Photo mismatch — resubmit required' : '—',
  verifiedAt: user.verification === 'Verified' ? daysAgo(18) : null,
  reviewer: user.verification === 'None' ? '—' : 'Admin User',
})

export const buildReports = (user) => ({
  received: user.reported ? 3 : 0,
  submitted: user.status === 'Blocked' ? 1 : 0,
  categories: user.reported ? ['Abuse', 'Spam'] : [],
  history: user.reported
    ? [
        { id: 'r1', type: 'Received', category: 'Abuse', at: daysAgo(6), status: 'Open' },
        { id: 'r2', type: 'Received', category: 'Spam', at: daysAgo(4), status: 'Investigating' },
      ]
    : [],
  warnings: user.reported ? 1 : 0,
  suspensions: user.status === 'Suspended' || user.status === 'Blocked' ? 1 : 0,
  restrictions: user.restrictions,
  appeal: user.status === 'Blocked' ? 'Pending' : 'None',
})

export const build360 = (id) => {
  const user = getUserById(id)
  if (!user) return null
  const onboarding = buildOnboarding(user)
  const wallet = buildWallet(user)
  const live = buildLive(user)
  const dating = buildDating(user)
  return {
    user,
    onboarding,
    wallet,
    live,
    dating,
    gifts: buildGifts(user),
    logins: buildLogins(user),
    kyc: buildKyc(user),
    reports: buildReports(user),
  }
}

const RANGE = { today: 1, '7d': 7, '30d': 30, '90d': 90 }

export const buildUserAnalytics = (preset = '30d') => {
  const users = listUsers()
  const days = RANGE[preset] || 30
  const growth = Array.from({ length: Math.min(days, 14) }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (Math.min(days, 14) - 1 - index))
    const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return {
      name: label,
      registered: users.filter((user) => new Date(user.registeredAt).toDateString() === date.toDateString()).length + (index % 3),
      active: 4 + (index % 5),
    }
  })
  const retention = [
    { name: 'D1', value: 62 },
    { name: 'D7', value: 41 },
    { name: 'D30', value: 24 },
  ]
  const byCountry = Object.entries(
    users.reduce((acc, user) => {
      acc[user.country] = (acc[user.country] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))
  const byState = Object.entries(
    users.reduce((acc, user) => {
      acc[user.state] = (acc[user.state] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  const byCity = Object.entries(
    users.reduce((acc, user) => {
      acc[user.city] = (acc[user.city] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const onboardingRate = Math.round(users.reduce((sum, user) => sum + buildOnboarding(user).percent, 0) / users.length)
  return {
    kpis: {
      total: users.length,
      neu: users.filter((user) => matchesSegment(user, 'new')).length,
      dau: users.filter((user) => matchesSegment(user, 'active')).length,
      mau: users.filter((user) => inLast(user.lastActive, 30 * 86400000)).length,
      online: users.filter((user) => user.online).length,
      inactive: users.filter((user) => matchesSegment(user, 'inactive')).length,
      verified: users.filter((user) => user.verification === 'Verified').length,
      vip: users.filter((user) => user.vip).length,
      hosts: users.filter((user) => user.userType === 'Host').length,
      viewers: users.filter((user) => user.userType === 'Viewer').length,
      onboardingRate,
    },
    growth,
    retention,
    mix: [
      { name: 'Hosts', value: users.filter((user) => user.userType === 'Host').length },
      { name: 'Viewers', value: users.filter((user) => user.userType === 'Viewer').length },
      { name: 'Agency', value: users.filter((user) => user.userType === 'Agency').length },
    ],
    byCountry,
    byState,
    byCity,
  }
}

export const formatWhen = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const formatDay = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const statusTone = (status) => {
  if (status === 'Active') return 'success'
  if (status === 'Blocked' || status === 'Banned') return 'danger'
  if (status === 'Suspended') return 'warning'
  return 'neutral'
}

export const verifyTone = (status) => {
  if (status === 'Verified') return 'success'
  if (status === 'Rejected') return 'danger'
  if (status === 'Pending') return 'warning'
  return 'neutral'
}
