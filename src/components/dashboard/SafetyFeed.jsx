import { Link } from 'react-router-dom'
import { AlertTriangle, Ban, Shield, Ticket } from 'lucide-react'
import KpiCard from '../KpiCard'
import Panel from '../Panel'
import { timeAgo } from '../../utils/dashboardFields'

const DOT = {
  withdrawal: 'bg-orange-500',
  report: 'bg-rose-500',
  user: 'bg-blue-500',
  host: 'bg-emerald-500',
  live: 'bg-pink-500',
  ticket: 'bg-amber-500',
}

const SafetyFeed = ({ metrics }) => (
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
    <div className="lg:col-span-7">
      <Panel
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
        <p className="text-[11px] text-gray-400">
          KYC queues, strike history, and response-time SLAs are omitted until verification_requests and moderation timestamps exist.
        </p>
      </Panel>
    </div>
    <div className="lg:col-span-5">
      <Panel
        title="Activity feed"
        action={
          <span className="text-[11px] text-gray-400">From users, live, tickets, hosts, reports</span>
        }
      >
        <div className="max-h-56 space-y-1 overflow-y-auto">
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
