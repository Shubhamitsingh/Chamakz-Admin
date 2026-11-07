import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import UserAvatar from '../components/UserAvatar'
import { useLeaderboardData } from '../hooks/useLeaderboardData'
import { getPresetRange } from '../utils/dashboardFields'

const PAGE_SIZE = 8
const SUCCESS = new Set(['completed', 'success', 'successful', 'paid', 'approved'])
const BLOCKED = new Set(['failed', 'cancelled', 'canceled', 'refunded', 'reversed', 'rejected', 'pending'])
const RANGES = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['thisMonth', 'This month'],
  ['lastMonth', 'Last month'],
  ['all', 'All time'],
  ['custom', 'Custom'],
]

const HOST_CATEGORIES = [
  { id: 'earn', label: 'Top earning hosts' },
  { id: 'hours', label: 'Most live hours' },
  { id: 'gifts', label: 'Most gifted hosts' },
  { id: 'views', label: 'Most viewed hosts' },
  { id: 'active', label: 'Most active hosts' },
]
const USER_CATEGORIES = [
  { id: 'coins', label: 'Top coin purchasers' },
  { id: 'frequent', label: 'Most frequent recharges' },
]

const inRange = (date, range) => date && date >= range.start && date <= range.end

const hoursLabel = (ms) => {
  if (!ms) return '—'
  const hours = ms / 3600000
  if (hours >= 1) return `${hours.toFixed(2)} h`
  return `${Math.max(1, Math.round(ms / 60000))} min`
}

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const blank = (person) => ({
  ...person,
  coins: 0,
  gifts: 0,
  earningsInr: null,
  ms: 0,
  sessions: 0,
  liveDays: 0,
  viewers: 0,
  totalViews: null,
  peak: null,
  purchases: 0,
  purchaseTx: 0,
  rechargeInr: null,
  rechargeTx: 0,
})

