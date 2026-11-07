import { EconomyHeader, TableWrap, td, th } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'

const Audit = () => {
  const { db } = useEconomy()
  return (
    <div className="space-y-4">
      <EconomyHeader title="Audit Logs" description="Completed demo transactions are not edited or deleted. Corrections are added as credit, debit, or reversal rows." />
      <TableWrap>
        <table className="w-full min-w-[860px]">
          <thead><tr>{['Admin', 'Action', 'Target', 'Previous', 'New', 'Reason', 'Time'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {db.audits.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className={td}>{row.adminId}</td>
                <td className={td}>{row.action}</td>
                <td className={td}>{row.targetId}</td>
                <td className={td}>{row.previousValue}</td>
                <td className={td}>{row.newValue}</td>
                <td className={td}>{row.reason}</td>
                <td className={td}>{new Date(row.createdAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  )
}

export default Audit
