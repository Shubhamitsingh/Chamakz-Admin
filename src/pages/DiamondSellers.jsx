import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Gem, Plus, X } from 'lucide-react'
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
  PAYOUT_STATUSES,
  REQUEST_STATUSES,
  analyticsView,
  createDiamondSeller,
  createPayout,
  deleteDiamondSeller,
  formatWhen,
  getDefaultRates,
  getDiamondSeller,
  inDateRange,
  inr,
  isValidUpi,
  isValidWhatsapp,
  listDiamondSellers,
  listPayouts,
  listRequests,
  listTransactions,
  overviewMetrics,
  payoutStatusTone,
  requestStatusTone,
  sellerCut,
  SELLER_COMMISSION_PCT,
  setDefaultRates,
  setDiamondSellerStatus,
  setPayoutStatus,
  setRequestStatus,
  setSellerCommissionPct,
  updateDiamondSeller,
} from '../utils/diamondSellersData'

const emptyForm = () => ({
  name: '',
  whatsapp: '+91 ',
  upiId: '',
  status: 'Active',
  sellerCommissionPct: String(getDefaultRates().sellerPct),
})

const TABS = [
  { id: 'sellers', label: 'Sellers' },
  { id: 'requests', label: 'Seller Requests' },
  { id: 'commission', label: 'Commission' },
  { id: 'analytics', label: 'Analytics' },
]

const RANGE = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
]

const Avatar = ({ name }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-xs font-semibold text-white">
    {(name || '?').charAt(0)}
  </span>
)

const Chip = ({ active, onClick, children }) => (
  <button type="button" className={`rounded-full px-3 py-1 text-xs ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white ring-1 ring-gray-200 dark:bg-gray-800'}`} onClick={onClick}>
    {children}
  </button>
)

const LiveBadge = ({ live }) => (
  live ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Offline
    </span>
  )
)

const UserPresence = ({ live, online, account }) => (
  <span className="mt-1 flex flex-wrap items-center gap-1">
    {live ? (
      <LiveBadge live />
    ) : online ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Online
      </span>
    ) : (
      <LiveBadge live={false} />
    )}
    {account && account !== 'Active' && (
      <StatusBadge tone="danger">{account}</StatusBadge>
    )}
  </span>
)

