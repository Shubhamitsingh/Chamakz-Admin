import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import { getStore, touchStore } from '../firebase/shims/firestore'
import {
  adminRecharge,
  profileOf,
  sellerTransfer,
  setSellerStatus,
  setWalletFrozen,
  summarize,
} from '../utils/diamondLedger'

const SECTIONS = [
  ['overview', 'Overview'],
  ['recharge', 'Admin recharge'],
  ['users', 'User diamonds'],
  ['sellers', 'Sellers'],
  ['history', 'Transaction history'],
]

const RANGES = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['all', 'All'],
  ['custom', 'Custom'],
]

const REASONS = ['Promotion', 'Support compensation', 'Seller stock', 'Correction', 'Other']

const dayStart = (date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const inRange = (iso, range, from, to) => {
  const date = new Date(iso)
  const today = dayStart(new Date())
  if (range === 'today') return date >= today
  if (range === 'yesterday') return date >= new Date(today.getTime() - 86400000) && date < today
  if (range === '7d') return date >= new Date(today.getTime() - 6 * 86400000)
  if (range === '30d') return date >= new Date(today.getTime() - 29 * 86400000)
  if (range === 'custom') {
    if (from && date < dayStart(from)) return false
    if (to) {
      const end = dayStart(to)
      end.setDate(end.getDate() + 1)
      if (date >= end) return false
    }
  }
  return true
}

const refresh = (setTick) => {
  touchStore('users', 'diamond_wallets', 'diamond_transactions', 'notifications', 'admin_audit_logs')
  setTick((value) => value + 1)
}

const DiamondMarketplace = () => {
  const [tick, setTick] = useState(0)
  const [section, setSection] = useState('overview')
  const [query, setQuery] = useState('')
  const [profile, setProfile] = useState(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('Seller stock')
  const [customReason, setCustomReason] = useState('')
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sellerQuery, setSellerQuery] = useState('')
  const [sellerProfile, setSellerProfile] = useState(null)
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipient, setRecipient] = useState(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferPreview, setTransferPreview] = useState(false)
  const [range, setRange] = useState('7d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmKey, setConfirmKey] = useState('')

  const store = getStore()
  const summary = useMemo(() => summarize(store), [tick, store])
  const people = useMemo(() => (
    Object.keys(store.users || {}).map((id) => profileOf(store, id)).filter(Boolean)
  ), [tick, store])

  const chart = useMemo(() => {
    const days = [...Array(7)].map((_, index) => {
      const date = dayStart(new Date())
      date.setDate(date.getDate() - (6 - index))
      const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const rows = summary.rows.filter((row) => dayStart(row.createdAt).getTime() === date.getTime() && row.status === 'completed')
      return {
        label,
        recharge: rows.filter((row) => row.type === 'ADMIN_RECHARGE').reduce((sum, row) => sum + row.quantity, 0),
        transfer: rows.filter((row) => row.type === 'SELLER_TRANSFER').reduce((sum, row) => sum + row.quantity, 0),
      }
    })
    return days
  }, [summary.rows])

  const history = summary.rows
    .filter((row) => inRange(row.createdAt, range, from, to))
    .filter((row) => typeFilter === 'all' || row.type === typeFilter || (typeFilter === 'failed' && row.status === 'failed'))
    .filter((row) => {
      const needle = search.trim().toLowerCase()
      if (!needle) return true
      return [row.id, row.senderUserId, row.receiverUserId, row.senderNumericId, row.receiverNumericId, row.senderName, row.receiverName]
        .some((value) => String(value || '').toLowerCase().includes(needle))
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const lookup = () => {
    setError('')
    setMessage('')
    setPreview(false)
    const next = profileOf(store, query)
    setProfile(next)
    if (!next) setError('No account matches that User ID in this demo store.')
  }

  const runRecharge = () => {
    setError('')
    setMessage('')
    const key = confirmKey || crypto.randomUUID()
    setConfirmKey(key)
    try {
      const result = adminRecharge(store, {
        userQuery: query,
        amount: Number(amount),
        reason: reason === 'Other' ? customReason : reason,
        actorId: 'admin',
        actorRole: 'superadmin',
        idempotencyKey: key,
      })
      refresh(setTick)
      setProfile(profileOf(getStore(), query))
      setPreview(false)
      setConfirmKey('')
      setMessage(result.replayed
        ? `This confirmation was already saved as ${result.transaction.id}. The balance was not changed again.`
        : `Demo ledger credited ${Number(amount).toLocaleString()} diamonds. Transaction ${result.transaction.id}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const runTransfer = () => {
    setError('')
    setMessage('')
    const key = confirmKey || crypto.randomUUID()
    setConfirmKey(key)
    try {
      const result = sellerTransfer(store, {
        sellerQuery: sellerQuery,
        recipientQuery: recipientQuery,
        amount: Number(transferAmount),
        idempotencyKey: key,
      })
      refresh(setTick)
      setSellerProfile(profileOf(getStore(), sellerQuery))
      setRecipient(profileOf(getStore(), recipientQuery))
      setTransferPreview(false)
      setConfirmKey('')
      setMessage(result.replayed
        ? `This transfer was already saved as ${result.transaction.id}.`
        : `Demo transfer ${result.transaction.id} completed.`)
    } catch (err) {
      setError(err.message)
    }
  }

  const changeSeller = (userQuery, status) => {
    try {
      setSellerStatus(store, { userQuery, status, actorId: 'admin' })
      refresh(setTick)
      setMessage(`Seller status saved as ${status}.`)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const freeze = (userQuery, frozen) => {
    try {
      setWalletFrozen(store, { userQuery, frozen, actorId: 'admin' })
      refresh(setTick)
      setMessage(frozen ? 'Wallet frozen. New seller transfers are blocked.' : 'Wallet unfrozen.')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const stats = [
    ['Diamonds in circulation', summary.circulation.toLocaleString(), 'Current coin balances'],
    ['Credited by admin', summary.creditedByAdmin.toLocaleString(), 'Completed recharges'],
    ['Transferred', summary.transferred.toLocaleString(), 'Seller transfers'],
    ['Received by users', summary.receivedByUsers.toLocaleString(), 'Credits plus transfers'],
    ['Approved sellers', summary.sellers, 'Linked user accounts'],
    ['Transactions', summary.transactions, 'Ledger rows'],
    ["Today's recharge", summary.todayRecharge.toLocaleString(), 'Admin credits today'],
    ["Today's transfers", summary.todayTransfer.toLocaleString(), 'Seller sends today'],
    ['Pending / failed', `${summary.pending} / ${summary.failed}`, 'Not completed'],
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Diamond Marketplace" />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{message}</div>}

      <div className="filter-bar surface-raised overflow-x-auto">
        {SECTIONS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setSection(id); setError(''); setMessage('') }} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${section === id ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
        ))}
      </div>

      {section === 'overview' && (
        <>
          <div className="grid grid-cols-1 gap-2 min-[376px]:grid-cols-2 xl:grid-cols-3">
            {stats.map(([label, value, hint]) => (
              <div key={label} className="surface-raised flex min-h-[88px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-3.5 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <div>
                  <p className="text-xl font-semibold tabular-nums leading-none">{value}</p>
                  <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>
                </div>
              </div>
            ))}
          </div>
          <Panel title="Last 7 days" action={<p className="text-[11px] text-gray-400">Saved ledger rows only</p>}>
            {summary.transactions === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">No diamond transactions yet.</div>
            ) : (
              <div className="h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} width={48} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="recharge" name="Admin recharge" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="transfer" name="Seller transfer" fill="#0f2744" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </>
      )}

      {section === 'recharge' && (
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title="Recharge by User ID">
            <p className="mb-3 text-xs text-gray-500">Credits the existing coin balance on the matched account.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="User ID" className="input-field" />
              <button type="button" className="btn-secondary shrink-0" onClick={lookup}>Search</button>
            </div>
            {profile && (
              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <label className="text-xs font-medium text-gray-600">
                  Quantity
                  <input value={amount} onChange={(event) => { setAmount(event.target.value); setPreview(false); setConfirmKey('') }} type="number" min="1" className="input-field mt-1" />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  Reason
                  <select value={reason} onChange={(event) => setReason(event.target.value)} className="input-field mt-1">
                    {REASONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                {reason === 'Other' && <input value={customReason} onChange={(event) => setCustomReason(event.target.value)} placeholder="Reason" className="input-field sm:col-span-2" />}
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <button type="button" className="btn-secondary" onClick={() => setPreview(true)}>Preview</button>
                  {preview && <button type="button" className="btn-primary" onClick={runRecharge}>Confirm recharge</button>}
                </div>
                {preview && (
                  <div className="rounded-lg bg-pink-50 px-3 py-2.5 text-sm text-pink-900 sm:col-span-2">
                    Add {Number(amount || 0).toLocaleString()} diamonds to {profile.name}. New balance {(profile.balance + Number(amount || 0)).toLocaleString()}.
                  </div>
                )}
              </div>
            )}
          </Panel>
          <aside className="surface-raised rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {profile ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Account</p>
                <p className="mt-2 text-base font-semibold">{profile.name}</p>
                <p className="font-mono text-xs text-gray-500">{profile.numericUserId}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Type</dt><dd>{profile.accountType}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Status</dt><dd>{profile.accountStatus}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Phone verified</dt><dd>{profile.phoneVerified ? 'Yes' : 'No'}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Wallet</dt><dd className="capitalize">{profile.walletStatus}</dd></div>
                </dl>
                <div className="mt-4 rounded-lg bg-gray-50 px-3 py-3 dark:bg-gray-900/40">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Current diamonds</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{profile.balance.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <div className="flex min-h-[180px] items-center justify-center text-center text-sm text-gray-500">Search a User ID to load the account.</div>
            )}
          </aside>
        </div>
      )}

      {section === 'users' && (
        <Panel title="User diamond balances" padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-gray-900/40">
                <tr>
                  {['User ID', 'Name', 'Type', 'Diamonds', 'Received', 'Transferred', 'Last transaction', 'Status', 'Actions'].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.docId} className="border-t border-gray-100 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/60">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{person.numericUserId}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium">{person.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{person.accountType}</td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums">{person.balance.toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600">{person.received.toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600">{person.transferred.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">{person.lastTransaction ? new Date(person.lastTransaction).toLocaleString('en-IN') : '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs">{person.accountStatus} · {person.walletStatus}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button type="button" className="btn-ghost" onClick={() => { setSection('recharge'); setQuery(person.numericUserId); setProfile(person) }}>Recharge</button>
                        <button type="button" className="btn-ghost" onClick={() => { setSection('history'); setSearch(person.numericUserId) }}>History</button>
                        <button type="button" className="btn-ghost" onClick={() => freeze(person.numericUserId, person.walletStatus !== 'frozen')}>{person.walletStatus === 'frozen' ? 'Unfreeze' : 'Freeze'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {section === 'sellers' && (
        <div className="space-y-3">
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <Panel title="Link an existing user">
              <p className="mb-3 text-xs text-gray-500">Uses the same user record. It does not create a second identity.</p>
              <input value={sellerQuery} onChange={(event) => setSellerQuery(event.target.value)} placeholder="Existing User ID" className="input-field" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => changeSeller(sellerQuery, 'pending')}>Register</button>
                <button type="button" className="btn-primary" onClick={() => changeSeller(sellerQuery, 'approved')}>Approve</button>
                <button type="button" className="btn-secondary" onClick={() => changeSeller(sellerQuery, 'rejected')}>Reject</button>
              </div>
            </Panel>
            <Panel title="Seller transfer">
              <p className="mb-3 text-xs text-gray-500">Debits the seller and credits the recipient in one ledger entry.</p>
              <div className="grid gap-2">
                <input value={sellerQuery} onChange={(event) => { setSellerQuery(event.target.value); setTransferPreview(false); setConfirmKey('') }} placeholder="Seller User ID" className="input-field" />
                <input value={recipientQuery} onChange={(event) => { setRecipientQuery(event.target.value); setTransferPreview(false); setConfirmKey('') }} placeholder="Recipient User ID" className="input-field" />
                <input value={transferAmount} onChange={(event) => { setTransferAmount(event.target.value); setTransferPreview(false); setConfirmKey('') }} type="number" min="1" placeholder="Diamonds" className="input-field" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={() => { setSellerProfile(profileOf(store, sellerQuery)); setRecipient(profileOf(store, recipientQuery)); setTransferPreview(true) }}>Preview</button>
                  {transferPreview && sellerProfile && recipient && <button type="button" className="btn-primary" onClick={runTransfer}>Confirm transfer</button>}
                </div>
              </div>
              {transferPreview && (
                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm dark:bg-gray-900/40">
                  {sellerProfile ? `${sellerProfile.name} has ${sellerProfile.balance.toLocaleString()}` : 'Seller not found'}. {recipient ? `${recipient.name} has ${recipient.balance.toLocaleString()}.` : 'Recipient not found.'}
                </div>
              )}
            </Panel>
          </div>
          <Panel title="Seller accounts" padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-gray-900/40">
                  <tr>
                    {['User ID', 'Name', 'Status', 'Balance', 'Wallet', 'Actions'].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {people.filter((person) => person.sellerStatus !== 'none').map((person) => (
                    <tr key={person.docId} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{person.numericUserId}</td>
                      <td className="px-3 py-2.5 font-medium">{person.name}</td>
                      <td className="px-3 py-2.5 capitalize">{person.sellerStatus}</td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums">{person.balance.toLocaleString()}</td>
                      <td className="px-3 py-2.5 capitalize">{person.walletStatus}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <button type="button" className="btn-ghost" onClick={() => changeSeller(person.numericUserId, 'approved')}>Activate</button>
                          <button type="button" className="btn-ghost" onClick={() => changeSeller(person.numericUserId, 'suspended')}>Suspend</button>
                          <button type="button" className="btn-ghost" onClick={() => freeze(person.numericUserId, person.walletStatus !== 'frozen')}>{person.walletStatus === 'frozen' ? 'Unfreeze' : 'Freeze'}</button>
                          <button type="button" className="btn-ghost" onClick={() => { setSection('recharge'); setQuery(person.numericUserId); setProfile(person) }}>Recharge</button>
                          <button type="button" className="btn-ghost" onClick={() => { setSection('history'); setSearch(person.numericUserId); setTypeFilter('SELLER_TRANSFER') }}>Transfers</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {people.every((person) => person.sellerStatus === 'none') && <p className="px-4 py-6 text-sm text-gray-500">No seller is linked yet.</p>}
            </div>
          </Panel>
        </div>
      )}

      {section === 'history' && (
        <Panel title="Ledger" padded={false}>
          <div className="space-y-3 border-b border-gray-100 p-4">
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setRange(id)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${range === id ? 'bg-pink-500 text-white' : 'border border-slate-200 bg-white'}`}>{label}</button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                {[['all', 'All types'], ['ADMIN_RECHARGE', 'Admin recharge'], ['SELLER_TRANSFER', 'Seller transfer'], ['failed', 'Failed']].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setTypeFilter(id)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${typeFilter === id ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
                ))}
              </div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search User ID or transaction ID" className="input-field sm:ml-auto sm:max-w-xs" />
            </div>
            {range === 'custom' && (
              <div className="flex flex-wrap gap-2">
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input-field w-auto" />
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input-field w-auto" />
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-gray-900/40">
                <tr>
                  {['Transaction', 'Type', 'Sender', 'Receiver', 'Diamonds', 'By', 'When', 'Status'].map((label) => <th key={label} className="px-3 py-2.5 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">No ledger rows for this filter.</td></tr>}
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px]">{row.id}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs">{row.type}</td>
                    <td className="px-3 py-2.5 text-xs">{row.senderName || row.senderUserId}</td>
                    <td className="px-3 py-2.5 text-xs">{row.receiverName || row.receiverUserId}</td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums">{row.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs">{row.initiatedBy}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-500">{new Date(row.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-xs capitalize">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}

export default DiamondMarketplace
