import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Landmark,
  MoreHorizontal,
  Pause,
  Play,
  Upload,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'
import ExportButton from '../components/ExportButton'
import { useApp } from '../context/AppContext'
import {
  BANK_STATUSES,
  PAYMENT_METHOD,
  buildFinance,
  canApproveWithdrawal,
  formatAccount,
  formatWhen,
  getWithdrawal,
  hostHistory,
  inr,
  listWithdrawals,
  maskAccount,
  mutateHostBank,
  mutateWithdrawal,
  statusTone,
} from '../utils/withdrawalData'

const Avatar = ({ name }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-600 text-xs font-semibold text-white">
    {(name || '?').charAt(0)}
  </span>
)

const ActionMenu = ({ items }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)
  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          setPos({ top: box.bottom + 4, left: Math.max(8, box.right - 192) })
          setOpen((value) => !value)
        }}
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="fixed z-50 w-48 rounded-md border border-gray-200 bg-white py-1 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800"
          style={{ top: pos.top, left: pos.left }}
        >
          {items.map((item) => (
            <button key={item.label} type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { setOpen(false); item.onClick() }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const Field = ({ label, children }) => (
  <p>
    <span className="text-[11px] uppercase tracking-wide text-gray-500">{label}</span>
    <span className="mt-0.5 block text-sm">{children}</span>
  </p>
)

const Transactions = () => {
  const { showToast, markTransactionsAsSeen } = useApp()
  const [tick, setTick] = useState(0)
  const [tab, setTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [bankStatus, setBankStatus] = useState('all')
  const [hostFilter, setHostFilter] = useState('all')
  const [minAmt, setMinAmt] = useState('')
  const [maxAmt, setMaxAmt] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState('submittedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedId, setSelectedId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [reason, setReason] = useState('')
  const [utr, setUtr] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [payNote, setPayNote] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [revealAccount, setRevealAccount] = useState(false)
  const [reportPreset, setReportPreset] = useState('30d')
  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')

  useEffect(() => { markTransactionsAsSeen?.() }, [markTransactionsAsSeen])
  useEffect(() => { setRevealAccount(false) }, [selectedId])

  const rows = useMemo(() => listWithdrawals(), [tick])
  const selected = selectedId ? getWithdrawal(selectedId) : null
  const refresh = () => setTick((value) => value + 1)
  const hosts = useMemo(() => [...new Map(rows.map((row) => [row.host.id, row.host])).values()], [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (bankStatus !== 'all' && row.bank.status !== bankStatus) return false
      if (hostFilter !== 'all' && row.host.id !== hostFilter) return false
      if (minAmt !== '' && row.payable < Number(minAmt)) return false
      if (maxAmt !== '' && row.payable > Number(maxAmt)) return false
      if (from && new Date(row.submittedAt) < new Date(from)) return false
      if (to && new Date(row.submittedAt) > new Date(`${to}T23:59:59`)) return false
      if (!q) return true
      return `${row.id} ${row.host.name} ${row.host.numericId} ${row.bank.account} ${row.bank.ifsc} ${row.bank.bankName} ${row.utr || ''}`.toLowerCase().includes(q)
    })
    return [...list].sort((a, b) => {
      if (sortKey === 'submittedAt' || sortKey === 'updatedAt') {
        const left = new Date(a[sortKey]).getTime()
        const right = new Date(b[sortKey]).getTime()
        return sortDir === 'asc' ? left - right : right - left
      }
      const left = sortKey === 'bankName' ? a.bank.bankName : a[sortKey]
      const right = sortKey === 'bankName' ? b.bank.bankName : b[sortKey]
      if (typeof left === 'number') return sortDir === 'asc' ? left - right : right - left
      return sortDir === 'asc' ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left))
    })
  }, [rows, search, status, bankStatus, hostFilter, minAmt, maxAmt, from, to, sortKey, sortDir])

  useEffect(() => { setPage(1) }, [search, status, bankStatus, hostFilter, minAmt, maxAmt, from, to])

  const pendingPayout = rows.filter((row) => ['Pending', 'Approved', 'Processing', 'On Hold'].includes(row.status)).reduce((sum, row) => sum + row.payable, 0)
  const counts = {
    all: rows.length,
    Pending: rows.filter((row) => row.status === 'Pending').length,
    Approved: rows.filter((row) => row.status === 'Approved').length,
    Processing: rows.filter((row) => row.status === 'Processing').length,
    Paid: rows.filter((row) => row.status === 'Paid').length,
    Rejected: rows.filter((row) => row.status === 'Rejected').length,
    'On Hold': rows.filter((row) => row.status === 'On Hold').length,
    requested: rows.reduce((sum, row) => sum + row.payable, 0),
    paid: rows.filter((row) => row.status === 'Paid').reduce((sum, row) => sum + (row.paidAmount || row.payable), 0),
    pendingPayout,
  }

  const finance = useMemo(() => buildFinance(rows, reportPreset, reportFrom, reportTo), [rows, reportPreset, reportFrom, reportTo])
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)
  const history = selected ? hostHistory(selected.host.id, selected.id) : []
  const confirmRow = confirm ? getWithdrawal(confirm.id) : null

  const run = (kind, id) => {
    const row = getWithdrawal(id)
    if (!row) return
    if ((kind === 'reject' || kind === 'hold' || kind === 'bank-reject' || kind === 'bank-update') && !reason.trim()) {
      showToast('Add a reason', 'error')
      return
    }
    if (kind === 'approve') {
      if (row.status !== 'Pending' && row.status !== 'On Hold') {
        showToast('Only pending or on-hold requests can be approved', 'error')
        return
      }
      if (!canApproveWithdrawal(row)) {
        showToast('Approve only after the registered bank account is verified', 'error')
        return
      }
      mutateWithdrawal(id, { status: 'Approved' }, { actor: 'Admin User', action: 'Approved for bank transfer', status: 'Approved' })
    }
    if (kind === 'reject') {
      mutateWithdrawal(id, { status: 'Rejected', rejectReason: reason.trim() }, { actor: 'Admin User', action: `Rejected · ${reason.trim()}`, status: 'Rejected' })
    }
    if (kind === 'hold') {
      mutateWithdrawal(id, { status: 'On Hold', holdReason: reason.trim() }, { actor: 'Admin User', action: `Placed on hold · ${reason.trim()}`, status: 'On Hold' })
    }
    if (kind === 'process') {
      if (row.status !== 'Approved') {
        showToast('Start processing only after approval', 'error')
        return
      }
      mutateWithdrawal(id, { status: 'Processing' }, { actor: 'Admin User', action: 'Marked for company bank transfer. No live transfer ran.', status: 'Processing' })
    }
    if (kind === 'resume') {
      mutateWithdrawal(id, { status: 'Pending' }, { actor: 'Admin User', action: 'Resumed review', status: 'Pending' })
    }
    if (kind === 'paid') {
      if (row.status === 'Paid') {
        showToast('This request is already paid', 'error')
        return
      }
      if (row.status !== 'Processing') {
        showToast('Pay only after processing starts. Pending cannot be marked paid.', 'error')
        return
      }
      if (!utr.trim() || !paidAmount || !file) {
        showToast('Amount, UTR, and bank transfer receipt are required', 'error')
        return
      }
      mutateWithdrawal(id, {
        status: 'Paid',
        paidAmount: Number(paidAmount),
        method: PAYMENT_METHOD,
        utr: utr.trim(),
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paidBy: 'Admin User',
        proofName: file.name,
        proofUrl: preview,
        payNote,
      }, { actor: 'Admin User', action: `Marked paid · ${utr.trim()}`, status: 'Paid' })
      setFile(null)
      setPreview('')
      showToast('Sample payout marked paid. No real bank transfer ran.', 'success')
      setConfirm(null)
      setReason('')
      refresh()
      return
    }
    if (kind === 'bank-verify') {
      mutateHostBank(row.host.id, { status: 'Verified', rejectReason: '' }, { at: new Date(), actor: 'Admin User', action: 'Bank details verified', status: 'Verified' })
      showToast('Sample bank details marked verified', 'success')
      setConfirm(null)
      setReason('')
      refresh()
      return
    }
    if (kind === 'bank-reject') {
      mutateHostBank(row.host.id, { status: 'Rejected', rejectReason: reason.trim() }, { at: new Date(), actor: 'Admin User', action: `Bank details rejected · ${reason.trim()}`, status: 'Rejected' })
      showToast('Sample bank details rejected', 'success')
      setConfirm(null)
      setReason('')
      refresh()
      return
    }
    if (kind === 'bank-update') {
      mutateHostBank(row.host.id, { status: 'Update Requested' }, { at: new Date(), actor: 'Admin User', action: `Requested updated bank information · ${reason.trim()}`, status: 'Update Requested' })
      showToast('Host asked to update bank details in this sample', 'success')
      setConfirm(null)
      setReason('')
      refresh()
      return
    }
    if (kind === 'bank-resubmit') {
      mutateHostBank(row.host.id, { status: 'Pending Verification' }, { at: new Date(), actor: 'Host', action: 'Updated bank details submitted. Not auto-verified.', status: 'Pending Verification' })
      showToast('Updated bank details set to pending verification', 'success')
      setConfirm(null)
      setReason('')
      refresh()
      return
    }
    setConfirm(null)
    setReason('')
    refresh()
    showToast('Sample queue updated. No live payout.', 'success')
  }

  const onFile = (event) => {
    const next = event.target.files?.[0]
    if (!next) return
    if (!next.type.startsWith('image/') && next.type !== 'application/pdf') {
      showToast('Choose an image or PDF', 'error')
      return
    }
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  const exportRows = filtered.map((row) => ({
    id: row.id,
    host: `${row.host.name} (${row.host.numericId})`,
    coins: row.coins,
    payable: row.payable,
    bank: row.bank.bankName,
    account: maskAccount(row.bank.account),
    ifsc: row.bank.ifsc,
    bankStatus: row.bank.status,
    status: row.status,
    utr: row.utr || '',
  }))
  const exportColumns = [
    { header: 'Request ID', accessor: 'id' },
    { header: 'Host', accessor: 'host' },
    { header: 'Coins', accessor: 'coins' },
    { header: 'Payable', accessor: 'payable' },
    { header: 'Bank', accessor: 'bank' },
    { header: 'Account', accessor: 'account' },
    { header: 'IFSC', accessor: 'ifsc' },
    { header: 'Bank status', accessor: 'bankStatus' },
    { header: 'Status', accessor: 'status' },
    { header: 'UTR', accessor: 'utr' },
  ]

  const kpis = [
    { id: 'all', title: 'Total requests', value: counts.all, icon: Wallet, tone: 'blue' },
    { id: 'Pending', title: 'Pending', value: counts.Pending, icon: Clock, tone: 'amber' },
    { id: 'Approved', title: 'Approved', value: counts.Approved, icon: CheckCircle, tone: 'sky' },
    { id: 'Processing', title: 'Processing', value: counts.Processing, icon: Landmark, tone: 'indigo' },
    { id: 'Paid', title: 'Paid', value: counts.Paid, icon: DollarSign, tone: 'emerald' },
    { id: 'Rejected', title: 'Rejected', value: counts.Rejected, icon: XCircle, tone: 'rose' },
    { id: 'On Hold', title: 'On hold', value: counts['On Hold'], icon: Pause, tone: 'slate' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Host withdrawals"
        description="Company bank transfers only. Sample queue — this screen never sends money or connects to a bank."
        actions={
          <div className="flex gap-1">
            <button type="button" className={`rounded-md px-3 py-1.5 text-xs ${tab === 'requests' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'border'}`} onClick={() => setTab('requests')}>Requests</button>
            <button type="button" className={`rounded-md px-3 py-1.5 text-xs ${tab === 'reports' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'border'}`} onClick={() => setTab('reports')}>Reports</button>
          </div>
        }
      />

      {tab === 'reports' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[{ id: 'today', label: 'Today' }, { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' }, { id: 'month', label: 'This month' }, { id: 'custom', label: 'Custom' }].map((item) => (
              <button key={item.id} type="button" className={`rounded-md border px-3 py-1.5 text-xs ${reportPreset === item.id ? 'border-gray-900 bg-gray-900 text-white' : ''}`} onClick={() => setReportPreset(item.id)}>{item.label}</button>
            ))}
            {reportPreset === 'custom' && (
              <>
                <input className="input-field max-w-[140px]" type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
                <input className="input-field max-w-[140px]" type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KpiCard title="Coins requested" value={finance.coinsRequested.toLocaleString()} tone="violet" />
            <KpiCard title="Coins approved" value={finance.coinsApproved.toLocaleString()} tone="sky" />
            <KpiCard title="Coins paid out" value={finance.coinsPaid.toLocaleString()} tone="emerald" />
            <KpiCard title="Pending payout" value={inr(finance.pendingMoney)} tone="amber" />
            <KpiCard title="Rejected amount" value={inr(finance.rejectedMoney)} tone="rose" />
            <KpiCard title="Successful payouts" value={finance.payouts} tone="indigo" />
            <KpiCard title="Average paid" value={inr(finance.average)} tone="teal" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {kpis.map((card) => (
              <button key={card.id} type="button" className={`text-left ${status === card.id ? 'rounded-lg ring-1 ring-gray-900' : ''}`} onClick={() => setStatus(card.id)}>
                <KpiCard title={card.title} value={card.value} icon={card.icon} tone={card.tone} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <KpiCard title="Amount requested" value={inr(counts.requested)} tone="amber" />
            <KpiCard title="Amount paid" value={inr(counts.paid)} tone="emerald" />
            <KpiCard title="Pending payout" value={inr(counts.pendingPayout)} tone="sky" />
          </div>

          <Panel padded={false}>
            <div className="flex flex-wrap gap-2 p-3">
              <SearchBar placeholder="Search ID, host, IFSC, account, or UTR" value={search} onChange={setSearch} />
              <select className="input-field max-w-[190px]" value={bankStatus} onChange={(e) => setBankStatus(e.target.value)}>
                <option value="all">All bank statuses</option>
                {BANK_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select className="input-field max-w-[160px]" value={hostFilter} onChange={(e) => setHostFilter(e.target.value)}>
                <option value="all">All hosts</option>
                {hosts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input className="input-field max-w-[110px]" type="number" placeholder="Min ₹" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
              <input className="input-field max-w-[110px]" type="number" placeholder="Max ₹" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} />
              <input className="input-field max-w-[140px]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input className="input-field max-w-[140px]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              <ExportButton data={exportRows} columns={exportColumns} filename="withdrawals" disabled={exportRows.length === 0} />
            </div>
            {pageRows.length === 0 ? (
              <EmptyState title="No withdrawal requests" description="Try another status card or clear filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                      <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('id'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Request ID</th>
                      <th className="px-3 py-2">Host</th>
                      <th className="px-3 py-2">Host ID</th>
                      <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('coins'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Coins</th>
                      <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('payable'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Payable</th>
                      <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('bankName'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Bank</th>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2">IFSC</th>
                      <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('submittedAt'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Requested</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/40">
                        <td className="px-3 py-2 font-mono text-[11px]">{row.id}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={row.host.name} />
                            <div>
                              <p className="font-medium">{row.host.name}</p>
                              <StatusBadge tone={statusTone(row.bank.status)}>{row.bank.status}</StatusBadge>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px]">{row.host.numericId}</td>
                        <td className="px-3 py-2 tabular-nums">{row.coins.toLocaleString()}</td>
                        <td className="px-3 py-2 font-medium tabular-nums text-emerald-700">{inr(row.payable)}</td>
                        <td className="px-3 py-2 text-xs">{row.bank.bankName}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{maskAccount(row.bank.account)}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{row.bank.ifsc}</td>
                        <td className="px-3 py-2 text-xs">{formatWhen(row.submittedAt)}</td>
                        <td className="px-3 py-2"><StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge></td>
                        <td className="px-3 py-2">
                          <ActionMenu
                            items={[
                              { label: 'View', onClick: () => { setSelectedId(row.id); setPaidAmount(String(row.payable)); setUtr(row.utr || ''); setPaidAt('') } },
                              ...(row.status === 'Pending' ? [
                                { label: 'Approve', onClick: () => setConfirm({ kind: 'approve', id: row.id }) },
                                { label: 'Reject', onClick: () => { setConfirm({ kind: 'reject', id: row.id }); setReason('') } },
                                { label: 'On hold', onClick: () => { setConfirm({ kind: 'hold', id: row.id }); setReason('') } },
                              ] : []),
                              ...(row.status === 'Approved' ? [{ label: 'Start processing', onClick: () => setConfirm({ kind: 'process', id: row.id }) }] : []),
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-gray-100 p-3 dark:border-gray-700">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }} />
            </div>
          </Panel>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div>
                <p className="font-mono text-xs text-gray-500">{selected.id}</p>
                <h2 className="text-sm font-semibold">{selected.host.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-md p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <Panel title="Withdrawal summary">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Host ID">{selected.host.numericId}</Field>
                  <Field label="Requested coins">{selected.coins.toLocaleString()}</Field>
                  <Field label="Eligible coins">{selected.eligibleBefore.toLocaleString()}</Field>
                  <Field label="Rate snapshot">₹{selected.rate.toFixed(2)} / coin</Field>
                  <Field label="Gross">{inr(selected.gross)}</Field>
                  <Field label="Deductions">{selected.deductions ? inr(selected.deductions) : 'Not applicable'}</Field>
                  <Field label="Final payable">{inr(selected.payable)}</Field>
                  <Field label="Payment method">{PAYMENT_METHOD}</Field>
                  <Field label="Requested">{formatWhen(selected.submittedAt)}</Field>
                  <Field label="Updated">{formatWhen(selected.updatedAt)}</Field>
                </div>
              </Panel>

              <Panel title="Host">
                <div className="flex items-center gap-2">
                  <Avatar name={selected.host.name} />
                  <div>
                    <p className="text-sm font-medium">{selected.host.name}</p>
                    <p className="font-mono text-[11px] text-gray-500">{selected.host.numericId}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>{selected.host.email}</p>
                  <p>{selected.host.phone || 'Phone not provided'}</p>
                  <p>KYC {selected.host.verified}</p>
                  <p>{selected.host.status}</p>
                  <p>Earned {selected.host.earned.toLocaleString()}</p>
                  <p>Withdrawn {selected.host.withdrawn.toLocaleString()}</p>
                  <p>Available {selected.host.available.toLocaleString()}</p>
                  <p>Paid to host {inr(history.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + (item.paidAmount || item.payable), 0) + (selected.status === 'Paid' ? (selected.paidAmount || selected.payable) : 0))}</p>
                </div>
                <Link className="mt-2 inline-block text-xs font-medium text-indigo-600" to={`/users/profile/${selected.host.id}`}>Open host profile</Link>
              </Panel>

              <Panel title="Coin calculation">
                <p className="text-xs text-gray-500">Snapshot on this request. Rate is not recalculated.</p>
                <p className="mt-2 font-mono text-xs">{selected.coins.toLocaleString()} × ₹{selected.rate.toFixed(2)} = {inr(selected.gross)}</p>
                <p className="font-mono text-xs">{inr(selected.gross)} − {selected.deductions ? inr(selected.deductions) : '₹0 (none)'} = {inr(selected.payable)}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>Gift coins {selected.gifts.toLocaleString()}</p>
                  <p>Other eligible {selected.host.other.toLocaleString()}</p>
                  <p>Promo / non-withdrawable {selected.promo.toLocaleString()}</p>
                  <p>Previously withdrawn {selected.host.withdrawn.toLocaleString()}</p>
                  <p>Currently requested {selected.coins.toLocaleString()}</p>
                  <p>Remaining after request {selected.remaining.toLocaleString()}</p>
                </div>
              </Panel>

              <Panel title="Registered bank account">
                <p className="mb-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  Company payout goes to this registered bank account by bank transfer only.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Field label="Account holder">{selected.bank.holder}</Field>
                  <Field label="Bank">{selected.bank.bankName}</Field>
                  <div className="col-span-2">
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">Account number</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-sm">{revealAccount ? formatAccount(selected.bank.account) : maskAccount(selected.bank.account)}</span>
                      <button type="button" className="inline-flex items-center gap-1 text-[11px] text-indigo-600" onClick={() => setRevealAccount((value) => !value)}>
                        {revealAccount ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {revealAccount ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                  <Field label="IFSC">{selected.bank.ifsc}</Field>
                  <Field label="Branch">{selected.bank.branch || 'Not provided'}</Field>
                  <Field label="Account type">{selected.bank.accountType || 'Not provided'}</Field>
                  <Field label="Bank verification"><StatusBadge tone={statusTone(selected.bank.status)}>{selected.bank.status}</StatusBadge></Field>
                  <Field label="Submitted">{formatWhen(selected.bank.submittedAt)}</Field>
                  <Field label="Last updated">{formatWhen(selected.bank.updatedAt)}</Field>
                </div>
                {selected.bank.rejectReason && <p className="mt-2 text-xs text-red-700">Bank rejection: {selected.bank.rejectReason}</p>}
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">{selected.bank.documentKind}</p>
                  {selected.bank.documentUrl ? (
                    <img src={selected.bank.documentUrl} alt="" className="mt-1 max-h-36 rounded-md border" />
                  ) : <p className="text-xs text-gray-500">No statement or cheque in this sample.</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{selected.bank.documentName}</p>
                </div>
                {selected.status !== 'Paid' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.bank.status !== 'Verified' && (
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => setConfirm({ kind: 'bank-verify', id: selected.id })}>Verify bank</button>
                    )}
                    {selected.bank.status !== 'Rejected' && (
                      <button type="button" className="rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] text-red-700" onClick={() => { setConfirm({ kind: 'bank-reject', id: selected.id }); setReason('') }}>Reject bank</button>
                    )}
                    <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => { setConfirm({ kind: 'bank-update', id: selected.id }); setReason('') }}>Request update</button>
                    <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => setConfirm({ kind: 'bank-resubmit', id: selected.id })}>Host resubmitted</button>
                  </div>
                )}
                <ul className="mt-3 space-y-1 text-[11px] text-gray-500">
                  {(selected.bank.history || []).map((item, index) => (
                    <li key={index}>{item.status} · {item.action} · {item.actor} · {formatWhen(item.at)}</li>
                  ))}
                </ul>
              </Panel>

              {selected.status === 'Paid' && (
                <Panel title="Payment confirmation">
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <p className="font-medium">Paid · already completed</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <p>Amount {inr(selected.paidAmount)}</p>
                      <p>{PAYMENT_METHOD}</p>
                      <p>Bank {selected.bank.bankName}</p>
                      <p>Account {maskAccount(selected.bank.account)}</p>
                      <p>IFSC {selected.bank.ifsc}</p>
                      <p>UTR {selected.utr}</p>
                      <p>{selected.paidBy}</p>
                      <p>{formatWhen(selected.paidAt)}</p>
                    </div>
                    {selected.payNote && <p className="mt-2">{selected.payNote}</p>}
                    {selected.proofUrl ? <img src={selected.proofUrl} alt="" className="mt-2 max-h-32 rounded-md" /> : null}
                    <p className="mt-1 text-gray-500">Completed payout is read-only in this sample.</p>
                  </div>
                </Panel>
              )}
              {selected.status === 'Rejected' && <p className="text-xs text-red-700">Rejected: {selected.rejectReason}</p>}
              {selected.status === 'On Hold' && <p className="text-xs text-gray-600">Hold: {selected.holdReason}</p>}

              {selected.status === 'Processing' && (
                <Panel title="Bank transfer proof">
                  <p className="text-xs text-gray-500">Record the company transfer after it is done outside this panel. This form does not send money.</p>
                  <div className="mt-2 space-y-2 text-xs">
                    <p className="rounded-md bg-gray-50 px-2 py-1.5 dark:bg-gray-900/40">Method locked: {PAYMENT_METHOD}</p>
                    <input className="input-field" placeholder="Bank UTR / reference" value={utr} onChange={(e) => setUtr(e.target.value)} />
                    <input className="input-field" type="number" placeholder="Amount transferred" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                    <input className="input-field" type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                    <input className="input-field" placeholder="Payment confirmation note (optional)" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2">
                      <Upload className="h-4 w-4" />
                      {file ? file.name : 'Select bank transfer receipt (image or PDF)'}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={onFile} />
                    </label>
                    {preview && file?.type.startsWith('image/') && <img src={preview} alt="" className="max-h-28 rounded-md" />}
                    {file && (
                      <div className="flex gap-2">
                        <button type="button" className="text-indigo-600" onClick={() => document.querySelector('input[type=file]')?.click()}>Replace</button>
                        <button type="button" className="text-red-600" onClick={() => { setFile(null); setPreview('') }}>Remove</button>
                      </div>
                    )}
                    <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-white" onClick={() => setConfirm({ kind: 'paid', id: selected.id })}>Mark payment as completed</button>
                  </div>
                </Panel>
              )}

              <Panel title="Actions">
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'Pending' && (
                    <>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => setConfirm({ kind: 'approve', id: selected.id })}>Approve request</button>
                      <button type="button" className="rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] text-red-700" onClick={() => { setConfirm({ kind: 'reject', id: selected.id }); setReason('') }}>Reject</button>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => { setConfirm({ kind: 'hold', id: selected.id }); setReason('') }}>On hold</button>
                    </>
                  )}
                  {selected.status === 'Approved' && (
                    <>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => setConfirm({ kind: 'process', id: selected.id })}>Start payment processing</button>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => { setConfirm({ kind: 'hold', id: selected.id }); setReason('') }}>On hold</button>
                    </>
                  )}
                  {selected.status === 'On Hold' && (
                    <button type="button" className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => setConfirm({ kind: 'resume', id: selected.id })}><Play className="h-3 w-3" /> Resume</button>
                  )}
                  <Link to={`/users/profile/${selected.host.id}`} className="rounded-md border px-2.5 py-1.5 text-[11px]">View host profile</Link>
                </div>
                {!canApproveWithdrawal(selected) && selected.status === 'Pending' && (
                  <p className="mt-2 text-xs text-amber-700">Bank account is {selected.bank.status}. Approval is blocked until it is verified.</p>
                )}
              </Panel>

              <Panel title="Timeline">
                <ol className="space-y-2">
                  {selected.timeline.map((item, index) => (
                    <li key={index} className="text-xs">
                      <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                      <span className="ml-2 font-medium">{item.action}</span>
                      <span className="block text-[11px] text-gray-400">
                        {item.from ? `${item.from} → ${item.status}` : item.status} · {item.actor} · {formatWhen(item.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="Host withdrawal history">
                {history.length === 0 ? <p className="text-xs text-gray-500">No other sample requests for this host.</p> : (
                  <ul className="space-y-1 text-xs">
                    {history.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>{item.id} · {item.coins.toLocaleString()} · {inr(item.payable)} · {item.bank.bankName} · {formatWhen(item.submittedAt)}{item.paidAt ? ` · paid ${formatWhen(item.paidAt)}` : ''}</span>
                        <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </aside>
        </div>
      )}

      <Modal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} title="Confirm sample action" size="sm">
        {confirm?.kind === 'approve' && confirmRow && (
          <div className="space-y-1 text-sm">
            <p>{confirmRow.host.name} · {confirmRow.host.numericId}</p>
            <p>{confirmRow.coins.toLocaleString()} coins · {inr(confirmRow.payable)}</p>
            <p>{confirmRow.bank.bankName} · {maskAccount(confirmRow.bank.account)} · {confirmRow.bank.ifsc}</p>
            {!canApproveWithdrawal(confirmRow) && <p className="text-xs text-red-700">Bank is {confirmRow.bank.status}. Approval is blocked.</p>}
          </div>
        )}
        {confirm?.kind === 'paid' && (
          <div className="space-y-1 text-sm">
            <p>Amount {paidAmount ? inr(paidAmount) : 'missing'} · {PAYMENT_METHOD}</p>
            <p>UTR {utr || 'missing'}</p>
            <p>Receipt {file ? file.name : 'missing'}</p>
            <p className="text-xs text-gray-500">This does not send a bank transfer.</p>
          </div>
        )}
        {confirm?.kind === 'process' && <p className="text-sm">Marks this sample as processing. Initiate the transfer in your bank system separately.</p>}
        {['reject', 'hold', 'bank-reject', 'bank-update'].includes(confirm?.kind) && (
          <textarea className="input-field mt-3 min-h-[72px]" placeholder="Reason required" value={reason} onChange={(e) => setReason(e.target.value)} />
        )}
        {confirm?.kind === 'bank-verify' && <p className="text-sm">Mark this sample bank account as verified?</p>}
        {confirm?.kind === 'bank-resubmit' && <p className="text-sm">Updated details stay pending verification. They are not auto-verified.</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white disabled:opacity-40"
            disabled={confirm?.kind === 'approve' && confirmRow && !canApproveWithdrawal(confirmRow)}
            onClick={() => run(confirm.kind, confirm.id)}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Transactions
