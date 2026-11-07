import { EconomyHeader, TableWrap, td, th } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { inr } from '../../economy/data'

const Revenue = () => {
  const { db, current } = useEconomy()
  return (
    <div className="space-y-4">
      <EconomyHeader title="Host Earnings & Revenue Sharing" description={`Current policy: host ${db.settings.hostSharePct}% · platform ${db.settings.platformSharePct}% · ₹${db.settings.inrValuePerEarnedDiamond} per earned diamond. Each gift keeps the rate saved when it was created.`} />
      <div className="grid grid-cols-1 gap-3 min-[376px]:grid-cols-3">
        <div className="surface-raised rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Gross eligible gift value</p><p className="text-xl font-semibold">{inr(current.hostEntitlement + current.platformShare)}</p></div>
        <div className="surface-raised rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Host entitlement</p><p className="text-xl font-semibold">{inr(current.hostEntitlement)}</p></div>
        <div className="surface-raised rounded-lg border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">Platform share</p><p className="text-xl font-semibold">{inr(current.platformShare)}</p></div>
      </div>
      <TableWrap>
        <table className="w-full min-w-[860px]">
          <thead><tr>{['Gift', 'Diamonds', 'Rate', 'Gross', 'Host', 'Platform'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {current.gifts.slice(0, 20).map((gift) => (
              <tr key={gift.id} className="border-t border-gray-100">
                <td className={td}>{gift.id}<div className="text-xs text-gray-400">{gift.giftName} · {gift.hostName}</div></td>
                <td className={td}>{gift.diamonds.toLocaleString('en-IN')}</td>
                <td className={td}>₹{gift.valuationRate}</td>
                <td className={td}>{inr(gift.grossInr)}</td>
                <td className={td}>{inr(gift.hostInr)} ({gift.hostSharePct}%)</td>
                <td className={td}>{inr(gift.platformInr)} ({gift.platformSharePct}%)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  )
}

export default Revenue
