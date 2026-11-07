import { EconomyHeader } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { diamonds } from '../../economy/data'

const Item = ({ label, value }) => (
  <div className="surface-raised rounded-lg border border-gray-200 bg-white p-3">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-semibold">{diamonds(value)}</p>
  </div>
)

const Circulation = () => {
  const { flow } = useEconomy()
  const steps = ['Successful purchase', 'Diamond issuance', 'User wallet', 'Gift transfer', 'Host earning wallet', 'Withdrawal eligibility']
  return (
    <div className="space-y-4">
      <EconomyHeader title="Diamond Supply & Circulation" description="Gifts move diamonds between wallets. They are not counted again as newly issued diamonds." />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {steps.map((step, index) => (
          <span key={step} className="rounded-md bg-slate-100 px-2 py-1">{index + 1}. {step}</span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 min-[376px]:grid-cols-2 xl:grid-cols-3">
        <Item label="Purchased diamonds issued" value={flow.purchased} />
        <Item label="Admin-credited diamonds" value={flow.adminCredit} />
        <Item label="User wallet credits" value={flow.userCredits} />
        <Item label="Diamonds gifted" value={flow.gifted} />
        <Item label="Host earning diamonds" value={flow.hostAvailable} />
        <Item label="User wallet available" value={flow.userAvailable} />
        <Item label="Host earning diamonds available" value={flow.hostAvailable} />
        <Item label="Refunded diamonds" value={flow.refunded} />
        <Item label="Adjustments (debits)" value={flow.adminDebit} />
      </div>
      <div className={`rounded-lg border p-4 ${flow.difference === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
        <p className="text-sm font-medium">{flow.difference === 0 ? 'Reconciliation balances' : 'Reconciliation warning'}</p>
        <p className="mt-1 text-sm text-gray-700">Net issued {diamonds(flow.netIssued)} = purchased {flow.purchased.toLocaleString('en-IN')} − refunded {flow.refunded.toLocaleString('en-IN')} + admin credits {flow.adminCredit.toLocaleString('en-IN')} − admin debits {flow.adminDebit.toLocaleString('en-IN')}.</p>
        <p className="text-sm text-gray-700">Outstanding {diamonds(flow.outstanding)} = user wallets {flow.userAvailable.toLocaleString('en-IN')} + host earning wallets {flow.hostAvailable.toLocaleString('en-IN')}.</p>
        <p className="text-sm text-gray-700">Difference: {flow.difference.toLocaleString('en-IN')} diamonds.</p>
      </div>
    </div>
  )
}

export default Circulation
