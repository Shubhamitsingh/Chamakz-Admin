import { Link } from 'react-router-dom'
import { AlertTriangle, Ban, Shield, Ticket } from 'lucide-react'
import KpiCard from '../KpiCard'
import Panel from '../Panel'
import StatusBadge from '../StatusBadge'
import { timeAgo } from '../../utils/dashboardFields'

const DOT = {
  withdrawal: 'bg-orange-500',
  report: 'bg-rose-500',
  user: 'bg-blue-500',
  host: 'bg-emerald-500',
  live: 'bg-pink-500',
  ticket: 'bg-amber-500',
}

const reportTone = (status) => {
  const value = String(status || '').toLowerCase()
  if (value === 'resolved' || value === 'closed') return 'success'
  if (value === 'investigating' || value === 'in-progress') return 'info'
  if (value === 'pending' || value === 'open' || value === 'new') return 'warning'
  return 'neutral'
}

const SafetyFeed = ({ metrics }) => (
  <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
    <div className="lg:col-span-7">
      <Panel
        className="flex h-full flex-col"
        title="Safety & moderation"
        action={
          <Link to="/complaints" className="text-xs font-medium text-gray-600 hover:underline">
            Reports
          </Link>
        }
      >
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <KpiCard title="Pending reports" value={metrics.pendingReports} icon={AlertTriangle} href="/complaints" tone="orange" />
          <KpiCard title="High priority" value={metrics.highPriorityReports} icon={Shield} href="/complaints" tone="rose" />
          <KpiCard title="Open tickets" value={metrics.openTickets} icon={Ticket} href="/tickets" tone="amber" />
          <KpiCard title="Banned / blocked" value={metrics.statusCounts.banned + metrics.statusCounts.blocked} icon={Ban} href="/users" tone="slate" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-md border border-gray-100 px-2.5 py-2 dark:border-gray-700">
            <p className="text-[11px] text-gray-500">Investigating</p>
            <p className="text-sm font-semibold tabular-nums">{metrics.investigatingReports}</p>
          </div>
          <div className="rounded-md border border-gray-100 px-2.5 py-2 dark:border-gray-700">
            <p className="text-[11px] text-gray-500">Unverified users</p>
            <p className="text-sm font-semibold tabular-nums">{metrics.unverified}</p>
          </div>
          <div className="rounded-md border border-gray-100 px-2.5 py-2 dark:border-gray-700">
            <p className="text-[11px] text-gray-500">Unread chats</p>
            <p className="text-sm font-semibold tabular-nums">{metrics.unreadChats}</p>
          </div>
        </div>

        <div className="min-h-[180px]">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Open cases</p>
            <Link to="/tickets" className="text-[11px] text-gray-500 hover:underline">
              Tickets
            </Link>
          </div>
          {metrics.recentReports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports in the connected store.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {metrics.recentReports.map((item) => (
                <li key={item.id}>
                  <Link to="/complaints" className="flex items-start justify-between gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.reported}</p>
                      <p className="truncate text-[11px] text-gray-500">{item.reason} · by {item.reporter}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge tone={item.priority === 'high' ? 'danger' : reportTone(item.status)}>
                        {item.status}
                      </StatusBadge>
                      <span className="text-[11px] text-gray-400">{timeAgo(item.time)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
    <div className="lg:col-span-5">
      <Panel
        className="flex h-full flex-col"
        title="Activity feed"
        action={<span className="text-[11px] text-gray-400">Live queue</span>}
      >
        <div className="flex-1 space-y-1">
          {metrics.activity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent events.</p>
          ) : (
            metrics.activity.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-start justify-between gap-2 rounded-md px-1 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/40"
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <p className="text-[11px] text-gray-500">{item.detail}</p>
                  </div>
                </div>
                <span className="whitespace-nowrap text-[11px] text-gray-400">{timeAgo(item.time)}</span>
              </Link>
            ))
          )}
        </div>
      </Panel>
    </div>
  </div>
)

export default SafetyFeed
