import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import { DateFilters, EconomyHeader, TableWrap, td, th, usePaged } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { inRange } from '../../economy/data'

const GiftsPage = () => {
  const { db, range } = useEconomy()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => db.gifts.filter((row) => inRange(row.createdAt, range) && `${row.id} ${row.senderId} ${row.hostId} ${row.giftName}`.toLowerCase().includes(query.trim().toLowerCase())), [db.gifts, range, query])
  const page = usePaged(rows)
  return (
    <div className="space-y-4">
      <EconomyHeader title="Gift Transactions" description="A gift moves diamonds from a user wallet into a host earning wallet. It does not issue new diamonds." />
      <DateFilters />
      <input value={query} onChange={(event) => { setQuery(event.target.value); page.setPage(1) }} placeholder="Gift, sender, or host" className="input-field max-w-sm" />
      <TableWrap>
        <table className="w-full min-w-[920px]">
          <thead><tr>{['Gift ID', 'Sender', 'Host', 'Gift', 'Diamonds', 'Session', 'Status', 'Date'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {page.slice.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className={td}>{row.id}</td>
                <td className={td}>{row.senderName}<div className="text-xs text-gray-400">{row.senderId}</div></td>
                <td className={td}>{row.hostName}<div className="text-xs text-gray-400">{row.hostId}</div></td>
                <td className={td}>{row.giftName}</td>
                <td className={td}>{row.diamonds.toLocaleString('en-IN')}</td>
                <td className={td}>{row.sessionId}</td>
                <td className={td}>{row.status}</td>
                <td className={td}>{new Date(row.createdAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Pagination currentPage={page.page} totalPages={page.totalPages} totalItems={page.total} itemsPerPage={page.perPage} onPageChange={page.setPage} onItemsPerPageChange={(value) => { page.setPerPage(value); page.setPage(1) }} />
    </div>
  )
}

export default GiftsPage
