import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Panel from '../Panel'
import EmptyState from '../EmptyState'
import { inr } from '../../utils/diamondSellersData'

const NAVY = '#0f2744'
const BLUE = '#2563eb'
const CYAN = '#06b6d4'
const GRID = '#e2e8f0'
const AXIS = { fontSize: 11, fill: '#64748b' }

const GRAINS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

const tipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
}

const money = (value) => inr(value)

const ChartFrame = ({ title, children, empty }) => (
  <Panel title={title}>
    {empty ? (
      <EmptyState title="No requests in this range" description="Change the date filter to see this chart." />
    ) : (
      <div className="h-56 w-full sm:h-64">{children}</div>
    )}
  </Panel>
)

const SellerAnalyticsCharts = ({ analytics, grain, onGrain }) => {
  const trend = analytics.trend || []
  const empty = trend.length === 0
  const maxHeat = Math.max(1, ...analytics.heatmap.cells.flat().map((cell) => cell.count))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Request growth</span>
        {GRAINS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onGrain(item.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              grain === item.id ? 'bg-pink-500 text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartFrame title="Request growth" empty={empty}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis allowDecimals={false} tick={AXIS} />
              <Tooltip contentStyle={tipStyle} />
              <Legend />
              <Line type="monotone" dataKey="requests" name="Requests" stroke={NAVY} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accepted" name="Accepted" stroke={CYAN} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Accepted amount and volume" empty={empty}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} />
              <Tooltip contentStyle={tipStyle} formatter={(value, name) => [name === 'Accepted amount' ? money(value) : money(value), name]} />
              <Legend />
              <Area type="monotone" dataKey="acceptedAmount" name="Accepted amount" stroke={BLUE} fill="#2563eb33" />
              <Area type="monotone" dataKey="volume" name="Request volume" stroke={CYAN} fill="#06b6d433" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Seller-wise accepted requests" empty={analytics.sellerBars.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.sellerBars}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS} interval={0} angle={-20} height={48} />
              <YAxis allowDecimals={false} tick={AXIS} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="accepted" name="Accepted" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Top sellers" empty={analytics.ranking.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.ranking} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tick={AXIS} />
              <YAxis type="category" dataKey="name" width={110} tick={AXIS} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="accepted" name="Accepted requests" fill={NAVY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Accepted, rejected and pending" empty={analytics.sellerBars.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.sellerBars}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS} interval={0} angle={-20} height={48} />
              <YAxis allowDecimals={false} tick={AXIS} />
              <Tooltip contentStyle={tipStyle} />
              <Legend />
              <Bar dataKey="accepted" name="Accepted" stackId="status" fill={BLUE} />
              <Bar dataKey="pending" name="Pending" stackId="status" fill={CYAN} />
              <Bar dataKey="rejected" name="Rejected" stackId="status" fill={NAVY} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Request mix" empty={analytics.outcome.every((row) => row.value === 0)}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.outcome} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="78%" paddingAngle={2}>
                {analytics.outcome.map((row) => (
                  <Cell key={row.name} fill={row.name === 'Accepted' ? BLUE : row.name === 'Pending' ? CYAN : NAVY} />
                ))}
              </Pie>
              <Tooltip contentStyle={tipStyle} formatter={(value, name, item) => [`${value} (${item.payload.percent}%)`, name]} />
              <Legend formatter={(value, entry) => `${value} ${entry.payload.percent}%`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Request funnel">
          {analytics.funnel[0].value === 0 ? (
            <EmptyState title="No requests in this range" description="The funnel fills when requests fall inside the selected dates." />
          ) : (
            <div className="space-y-2 py-2">
              {analytics.funnel.map((step, index) => {
                const base = analytics.funnel[0].value || 1
                const width = Math.max(28, Math.round((step.value / base) * 100))
                const previous = index === 0 ? step.value : analytics.funnel[index - 1].value
                const rate = previous ? Math.round((step.value / previous) * 100) : 0
                return (
                  <div key={step.name}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{step.name}</span>
                      <span className="tabular-nums">{step.value} · {index === 0 ? '100%' : `${rate}% of previous`}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-md bg-slate-100">
                      <div className="flex h-full items-center px-2 text-xs font-medium text-white" style={{ width: `${width}%`, background: index === 0 ? NAVY : index === 1 ? BLUE : CYAN }}>
                        {Math.round((step.value / base) * 100)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        <Panel title="Request activity by day and time">
          {empty ? (
            <EmptyState title="No activity in this range" description="Hourly request times appear here once the range has requests." />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                <div className="grid grid-cols-[40px_repeat(6,minmax(0,1fr))] gap-1 text-[10px] text-slate-500">
                  <span />
                  {analytics.heatmap.slots.map((slot) => <span key={slot} className="text-center">{slot}</span>)}
                  {analytics.heatmap.cells.map((row) => (
                    <div key={row[0].day} className="contents">
                      <span className="self-center">{row[0].day}</span>
                      {row.map((cell) => (
                        <span
                          key={`${cell.day}-${cell.slot}`}
                          title={`${cell.day} ${cell.slot}: ${cell.count} requests`}
                          className="h-7 rounded-sm"
                          style={{ background: `rgba(37, 99, 235, ${0.08 + (cell.count / maxHeat) * 0.92})` }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

export default SellerAnalyticsCharts
