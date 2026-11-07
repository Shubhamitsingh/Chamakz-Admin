import { CATEGORIES, ROLE_ACCESS, categoryById } from './schema'

const SECRET_KEYS = ['secretKey', 'webhookSecret']

export const canEdit = (role, categoryId) => (ROLE_ACCESS[role] || []).includes(categoryId)

export const stripSecrets = (categoryId, values) => {
  const next = { ...values }
  if (categoryId !== 'payments') return next
  SECRET_KEYS.forEach((key) => {
    if (String(next[key] || '').trim()) {
      next[`${key}Set`] = true
      next[key] = ''
    }
  })
  return next
}

export const validateCategory = (categoryId, values) => {
  const errors = []
  const category = categoryById(categoryId)
  if (!category) return ['Unknown configuration.']
  category.fields.forEach((field) => {
    if (field.type === 'number') {
      const value = Number(values[field.key])
      if (!Number.isFinite(value)) errors.push(`${field.label} must be a number.`)
      else if (field.min != null && value < field.min) errors.push(`${field.label} must be at least ${field.min}.`)
      else if (field.max != null && value > field.max) errors.push(`${field.label} must be at most ${field.max}.`)
    }
    if (field.type === 'text' && field.key === 'supportEmail' && values[field.key] && !String(values[field.key]).includes('@')) {
      errors.push('Support email needs an @ sign.')
    }
  })
  if (categoryId === 'withdrawals') {
    if (Number(values.hostShare) + Number(values.platformShare) !== 100) errors.push('Host share and platform share must add up to 100%.')
    if (Number(values.minWithdrawal) > Number(values.maxWithdrawal)) errors.push('Minimum withdrawal cannot exceed the maximum.')
    if (Number(values.maxDaily) > Number(values.maxMonthly)) errors.push('Daily withdrawal cannot exceed the monthly limit.')
  }
  if (categoryId === 'diamonds' && Number(values.minGift) > Number(values.maxGift)) errors.push('Minimum gift cannot exceed the maximum gift.')
  if (categoryId === 'payments' && Number(values.minPay) > Number(values.maxPay)) errors.push('Minimum payment cannot exceed the maximum.')
  if (categoryId === 'users' && Number(values.minAge) > Number(values.maxAge)) errors.push('Minimum age cannot exceed the maximum age.')
  if (categoryId === 'calls' && values.scheduledRate > 0 && !values.scheduledAt) errors.push('A scheduled rate needs a date and time.')
  return errors
}

export const diffCategory = (categoryId, before, after) => {
  const fields = categoryById(categoryId)?.fields || []
  return fields.filter((field) => field.type !== 'secret' && String(before?.[field.key] ?? '') !== String(after?.[field.key] ?? '')).map((field) => ({
    key: field.key,
    label: field.label,
    from: before?.[field.key],
    to: after?.[field.key],
  }))
}

const billableMinutes = (minutes, freeSeconds, minSeconds, rounding) => {
  if (minutes * 60 < minSeconds) return 0
  let billable = Math.max(0, minutes - freeSeconds / 60)
  if (rounding === 'Round up') billable = Math.ceil(billable)
  else if (rounding === 'Round down') billable = Math.floor(billable)
  return billable
}

export const previewCall = ({ kind, minutes, outcome, balance, calls, share }) => {
  const enabled = calls.videoEnabled
  const rate = Number(calls.videoRate)
  const free = Number(calls.videoFreeSeconds)
  const minimum = Number(calls.videoMinSeconds)
  if (!enabled) return { ok: false, reason: 'Video calls are disabled.' }
  if (['No charge'].includes(outcome) || outcome === 'rejected' || outcome === 'unanswered') {
    return { ok: true, charge: 0, host: 0, platform: 0, rate, reason: 'This outcome is not billed.' }
  }
  const minutesBilled = billableMinutes(Number(minutes), free, minimum, calls.rounding)
  const charge = Math.round(minutesBilled * rate)
  if (charge > Number(balance)) return { ok: false, charge, rate, reason: 'User wallet does not have enough diamonds. The call is blocked before billing.' }
  const host = Math.round(charge * Number(share.hostShare) / 100)
  const platform = charge - host
  return { ok: true, charge, host, platform, rate, minutesBilled, reason: 'User wallet is charged. Host earning diamonds are only the host share.' }
}

export const countSettings = (config) => CATEGORIES.reduce((sum, category) => sum + category.fields.length, 0)

export const FEATURE_FLAGS = ['videoCalls', 'liveStreaming', 'gifts', 'recharge', 'withdrawals', 'chat', 'follow', 'notifications', 'verification', 'referral', 'offers']

export const enabledFeatureCount = (features) => FEATURE_FLAGS.filter((key) => features?.[key]).length
