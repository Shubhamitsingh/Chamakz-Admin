import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  Hourglass,
  Lock,
  MoreHorizontal,
  Ticket,
  X,
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
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  addTicketReply,
  formatWhen,
  getTicket,
  listTickets,
  mutateTicket,
  priorityTone,
  statusTone,
} from '../utils/ticketsData'

const Avatar = ({ name }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-600 text-xs font-semibold text-white">
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
        aria-label="Actions"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect()
          setPos({ top: box.bottom + 4, left: Math.max(8, box.right - 176) })
          setOpen((value) => !value)
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed z-50 w-44 rounded-md border border-gray-200 bg-white py-1 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800" style={{ top: pos.top, left: pos.left }}>
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

const TicketsV2 = () => {
  const { showToast, markTicketsAsSeen } = useApp()
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
  const [confirm, setConfirm] = useState(null)
  const [reply, setReply] = useState('')
  const [note, setNote] = useState('')
  const [nextStatus, setNextStatus] = useState('In Progress')
  const [reason, setReason] = useState('')

  useEffect(() => { markTicketsAsSeen?.() }, [markTicketsAsSeen])

  const rows = useMemo(() => listTickets(), [tick])
  const selected = selectedId ? getTicket(selectedId) : null
  const refresh = () => setTick((value) => value + 1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (priority !== 'all' && row.priority !== priority) return false
      if (category !== 'all' && row.category !== category) return false
      if (from && new Date(row.submittedAt) < new Date(from)) return false
      if (to && new Date(row.submittedAt) > new Date(`${to}T23:59:59`)) return false
      if (!q) return true
      return `${row.id} ${row.user.name} ${row.user.numericId} ${row.user.email} ${row.subject} ${row.description}`.toLowerCase().includes(q)
    })
    return [...list].sort((a, b) => {
      if (sortKey === 'submittedAt' || sortKey === 'updatedAt') {
        const left = new Date(a[sortKey]).getTime()
        const right = new Date(b[sortKey]).getTime()
        return sortDir === 'asc' ? left - right : right - left
      }
      return sortDir === 'asc' ? String(a[sortKey]).localeCompare(String(b[sortKey])) : String(b[sortKey]).localeCompare(String(a[sortKey]))
    })
  }, [rows, search, status, priority, category, from, to, sortKey, sortDir])

  useEffect(() => { setPage(1) }, [search, status, priority, category, from, to])

  const counts = {
    all: rows.length,
    Open: rows.filter((row) => row.status === 'Open').length,
    'In Progress': rows.filter((row) => row.status === 'In Progress').length,
    'Waiting on User': rows.filter((row) => row.status === 'Waiting on User').length,
    Resolved: rows.filter((row) => row.status === 'Resolved').length,
    Closed: rows.filter((row) => row.status === 'Closed').length,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)

  const applyStatus = (id, next, detail) => {
    const extra = {}
    if (next === 'Resolved') extra.resolvedAt = new Date()
    if (next === 'Closed') extra.closedAt = new Date()
    if (detail && (next === 'Resolved' || next === 'Closed')) extra.resolution = detail
    mutateTicket(id, { status: next, ...extra }, { actor: 'Admin User', action: detail || `Status → ${next}`, status: next })
    refresh()
    showToast(`Sample ticket marked ${next}`, 'success')
  }

  const runConfirm = () => {
    if (!confirm) return
    const row = getTicket(confirm.id)
    if (!row) return
    if (confirm.kind === 'status') {
      if ((nextStatus === 'Resolved' || nextStatus === 'Closed') && !reason.trim()) {
        showToast('Add a short resolution note', 'error')
        return
      }
      applyStatus(confirm.id, nextStatus, reason.trim())
      setConfirm(null)
      setReason('')
      return
    }
    setConfirm(null)
    refresh()
  }

  const sendReply = (internal) => {
    const text = internal ? note.trim() : reply.trim()
    if (!selected || !text) {
      showToast('Write a message first', 'error')
      return
    }
    addTicketReply(selected.id, text, internal)
    setReply('')
    setNote('')
    refresh()
    showToast(internal ? 'Internal note saved on this sample' : 'Reply saved on this sample. No email was sent.', 'success')
  }

  const exportRows = filtered.map((row) => ({
    id: row.id,
    user: `${row.user.name} (${row.user.numericId})`,
    email: row.user.email,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
  }))
  const exportColumns = [
    { header: 'Ticket ID', accessor: 'id' },
    { header: 'User', accessor: 'user' },
    { header: 'Email', accessor: 'email' },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Category', accessor: 'category' },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Status', accessor: 'status' },
  ]

  const kpis = [
    { id: 'all', title: 'Total tickets', value: counts.all, icon: Ticket, tone: 'blue' },
    { id: 'Open', title: 'Open', value: counts.Open, icon: Clock, tone: 'amber' },
    { id: 'In Progress', title: 'In progress', value: counts['In Progress'], icon: Hourglass, tone: 'sky' },
    { id: 'Waiting on User', title: 'Waiting', value: counts['Waiting on User'], icon: Clock, tone: 'slate' },
    { id: 'Resolved', title: 'Resolved', value: counts.Resolved, icon: CheckCircle, tone: 'emerald' },
    { id: 'Closed', title: 'Closed', value: counts.Closed, icon: Lock, tone: 'indigo' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tickets / Support"
        description="Sample helpdesk queue. Replies and status changes stay on this page — no live user messages are sent."
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((card) => (
          <button key={card.id} type="button" className={`text-left ${status === card.id ? 'rounded-lg ring-1 ring-gray-900' : ''}`} onClick={() => setStatus(card.id)}>
            <KpiCard title={card.title} value={card.value} icon={card.icon} tone={card.tone} />
          </button>
        ))}
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <SearchBar placeholder="Search ID, user, email, or subject" value={search} onChange={setSearch} />
          <select className="input-field max-w-[140px]" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All priority</option>
            {TICKET_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field max-w-[190px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {TICKET_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="input-field max-w-[140px]" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="input-field max-w-[140px]" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <ExportButton data={exportRows} columns={exportColumns} filename="tickets" disabled={exportRows.length === 0} />
        </div>
        {pageRows.length === 0 ? (
          <EmptyState title="No tickets in this view" description="Try another status card or clear filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('id'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Ticket ID</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => { setSortKey('submittedAt'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc') }}>Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/40">
                    <td className="px-3 py-2 font-mono text-[11px]">{row.id}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.user.name} />
                        <div>
                          <p className="font-medium">{row.user.name}</p>
                          <p className="font-mono text-[11px] text-gray-500">{row.user.numericId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <p className="truncate font-medium">{row.subject}</p>
                      <p className="truncate text-[11px] text-gray-500">{row.description}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.category}</td>
                    <td className="px-3 py-2"><StatusBadge tone={priorityTone(row.priority)}>{row.priority}</StatusBadge></td>
                    <td className="px-3 py-2"><StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge></td>
                    <td className="px-3 py-2 text-xs">{formatWhen(row.submittedAt)}</td>
                    <td className="px-3 py-2">
                      <ActionMenu
                        items={[
                          { label: 'View', onClick: () => setSelectedId(row.id) },
                          { label: 'Update status', onClick: () => { setSelectedId(row.id); setNextStatus(row.status); setReason(''); setConfirm({ kind: 'status', id: row.id }) } },
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

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div>
                <p className="font-mono text-xs text-gray-500">{selected.id}</p>
                <h2 className="text-sm font-semibold">{selected.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
                <button type="button" className="rounded-md p-1 hover:bg-gray-100" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <Panel title="Ticket">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Priority"><StatusBadge tone={priorityTone(selected.priority)}>{selected.priority}</StatusBadge></Field>
                  <Field label="Category">{selected.category}</Field>
                  <Field label="Created">{formatWhen(selected.submittedAt)}</Field>
                  <Field label="Updated">{formatWhen(selected.updatedAt)}</Field>
                  {selected.resolvedAt && <Field label="Resolved">{formatWhen(selected.resolvedAt)}</Field>}
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900/40">{selected.description}</p>
                {selected.resolution && <p className="mt-2 text-xs text-emerald-700">Resolution: {selected.resolution}</p>}
              </Panel>

              <Panel title="User">
                <div className="flex items-center gap-2">
                  <Avatar name={selected.user.name} />
                  <div>
                    <p className="text-sm font-medium">{selected.user.name}</p>
                    <p className="font-mono text-[11px] text-gray-500">{selected.user.numericId} · {selected.user.role}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>{selected.user.email}</p>
                  <p>{selected.user.phone}</p>
                  <p>Account {selected.user.status}</p>
                </div>
                <Link className="mt-2 inline-block text-xs font-medium text-indigo-600" to={`/users/profile/${selected.user.id}`}>Open user profile</Link>
              </Panel>

              <Panel title="Conversation">
                <ol className="space-y-2">
                  {selected.messages.map((item, index) => (
                    <li key={index} className={`rounded-md px-3 py-2 text-xs ${item.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/20' : 'bg-gray-50 dark:bg-gray-900/40'}`}>
                      <p className="font-medium">{item.actor} · {item.role === 'admin' ? 'Admin' : 'User'}</p>
                      <p className="mt-1 whitespace-pre-wrap">{item.text}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatWhen(item.at)}</p>
                    </li>
                  ))}
                </ol>
                {selected.status !== 'Closed' && (
                  <div className="mt-3 space-y-2">
                    <textarea className="input-field min-h-[72px]" placeholder="Reply to user (sample only)" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white" onClick={() => sendReply(false)}>Send reply</button>
                  </div>
                )}
              </Panel>

              <Panel title="Internal notes">
                {selected.notes.length === 0 ? <p className="text-xs text-gray-500">No internal notes.</p> : (
                  <ul className="space-y-1 text-xs">
                    {selected.notes.map((item, index) => (
                      <li key={index}>{item.actor} · {formatWhen(item.at)} — {item.text}</li>
                    ))}
                  </ul>
                )}
                {selected.status !== 'Closed' && (
                  <div className="mt-2 space-y-2">
                    <textarea className="input-field min-h-[56px]" placeholder="Internal note (not visible to user)" value={note} onChange={(e) => setNote(e.target.value)} />
                    <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => sendReply(true)}>Add note</button>
                  </div>
                )}
              </Panel>

              <Panel title="Actions">
                <div className="flex flex-wrap gap-2">
                  {selected.status !== 'Closed' && (
                    <>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => applyStatus(selected.id, 'In Progress')}>In progress</button>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => applyStatus(selected.id, 'Waiting on User')}>Waiting on user</button>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => { setNextStatus('Resolved'); setReason(''); setConfirm({ kind: 'status', id: selected.id }) }}>Resolve</button>
                      <button type="button" className="rounded-md border px-2.5 py-1.5 text-[11px]" onClick={() => { setNextStatus('Closed'); setReason(''); setConfirm({ kind: 'status', id: selected.id }) }}>Close</button>
                    </>
                  )}
                  <Link to={`/users/profile/${selected.user.id}`} className="rounded-md border px-2.5 py-1.5 text-[11px]">View profile</Link>
                </div>
                {selected.status === 'Closed' && <p className="mt-2 text-xs text-gray-500">Closed tickets are read-only in this sample.</p>}
              </Panel>

              <Panel title="Timeline">
                <ol className="space-y-2">
                  {selected.timeline.map((item, index) => (
                    <li key={index} className="text-xs">
                      <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                      <span className="ml-2 font-medium">{item.action}</span>
                      <span className="block text-[11px] text-gray-400">{item.actor} · {formatWhen(item.at)}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
          </aside>
        </div>
      )}

      <Modal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} title="Confirm sample action" size="sm">
        {confirm?.kind === 'assign' && (
          <select className="input-field mt-2" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
            {TICKET_ADMINS.filter((item) => item !== 'Unassigned').map((item) => <option key={item}>{item}</option>)}
          </select>
        )}
        {confirm?.kind === 'status' && (
          <div className="space-y-2">
            <select className="input-field" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {TICKET_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
            {(nextStatus === 'Resolved' || nextStatus === 'Closed') && (
              <textarea className="input-field min-h-[72px]" placeholder="Resolution note required" value={reason} onChange={(e) => setReason(e.target.value)} />
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">This updates the sample queue only.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white" onClick={runConfirm}>Confirm</button>
        </div>
      </Modal>
    </div>
  )
}

export default TicketsV2
