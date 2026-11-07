import { useMemo, useState } from 'react'
import Pagination from '../../components/Pagination'
import { Drawer, EconomyHeader, TableWrap, statusClass, td, th, usePaged } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'
import { diamonds, inr, userStatement } from '../../economy/data'

const allTime = { start: new Date(0), end: new Date() }

export const UserWallets = () => {
  const { db, setWalletStatus, adjust } = useEconomy()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('100')
  const [reason, setReason] = useState('Support compensation')
  const [error, setError] = useState('')
  const rows = useMemo(() => db.users.map((user) => ({ user, statement: userStatement(db, user.id, allTime) })).filter(({ user }) => `${user.id} ${user.name}`.toLowerCase().includes(query.trim().toLowerCase())), [db, query])
  const page = usePaged(rows)
  const open = selected ? userStatement(db, selected, allTime) : null
  return (
    <div className="space-y-4">
      <EconomyHeader title="User Wallet Management" description="Purchased diamonds and host earnings stay in separate balances." />
      <input value={query} onChange={(event) => { setQuery(event.target.value); page.setPage(1) }} placeholder="Search user ID or name" className="input-field max-w-sm" />
      <TableWrap>
        <table className="w-full min-w-[860px]">
          <thead><tr>{['User ID', 'Name', 'Role', 'Purchased', 'Gifted', 'Available', 'Status', 'Last activity'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {page.slice.map(({ user, statement }) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className={td}>{user.id}</td>
                <td className={td}>{user.name}</td>
                <td className={td}>{user.role}</td>
                <td className={td}>{statement.purchased.toLocaleString('en-IN')}</td>
                <td className={td}>{statement.gifted.toLocaleString('en-IN')}</td>
                <td className={td}>{statement.available.toLocaleString('en-IN')}</td>
                <td className={td}><span className={`rounded-md px-2 py-0.5 text-xs capitalize ${statusClass(user.walletStatus)}`}>{user.walletStatus}</span></td>
                <td className={td}><button type="button" className="btn-ghost" onClick={() => setSelected(user.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <Pagination currentPage={page.page} totalPages={page.totalPages} totalItems={page.total} itemsPerPage={page.perPage} onPageChange={page.setPage} onItemsPerPageChange={(value) => { page.setPerPage(value); page.setPage(1) }} />
      {open && (
        <Drawer title={`${open.user.name} · ${open.user.id}`} onClose={() => setSelected(null)}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>User wallet: {diamonds(open.available)}</p>
            <p>Purchased: {diamonds(open.purchased)}</p>
            <p>Gifted: {diamonds(open.gifted)}</p>
            <p>INR paid: {inr(open.inrPaid)}</p>
            {open.host && <p>Host earning wallet: {diamonds(open.host.diamondsReceived)}</p>}
            {open.host && <p>Host INR entitlement: {inr(open.host.hostInr)}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => setWalletStatus(open.user.id, open.user.walletStatus === 'frozen' ? 'active' : 'frozen', 'Demo wallet review')}>{open.user.walletStatus === 'frozen' ? 'Unfreeze' : 'Freeze'}</button>
          </div>
          <div className="space-y-2 rounded-lg border border-gray-100 p-3">
            <p className="text-xs font-medium">Manual adjustment</p>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} className="input-field" />
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="input-field" />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={() => { try { adjust(open.user.id, 'credit', Number(amount), reason); setError('') } catch (err) { setError(err.message) } }}>Credit</button>
              <button type="button" className="btn-ghost" onClick={() => { try { adjust(open.user.id, 'debit', Number(amount), reason); setError('') } catch (err) { setError(err.message) } }}>Debit</button>
            </div>
          </div>
          <History title="Payments" rows={open.payments.map((row) => `${row.id} · ${row.status} · ${inr(row.inr)} · ${row.diamonds} diamonds`)} />
          <History title="Gifts sent" rows={open.giftsSent.map((row) => `${row.id} · ${row.giftName} · ${row.diamonds} to ${row.hostId}`)} />
          <History title="Adjustments" rows={open.adjustments.map((row) => `${row.id} · ${row.type} · ${row.diamonds} · ${row.reason}`)} />
        </Drawer>
      )}
    </div>
  )
}

const History = ({ title, rows }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
    {rows.length === 0 ? <p className="text-sm text-gray-400">None</p> : <ul className="mt-1 space-y-1 text-sm">{rows.map((row) => <li key={row}>{row}</li>)}</ul>}
  </div>
)

export const HostWallets = () => {
  const { db } = useEconomy()
  const [selected, setSelected] = useState(null)
  const rows = db.users.filter((user) => user.isHost).map((user) => ({ user, statement: userStatement(db, user.id, allTime) }))
  const page = usePaged(rows, 10)
  const open = selected ? userStatement(db, selected, allTime) : null
  return (
    <div className="space-y-4">
      <EconomyHeader title="Host Earning Wallets" description="A host can also have a user wallet. The two numbers are never added together." />
      <TableWrap>
        <table className="w-full min-w-[980px]">
          <thead><tr>{['Host', 'Gift diamonds', 'Earning diamonds', 'Gross value', 'Host INR', 'Pending', 'Paid', ''].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead>
          <tbody>
            {page.slice.map(({ user, statement }) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className={td}>{user.name}<div className="text-xs text-gray-400">{user.id}</div></td>
                <td className={td}>{statement.host.diamondsReceived.toLocaleString('en-IN')}</td>
                <td className={td}>{statement.host.diamondsReceived.toLocaleString('en-IN')}</td>
                <td className={td}>{inr(statement.host.gross)}</td>
                <td className={td}>{inr(statement.host.hostInr)}</td>
                <td className={td}>{inr(statement.host.pendingInr)}</td>
                <td className={td}>{inr(statement.host.paidInr)}</td>
                <td className={td}><button type="button" className="btn-ghost" onClick={() => setSelected(user.id)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {open?.host && (
        <Drawer title={open.user.name} onClose={() => setSelected(null)}>
          <p className="text-xs font-medium uppercase text-gray-500">Wallet summary</p>
          <p className="text-sm">User wallet {diamonds(open.available)} · Host earning wallet {diamonds(open.host.diamondsReceived)}</p>
          <p className="text-sm">Lifetime gross {inr(open.host.gross)} · Host earnings {inr(open.host.hostInr)} · Pending {inr(open.host.pendingInr)} · Paid {inr(open.host.paidInr)}</p>
          <p className="text-xs font-medium uppercase text-gray-500">Earning calculation</p>
          <ul className="space-y-2 text-sm">
            {open.host.gifts.slice(0, 8).map((gift) => (
              <li key={gift.id}>{gift.diamonds.toLocaleString('en-IN')} × ₹{gift.valuationRate} = {inr(gift.grossInr)}. Host {gift.hostSharePct}% = {inr(gift.hostInr)}. Platform {gift.platformSharePct}% = {inr(gift.platformInr)}. Illustrative rate saved on this gift.</li>
            ))}
          </ul>
          <History title="Gifts received" rows={open.host.gifts.map((gift) => `${gift.id} · ${gift.senderName} · ${gift.giftName} · ${gift.diamonds} · ${gift.sessionId}`)} />
          <History title="Withdrawals" rows={open.host.withdrawals.map((row) => `${row.id} · ${inr(row.amount)} · ${row.status}`)} />
        </Drawer>
      )}
    </div>
  )
}
