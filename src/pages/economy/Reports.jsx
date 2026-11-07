import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import { DateFilters, EconomyHeader, TableWrap, td, th, usePaged } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { inRange, userStatement } from '../../economy/data'
import { exportToCSV } from '../../utils/exportUtils'

const REPORTS = [
  ['purchases', 'INR purchase report'],
  ['issuance', 'Diamond issuance report'],
  ['wallets', 'User wallet balance report'],
  ['gifts', 'Gift transaction report'],
  ['earnings', 'Host earning report'],
  ['withdrawals', 'Host withdrawal report'],
  ['platform', 'Platform revenue report'],
  ['refunds', 'Refund and reversal report'],
  ['circulation', 'Diamond circulation report'],
]

const Reports = () => {
  const { db, range } = useEconomy()
  const [kind, setKind] = useState('purchases')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo(() => {
    const all = { start: new Date(0), end: new Date() }
    const text = query.trim().toLowerCase()
    const match = (value) => String(value).toLowerCase().includes(text)
    if (kind === 'purchases' || kind === 'issuance' || kind === 'refunds') {
      return db.payments.filter((row) => inRange(row.createdAt, range) && (kind !== 'refunds' || row.status === 'refunded') && (kind !== 'issuance' || row.status === 'success') && (status === 'all' || row.status === status) && match(`${row.id} ${row.userId}`)).map((row) => ({ id: row.id, user: row.userId, inr: row.inr, diamonds: row.diamonds, status: row.status }))
    }
    if (kind === 'gifts') return db.gifts.filter((row) => inRange(row.createdAt, range) && match(`${row.id} ${row.senderId} ${row.hostId}`)).map((row) => ({ id: row.id, sender: row.senderId, host: row.hostId, diamonds: row.diamonds, status: row.status }))
    if (kind === 'withdrawals') return db.withdrawals.filter((row) => inRange(row.createdAt, range) && (status === 'all' || row.status === status) && match(row.hostId)).map((row) => ({ id: row.id, host: row.hostId, amount: row.amount, status: row.status }))
    if (kind === 'earnings' || kind === 'platform') return db.gifts.filter((row) => inRange(row.createdAt, range) && match(row.hostId)).map((row) => ({ id: row.id, host: row.hostId, gross: row.grossInr, hostInr: row.hostInr, platform: row.platformInr }))
    return db.users.filter((user) => match(user.id)).map((user) => {
      const statement = userStatement(db, user.id, all)
      return { id: user.id, available: statement.available, host: statement.host?.diamondsReceived || 0 }
    })
  }, [db, kind, query, range, status])
  const page = usePaged(rows)
  const headers = rows[0] ? Object.keys(rows[0]) : []
  return (
    <div className="space-y-4">
      <EconomyHeader title="Financial Reports" description="CSV export uses the rows that match the current filters." actions={<button type="button" className="btn-primary" onClick={() => exportToCSV(rows, `chamak-${kind}-demo`)}>Export CSV</button>} />
      <DateFilters />
      <div className="filter-bar">
        {REPORTS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setKind(id); page.setPage(1) }} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${kind === id ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
        ))}
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="User or host ID" className="input-field" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field w-auto">
          {['all', 'success', 'pending', 'failed', 'refunded', 'paid', 'rejected'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <TableWrap>
        <table className="w-full min-w-[640px]">
          <thead><tr>{headers.map((header) => <th key={header} className={th}>{header}</th>)}</tr></thead>
          <tbody>
            {page.slice.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">{headers.map((header) => <td key={header} className={td}>{String(row[header])}</td>)}</tr>
            ))}
            {page.slice.length === 0 && <tr><td className={td}>No rows for this report.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Pagination currentPage={page.page} totalPages={page.totalPages} totalItems={page.total} itemsPerPage={page.perPage} onPageChange={page.setPage} onItemsPerPageChange={(value) => { page.setPerPage(value); page.setPage(1) }} />
    </div>
  )
}

export default Reports
