import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import UserAvatar from '../components/UserAvatar'
import { useLiveMonitor } from '../hooks/useLiveMonitor'
import { formatCompact } from '../utils/dashboardFields'

const FILTERS = [
  { id: 'all', label: 'All hosts' },
  { id: 'live', label: 'Currently live' },
  { id: 'offline', label: 'Offline hosts' },
  { id: 'highest', label: 'Highest viewers' },
  { id: 'lowest', label: 'Lowest viewers' },
  { id: 'recent', label: 'Recently started' },
  { id: 'longest', label: 'Longest streaming' },
]

const pad = (value) => String(value).padStart(2, '0')

const duration = (start, now) => {
  if (!start) return '—'
  const ms = now - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`
}

const sumDuration = (hosts, now) => {
  const ms = hosts.reduce((sum, host) => {
    if (!host.isLive || !host.startTime) return sum
    return sum + Math.max(0, now - new Date(host.startTime).getTime())
  }, 0)
  return duration(new Date(now - ms), now)
}

const clock = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const shown = (value) => (value == null || value === '' ? 'Not on this record' : formatCompact(value))

const LiveStreaming = () => {
  const { hosts, loading, error, now } = useLiveMonitor()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const liveHosts = hosts.filter((host) => host.isLive)

  const totals = useMemo(() => {
    const viewers = liveHosts.reduce((sum, host) => sum + host.viewCount, 0)
    const recordedPeaks = liveHosts.map((host) => host.peakViewers).filter((value) => value != null)
    const peak = recordedPeaks.length
      ? Math.max(...recordedPeaks)
      : liveHosts.reduce((max, host) => Math.max(max, host.viewCount), 0)
    return {
      live: liveHosts.length,
      viewers,
      streams: liveHosts.length,
      offline: hosts.length - liveHosts.length,
      peak,
      peakLabel: recordedPeaks.length ? 'Saved on the live record' : 'Highest room right now',
    }
  }, [hosts, liveHosts])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let list = hosts.filter((host) => {
      if (!needle) return true
      return [host.hostName, host.hostId, host.numericUserId].some((value) => String(value || '').toLowerCase().includes(needle))
    })
    if (filter === 'live' || filter === 'highest' || filter === 'lowest' || filter === 'recent' || filter === 'longest') {
      if (filter === 'live') list = list.filter((host) => host.isLive)
    }
    if (filter === 'offline') list = list.filter((host) => !host.isLive)
    const copy = [...list]
    if (filter === 'highest') copy.sort((a, b) => b.viewCount - a.viewCount || Number(b.isLive) - Number(a.isLive))
    if (filter === 'lowest') copy.sort((a, b) => a.viewCount - b.viewCount || Number(b.isLive) - Number(a.isLive))
    if (filter === 'recent') copy.sort((a, b) => (b.startTime?.getTime?.() || 0) - (a.startTime?.getTime?.() || 0))
    if (filter === 'longest') copy.sort((a, b) => (a.startTime?.getTime?.() || now) - (b.startTime?.getTime?.() || now))
    if (filter === 'all') copy.sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.hostName.localeCompare(b.hostName))
    return copy
  }, [hosts, query, filter, now])

  const selected = hosts.find((host) => host.id === selectedId) || null

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader /></div>
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live Streaming"
        description="Monitor who is live, how many people are watching, and how long each room has been open."
      />
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {[
          ['Total live hosts', totals.live],
          ['Total live viewers', formatCompact(totals.viewers)],
          ['Total active streams', totals.streams],
          ['Total offline hosts', totals.offline],
          ['Peak viewers', formatCompact(totals.peak)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#0f2744] dark:text-white">{value}</p>
            {label === 'Peak viewers' && <p className="text-[11px] text-slate-400">{totals.peakLabel}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search host name, host ID, or user ID"
            className="input-field w-full pl-8"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === item.id ? 'bg-pink-500 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={hosts.length === 0 ? 'No hosts found' : 'No hosts match this search'}
          description={hosts.length === 0 ? 'Approved hosts appear here. A host turns live when their room is active.' : 'Try another name or ID.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((host) => (
            <button
              key={host.id}
              type="button"
              onClick={() => setSelectedId(host.id)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-[#2563eb] hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <UserAvatar userId={host.hostId} name={host.hostName} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{host.hostName}</p>
                    {host.isLive ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">OFFLINE</span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">Host {host.hostId} · User {host.numericUserId || '—'}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-400">Viewers</dt>
                  <dd className="font-semibold tabular-nums text-[#0f2744] dark:text-white">{host.isLive ? formatCompact(host.viewCount) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Duration</dt>
                  <dd className="font-semibold tabular-nums">{host.isLive ? duration(host.startTime, now) : '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-400">Title</dt>
                  <dd className="truncate">{host.title || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Started</dt>
                  <dd>{host.isLive ? clock(host.startTime) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Peak</dt>
                  <dd>{host.peakViewers != null ? formatCompact(host.peakViewers) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Coins earned</dt>
                  <dd className="font-semibold tabular-nums text-[#0f2744] dark:text-white">{host.coinsEarned != null ? host.coinsEarned.toLocaleString() : '—'}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400">Combined live duration {sumDuration(liveHosts, now)}. Counts follow the live room records.</p>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#071525]/40">
          <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm font-semibold">Host details</p>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-md p-1 hover:bg-slate-100" aria-label="Close details">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="flex items-center gap-3">
                <UserAvatar userId={selected.hostId} name={selected.hostName} size="lg" />
                <div>
                  <p className="text-base font-semibold">{selected.hostName}</p>
                  {selected.isLive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Offline</span>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[11px] text-slate-500">Host ID</dt><dd className="font-mono text-xs">{selected.hostId}</dd></div>
                <div><dt className="text-[11px] text-slate-500">User ID</dt><dd className="font-mono text-xs">{selected.numericUserId || '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Status</dt><dd>{selected.isLive ? 'Live' : 'Offline'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Current viewers</dt><dd className="tabular-nums">{selected.isLive ? formatCompact(selected.viewCount) : '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Duration</dt><dd className="tabular-nums">{selected.isLive ? duration(selected.startTime, now) : '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Started</dt><dd>{selected.isLive ? clock(selected.startTime) : '—'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Peak viewers</dt><dd>{shown(selected.peakViewers)}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Coins earned</dt><dd className="tabular-nums">{selected.coinsEarned != null ? selected.coinsEarned.toLocaleString() : 'Not on this record'}</dd></div>
                <div><dt className="text-[11px] text-slate-500">Total streams</dt><dd>{shown(selected.totalStreams)}</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-slate-500">Total views</dt><dd>{shown(selected.totalViews)}</dd></div>
                <div className="col-span-2"><dt className="text-[11px] text-slate-500">Stream title</dt><dd>{selected.title || '—'}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default LiveStreaming
