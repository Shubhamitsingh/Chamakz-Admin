import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  ShieldAlert,
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
  addComplaintNote,
  ALL_CATEGORY_ITEMS,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  formatWhen,
  getComplaint,
  listComplaints,
  mutateComplaint,
  priorityTone,
  statusTone,
} from '../utils/complaintsData'

const DESTRUCTIVE = new Set(['Restrict Chat Access', 'Restrict Live Streaming', 'Temporarily Suspend Account', 'Permanently Ban Account', 'Remove Reported Content'])

const ACTIONS = [
  'Send Warning',
  'Remove Reported Content',
  'Restrict Chat Access',
  'Restrict Live Streaming',
  'Temporarily Suspend Account',
  'Permanently Ban Account',
  'Dismiss Complaint',
  'Escalate Complaint',
  'Mark as Resolved',
]

const AVATAR_TONES = {
  reporter: 'bg-indigo-600',
  reported: 'bg-emerald-600',
}

const Avatar = ({ name, tone = 'reporter' }) => (
  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white ${AVATAR_TONES[tone] || AVATAR_TONES.reporter}`}>
    {(name || '?').charAt(0)}
  </span>
)

const ActionMenu = ({ onView, onStatus }) => {
  const [open, setOpen] = useState(false)
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
      <button type="button" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setOpen((value) => !value)} aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { setOpen(false); onView() }}>View complaint</button>
          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { setOpen(false); onStatus() }}>Update status</button>
        </div>
      )}
    </div>
  )
}

const Complaints = () => {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [category, setCategory] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState('submittedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedId, setSelectedId] = useState(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(null)
  const [reason, setReason] = useState('')
  const [nextStatus, setNextStatus] = useState('Investigating')
  const [note, setNote] = useState('')

  const rows = useMemo(() => listComplaints(), [tick])
  const selected = selectedId ? getComplaint(selectedId) : null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (priority !== 'all' && row.priority !== priority) return false
      if (category !== 'all' && row.category !== category) return false
      if (from && new Date(row.submittedAt) < new Date(from)) return false
      if (to && new Date(row.submittedAt) > new Date(`${to}T23:59:59`)) return false
      if (!q) return true
      return `${row.id} ${row.reporter.name} ${row.reporter.numericId} ${row.reported.name} ${row.reported.numericId} ${row.reason}`.toLowerCase().includes(q)
    })
    return [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av instanceof Date || sortKey.endsWith('At')) {
        const left = new Date(av).getTime()
        const right = new Date(bv).getTime()
        return sortDir === 'asc' ? left - right : right - left
      }
      const left = String(av)
      const right = String(bv)
      return sortDir === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
    })
  }, [rows, search, status, priority, category, from, to, sortKey, sortDir])

  useEffect(() => { setPage(1) }, [search, status, priority, category, from, to])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)
  const counts = {
    all: rows.length,
    Pending: rows.filter((row) => row.status === 'Pending').length,
    Investigating: rows.filter((row) => row.status === 'Investigating').length,
    Escalated: rows.filter((row) => row.status === 'Escalated').length,
    Resolved: rows.filter((row) => row.status === 'Resolved').length,
    Dismissed: rows.filter((row) => row.status === 'Dismissed').length,
  }

  const refresh = () => setTick((value) => value + 1)

  const open = (id) => {
    setSelectedId(id)
  }

  const applyStatus = (id, next, detail) => {
    mutateComplaint(id, { status: next }, { at: new Date(), actor: 'Admin User', action: detail || `Status → ${next}` })
    refresh()
    showToast(`Sample status updated to ${next}`, 'success')
  }

  const confirmAction = () => {
    if (!actionOpen) return
    const { id, label } = actionOpen
    if (DESTRUCTIVE.has(label) && !reason.trim()) {
      showToast('Add a reason for this sample action', 'error')
      return
    }
    let next = null
    if (label === 'Dismiss Complaint') next = 'Dismissed'
    if (label === 'Escalate Complaint') next = 'Escalated'
    if (label === 'Mark as Resolved') next = 'Resolved'
    if (['Send Warning', 'Remove Reported Content', 'Restrict Chat Access', 'Restrict Live Streaming', 'Temporarily Suspend Account', 'Permanently Ban Account'].includes(label)) {
      next = 'Resolved'
    }
    mutateComplaint(
      id,
      next ? { status: next } : {},
      { at: new Date(), actor: 'Admin User', action: `${label}${reason.trim() ? ` · ${reason.trim()}` : ''}` }
    )
    setActionOpen(null)
    setReason('')
    refresh()
    showToast(`${label} recorded on this sample queue. It does not change live accounts.`, 'success')
  }

  const exportColumns = [
    { header: 'Complaint ID', accessor: 'id' },
    { header: 'Reporter', accessor: 'reporterName' },
    { header: 'Reported', accessor: 'reportedName' },
    { header: 'Category', accessor: 'category' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Status', accessor: 'status' },
  ]

  const exportRows = filtered.map((row) => ({
    ...row,
    reporterName: `${row.reporter.name} (${row.reporter.numericId})`,
    reportedName: `${row.reported.name} (${row.reported.numericId})`,
  }))

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Complaints"
        description="Sample moderation queue. Actions stay on this page and do not change live accounts."
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {[
          { id: 'all', title: 'Total complaints', value: counts.all, icon: AlertTriangle, tone: 'blue' },
          { id: 'Pending', title: 'Pending', value: counts.Pending, icon: Clock, tone: 'amber' },
          { id: 'Investigating', title: 'Investigating', value: counts.Investigating, icon: Eye, tone: 'sky' },
          { id: 'Escalated', title: 'Escalated', value: counts.Escalated, icon: ShieldAlert, tone: 'rose' },
          { id: 'Resolved', title: 'Resolved', value: counts.Resolved, icon: CheckCircle, tone: 'emerald' },
          { id: 'Dismissed', title: 'Dismissed', value: counts.Dismissed, icon: XCircle, tone: 'slate' },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setStatus(card.id)}
            className={`text-left ${status === card.id ? 'rounded-lg ring-1 ring-gray-900 dark:ring-white' : ''}`}
          >
            <KpiCard title={card.title} value={card.value} icon={card.icon} tone={card.tone} />
          </button>
        ))}
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <SearchBar placeholder="Search ID, reporter, reported user, or reason" value={search} onChange={setSearch} />
          <select className="input-field max-w-[140px]" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All priority</option>
            {COMPLAINT_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {ALL_CATEGORY_ITEMS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="input-field max-w-[140px]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="input-field max-w-[140px]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <ExportButton data={exportRows} columns={exportColumns} filename="complaints" disabled={exportRows.length === 0} />
        </div>

        {pageRows.length === 0 ? (
          <EmptyState title="No complaints in this view" description="Clear filters or choose another status card." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('id')}>ID</th>
                  <th className="px-3 py-2 font-medium">Reporter</th>
                  <th className="px-3 py-2 font-medium">Reported</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('submittedAt')}>Submitted</th>
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('updatedAt')}>Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/40">
                    <td className="px-3 py-2 font-mono text-[11px]">{row.id}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.reporter.name} tone="reporter" />
                        <div>
                          <p className="font-medium">{row.reporter.name}</p>
                          <p className="font-mono text-[11px] text-gray-500">{row.reporter.numericId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.reported.name} tone="reported" />
                        <div>
                          <p className="font-medium">{row.reported.name}</p>
                          <p className="font-mono text-[11px] text-gray-500">{row.reported.numericId}</p>
                          {row.multiReport ? <StatusBadge tone="warning">{row.reportsAgainstUser} reports</StatusBadge> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.category}</td>
                    <td className="max-w-[180px] px-3 py-2">
                      <p className="truncate text-xs" title={row.reason}>{row.reason}</p>
                      {row.duplicate ? <p className="text-[10px] text-amber-700">Possible duplicate</p> : null}
                    </td>
                    <td className="px-3 py-2"><StatusBadge tone={priorityTone(row.priority)}>{row.priority}</StatusBadge></td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>
                    </td>
                    <td className="px-3 py-2 text-xs">{formatWhen(row.submittedAt)}</td>
                    <td className="px-3 py-2 text-xs">{formatWhen(row.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <ActionMenu
                        onView={() => open(row.id)}
                        onStatus={() => { setSelectedId(row.id); setNextStatus(row.status); setStatusOpen(true) }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-100 p-3 dark:border-gray-700">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }}
          />
        </div>
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close drawer" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div>
                <p className="font-mono text-xs text-gray-500">{selected.id}</p>
                <h2 className="text-sm font-semibold">{selected.reason}</h2>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <Panel title="Complaint summary">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p><span className="text-[11px] uppercase text-gray-500">Category</span><br />{selected.group} · {selected.category}</p>
                  <p><span className="text-[11px] uppercase text-gray-500">Priority</span><br /><StatusBadge tone={priorityTone(selected.priority)}>{selected.priority}</StatusBadge></p>
                  <p><span className="text-[11px] uppercase text-gray-500">Status</span><br /><StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge></p>
                  <p><span className="text-[11px] uppercase text-gray-500">Submitted</span><br />{formatWhen(selected.submittedAt)}</p>
                  <p><span className="text-[11px] uppercase text-gray-500">Updated</span><br />{formatWhen(selected.updatedAt)}</p>
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{selected.description}</p>
              </Panel>

              <div className="grid gap-3 sm:grid-cols-2">
                <Panel title="Reporter">
                  <div className="flex items-center gap-2">
                    <Avatar name={selected.reporter.name} tone="reporter" />
                    <div>
                      <p className="text-sm font-medium">{selected.reporter.name}</p>
                      <p className="font-mono text-[11px] text-gray-500">{selected.reporter.numericId}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{selected.reporter.email}</p>
                  <p className="text-xs">{selected.reporter.status} · joined {formatWhen(selected.reporter.registeredAt)}</p>
                  <p className="text-xs">Complaints submitted: {selected.reportsByReporter}</p>
                  <Link className="mt-2 inline-block text-xs font-medium text-indigo-600" to={`/users/profile/${selected.reporter.id}`}>Open user profile</Link>
                </Panel>
                <Panel title="Reported user">
                  <div className="flex items-center gap-2">
                    <Avatar name={selected.reported.name} tone="reported" />
                    <div>
                      <p className="text-sm font-medium">{selected.reported.name}</p>
                      <p className="font-mono text-[11px] text-gray-500">{selected.reported.numericId}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{selected.reported.email}</p>
                  <p className="text-xs">{selected.reported.status} · joined {formatWhen(selected.reported.registeredAt)}</p>
                  <p className="text-xs">Complaints received: {selected.reportsAgainstUser}</p>
                  {selected.multiReport ? <StatusBadge tone="warning">Multiple reports on this account</StatusBadge> : null}
                  <Link className="mt-2 inline-block text-xs font-medium text-indigo-600" to={`/users/profile/${selected.reported.id}`}>Open user profile</Link>
                </Panel>
              </div>

              <Panel title="Evidence">
                {selected.evidence.type === 'none' && <p className="text-sm text-gray-500">No evidence attached</p>}
                {selected.evidence.type === 'chat' && (
                  <ul className="space-y-1 text-xs">
                    {selected.evidence.messages.map((item, index) => (
                      <li key={index} className="rounded-md bg-gray-50 px-2 py-1 dark:bg-gray-900/40"><span className="font-medium">{item.from}:</span> {item.text}</li>
                    ))}
                    <li className="text-[11px] text-gray-400">Excerpt only. Full private conversations are not shown.</li>
                  </ul>
                )}
                {selected.evidence.type === 'screenshot' && (
                  <div>
                    <p className="mb-2 text-xs text-gray-500">{selected.evidence.label}</p>
                    <img src={selected.evidence.url} alt="Uploaded evidence placeholder" className="max-h-40 rounded-md border border-gray-200" />
                  </div>
                )}
                {selected.evidence.type === 'live' && (
                  <div className="text-sm">
                    <p>Stream ID: <span className="font-mono text-xs">{selected.evidence.streamId}</span></p>
                    <p className="text-xs text-gray-500">{selected.evidence.session}</p>
                    <p className="mt-1 text-xs">{selected.evidence.note}</p>
                    <p className="text-[11px] text-gray-400">Incident {formatWhen(selected.incidentAt)}</p>
                  </div>
                )}
                {selected.evidence.type === 'profile' && <p className="text-sm text-gray-600">{selected.evidence.note}</p>}
              </Panel>

              <Panel title="Investigation">
                <ul className="mb-3 space-y-2">
                  {selected.timeline.map((item, index) => (
                    <li key={index} className="text-xs">
                      <span className="font-medium">{item.action}</span>
                      <span className="block text-[11px] text-gray-400">{item.actor} · {formatWhen(item.at)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-1 text-[11px] uppercase text-gray-500">Internal notes</p>
                {selected.notes.length === 0 ? <p className="text-xs text-gray-500">No internal notes yet.</p> : selected.notes.map((item, index) => (
                  <div key={index} className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                    {item.text}
                    <p className="text-[11px] text-gray-400">{item.actor} · {formatWhen(item.at)}</p>
                  </div>
                ))}
                <textarea className="input-field mt-2 min-h-[72px]" placeholder="Add internal note" value={note} onChange={(e) => setNote(e.target.value)} />
                <button
                  type="button"
                  className="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-gray-900"
                  onClick={() => {
                    if (!note.trim()) return
                    addComplaintNote(selected.id, note.trim())
                    setNote('')
                    refresh()
                    showToast('Internal note added to sample case', 'success')
                  }}
                >
                  Add note
                </button>
              </Panel>

              <Panel title="Moderation actions">
                <p className="mb-2 text-[11px] text-gray-400">Sample actions only. They update this queue, not production accounts.</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={`rounded-md border px-2.5 py-1.5 text-[11px] ${DESTRUCTIVE.has(label) ? 'border-red-200 text-red-700' : ''}`}
                      onClick={() => { setActionOpen({ id: selected.id, label }); setReason('') }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          </aside>
        </div>
      )}

      <Modal isOpen={statusOpen} onClose={() => setStatusOpen(false)} title="Update status" size="sm">
        <select className="input-field" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
          {COMPLAINT_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setStatusOpen(false)}>Cancel</button>
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white"
            onClick={() => {
              applyStatus(selectedId, nextStatus)
              setStatusOpen(false)
            }}
          >
            Update
          </button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(actionOpen)} onClose={() => setActionOpen(null)} title="Confirm sample action" size="sm">
        <p className="text-sm">Action: <strong>{actionOpen?.label}</strong></p>
        <p className="mt-1 text-xs text-gray-500">This only updates the sample complaints queue.</p>
        {DESTRUCTIVE.has(actionOpen?.label) && (
          <textarea className="input-field mt-3 min-h-[72px]" placeholder="Reason required" value={reason} onChange={(e) => setReason(e.target.value)} />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setActionOpen(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white" onClick={confirmAction}>Confirm</button>
        </div>
      </Modal>
    </div>
  )
}

export default Complaints
