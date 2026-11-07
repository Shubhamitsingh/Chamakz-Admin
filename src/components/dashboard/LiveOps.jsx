import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Gift, Radio, Search, UserCheck, X } from 'lucide-react'
import KpiCard from '../KpiCard'
import UserAvatar from '../UserAvatar'
import Panel from '../Panel'
import { formatCompact, streamDuration } from '../../utils/dashboardFields'

const matches = (value, query) => String(value || '').toLowerCase().includes(query)

const LiveOps = ({ liveStreams, metrics, stoppingStream, onStopStream }) => {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [lookup, setLookup] = useState(null)

  useEffect(() => {
    if (!selectedId && liveStreams[0]) setSelectedId(liveStreams[0].id)
  }, [liveStreams, selectedId])

  const selected = liveStreams.find((stream) => stream.id === selectedId) || liveStreams[0] || null
  const needle = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!needle) return liveStreams
    return liveStreams.filter((stream) => (
      matches(stream.numericUserId, needle) ||
      matches(stream.hostName, needle) ||
      matches(stream.hostId, needle) ||
      matches(stream.room, needle)
    ))
  }, [liveStreams, needle])

  const openSearch = (event) => {
    event.preventDefault()
    if (!needle) {
      setLookup(null)
      return
    }
    const live = liveStreams.find((stream) => (
      String(stream.numericUserId || '').toLowerCase() === needle ||
      String(stream.hostId || '').toLowerCase() === needle ||
      matches(stream.hostName, needle) ||
      matches(stream.room, needle)
    ))
    if (live) {
      setSelectedId(live.id)
      setLookup({ state: 'live', name: live.hostName, id: live.numericUserId })
      return
    }
    const person = (metrics.hostDirectory || []).find((user) => (
      String(user.numericUserId || '').toLowerCase() === needle ||
      String(user.id || '').toLowerCase() === needle ||
      matches(user.name, needle)
    ))
    setLookup(person
      ? { state: 'offline', name: person.name, id: person.numericUserId || person.id }
      : { state: 'missing', id: query.trim() })
  }

  return (
    <Panel
      className="flex h-full flex-col"
      title="Live streaming"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          {metrics.liveRooms} live
        </span>
      }
    >
      <div id="live-ops" className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard title="Live rooms" value={metrics.liveRooms} icon={Radio} tone="rose" />
        <KpiCard title="Viewers now" value={formatCompact(metrics.liveViewers)} icon={Eye} tone="orange" />
        <KpiCard title="Approved hosts" value={metrics.hosts} icon={UserCheck} tone="emerald" />
        <KpiCard title="Live-related reports" value={metrics.liveReports} icon={Gift} href="/complaints" tone="amber" hint="Complaints mentioning live" />
      </div>

      <form onSubmit={openSearch} className="mb-3 flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search host ID, name, or room"
            className="input-field w-full pl-8"
          />
        </label>
        <button type="submit" className="rounded-md bg-[#0f2744] px-3 py-1.5 text-xs font-medium text-white">
          Watch
        </button>
      </form>

      {lookup?.state === 'offline' && (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lookup.name} ({lookup.id}) is not live. Only an active room can be opened.
        </p>
      )}
      {lookup?.state === 'missing' && (
        <p className="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          No host found for “{lookup.id}”.
        </p>
      )}

      {!selected ? (
        <p className="text-sm text-gray-500">No hosts are live right now. Search an ID when a room starts.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="overflow-hidden rounded-lg bg-[#0f2744] text-white lg:col-span-3">
            <div className="flex items-center justify-between px-3 py-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                LIVE · {selected.room}
              </span>
              <span className="tabular-nums">{formatCompact(selected.viewCount)} watching</span>
            </div>
            {selected.playbackUrl ? (
              <video src={selected.playbackUrl} className="aspect-video w-full bg-black object-cover" controls autoPlay muted playsInline />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0f2744] to-[#155e75] px-6 text-center">
                <UserAvatar userId={selected.hostId} name={selected.hostName} />
                <p className="text-sm font-semibold">{selected.hostName}</p>
                <p className="text-[11px] text-cyan-100">ID {selected.numericUserId || selected.hostId}</p>
                <p className="max-w-xs text-[11px] text-slate-300">This room has no video URL yet, so the picture cannot play. Viewer count, gifts, and duration are from the live record.</p>
              </div>
            )}
          </div>
          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <UserAvatar userId={selected.hostId} name={selected.hostName} size="sm" />
              <div>
                <p className="text-sm font-medium">{selected.hostName}</p>
                <p className="font-mono text-[11px] text-gray-500">{selected.numericUserId || selected.hostId}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700"><dt className="text-[11px] text-gray-500">Viewers</dt><dd className="font-semibold tabular-nums">{formatCompact(selected.viewCount)}</dd></div>
              <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700"><dt className="text-[11px] text-gray-500">Duration</dt><dd className="font-semibold">{streamDuration(selected.startTime)}</dd></div>
              <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700"><dt className="text-[11px] text-gray-500">Gifts</dt><dd className="font-semibold tabular-nums">{selected.gifts || 0}</dd></div>
              <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700"><dt className="text-[11px] text-gray-500">Coins</dt><dd className="font-semibold tabular-nums">{formatCompact(selected.totalCoinsEarned || 0)}</dd></div>
            </dl>
            <button
              type="button"
              onClick={() => onStopStream(selected)}
              disabled={stoppingStream === selected.id}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              {stoppingStream === selected.id ? 'Stopping' : 'Stop this room'}
            </button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {results.map((stream) => (
            <button
              key={stream.id}
              type="button"
              onClick={() => { setSelectedId(stream.id); setLookup({ state: 'live', name: stream.hostName, id: stream.numericUserId }) }}
              className={`rounded-full px-2.5 py-1 text-[11px] ${selected?.id === stream.id ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {stream.hostName} · {stream.numericUserId || 'ID'} · {formatCompact(stream.viewCount)}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        Search any host ID to open that live room. A video plays only when the room record includes a stream URL.{' '}
        <Link to="/complaints" className="font-medium text-gray-700 underline dark:text-gray-200">Open reports</Link>
      </p>
    </Panel>
  )
}

export default LiveOps
