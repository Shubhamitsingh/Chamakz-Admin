import { useState } from 'react'
import { EconomyHeader, TableWrap, statusClass, td, th } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { inr } from '../../economy/data'

const Withdrawals = () => {
  const { db, setWithdrawalStatus } = useEconomy()
  const [reason, setReason] = useState('KYC needs a clearer bank proof')
  const [utr, setUtr] = useState('UTRDEMO1001')
  const [filter, setFilter] = useState('all')
  const rows = db.withdrawals.filter((row) => filter === 'all' || row.status === filter)
  return (
    <div className="space-y-4">
      <EconomyHeader title="Withdrawal Management" description="Status changes update this demo ledger only. No bank transfer is sent." />
      <div className="filter-bar">
        {['all', 'pending', 'under_review', 'approved', 'rejected', 'processing', 'paid'].map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ${filter === item ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item.replace('_', ' ')}</button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={reason} onChange={(event) => setReason(event.target.value)} className="input-field" placeholder="Rejection reason" />
        <input value={utr} onChange={(event) => setUtr(event.target.value)} className="input-field" placeholder="Payout reference" />
      </div>
      <TableWrap>
        <table className="w-full min-w-[980px]">
          <thead><tr>{['Request', 'Host', 'Amount', 'KYC', 'Status', 'Date', 'Actions'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className={td}>{row.id}</td>
                <td className={td}>{row.hostName}<div className="text-xs text-gray-400">{row.hostId}</div></td>
                <td className={td}>{inr(row.amount)}</td>
                <td className={td}>{row.kyc}</td>
                <td className={td}><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusClass(row.status)}`}>{row.status.replace('_', ' ')}</span>{row.utr ? <div className="text-xs text-gray-400">{row.utr}</div> : null}</td>
                <td className={td}>{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className="btn-ghost" onClick={() => setWithdrawalStatus(row.id, 'approved')}>Approve</button>
                    <button type="button" className="btn-ghost" onClick={() => setWithdrawalStatus(row.id, 'rejected', { reason })}>Reject</button>
                    <button type="button" className="btn-ghost" onClick={() => setWithdrawalStatus(row.id, 'processing')}>Processing</button>
                    <button type="button" className="btn-ghost" onClick={() => setWithdrawalStatus(row.id, 'paid', { utr })}>Paid</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  )
}

export default Withdrawals
