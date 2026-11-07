import { useMemo, useState } from 'react'
import {
  Activity,
  DollarSign,
  Radio,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useDashboardData } from '../hooks/useDashboardData'
import KpiCard from '../components/KpiCard'
import Loader from '../components/Loader'
import ActionCenter from '../components/dashboard/ActionCenter'
import EconomyPanel from '../components/dashboard/EconomyPanel'
import SafetyFeed from '../components/dashboard/SafetyFeed'
import HostsAnalytics from '../components/dashboard/HostsAnalytics'
import SystemStrip from '../components/dashboard/SystemStrip'
import GeoSnapshot from '../components/dashboard/GeoSnapshot'
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap'
import { exportToCSV } from '../utils/exportUtils'
import { formatCompact, timeAgo } from '../utils/dashboardFields'
import { inr, summarize } from '../economy/data'
import { economyFromLive, useDataRevision } from '../data/liveStore'

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
  const [preset, setPreset] = useState('7d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [fullscreen, setFullscreen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const revision = useDataRevision()
  const economyTotals = useMemo(() => summarize(economyFromLive(), { start: new Date(0), end: new Date() }), [revision])

  const { loading, error, health, availability, lastUpdated, metrics } = useDashboardData({
    preset,
    customStart,
    customEnd,
    countryFilter,
    platformFilter,
    userTypeFilter,
  })

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

      <div className="filter-bar surface-raised">
        {DATE_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              preset === item.id
                ? 'bg-pink-500 text-white'
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
        <div className="grid grid-cols-1 gap-2 min-[376px]:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <KpiCard title="Registered" value={formatCompact(metrics.totalUsers)} icon={Users} href="/users" sparkline={metrics.sparkline} hint="All matching filters" tone="blue" />
          <KpiCard title="DAU (24h)" value={formatCompact(metrics.activeUsers)} icon={UserCheck} href="/users" hint="lastActive within 24h" sparkline={metrics.activeSparkline} tone="sky" />
          <KpiCard title="MAU (30d)" value={formatCompact(metrics.mauUsers)} icon={Users} href="/users" hint="lastActive within 30d" sparkline={metrics.activeSparkline} tone="blue" />
          <KpiCard title="Online now" value={formatCompact(metrics.onlineUsers)} icon={Activity} href="/users" hint="last 5 minutes" sparkline={metrics.activeSparkline} tone="sky" />
          <KpiCard title="New in range" value={formatCompact(metrics.newInRange)} icon={Users} href="/users" trend={metrics.rangeUserChange} sparkline={metrics.sparkline} tone="indigo" />
          <KpiCard title="Live / viewers" value={`${metrics.liveRooms} / ${formatCompact(metrics.liveViewers)}`} icon={Radio} sparkline={metrics.activeSparkline} tone="blue" />
          <KpiCard title="Platform revenue" value={inr(economyTotals.platformShare)} icon={DollarSign} href="/economy" hint="Our share of gifted diamonds" tone="emerald" />
          <KpiCard title="Paid / left" value={`${inr(economyTotals.paidWithdrawals)} / ${inr(economyTotals.hostEntitlement - economyTotals.paidWithdrawals)}`} icon={Wallet} href="/economy/withdrawals" hint="Paid to hosts / still to pay" tone="amber" />
                </div>
      </section>

      <EconomyPanel preset={preset} customStart={customStart} customEnd={customEnd} />

      <SafetyFeed metrics={metrics} />
      <ActivityHeatmap heatmap={metrics.activityHeatmap} />
      <GeoSnapshot preset={['today', '7d', '30d', '90d', 'custom'].includes(preset) ? preset : '30d'} />
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
