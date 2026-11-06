export const toDate = (value) => {
  if (!value) return null
  try {
    if (typeof value.toDate === 'function') return value.toDate()
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

export const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export const endOfDay = (date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const getPresetRange = (preset, customStart, customEnd) => {
  const now = new Date()
  const today = startOfDay(now)

  switch (preset) {
    case 'yesterday': {
      const start = addDays(today, -1)
      return { start, end: endOfDay(start) }
    }
    case '7d':
      return { start: addDays(today, -6), end: now }
    case '30d':
      return { start: addDays(today, -29), end: now }
    case '90d':
      return { start: addDays(today, -89), end: now }
    case 'thisMonth':
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: now }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'thisYear':
      return { start: new Date(today.getFullYear(), 0, 1), end: now }
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : addDays(today, -29),
        end: customEnd ? endOfDay(customEnd) : now,
      }
    case 'today':
    default:
      return { start: today, end: now }
  }
}

export const previousRange = (start, end) => {
  const duration = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)
  return { start: prevStart, end: prevEnd }
}

export const percentChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) return null
    return { direction: 'up', label: `+${current}` }
  }
  const delta = ((current - previous) / previous) * 100
  return {
    direction: delta >= 0 ? 'up' : 'down',
    label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
  }
}

export const formatCompact = (value) => {
  const number = Number(value) || 0
  if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(1)}M`
  if (Math.abs(number) >= 1000) return `${(number / 1000).toFixed(1)}k`
  return number.toLocaleString()
}

export const getUserName = (data = {}) =>
  data.name || data.displayName || data.userName || data.username || data.email || 'Unknown user'

export const getNumericId = (data = {}) =>
  data.numericUserId || data.numeric_user_id || data.userNumericId || data.userId || 'N/A'

export const getGender = (data = {}) => {
  const raw = (data.gender || data.sex || data.userGender || '').toString().trim().toLowerCase()
  if (!raw) return null
  if (['m', 'male', 'man', 'boy'].includes(raw)) return 'male'
  if (['f', 'female', 'woman', 'girl'].includes(raw)) return 'female'
  return 'other'
}

export const getCountry = (data = {}) => {
  const value = data.country || data.countryName || data.countryCode || data.nation
  return value ? String(value).trim() : null
}

export const getCity = (data = {}) => {
  const value = data.city || data.cityName || data.town
  return value ? String(value).trim() : null
}

export const getRegion = (data = {}) => {
  const value = data.region || data.state || data.province || data.stateName
  return value ? String(value).trim() : null
}

export const getAccountStatus = (data = {}) => {
  const status = String(data.status || data.accountStatus || '').toLowerCase()
  if (data.banned === true || status === 'banned') return 'banned'
  if (data.suspended === true || status === 'suspended') return 'suspended'
  if (data.blocked === true || status === 'blocked') return 'blocked'
  if (data.deleted === true || status === 'deleted') return 'deleted'
  if (status === 'inactive') return 'inactive'
  return 'active'
}

export const isVerifiedUser = (data = {}) =>
  data.verified === true ||
  data.isVerified === true ||
  data.profileVerified === true ||
  data.kycStatus === 'approved' ||
  data.kycStatus === 'verified'

export const isPremiumUser = (data = {}) =>
  data.isPremium === true ||
  data.premium === true ||
  String(data.subscriptionStatus || '').toLowerCase() === 'active' ||
  String(data.membership || '').toLowerCase() === 'premium' ||
  String(data.plan || '').toLowerCase() === 'vip'

export const getPlatform = (data = {}) => {
  const raw = String(
    data.platform || data.os || data.deviceType || data.device || data.appPlatform || ''
  ).toLowerCase()
  if (!raw) return null
  if (raw.includes('android')) return 'Android'
  if (raw.includes('ios') || raw.includes('iphone') || raw.includes('ipad')) return 'iOS'
  if (raw.includes('web') || raw.includes('browser')) return 'Web'
  if (raw.includes('desktop') || raw.includes('windows') || raw.includes('mac')) return 'Desktop'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export const getAppVersion = (data = {}) =>
  data.appVersion || data.version || data.app_version || data.buildVersion || null

export const countBy = (items, getter) => {
  const counts = {}
  items.forEach((item) => {
    const key = getter(item)
    if (!key) return
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

export const inRange = (date, start, end) => {
  if (!date) return false
  return date >= start && date <= end
}

export const timeAgo = (date) => {
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export const streamDuration = (startTime) => {
  if (!startTime) return '—'
  const mins = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000)
  if (mins < 1) return 'Just started'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
