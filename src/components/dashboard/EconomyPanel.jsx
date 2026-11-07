import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../Panel'
import { diamonds, getRange, inr, series, summarize } from '../../economy/data'
import { economyFromLive, useDataRevision } from '../../data/liveStore'

const rangeFor = (preset, customStart, customEnd) => {
  if (preset === 'thisMonth') return getRange('month')
  if (preset === '90d') {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 89)
    return { start, end }
  }
  if (preset === 'lastMonth') {
    const now = new Date()
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    }
  }
  if (preset === 'custom') return getRange('custom', customStart, customEnd)
  return getRange(preset)
}

const ROW_TONES = {
  emerald: 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20',
  sky: 'border-l-sky-500 bg-sky-50/70 dark:bg-sky-950/20',
  amber: 'border-l-amber-500 bg-amber-50/80 dark:bg-amber-950/20',
  rose: 'border-l-rose-500 bg-rose-50/70 dark:bg-rose-950/20',
  pink: 'border-l-pink-500 bg-pink-50/70 dark:bg-pink-950/20',
  violet: 'border-l-violet-500 bg-violet-50/70 dark:bg-violet-950/20',
  slate: 'border-l-slate-400 bg-slate-50/80 dark:bg-slate-800/40',
}

const Row = ({ label, value, to, note, tone = 'slate' }) => (
  <Link to={to} className={`flex items-center justify-between gap-3 rounded-md border border-gray-100 border-l-4 px-2.5 py-2 dark:border-gray-700 ${ROW_TONES[tone]}`}>
    <span>
      <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">{label}</span>
      <span className="block text-[11px] text-gray-500">{note}</span>
    </span>
    <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{value}</span>
  </Link>
)

const MONEY_TONES = {
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100',
  sky: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100',
  amber: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100',
}

const Money = ({ label, value, note, tone }) => (
  <div className={`rounded-lg border p-3 ${MONEY_TONES[tone]}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    <p className="mt-1 text-[11px] opacity-70">{note}</p>
  </div>
)

const EconomyPanel = ({ preset = '30d', customStart = '', customEnd = '' }) => {
  const revision = useDataRevision()
  const db = useMemo(() => economyFromLive(), [revision])
  const range = useMemo(() => rangeFor(preset, customStart, customEnd), [preset, customStart, customEnd])
  const review = useMemo(() => summarize(db, range), [db, range])
  const totals = useMemo(() => summarize(db, { start: new Date(0), end: new Date() }), [db])
  const chart = useMemo(() => series(db, range), [db, range])
  const hostInRange = review.gifts.reduce((sum, gift) => sum + gift.hostInr, 0)
  const platformInRange = review.gifts.reduce((sum, gift) => sum + gift.platformInr, 0)
  const grossInRange = hostInRange + platformInRange
  const platformRevenue = totals.platformShare
  const paidToHosts = totals.paidWithdrawals
  const stillToPay = totals.hostEntitlement - totals.paidWithdrawals
  const grossAll = totals.platformShare + totals.hostEntitlement

  return (
    <Panel
      className="surface-raised flex h-full flex-col"
      title="Platform revenue"
      action={<Link to="/economy" className="text-xs font-medium text-gray-600 hover:underline">Open full review</Link>}
    >
      <p className="mb-3 text-[11px] text-amber-800">Demo data. Revenue is the INR value of diamonds that were gifted. Diamonds still sitting in a user wallet are not revenue.</p>
      <div className="mb-3 grid grid-cols-1 gap-2 min-[376px]:grid-cols-3">
        <Money tone="emerald" label="Platform revenue" value={inr(platformRevenue)} note="Our share of every diamond gift" />
        <Money tone="sky" label="Paid to hosts" value={inr(paidToHosts)} note="Withdrawals already marked paid" />
        <Money tone="amber" label="Still to pay hosts" value={inr(stillToPay)} note="Host earnings not paid yet" />
      </div>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">
        {diamonds(totals.stock.reduce((sum, row) => sum + (row.host?.diamondsReceived || 0), 0))} were gifted. Their value is {inr(grossAll)}. Platform keeps {inr(platformRevenue)}. Hosts earned {inr(totals.hostEntitlement)}, of which {inr(paidToHosts)} is paid and {inr(stillToPay)} is left.
      </p>
      <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">Selected dates · gift value {inr(grossInRange)} · platform {inr(platformInRange)} · host share {inr(hostInRange)}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Row tone="emerald" label="INR collected" note="Successful payments in this range" value={inr(review.inrCollection)} to="/economy/purchases" />
        <Row tone="sky" label="Diamonds issued" note="From those successful payments" value={diamonds(review.diamondsIssued)} to="/economy/purchases" />
        <Row tone="pink" label="Diamonds gifted" note="Moved to hosts, not newly issued" value={diamonds(review.giftedDiamonds)} to="/economy/gifts" />
        <Row tone="violet" label="Host earnings" note="Host share of gifts in this range" value={inr(hostInRange)} to="/economy/revenue" />
        <Row tone="emerald" label="Platform share" note="Platform share of gifts in this range" value={inr(platformInRange)} to="/economy/revenue" />
        <Row tone="rose" label="Refunds" note="Reversed payments in this range" value={inr(review.refundInr)} to="/economy/purchases" />
        <Row tone="slate" label="User wallets" note="Diamonds still held by users" value={diamonds(review.userWalletDiamonds)} to="/economy/user-wallets" />
        <Row tone="violet" label="Host earning wallets" note="Diamonds received and still held" value={diamonds(review.hostEarnedDiamonds)} to="/economy/host-wallets" />
        <Row tone="amber" label="Pending withdrawals" note="Waiting for approval or payout" value={inr(review.pendingWithdrawals)} to="/transactions" />
        <Row tone="sky" label="Paid to hosts" note="Withdrawals already marked paid" value={inr(review.paidWithdrawals)} to="/transactions" />
      </div>
      <div className="mt-3 h-36">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Platform revenue from gifts in this range</p>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area dataKey="platformInr" name="Platform" stroke="#059669" fill="#d1fae5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export default EconomyPanel
