import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../../components/Panel'
import { DateFilters, EconomyHeader, StatCard } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { diamonds, inr } from '../../economy/data'

const Chart = ({ title, children }) => (
  <Panel title={title}>
    <div className="h-56 w-full">{children}</div>
  </Panel>
)

const FinanceOverview = () => {
  const { current, previous, chart, trend } = useEconomy()
  const cards = [
    ['Total INR collection', inr(current.inrCollection), trend(current.inrCollection, previous.inrCollection), '/economy/purchases'],
    ['Diamonds issued', diamonds(current.diamondsIssued), trend(current.diamondsIssued, previous.diamondsIssued), '/economy/purchases'],
    ['User wallet diamonds', diamonds(current.userWalletDiamonds), null, '/economy/user-wallets'],
    ['Diamonds gifted', diamonds(current.giftedDiamonds), trend(current.giftedDiamonds, previous.giftedDiamonds), '/economy/gifts'],
    ['Host earned diamonds', diamonds(current.hostEarnedDiamonds), null, '/economy/host-wallets'],
    ['Host INR entitlement', inr(current.hostEntitlement), trend(current.hostEntitlement, previous.hostEntitlement), '/economy/revenue'],
    ['Pending withdrawals', inr(current.pendingWithdrawals), null, '/economy/withdrawals'],
    ['Host payouts completed', inr(current.paidWithdrawals), null, '/economy/withdrawals'],
    ['Platform share', inr(current.platformShare), trend(current.platformShare, previous.platformShare), '/economy/revenue'],
    ['Refunds / chargebacks', inr(current.refundInr), trend(current.refundInr, previous.refundInr), '/economy/purchases'],
    ['Outstanding user diamonds', diamonds(current.userWalletDiamonds), null, '/economy/circulation'],
  ]
  return (
    <div className="space-y-4">
      <EconomyHeader title="Finance Overview" description="Every figure is calculated from the same demo purchases, gifts, adjustments, and withdrawals." />
      <DateFilters />
      <div className="grid grid-cols-1 gap-3 min-[376px]:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, delta, to]) => (
          <StatCard key={label} label={label} value={value} hint={delta == null ? 'Current stock' : 'Vs previous period'} delta={delta} to={to} />
        ))}
      </div>
      <p className="text-xs text-gray-500">Admin credits in this period: {diamonds(current.adminCredits)}. Unspent user diamonds are not counted as host earnings or platform revenue.</p>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Chart title="Daily INR collections">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Area dataKey="inr" stroke="#ec4899" fill="#fce7f3" /></AreaChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Daily diamonds issued">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Area dataKey="issued" stroke="#0f172a" fill="#e2e8f0" /></AreaChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Diamonds gifted">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="gifted" fill="#ec4899" /></BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Host earnings">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Area dataKey="hostInr" stroke="#059669" fill="#d1fae5" /></AreaChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Platform vs host share">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="hostInr" stackId="a" fill="#059669" /><Bar dataKey="platformInr" stackId="a" fill="#64748b" /></BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Wallet distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'Now', user: current.userWalletDiamonds, host: current.hostEarnedDiamonds }]}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
              <Bar dataKey="user" fill="#ec4899" name="User wallet" />
              <Bar dataKey="host" fill="#0f172a" name="Host earning wallet" />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      </div>
    </div>
  )
}

export default FinanceOverview
