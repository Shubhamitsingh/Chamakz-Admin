import { Link } from 'react-router-dom'
import { Eye, Gift, Radio, UserCheck, X } from 'lucide-react'
import KpiCard from '../KpiCard'
import UserAvatar from '../UserAvatar'
import Panel from '../Panel'
import { formatCompact, streamDuration } from '../../utils/dashboardFields'

const LiveOps = ({ liveStreams, metrics, stoppingStream, onStopStream }) => (
  <Panel
    title="Live streaming"
    action={
      <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {metrics.liveRooms} live
      </span>
    }
  >
    <div id="live-ops" className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
      <KpiCard title="Live rooms" value={metrics.liveRooms} icon={Radio} tone="rose" />
      <KpiCard title="Viewers now" value={formatCompact(metrics.liveViewers)} icon={Eye} tone="orange" />
      <KpiCard title="Approved hosts" value={metrics.hosts} icon={UserCheck} href="/host-applications" tone="emerald" />
      <KpiCard title="Live-related reports" value={metrics.liveReports} icon={Gift} href="/complaints" tone="amber" hint="Complaints mentioning live" />
    </div>

    {liveStreams.length === 0 ? (
      <p className="text-sm text-gray-500">No hosts are live right now.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
              <th className="py-2 pr-3">Host</th>
              <th className="py-2 pr-3">Room</th>
              <th className="py-2 pr-3">Viewers</th>
              <th className="py-2 pr-3">Duration</th>
              <th className="py-2 pr-3">Gifts / coins</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {liveStreams.map((stream) => (
              <tr key={stream.id} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar userId={stream.hostId} name={stream.hostName} size="sm" />
                    <div>
                      <p className="font-medium">{stream.hostName}</p>
                      <p className="text-[11px] text-gray-500">{stream.numericUserId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-3">{stream.room}</td>
                <td className="py-2 pr-3 tabular-nums">{stream.viewCount}</td>
                <td className="py-2 pr-3">{streamDuration(stream.startTime)}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {stream.gifts || 0} / {formatCompact(stream.totalCoinsEarned || 0)}
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => onStopStream(stream)}
                    disabled={stoppingStream === stream.id}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    {stoppingStream === stream.id ? 'Stopping' : 'Stop'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <p className="mt-3 text-[11px] text-gray-400">
      Peak viewers, failed sessions, and co-host history stay hidden until `live_streams` documents include ended sessions.{' '}
      <Link to="/complaints" className="font-medium text-gray-700 underline dark:text-gray-200">
        Open reports
      </Link>
    </p>
  </Panel>
)

export default LiveOps
