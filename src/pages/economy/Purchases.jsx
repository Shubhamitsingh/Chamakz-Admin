import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import { DateFilters, Drawer, EconomyHeader, TableWrap, statusClass, td, th, usePaged } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { diamonds, inr, inRange } from '../../economy/data'

const Purchases = () => {
  const { db, range } = useEconomy()
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const rows = useMemo(() => db.payments.filter((row) => {
    if (!inRange(row.createdAt, range)) return false
    if (status !== 'all' && row.status !== status) return false
    const text = `${row.id} ${row.userId} ${row.userName}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  }), [db.payments, range, status, query])
  const page = usePaged(rows)
  return (
    <div className="space-y-4">
      <EconomyHeader title="Diamond Purchase Management" description="Successful payments issue diamonds. Pending, failed, and refunded rows stay in the same ledger." />
      <DateFilters />
      <div className="filter-bar">
        {['all', 'success', 'pending', 'failed', 'refunded'].map((item) => (
          <button key={item} type="button" onClick={() => { setStatus(item); page.setPage(1) }} className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ${status === item ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item}</button>
        ))}
        <input value={query} onChange={(event) => { setQuery(event.target.value); page.setPage(1) }} placeholder="Payment ID or user" className="input-field" />
      </div>
      <TableWrap>
        <table className="w-full min-w-[860px]">
          <thead><tr>{['Payment ID', 'User ID', 'User', 'INR', 'Diamonds', 'Gateway', 'Status', 'Date', ''].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {page.slice.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className={td}>{row.id}</td>
                <td className={td}>{row.userId}</td>
                <td className={td}>{row.userName}</td>
                <td className={td}>{inr(row.inr)}</td>
                <td className={td}>{row.diamonds.toLocaleString('en-IN')}</td>
                <td className={td}>{row.gateway}</td>
                <td className={td}><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusClass(row.status)}`}>{row.status}</span></td>
                <td className={td}>{new Date(row.createdAt).toLocaleString('en-IN')}</td>
                <td className={td}><button type="button" className="btn-ghost" onClick={() => setSelected(row)}>View</button></td>
              </tr>
            ))}
            {page.slice.length === 0 && <tr><td className={`${td} text-gray-500`} colSpan={9}>No payments match these filters.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Pagination currentPage={page.page} totalPages={page.totalPages} totalItems={page.total} itemsPerPage={page.perPage} onPageChange={page.setPage} onItemsPerPageChange={(value) => { page.setPerPage(value); page.setPage(1) }} />
      {selected && (
        <Drawer title={selected.id} onClose={() => setSelected(null)}>
          <p className="text-sm">{selected.userName} · {selected.userId}</p>
          <p className="text-sm">{inr(selected.inr)} via {selected.method} · {selected.gateway}</p>
          <p className="text-sm">Rate stored on this payment: {selected.rate} diamonds per ₹1. Issued: {diamonds(selected.diamonds)}.</p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Payment recorded as {selected.status}.</li>
            <li>2. {selected.status === 'success' ? 'User wallet credited.' : selected.status === 'refunded' ? 'Issued diamonds reversed.' : 'No diamonds issued.'}</li>
            <li>3. Wallet history on the user profile reads this same payment id.</li>
          </ol>
        </Drawer>
      )}
    </div>
  )
}

export default Purchases
