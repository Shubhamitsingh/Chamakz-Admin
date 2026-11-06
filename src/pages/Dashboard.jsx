import { useState } from 'react'
import {
  Activity,
  DollarSign,
  Radio,
  Shield,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useApp } from '../context/AppContext'
import { useDashboardData } from '../hooks/useDashboardData'
import KpiCard from '../components/KpiCard'
import Loader from '../components/Loader'
import ActionCenter from '../components/dashboard/ActionCenter'
import LiveOps from '../components/dashboard/LiveOps'
import EconomyPanel from '../components/dashboard/EconomyPanel'
import SafetyFeed from '../components/dashboard/SafetyFeed'
import HostsAnalytics from '../components/dashboard/HostsAnalytics'
import SystemStrip from '../components/dashboard/SystemStrip'
import { exportToCSV } from '../utils/exportUtils'
import { formatCompact, timeAgo } from '../utils/dashboardFields'

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom' },
]

const Dashboard = () => {
  const { showToast } = useApp()
  const [preset, setPreset] = useState('7d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [fullscreen, setFullscreen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [stoppingStream, setStoppingStream] = useState(null)

  const { loading, error, health, availability, lastUpdated, liveStreams, metrics } = useDashboardData({
    preset,
    customStart,
    customEnd,
    countryFilter,
    platformFilter,
    userTypeFilter,
  })

  const handleStopStream = async (stream) => {
    setStoppingStream(stream.id)
    try {
      if (stream.collection === 'users') {
        await updateDoc(doc(db, 'users', stream.hostId), {
          isLive: false,
          liveStreamData: null,
          liveEndedAt: serverTimestamp(),
          liveEndedBy: 'admin',
        })
      } else {
        await updateDoc(doc(db, stream.collection, stream.id), {
          status: 'ended',
          endedAt: serverTimestamp(),
          endedBy: 'admin',
        })
        if (stream.hostId) {
          try {
            await updateDoc(doc(db, 'users', stream.hostId), {
              isLive: false,
              liveStreamData: null,
            })
          } catch {
            // host doc may not exist
          }
        }
      }
      showToast('Stream stopped', 'success')
    } catch (err) {
      showToast(err.message || 'Could not stop stream', 'error')
    }
    setStoppingStream(null)
  }

  const exportReport = () => {
    exportToCSV(
      [
        {
          totalUsers: metrics.totalUsers,
          dau: metrics.activeUsers,
          mau: metrics.mauUsers,
          online: metrics.onlineUsers,
          liveRooms: metrics.liveRooms,
          liveViewers: metrics.liveViewers,
          revenueInRange: metrics.revenueInRange,
          pendingWithdrawals: metrics.pendingWithdrawals,
          pendingReports: metrics.pendingReports,
          pendingHosts: metrics.pendingHostApps,
        },
      ],
      'dashboard-overview'
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${fullscreen ? 'fixed inset-0 z-40 overflow-auto bg-gray-50 p-4 dark:bg-gray-900' : ''}`}>
      <header className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Operations command center</h1>
          <p className="text-xs text-gray-500">
            Decisions first. Metrics only from connected collections.
            {lastUpdated ? ` Updated ${timeAgo(lastUpdated)}.` : ''}
            {health.mock ? ' Local demo store — not production Firebase.' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportReport} className="btn-secondary">
            Export CSV
          </button>
          <button type="button" onClick={() => setFullscreen((value) => !value)} className="btn-secondary">
            {fullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </header>

      <div className="filter-bar">
        {DATE_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              preset === item.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input-field max-w-[140px]" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input-field max-w-[140px]" />
          </>
        )}
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="input-field max-w-[160px]">
          <option value="all">All countries</option>
          {metrics.countryOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="input-field max-w-[160px]">
          <option value="all">All platforms</option>
          {metrics.platformOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className="input-field max-w-[160px]">
          <option value="all">All user types</option>
          <option value="host">Hosts</option>
          <option value="user">Users</option>
        </select>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <ActionCenter metrics={metrics} availability={availability} />

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-sm font-semibold">Executive overview</h2>
          <p className="text-[11px] text-gray-400">{metrics.totalUsers} users in current filters</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          <KpiCard title="Registered" value={formatCompact(metrics.totalUsers)} icon={Users} href="/users" sparkline={metrics.sparkline} hint="All matching filters" tone="blue" />
          <KpiCard title="DAU (24h)" value={formatCompact(metrics.activeUsers)} icon={UserCheck} href="/users" hint="lastActive within 24h" tone="emerald" />
          <KpiCard title="MAU (30d)" value={formatCompact(metrics.mauUsers)} icon={Users} href="/users" hint="lastActive within 30d" tone="sky" />
          <KpiCard title="Online now" value={formatCompact(metrics.onlineUsers)} icon={Activity} href="/users" hint="last 5 minutes" tone="teal" />
          <KpiCard title="New in range" value={formatCompact(metrics.newInRange)} icon={Users} href="/users" trend={metrics.rangeUserChange} sparkline={metrics.sparkline} tone="indigo" />
          <KpiCard title="Live / viewers" value={`${metrics.liveRooms} / ${formatCompact(metrics.liveViewers)}`} icon={Radio} tone="rose" />
          <KpiCard title="Revenue (range)" value={`₹${formatCompact(metrics.revenueInRange)}`} icon={DollarSign} href="/transactions" trend={metrics.revenueChange} tone="emerald" />
          <KpiCard title="Payouts / reports" value={`${metrics.pendingWithdrawals} / ${metrics.pendingReports}`} icon={metrics.pendingReports ? Shield : Wallet} href={metrics.pendingReports ? '/complaints' : '/transactions'} tone="orange" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <LiveOps liveStreams={liveStreams} metrics={metrics} stoppingStream={stoppingStream} onStopStream={handleStopStream} />
        </div>
        <div className="xl:col-span-5">
          <EconomyPanel metrics={metrics} availability={availability} />
        </div>
      </div>

      <SafetyFeed metrics={metrics} />
      <HostsAnalytics
        metrics={metrics}
        availability={availability}
        detailsOpen={detailsOpen}
        onToggleDetails={() => setDetailsOpen((value) => !value)}
      />
      <SystemStrip health={health} />
    </div>
  )
}

export default Dashboard