const DiamondSellers = () => {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const [tab, setTab] = useState('sellers')
  const [search, setSearch] = useState('')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [sortKey, setSortKey] = useState('updatedAt')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedId, setSelectedId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [reqSearch, setReqSearch] = useState('')
  const [reqStatus, setReqStatus] = useState('all')
  const [reqSeller, setReqSeller] = useState('all')
  const [reqPresence, setReqPresence] = useState('all')
  const [reqMin, setReqMin] = useState('')
  const [reqMax, setReqMax] = useState('')
  const [reqFrom, setReqFrom] = useState('')
  const [reqTo, setReqTo] = useState('')
  const [reqPage, setReqPage] = useState(1)
  const [range, setRange] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [defaultPct, setDefaultPct] = useState(String(getDefaultRates().sellerPct))
  const [payoutForm, setPayoutForm] = useState(null)
  const [payForm, setPayForm] = useState({ paymentRef: '', paymentDate: '', proof: '', proofName: '' })

  const refresh = () => setTick((value) => value + 1)
  const sellers = useMemo(() => listDiamondSellers(), [tick])
  const requests = useMemo(() => listRequests(), [tick])
  const payouts = useMemo(() => listPayouts(), [tick])
  const transactions = useMemo(() => listTransactions(), [tick])
  const rates = useMemo(() => getDefaultRates(), [tick])
  const selected = selectedId ? getDiamondSeller(selectedId) : null
  const overview = overviewMetrics(requests)

  const topIds = useMemo(() => (
    [...sellers].sort((a, b) => b.metrics.completedAmount - a.metrics.completedAmount).slice(0, 2).map((row) => row.id)
  ), [sellers])

  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sellers.filter((row) => {
      if (sellerFilter === 'Active' && row.status !== 'Active') return false
      if (sellerFilter === 'Inactive' && row.status !== 'Inactive') return false
      if (sellerFilter === 'top' && !topIds.includes(row.id)) return false
      if (!q) return true
      return `${row.name} ${row.id} ${row.whatsapp} ${row.upiId}`.toLowerCase().includes(q)
    }).sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'completed') return b.metrics.completedAmount - a.metrics.completedAmount
      if (sortKey === 'commission') return b.metrics.sellerCommission - a.metrics.sellerCommission
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [sellers, search, sellerFilter, sortKey, topIds])

  const filteredRequests = useMemo(() => {
    const q = reqSearch.trim().toLowerCase()
    return requests.filter((row) => {
      if (reqStatus === 'acceptedValue') return ['Accepted', 'Processing', 'Completed'].includes(row.status)
      if (reqStatus === 'completedValue') return row.status === 'Completed'
      if (reqStatus !== 'all' && row.status !== reqStatus) return false
      if (reqSeller !== 'all' && row.sellerId !== reqSeller) return false
      if (reqPresence === 'live' && !row.userLive) return false
      if (reqPresence === 'online' && (row.userLive || !row.userOnline)) return false
      if (reqPresence === 'offline' && (row.userLive || row.userOnline)) return false
      if (reqMin && row.amount < Number(reqMin)) return false
      if (reqMax && row.amount > Number(reqMax)) return false
      if (reqFrom || reqTo) {
        if (!inDateRange(row.requestedAt, 'custom', reqFrom, reqTo)) return false
      }
      if (!q) return true
      return `${row.id} ${row.userName} ${row.userId} ${row.sellerName} ${row.sellerId}`.toLowerCase().includes(q)
    })
  }, [requests, reqSearch, reqStatus, reqSeller, reqPresence, reqMin, reqMax, reqFrom, reqTo])

  const analytics = useMemo(() => analyticsView(range, customFrom, customTo), [tick, range, customFrom, customTo])

  useEffect(() => { setPage(1) }, [search, sellerFilter, sortKey])
  useEffect(() => { setReqPage(1) }, [reqSearch, reqStatus, reqSeller, reqPresence, reqMin, reqMax, reqFrom, reqTo])

  const sellerPages = Math.max(1, Math.ceil(filteredSellers.length / perPage))
  const sellerRows = filteredSellers.slice((page - 1) * perPage, page * perPage)
  const reqPages = Math.max(1, Math.ceil(filteredRequests.length / perPage))
  const reqRows = filteredRequests.slice((reqPage - 1) * perPage, reqPage * perPage)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm(), sellerCommissionPct: String(getDefaultRates().sellerPct) })
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (id) => {
    const row = getDiamondSeller(id)
    if (!row) return
    setEditingId(id)
    setForm({
      name: row.name,
      whatsapp: row.whatsapp,
      upiId: row.upiId,
      status: row.status,
      sellerCommissionPct: String(row.sellerCommissionPct),
    })
    setErrors({})
    setFormOpen(true)
  }

  const pickFile = (file, onReady, errorKey) => {
    if (!file) return
    const ok = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type) || /\.(png|jpe?g)$/i.test(file.name)
    if (!ok) {
      setErrors((prev) => ({ ...prev, [errorKey]: 'Use PNG or JPG' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => onReady(reader.result, file.name)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Seller name is required'
    if (!isValidWhatsapp(form.whatsapp)) next.whatsapp = 'Use country code, e.g. +91 9876543210'
    if (!isValidUpi(form.upiId)) next.upiId = 'Enter a UPI ID like name@okaxis'
    const pct = Number(form.sellerCommissionPct)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) next.sellerCommissionPct = 'Use 0–100'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) {
      showToast('Fix the highlighted fields before saving', 'error')
      return
    }
    const payload = { ...form, sellerCommissionPct: Number(form.sellerCommissionPct) }
    if (editingId) {
      const existing = getDiamondSeller(editingId)
      updateDiamondSeller(editingId, payload)
      if (existing && Number(form.sellerCommissionPct) !== existing.sellerCommissionPct) {
        setSellerCommissionPct(editingId, Number(form.sellerCommissionPct))
      }
      showToast('Seller updated in this admin list. Not published to a live seller app.', 'success')
    } else {
      createDiamondSeller(payload)
      showToast('Seller saved in this admin list. Nothing was paid or messaged.', 'success')
    }
    setFormOpen(false)
    refresh()
  }

  const applyConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'status') {
      setDiamondSellerStatus(confirm.id, confirm.next)
      showToast(confirm.next === 'Active' ? 'Seller is Live. The sample seller page would show a Live badge.' : 'Seller is Offline. The sample seller page would show Offline.', 'success')
    }
    if (confirm.type === 'delete') {
      deleteDiamondSeller(confirm.id)
      if (selectedId === confirm.id) setSelectedId(null)
      showToast('Seller removed from this admin list.', 'success')
    }
    if (confirm.type === 'request') {
      setRequestStatus(confirm.id, confirm.next)
      showToast(`Request marked ${confirm.next} in this sample list. No payment moved.`, 'success')
    }
    if (confirm.type === 'rate') {
      setSellerCommissionPct(confirm.id, confirm.pct)
      showToast('Current seller rate updated. Older completed commissions were not recalculated.', 'success')
    }
    if (confirm.type === 'defaultRate') {
      setDefaultRates(confirm.pct)
      setDefaultPct(String(confirm.pct))
      showToast('Default rate for new sellers updated. Existing completed commissions were not changed.', 'success')
    }
    setConfirm(null)
    refresh()
  }

  const clickKpi = (id) => {
    if (id === 'sellers' || id === 'Active' || id === 'Inactive') {
      setTab('sellers')
      setSellerFilter(id === 'sellers' ? 'all' : id)
      return
    }
    if (id === 'sellerCommission' || id === 'companyCommission') {
      setTab('commission')
      return
    }
    setTab('requests')
    setReqStatus(id)
  }

  const sellerExports = filteredSellers.map((row) => ({
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    upiId: row.upiId,
    status: row.status,
    requests: row.metrics.total,
    accepted: row.metrics.accepted,
    completed: row.metrics.completed,
    pending: row.metrics.pending,
    acceptedAmount: row.metrics.acceptedAmount,
    completedAmount: row.metrics.completedAmount,
    commission: row.metrics.sellerCommission,
  }))

  const requestExports = filteredRequests.map((row) => ({
    id: row.id,
    user: row.userName,
    userId: row.userId,
    presence: row.userPresence,
    seller: row.sellerName,
    sellerId: row.sellerId,
    package: row.packageName,
    amount: row.amount,
    status: row.status,
    requested: formatWhen(row.requestedAt),
    accepted: formatWhen(row.acceptedAt),
    completed: formatWhen(row.completedAt),
  }))

  const txnExports = transactions.filter((row) => filteredRequests.some((item) => item.id === row.requestId) || tab !== 'requests').map((row) => ({
    id: row.id,
    requestId: row.requestId,
    seller: row.sellerName,
    amount: row.completedAmount,
    sellerCommission: row.sellerCommission,
    companyCommission: row.companyCommission,
    pct: row.commissionPct,
    completed: formatWhen(row.completedAt),
  }))

  const payoutExports = payouts.map((row) => ({
    id: row.id,
    seller: row.sellerName,
    period: row.periodLabel,
    eligible: row.eligibleAmount,
    pct: row.commissionPct,
    commission: row.commissionAmount,
    paid: row.paidAmount,
    remaining: row.remainingAmount,
    status: row.status,
    paidOn: formatWhen(row.paymentDate),
    ref: row.paymentRef,
  }))

  return (
    <div className="space-y-3">
      <PageHeader
        title="Diamond Sellers"
        description="Sample workspace for seller onboarding, request tracking, and commission math. Mock amounts only — no UPI, WhatsApp, or live payouts."
        actions={
          <div className="flex flex-wrap gap-1">
            {TABS.map((item) => (
              <button key={item.id} type="button" className={`rounded-md px-3 py-1.5 text-xs ${tab === item.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'ring-1 ring-gray-200'}`} onClick={() => setTab(item.id)}>{item.label}</button>
            ))}
            <button type="button" className="inline-flex items-center gap-1 rounded-md bg-cyan-700 px-3 py-1.5 text-xs font-medium text-white" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Add Diamond Seller
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        {[
          { id: 'sellers', title: 'Total sellers', value: overview.sellers, tone: 'slate' },
          { id: 'Active', title: 'Live sellers', value: overview.active, tone: 'rose' },
          { id: 'Inactive', title: 'Offline sellers', value: overview.inactive, tone: 'slate' },
          { id: 'all', title: 'Requests received', value: overview.total, tone: 'sky' },
          { id: 'acceptedValue', title: 'Requests accepted', value: overview.accepted, tone: 'indigo' },
          { id: 'Pending', title: 'Pending requests', value: overview.pending, tone: 'amber' },
          { id: 'Completed', title: 'Completed requests', value: overview.completed, tone: 'teal' },
          { id: 'Rejected', title: 'Rejected / cancelled', value: overview.rejected + overview.cancelled, tone: 'orange' },
          { id: 'acceptedValue', title: 'Accepted amount', value: inr(overview.acceptedAmount), tone: 'violet' },
          { id: 'completedValue', title: 'Completed amount', value: inr(overview.completedAmount), tone: 'emerald' },
          { id: 'sellerCommission', title: `Seller commission (${SELLER_COMMISSION_PCT}%)`, value: inr(overview.sellerCommission), tone: 'pink' },
          { id: 'companyCommission', title: 'Company share (95%)', value: inr(overview.companyCommission), tone: 'blue' },
        ].map((card) => (
          <button key={card.title} type="button" className="w-full text-left" onClick={() => clickKpi(card.id)}>
            <KpiCard title={card.title} value={card.value} icon={Gem} tone={card.tone} />
          </button>
        ))}
      </div>

      {tab === 'sellers' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBar placeholder="Search name, seller ID, or WhatsApp" value={search} onChange={setSearch} />
            {[{ id: 'all', label: 'All sellers' }, { id: 'Active', label: 'Live' }, { id: 'Inactive', label: 'Offline' }, { id: 'top', label: 'Top performing' }].map((item) => (
              <Chip key={item.id} active={sellerFilter === item.id} onClick={() => setSellerFilter(item.id)}>{item.label}</Chip>
            ))}
            <select className="input-field max-w-[170px]" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="updatedAt">Last updated</option>
              <option value="name">Name</option>
              <option value="completed">Completed amount</option>
              <option value="commission">Commission earned</option>
            </select>
            <ExportButton data={sellerExports} filename="diamond-sellers" disabled={sellerExports.length === 0} columns={[
              { header: 'Seller ID', accessor: 'id' }, { header: 'Name', accessor: 'name' }, { header: 'WhatsApp', accessor: 'whatsapp' }, { header: 'UPI', accessor: 'upiId' }, { header: 'Status', accessor: 'status' }, { header: 'Requests', accessor: 'requests' }, { header: 'Accepted', accessor: 'accepted' }, { header: 'Completed', accessor: 'completed' }, { header: 'Pending', accessor: 'pending' }, { header: 'Accepted ₹', accessor: 'acceptedAmount' }, { header: 'Completed ₹', accessor: 'completedAmount' }, { header: 'Commission ₹', accessor: 'commission' },
            ]} />
          </div>
          <Panel title="Sellers" action={<span className="text-[11px] text-gray-500">{filteredSellers.length} shown</span>} padded={false}>
            {sellerRows.length === 0 ? <EmptyState title="No sellers match" description="Add a seller or clear filters." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                    <tr>
                      {['Seller', 'WhatsApp', 'UPI', 'Reqs', 'Acc.', 'Done', 'Pend.', 'Accepted ₹', 'Completed ₹', `Seller ${SELLER_COMMISSION_PCT}%`, 'Live', 'Actions'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sellerRows.map((row) => (
                      <tr key={row.id} className={`border-b border-gray-100 dark:border-gray-800 ${row.live ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={row.name} />
                            <div>
                              <p className="font-medium">{row.name}</p>
                              <p className="font-mono text-[11px] text-gray-400">{row.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{row.whatsapp}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.upiId}</td>
                        <td className="px-3 py-2">{row.metrics.total}</td>
                        <td className="px-3 py-2">{row.metrics.accepted}</td>
                        <td className="px-3 py-2">{row.metrics.completed}</td>
                        <td className="px-3 py-2">{row.metrics.pending}</td>
                        <td className="px-3 py-2 text-xs">{inr(row.metrics.acceptedAmount)}</td>
                        <td className="px-3 py-2 text-xs">{inr(row.metrics.completedAmount)}</td>
                        <td className="px-3 py-2 text-xs">{inr(row.metrics.sellerCommission)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`relative h-5 w-9 rounded-full ${row.live ? 'bg-rose-600' : 'bg-gray-300'}`}
                              aria-label={`Set ${row.name} ${row.live ? 'offline' : 'live'}`}
                              onClick={() => setConfirm({ type: 'status', id: row.id, next: row.live ? 'Inactive' : 'Active', name: row.name, live: !row.live })}
                            >
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white ${row.live ? 'left-4' : 'left-0.5'}`} />
                            </button>
                            <LiveBadge live={Boolean(row.live)} />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200" onClick={() => setSelectedId(row.id)}>View</button>
                            <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200" onClick={() => openEdit(row.id)}>Edit</button>
                            <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200" onClick={() => { setTab('requests'); setReqSeller(row.id) }}>Requests</button>
                            <button type="button" className="rounded-md px-2 py-1 text-[11px] text-rose-700 ring-1 ring-rose-200" onClick={() => setConfirm({ type: 'delete', id: row.id, name: row.name })}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Pagination currentPage={page} totalPages={sellerPages} totalItems={filteredSellers.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }} />
        </>
      )}

      {tab === 'requests' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBar placeholder="Search request, user, or seller" value={reqSearch} onChange={setReqSearch} />
            <select className="input-field max-w-[160px]" value={reqStatus} onChange={(e) => setReqStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="input-field max-w-[180px]" value={reqSeller} onChange={(e) => setReqSeller(e.target.value)}>
              <option value="all">All sellers</option>
              {sellers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            {[{ id: 'all', label: 'All users' }, { id: 'live', label: `Live (${requests.filter((row) => row.userLive).length})` }, { id: 'online', label: 'Online' }, { id: 'offline', label: 'Offline' }].map((item) => (
              <Chip key={item.id} active={reqPresence === item.id} onClick={() => setReqPresence(item.id)}>{item.label}</Chip>
            ))}
            <input className="input-field max-w-[110px]" type="number" placeholder="Min ₹" value={reqMin} onChange={(e) => setReqMin(e.target.value)} />
            <input className="input-field max-w-[110px]" type="number" placeholder="Max ₹" value={reqMax} onChange={(e) => setReqMax(e.target.value)} />
            <input className="input-field max-w-[140px]" type="date" value={reqFrom} onChange={(e) => setReqFrom(e.target.value)} />
            <input className="input-field max-w-[140px]" type="date" value={reqTo} onChange={(e) => setReqTo(e.target.value)} />
            <ExportButton data={requestExports} filename="seller-requests" disabled={requestExports.length === 0} columns={[
              { header: 'Request ID', accessor: 'id' }, { header: 'User', accessor: 'user' }, { header: 'User ID', accessor: 'userId' }, { header: 'User status', accessor: 'presence' }, { header: 'Seller', accessor: 'seller' }, { header: 'Seller ID', accessor: 'sellerId' }, { header: 'Package', accessor: 'package' }, { header: 'Amount', accessor: 'amount' }, { header: 'Status', accessor: 'status' }, { header: 'Requested', accessor: 'requested' }, { header: 'Accepted', accessor: 'accepted' }, { header: 'Completed', accessor: 'completed' },
            ]} />
            <ExportButton data={txnExports} filename="completed-transactions" disabled={txnExports.length === 0} columns={[
              { header: 'Transaction ID', accessor: 'id' }, { header: 'Request ID', accessor: 'requestId' }, { header: 'Seller', accessor: 'seller' }, { header: 'Completed ₹', accessor: 'amount' }, { header: 'Seller commission', accessor: 'sellerCommission' }, { header: 'Company commission', accessor: 'companyCommission' }, { header: 'Rate %', accessor: 'pct' }, { header: 'Completed', accessor: 'completed' },
            ]} />
          </div>
          <Panel title="Seller requests" action={<span className="text-[11px] text-gray-500">{filteredRequests.length} shown · accepted {inr(filteredRequests.filter((row) => ['Accepted', 'Processing', 'Completed'].includes(row.status)).reduce((n, row) => n + row.amount, 0))} · completed {inr(filteredRequests.filter((row) => row.status === 'Completed').reduce((n, row) => n + row.amount, 0))}</span>} padded={false}>
            {reqRows.length === 0 ? <EmptyState title="No requests match" description="Clear filters to see sample purchase requests." /> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                    <tr>
                      {['Request', 'User / status', 'Seller', 'Package', 'Amount', `Seller ${SELLER_COMMISSION_PCT}%`, 'Requested', 'Accepted', 'Completed', 'Status', 'Actions'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {reqRows.map((row) => (
                      <tr key={row.id} className={`border-b border-gray-100 dark:border-gray-800 ${row.userLive ? 'bg-rose-50/70 dark:bg-rose-950/20' : ''}`}>
                        <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{row.userName}</p>
                          <p className="font-mono text-[11px] text-gray-400">{row.userId}</p>
                          <UserPresence live={row.userLive} online={row.userOnline} account={row.userAccount} />
                        </td>
                        <td className="px-3 py-2">{row.sellerName}<p className="font-mono text-[11px] text-gray-400">{row.sellerId}</p></td>
                        <td className="px-3 py-2 text-xs">{row.packageName}</td>
                        <td className="px-3 py-2 text-xs">{inr(row.amount)}</td>
                        <td className="px-3 py-2 text-xs">{row.status === 'Completed' ? inr(sellerCut(row.amount, row.commissionPct ?? SELLER_COMMISSION_PCT)) : '—'}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{formatWhen(row.requestedAt)}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{formatWhen(row.acceptedAt)}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{formatWhen(row.completedAt)}</td>
                        <td className="px-3 py-2"><StatusBadge tone={requestStatusTone(row.status)}>{row.status}</StatusBadge></td>
                        <td className="px-3 py-2">
                          <select className="input-field max-w-[130px] text-[11px]" value={row.status} onChange={(e) => setConfirm({ type: 'request', id: row.id, next: e.target.value, name: row.id })}>
                            {REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Pagination currentPage={reqPage} totalPages={reqPages} totalItems={filteredRequests.length} itemsPerPage={perPage} onPageChange={setReqPage} onItemsPerPageChange={(value) => { setPerPage(value); setReqPage(1) }} />
        </>
      )}

      {tab === 'commission' && (
        <div className="space-y-3">
          <Panel title="Commission model">
            <p className="mb-3 text-sm">Seller commission = <span className="font-semibold">completed amount × {SELLER_COMMISSION_PCT}%</span>. Pending, accepted, rejected, and cancelled requests earn ₹0.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
                <p className="text-[11px] uppercase text-gray-500">Example</p>
                <p>Request amount ₹1,000</p>
                <p>Seller {SELLER_COMMISSION_PCT}% = {inr(sellerCut(1000))}</p>
                <p>Company {100 - SELLER_COMMISSION_PCT}% = {inr(1000 - sellerCut(1000))}</p>
              </div>
              <label className="text-xs font-medium">Default seller % for new sellers
                <input className="input-field mt-1" type="number" min="0" max="100" step="0.5" value={defaultPct} onChange={(e) => setDefaultPct(e.target.value)} />
              </label>
              <div>
                <button type="button" className="rounded-md bg-cyan-700 px-3 py-1.5 text-xs text-white" onClick={() => setConfirm({ type: 'defaultRate', pct: Number(defaultPct), name: 'default' })}>Save default rate</button>
                <p className="mt-2 text-[11px] text-gray-500">Current default: seller {rates.sellerPct}% of completed amount. Sample math only.</p>
              </div>
            </div>
          </Panel>
          <Panel title="Per-seller rates" padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-[11px] uppercase text-gray-500"><tr>{['Seller', 'Current seller %', 'Company %', 'Completed ₹', 'Seller commission', 'Paid', 'Remaining', 'Action'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                <tbody>
                  {sellers.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2">{row.name}<p className="font-mono text-[11px] text-gray-400">{row.id}</p></td>
                      <td className="px-3 py-2">
                        <input className="input-field max-w-[90px]" type="number" defaultValue={row.sellerCommissionPct} onBlur={(e) => {
                          const pct = Number(e.target.value)
                          if (pct !== row.sellerCommissionPct) setConfirm({ type: 'rate', id: row.id, pct, name: row.name })
                        }} />
                      </td>
                      <td className="px-3 py-2 text-xs">{roundSafe(100 - row.sellerCommissionPct)}%</td>
                      <td className="px-3 py-2 text-xs">{inr(row.metrics.completedAmount)}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.metrics.sellerCommission)}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.metrics.commissionPaid)}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.metrics.remainingPayable)}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="text-[11px] text-cyan-700" onClick={() => setPayoutForm({ sellerId: row.id, periodLabel: 'Custom period', eligibleAmount: row.metrics.remainingPayable / (row.sellerCommissionPct / 100 || 1), commissionPct: row.sellerCommissionPct, commissionAmount: row.metrics.remainingPayable })}>New payout</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="Commission payout history" action={<ExportButton data={payoutExports} filename="commission-payouts" disabled={payoutExports.length === 0} columns={[
            { header: 'Payout ID', accessor: 'id' }, { header: 'Seller', accessor: 'seller' }, { header: 'Period', accessor: 'period' }, { header: 'Eligible ₹', accessor: 'eligible' }, { header: 'Rate %', accessor: 'pct' }, { header: 'Commission', accessor: 'commission' }, { header: 'Paid', accessor: 'paid' }, { header: 'Remaining', accessor: 'remaining' }, { header: 'Status', accessor: 'status' }, { header: 'Payment date', accessor: 'paidOn' }, { header: 'Reference', accessor: 'ref' },
          ]} />} padded={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-[11px] uppercase text-gray-500"><tr>{['Payout', 'Seller', 'Period', 'Eligible ₹', '%', 'Commission', 'Paid', 'Remaining', 'Status', 'Paid on', 'Actions'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                <tbody>
                  {payouts.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-mono text-xs">{row.id}</td>
                      <td className="px-3 py-2">{row.sellerName}</td>
                      <td className="px-3 py-2 text-xs">{row.periodLabel}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.eligibleAmount)}</td>
                      <td className="px-3 py-2 text-xs">{row.commissionPct}%</td>
                      <td className="px-3 py-2 text-xs">{inr(row.commissionAmount)}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.paidAmount)}</td>
                      <td className="px-3 py-2 text-xs">{inr(row.remainingAmount)}</td>
                      <td className="px-3 py-2"><StatusBadge tone={payoutStatusTone(row.status)}>{row.status}</StatusBadge></td>
                      <td className="px-3 py-2 text-xs">{formatWhen(row.paymentDate)}</td>
                      <td className="px-3 py-2">
                        <select className="input-field max-w-[130px] text-[11px]" value={row.status} onChange={(e) => {
                          if (e.target.value === 'Paid') setPayoutForm({ ...row, markPaid: true })
                          else {
                            setPayoutStatus(row.id, { status: e.target.value })
                            refresh()
                            showToast(`Payout ${row.id} set to ${e.target.value} in this sample list.`, 'success')
                          }
                        }}>
                          {PAYOUT_STATUSES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {RANGE.map((item) => <Chip key={item.id} active={range === item.id} onClick={() => setRange(item.id)}>{item.label}</Chip>)}
            {range === 'custom' && (
              <>
                <input className="input-field max-w-[140px]" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <input className="input-field max-w-[140px]" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KpiCard title="Requests in range" value={analytics.metrics.total} tone="sky" />
            <KpiCard title="Acceptance rate" value={`${analytics.metrics.acceptanceRate}%`} tone="indigo" />
            <KpiCard title="Completion rate" value={`${analytics.metrics.completionRate}%`} tone="emerald" />
            <KpiCard title="Average request" value={inr(analytics.metrics.averageAmount)} tone="amber" />
            <KpiCard title="Completed value" value={inr(analytics.metrics.completedAmount)} tone="teal" />
            <KpiCard title={`Seller commission (${SELLER_COMMISSION_PCT}%)`} value={inr(analytics.metrics.sellerCommission)} tone="pink" />
            <KpiCard title="Company share (95%)" value={inr(analytics.metrics.companyCommission)} tone="blue" />
            <KpiCard title="Accepted value" value={inr(analytics.metrics.acceptedAmount)} tone="violet" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Request trend">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#0891b2" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Completed transaction value">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area dataKey="completedValue" stroke="#059669" fill="#a7f3d0" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Panel title="Top completed value">{analytics.topCompleted.map((row) => <p key={row.sellerId} className="flex justify-between py-1 text-sm"><span>{row.sellerName}</span><span>{inr(row.completedAmount)}</span></p>)}</Panel>
            <Panel title="Most accepted requests">{analytics.topAccepted.map((row) => <p key={row.sellerId} className="flex justify-between py-1 text-sm"><span>{row.sellerName}</span><span>{row.accepted}</span></p>)}</Panel>
            <Panel title="Highest commission earned">{analytics.topCommission.map((row) => <p key={row.sellerId} className="flex justify-between py-1 text-sm"><span>{row.sellerName}</span><span>{inr(row.sellerCommission)}</span></p>)}</Panel>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div>
                <p className="font-mono text-[11px] text-gray-400">{selected.id}</p>
                <h2 className="text-base font-semibold">{selected.name}</h2>
              </div>
              <button type="button" className="rounded-md p-1 hover:bg-gray-100" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <LiveBadge live={Boolean(selected.live)} />
                <button type="button" className={`relative h-6 w-11 rounded-full ${selected.live ? 'bg-rose-600' : 'bg-gray-300'}`} onClick={() => setConfirm({ type: 'status', id: selected.id, next: selected.live ? 'Inactive' : 'Active', name: selected.name, live: !selected.live })}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${selected.live ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500">{selected.live ? 'ON — sample seller page would show this seller as Live.' : 'OFF — sample seller page would show this seller as Offline. Requests and commissions stay on file.'}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[11px] text-gray-500">WhatsApp</dt><dd className="font-mono">{selected.whatsapp}</dd></div>
                <div><dt className="text-[11px] text-gray-500">UPI ID</dt><dd className="font-mono">{selected.upiId}</dd></div>
                <div><dt className="text-[11px] text-gray-500">Seller commission</dt><dd>{selected.sellerCommissionPct}% of completed amount ({inr(selected.metrics.completedAmount)} × {selected.sellerCommissionPct}% = {inr(selected.metrics.sellerCommission)})</dd></div>
                <div><dt className="text-[11px] text-gray-500">Added / updated</dt><dd>{formatWhen(selected.createdAt)} · {formatWhen(selected.updatedAt)}</dd></div>
              </dl>
              <div className="grid grid-cols-2 gap-2">
                <KpiCard title="Received" value={selected.metrics.total} tone="slate" />
                <KpiCard title="Accepted" value={selected.metrics.accepted} tone="indigo" />
                <KpiCard title="Pending" value={selected.metrics.pending} tone="amber" />
                <KpiCard title="Completed" value={selected.metrics.completed} tone="emerald" />
                <KpiCard title="Rejected" value={selected.metrics.rejected} tone="rose" />
                <KpiCard title="Cancelled" value={selected.metrics.cancelled} tone="orange" />
                <KpiCard title="Acceptance" value={`${selected.metrics.acceptanceRate}%`} tone="sky" />
                <KpiCard title="Completion" value={`${selected.metrics.completionRate}%`} tone="teal" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <KpiCard title="Accepted ₹" value={inr(selected.metrics.acceptedAmount)} tone="violet" />
                <KpiCard title="Completed ₹" value={inr(selected.metrics.completedAmount)} tone="emerald" />
                <KpiCard title="Open accepted ₹" value={inr(selected.metrics.openAcceptedAmount)} tone="amber" />
                <KpiCard title="Rejected ₹" value={inr(selected.metrics.rejectedAmount)} tone="rose" />
                <KpiCard title={`Seller ${selected.sellerCommissionPct}%`} value={inr(selected.metrics.sellerCommission)} tone="pink" />
                <KpiCard title="Company share" value={inr(selected.metrics.companyCommission)} tone="blue" />
                <KpiCard title="Paid to seller" value={inr(selected.metrics.commissionPaid)} tone="teal" />
                <KpiCard title="Remaining payable" value={inr(selected.metrics.remainingPayable)} tone="orange" />
              </div>
              <p className="text-[11px] text-gray-500">Net payable uses completed commissions minus sample payouts marked Paid. Open accepted amounts are not commission-eligible yet.</p>
              <div>
                <p className="mb-2 text-xs font-medium">Activity</p>
                <ul className="space-y-2 text-xs">
                  {selected.history.map((item, index) => (
                    <li key={`${item.action}-${index}`} className="flex justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900">
                      <span>{item.action}{item.note ? ` · ${item.note}` : ''}<span className="text-gray-400"> · {item.actor}</span></span>
                      <span className="text-gray-400">{formatWhen(item.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit diamond seller' : 'Add diamond seller'} size="md">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Saved in this admin list. No payment or WhatsApp message is sent.</p>
          <label className="block text-xs font-medium">Seller full name
            <input className="input-field mt-1" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors((prev) => ({ ...prev, name: '' })) }} />
            {errors.name && <span className="text-[11px] text-rose-600">{errors.name}</span>}
          </label>
          <label className="block text-xs font-medium">WhatsApp number (with country code)
            <input className="input-field mt-1" value={form.whatsapp} onChange={(e) => { setForm({ ...form, whatsapp: e.target.value }); setErrors((prev) => ({ ...prev, whatsapp: '' })) }} />
            {errors.whatsapp && <span className="text-[11px] text-rose-600">{errors.whatsapp}</span>}
          </label>
          <label className="block text-xs font-medium">UPI ID
            <input className="input-field mt-1" value={form.upiId} onChange={(e) => { setForm({ ...form, upiId: e.target.value }); setErrors((prev) => ({ ...prev, upiId: '' })) }} />
            {errors.upiId && <span className="text-[11px] text-rose-600">{errors.upiId}</span>}
          </label>
          <label className="block text-xs font-medium">Seller commission % of completed amount
            <input className="input-field mt-1" type="number" min="0" max="100" step="0.5" value={form.sellerCommissionPct} onChange={(e) => setForm({ ...form, sellerCommissionPct: e.target.value })} />
            {errors.sellerCommissionPct && <span className="text-[11px] text-rose-600">{errors.sellerCommissionPct}</span>}
          </label>
          <label className="block text-xs font-medium">Seller page status
            <select className="input-field mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Live (ON)</option>
              <option value="Inactive">Offline (OFF)</option>
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="button" className="rounded-md bg-cyan-700 px-3 py-1.5 text-xs text-white" onClick={save}>Save seller</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} title="Confirm change">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {confirm?.type === 'delete' && `Remove ${confirm.name} from this admin list? Request history stays in memory until refresh.`}
          {confirm?.type === 'status' && `Turn ${confirm.name} ${confirm.live ? 'Live' : 'Offline'} on the sample seller page? The badge will show ${confirm.live ? 'Live' : 'Offline'}.`}
          {confirm?.type === 'request' && `Set ${confirm.name} to ${confirm.next}? Completed commission uses the seller’s current rate only if this request was not completed before.`}
          {confirm?.type === 'rate' && `Set ${confirm.name} to ${confirm.pct}% seller commission? Older completed rows keep their snapshot.`}
          {confirm?.type === 'defaultRate' && `Set the default new-seller rate to ${confirm.pct}%? Completed history is unchanged.`}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white" onClick={applyConfirm}>Confirm</button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(payoutForm)} onClose={() => setPayoutForm(null)} title={payoutForm?.markPaid ? 'Mark payout paid (sample)' : 'Create sample payout'}>
        {payoutForm?.markPaid ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">This only updates the mock payout record. No bank transfer is sent.</p>
            <label className="block text-xs">Payment reference
              <input className="input-field mt-1" value={payForm.paymentRef} onChange={(e) => setPayForm({ ...payForm, paymentRef: e.target.value })} />
            </label>
            <label className="block text-xs">Payment date
              <input className="input-field mt-1" type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
            </label>
            <label className="block text-xs">Payment proof (optional local preview)
              <input className="input-field mt-1" type="file" accept="image/png,image/jpeg" onChange={(e) => pickFile(e.target.files?.[0], (proof, proofName) => setPayForm((prev) => ({ ...prev, proof, proofName })), 'proof')} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setPayoutForm(null)}>Cancel</button>
              <button type="button" className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white" onClick={() => {
                if (!payForm.paymentRef.trim()) {
                  showToast('Add a payment reference before marking Paid.', 'error')
                  return
                }
                setPayoutStatus(payoutForm.id, { status: 'Paid', paymentRef: payForm.paymentRef, paymentDate: payForm.paymentDate, paymentProof: payForm.proof, paymentProofName: payForm.proofName })
                setPayoutForm(null)
                setPayForm({ paymentRef: '', paymentDate: '', proof: '', proofName: '' })
                refresh()
                showToast('Payout marked Paid in this sample list.', 'success')
              }}>Mark paid</button>
            </div>
          </div>
        ) : payoutForm ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Creates a pending payout row from remaining commission. Mock only.</p>
            <p className="text-sm">{inr(payoutForm.commissionAmount)} at {payoutForm.commissionPct}%</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setPayoutForm(null)}>Cancel</button>
              <button type="button" className="rounded-md bg-cyan-700 px-3 py-1.5 text-xs text-white" onClick={() => {
                createPayout(payoutForm)
                setPayoutForm(null)
                refresh()
                showToast('Sample payout row added.', 'success')
              }}>Create payout</button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

const roundSafe = (value) => {
  const number = Number(value)
  if (Number.isNaN(number)) return 0
  return Math.round(number * 100) / 100
}

export default DiamondSellers
