import { createContext, useContext, useMemo, useState } from 'react'
import { circulation, createEconomy, getRange, previousRange, series, summarize, trend } from './data'

const EconomyContext = createContext(null)

export const EconomyProvider = ({ children }) => {
  const [db, setDb] = useState(() => createEconomy())
  const [preset, setPreset] = useState('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const range = useMemo(() => getRange(preset, from, to), [preset, from, to])
  const prior = useMemo(() => previousRange(range), [range])
  const current = useMemo(() => summarize(db, range), [db, range])
  const previous = useMemo(() => summarize(db, prior), [db, prior])
  const flow = useMemo(() => circulation(db), [db])
  const chart = useMemo(() => series(db, range), [db, range])

  const audit = (entry) => {
    setDb((prev) => ({
      ...prev,
      audits: [{ id: `AUD-${Date.now()}`, adminId: 'admin', createdAt: new Date().toISOString(), ...entry }, ...prev.audits],
    }))
  }

  const setWithdrawalStatus = (id, status, extra = {}) => {
    setDb((prev) => ({
      ...prev,
      withdrawals: prev.withdrawals.map((row) => (row.id === id ? { ...row, status, ...extra } : row)),
    }))
    audit({ action: status === 'rejected' ? 'Withdrawal Rejection' : status === 'paid' ? 'Withdrawal Paid' : 'Withdrawal Approval', targetId: id, previousValue: 'previous status', newValue: status, reason: extra.reason || extra.utr || 'Demo status change' })
  }

  const setWalletStatus = (userId, walletStatus, reason) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === userId ? { ...user, walletStatus } : user)),
    }))
    audit({ action: walletStatus === 'frozen' ? 'Wallet Freeze' : 'Wallet Unfreeze', targetId: userId, previousValue: walletStatus === 'frozen' ? 'active' : 'frozen', newValue: walletStatus, reason })
  }

  const adjust = (userId, type, amount, reason) => {
    const diamonds = Number(amount)
    if (!Number.isInteger(diamonds) || diamonds <= 0) throw new Error('Enter a whole number of diamonds greater than zero.')
    if (!db.settings.manualCreditAllowed && type === 'credit') throw new Error('Manual admin credit is turned off in Economy Settings.')
    const statementAvailable = summarize(db, { start: new Date(0), end: new Date() }).stock.find((row) => row.user?.id === userId)?.available || 0
    if (type === 'debit' && diamonds > statementAvailable) throw new Error('Debit is larger than the available user wallet.')
    const row = { id: `ADJ-${Date.now()}`, userId, type, diamonds, reason, createdAt: new Date().toISOString(), adminId: 'admin' }
    setDb((prev) => ({ ...prev, adjustments: [...prev.adjustments, row] }))
    audit({ action: type === 'credit' ? 'Manual Diamond Credit' : 'Manual Diamond Debit', targetId: userId, previousValue: `${statementAvailable} diamonds`, newValue: `${type === 'credit' ? statementAvailable + diamonds : statementAvailable - diamonds} diamonds`, reason })
  }

  const saveSettings = (next) => {
    const host = Number(next.hostSharePct)
    const platform = Number(next.platformSharePct)
    if (host + platform !== 100) throw new Error('Host share and platform share must add up to 100%.')
    if (Number(next.minWithdrawal) > Number(next.maxWithdrawal)) throw new Error('Minimum withdrawal cannot be higher than the maximum.')
    const previousValue = `Host ${db.settings.hostSharePct}% · ₹${db.settings.inrValuePerEarnedDiamond}/diamond`
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...next, hostSharePct: host, platformSharePct: platform } }))
    audit({ action: 'Revenue Setting Change', targetId: 'settings', previousValue, newValue: `Host ${host}% · ₹${next.inrValuePerEarnedDiamond}/diamond`, reason: 'Demo settings update. Existing gifts keep their saved rates.' })
  }

  const value = {
    db,
    preset,
    setPreset,
    from,
    setFrom,
    to,
    setTo,
    range,
    current,
    previous,
    flow,
    chart,
    trend,
    setWithdrawalStatus,
    setWalletStatus,
    adjust,
    saveSettings,
  }

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>
}

export const useEconomy = () => {
  const context = useContext(EconomyContext)
  if (!context) throw new Error('Economy pages must render inside EconomyProvider')
  return context
}
