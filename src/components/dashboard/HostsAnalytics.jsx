import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import UserAvatar from '../UserAvatar'
import Panel from '../Panel'
import { formatCompact, timeAgo } from '../../utils/dashboardFields'

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#e11d48']

const HostsAnalytics = ({ metrics, availability, detailsOpen, onToggleDetails }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <Panel
          title="Hosts"
          action={
            <Link to="/host-applications" className="text-xs font-medium text-gray-600 hover:underline">
              Applications
            </Link>
          }
        >
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Registered</p>
              <p className="text-lg font-semibold tabular-nums">{metrics.hosts}</p>
            </div>
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Active 24h</p>
              <p className="text-lg font-semibold tabular-nums">{metrics.activeHosts}</p>
            </div>
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Pending</p>
              <p className="text-lg font-semibold tabular-nums">{metrics.pendingHostApps}</p>
            </div>
          </div>
          <p className="mb-2 text-[11px] text-gray-400">Ranked by wallet coins until a gift-earnings ledger exists</p>
          <ul className="space-y-2">
            {metrics.topHosts.length === 0 ? (
              <p className="text-sm text-gray-500">No host records yet.</p>
            ) : (
              metrics.topHosts.slice(0, 6).map((user, index) => (
                <li key={user.id} className="flex items-center gap-2">
                  <span className="w-4 text-[11px] tabular-nums text-gray-400">{index + 1}</span>
                  <UserAvatar userId={user.id} name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{user.name}</p>
                    <p className="text-[11px] text-gray-500">{user.numericUserId}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatCompact(user.coins)}</span>
                </li>
              ))
            )}
          </ul>
          {!availability.agencies && (
            <p className="mt-3 text-[11px] text-gray-400">Agencies are not in the connected collections yet.</p>
          )}
        </Panel>
      </div>
      <div className="lg:col-span-7">
        <Panel title="User growth">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.activitySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="users" name="New users" stroke="#2563eb" fill="#2563eb22" />
                <Area type="monotone" dataKey="active" name="Seen that day" stroke="#059669" fill="#05966922" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>

    <button
      type="button"
      onClick={onToggleDetails}
      className="text-xs font-medium text-gray-600 underline-offset-2 hover:underline"
    >
      {detailsOpen ? 'Hide secondary analytics' : 'Show location, devices, dating, and recharge detail'}
    </button>

    {detailsOpen && (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Panel title="Location">
            {!availability.location ? (
              <p className="text-sm text-gray-500">Country/city is not stored on user documents.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.countries.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Users" fill="#2563eb" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-4">
          <Panel title="Devices">
            {!availability.platform ? (
              <p className="text-sm text-gray-500">No platform field on users.</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.platforms} dataKey="value" nameKey="label" innerRadius={36} outerRadius={64}>
                      {metrics.platforms.map((entry, index) => (
                        <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-4">
          <Panel title="Dating & social">
            {availability.dating ? (
              <p className="text-sm">
                {metrics.datingEvents} dating events in connected collections.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Likes, matches, and private chats are not in admin collections (`matches`, `likes`). This panel will populate when those documents exist.
              </p>
            )}
            <div className="mt-3 space-y-1 text-[11px] text-gray-500">
              <p>Recently active users: {metrics.mostActive.length ? timeAgo(metrics.mostActive[0].lastActive) : '—'}</p>
              <p>Offline recharge queue: {availability.recharges ? metrics.pendingRecharges : 'collection missing'}</p>
              <p>Gift catalog items: {availability.gifts ? metrics.giftCatalog : '—'}</p>
            </div>
          </Panel>
        </div>
      </div>
    )}
  </div>
)

export default HostsAnalytics