const Leaderboard = () => {
  const { users, streams, transactions, loading, error, now } = useLeaderboardData()
  const [group, setGroup] = useState('host')
  const [category, setCategory] = useState('earn')
  const [preset, setPreset] = useState('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const range = preset === 'all'
    ? { start: new Date(0), end: new Date() }
    : getPresetRange(preset, from ? new Date(from) : null, to ? new Date(to) : null)

  const categories = group === 'host' ? HOST_CATEGORIES : USER_CATEGORIES

  const ranked = useMemo(() => {
    const people = new Map()
    users.forEach((user) => {
      people.set(user.id, blank({ id: user.id, name: user.name, publicId: user.numericUserId || user.id, isHost: user.isHost }))
    })
    const byName = new Map()
    users.forEach((user) => {
      const key = user.name.trim().toLowerCase()
      if (!byName.has(key)) byName.set(key, user.id)
      else byName.set(key, null)
    })

    const ensure = (id, name, publicId, isHost) => {
      if (!people.has(id)) people.set(id, blank({ id, name: name || 'Unknown', publicId: publicId || id, isHost }))
      return people.get(id)
    }

    streams.forEach((stream) => {
      if (!inRange(stream.start, range)) return
      const host = users.find((user) => user.id === stream.hostId)
      const row = ensure(stream.hostId || stream.id, host?.name || stream.name, host?.numericUserId || stream.numericUserId, true)
      const end = stream.end ? stream.end.getTime() : (stream.live ? now : null)
      if (end && stream.start) row.ms += Math.max(0, end - stream.start.getTime())
      row.sessions += 1
      row.coins += stream.coins
      row.gifts += stream.gifts
      row.viewers += stream.viewCount
      if (stream.totalViews != null) row.totalViews = (row.totalViews || 0) + stream.totalViews
      if (stream.peak != null) row.peak = Math.max(row.peak || 0, stream.peak)
      if (stream.earningsInr != null) row.earningsInr = (row.earningsInr || 0) + stream.earningsInr
      if (stream.start) row._days = row._days || new Set()
      if (stream.start) row._days.add(dayKey(stream.start))
    })

    transactions.forEach((tx) => {
      if (!inRange(tx.createdAt, range)) return
      const status = tx.status
      const type = tx.type
      if (type.includes('refund') || BLOCKED.has(status)) return
      if (status && !SUCCESS.has(status)) return
      const purchase = ['purchase', 'credit', 'payment'].includes(type)
      const giftSend = type === 'gift'
      if (!purchase && !giftSend) return
      const matchedId = tx.userId || byName.get(tx.name.trim().toLowerCase())
      if (!matchedId) return
      const user = users.find((item) => item.id === matchedId)
      const row = ensure(matchedId, user?.name || tx.name, user?.numericUserId || tx.numericUserId, Boolean(user?.isHost))
      if (purchase) {
        row.purchases += tx.coins
        row.purchaseTx += 1
        if (tx.inr != null) {
          row.rechargeInr = (row.rechargeInr || 0) + tx.inr
          row.rechargeTx += 1
        }
      }
      if (giftSend) {
        row.giftsSent = (row.giftsSent || 0) + 1
        row.coinsSpent = (row.coinsSpent || 0) + tx.coins
      }
    })

    people.forEach((row) => {
      row.liveDays = row._days ? row._days.size : 0
      row.avgMs = row.sessions ? row.ms / row.sessions : 0
    })

    const list = [...people.values()]
    const scoreOf = {
      earn: (row) => row.coins,
      hours: (row) => row.ms,
      gifts: (row) => row.gifts,
      views: (row) => row.totalViews ?? row.viewers,
      active: (row) => row.sessions,
      coins: (row) => row.purchases,
      recharge: (row) => row.rechargeInr || 0,
      frequent: (row) => row.purchaseTx,
      senders: (row) => row.giftsSent || 0,
      engaged: () => 0,
    }
    const audience = group === 'host'
      ? (row) => row.isHost || row.sessions > 0 || row.coins > 0 || row.gifts > 0
      : (row) => !row.isHost
    return list
      .filter((row) => audience(row) && scoreOf[category](row) > 0)
      .sort((a, b) => scoreOf[category](b) - scoreOf[category](a))
  }, [users, streams, transactions, range.start, range.end, now, group, category])

  const visible = ranked.filter((row) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [row.name, row.publicId, row.id].some((value) => String(value || '').toLowerCase().includes(needle))
  })

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const slice = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns = {
    earn: [['Coins earned', (row) => row.coins.toLocaleString()], ['Gifts', (row) => row.gifts.toLocaleString()]],
    hours: [['Live time', (row) => hoursLabel(row.ms)], ['Sessions', (row) => row.sessions]],
    gifts: [['Gifts', (row) => row.gifts.toLocaleString()], ['Gift coins', (row) => row.coins.toLocaleString()]],
    views: [['Viewers', (row) => (row.totalViews ?? row.viewers).toLocaleString()]],
    active: [['Live days', (row) => row.liveDays], ['Live time', (row) => hoursLabel(row.ms)], ['Sessions', (row) => row.sessions]],
    coins: [['Coins purchased', (row) => row.purchases.toLocaleString()], ['Transactions', (row) => row.purchaseTx]],
    frequent: [['Transactions', (row) => row.purchaseTx], ['Coins purchased', (row) => row.purchases.toLocaleString()]],
  }[category] || []

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader /></div>

  return (
    <div className="space-y-4">
      <PageHeader title="Leaderboard & Rankings" />
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[['host', 'Hosts'], ['user', 'Users']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => { setGroup(id); setCategory(id === 'host' ? 'earn' : 'coins'); setPage(1) }} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${group === id ? 'bg-pink-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{label}</button>
          ))}
          {categories.map((item) => (
            <button key={item.id} type="button" onClick={() => { setCategory(item.id); setPage(1) }} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${category === item.id ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{item.label}</button>
          ))}
        </div>
        <label className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name or ID" className="input-field w-full pl-8" />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {RANGES.map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setPreset(id); setPage(1) }} className={`rounded-md px-2.5 py-1 text-xs font-medium ${preset === id ? 'bg-pink-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{label}</button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} className="input-field w-auto text-xs" />
            <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} className="input-field w-auto text-xs" />
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No ranking for this range" description="No matching records in the selected dates." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">ID</th>
                  {columns.map(([label]) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {slice.map((row) => {
                  const place = visible.indexOf(row) + 1
                  const rankTone = place === 1 ? 'bg-amber-100 text-amber-800' : place === 2 ? 'bg-slate-200 text-slate-700' : place === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'
                  return (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${rankTone}`}>{place}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <UserAvatar userId={row.id} name={row.name} size="sm" />
                          <span className="truncate font-medium">{row.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.publicId}</td>
                      {columns.map(([label, read]) => <td key={label} className="px-3 py-2 tabular-nums">{read(row)}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40">Previous</button>
              <span>{safePage} / {pages}</span>
              <button type="button" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Leaderboard
