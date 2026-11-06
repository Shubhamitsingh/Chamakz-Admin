import { Link } from 'react-router-dom'
import { DollarSign, Gift, Wallet } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KpiCard from '../KpiCard'
import Panel from '../Panel'
import { formatCompact, timeAgo } from '../../utils/dashboardFields'

const EconomyPanel = ({ metrics, availability }) => (
  <Panel
    title="Virtual economy"
    action={
      <Link to="/transactions" className="text-xs font-medium text-gray-600 hover:underline">
        Ledger
      </Link>
    }
  >
    {!availability.payments && (
      <p className="mb-3 rounded-md border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
        Purchased coins, promo coins, and fiat revenue stay at 0 until purchase rows exist with type/amount/status.
      </p>
    )}
    <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
      <KpiCard title="Revenue in range" value={`₹${formatCompact(metrics.revenueInRange)}`} icon={DollarSign} href="/transactions" trend={metrics.revenueChange} tone="emerald" />
      <KpiCard title="Revenue today" value={`₹${formatCompact(metrics.revenueToday)}`} icon={DollarSign} href="/transactions" tone="teal" />
      <KpiCard title="This month" value={`₹${formatCompact(metrics.revenueMonth)}`} icon={DollarSign} href="/transactions" tone="blue" />
      <KpiCard title="Coins purchased" value={formatCompact(metrics.coinsPurchased)} icon={Wallet} href="/transactions" hint="type: purchase/credit" tone="amber" />
      <KpiCard title="Coins spent" value={formatCompact(metrics.coinsSpent)} icon={Gift} href="/gifts" hint="type: spend/gift/debit" tone="violet" />
      <KpiCard title="Promo coins" value={formatCompact(metrics.promoCoins)} icon={Gift} hint="type promo/bonus" tone="pink" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="h-44 lg:col-span-3">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Purchased coins vs revenue</p>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metrics.revenueSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="#05966922" />
            <Area type="monotone" dataKey="coins" name="Coins bought" stroke="#d97706" fill="#d9770622" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="lg:col-span-2">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">Latest ledger rows</p>
        {metrics.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions in this range.</p>
        ) : (
          <ul className="space-y-1.5">
            {metrics.recentTransactions.slice(0, 5).map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{row.userName}</span>
                <span className="tabular-nums text-gray-500">{row.amount}</span>
                <span className="text-[11px] text-gray-400">{timeAgo(row.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700">
            <p className="text-gray-500">Successful</p>
            <p className="font-semibold tabular-nums">{metrics.successfulPayments}</p>
          </div>
          <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700">
            <p className="text-gray-500">Failed</p>
            <p className="font-semibold tabular-nums">{metrics.failedPayments}</p>
          </div>
          <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700">
            <p className="text-gray-500">Pending payouts</p>
            <p className="font-semibold tabular-nums">{metrics.pendingWithdrawals}</p>
          </div>
          <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-gray-700">
            <p className="text-gray-500">Paid payouts</p>
            <p className="font-semibold tabular-nums">{metrics.completedWithdrawals}</p>
          </div>
        </div>
      </div>
    </div>
  </Panel>
)

export default EconomyPanel
