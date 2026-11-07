import { useEffect, useMemo, useState } from 'react'
import { Calendar, Megaphone, Plus, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import {
  EVENT_AUDIENCES,
  EVENT_KINDS,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  createEvent,
  deleteEvent,
  formatWhen,
  getEvent,
  listEvents,
  priorityTone,
  statusTone,
  toInputDate,
  updateEvent,
} from '../utils/eventsData'

const emptyForm = () => ({
  title: '',
  body: '',
  kind: 'Announcement',
  status: 'Draft',
  priority: 'Medium',
  audience: 'All users',
  startAt: '',
  endAt: '',
})

const Events = () => {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [removeId, setRemoveId] = useState(null)

  const rows = useMemo(() => listEvents(), [tick])
  const refresh = () => setTick((value) => value + 1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (kind !== 'all' && row.kind !== kind) return false
      if (status !== 'all' && row.status !== status) return false
      if (!q) return true
      return `${row.id} ${row.title} ${row.body} ${row.kind} ${row.audience}`.toLowerCase().includes(q)
    })
  }, [rows, search, kind, status])

  useEffect(() => { setPage(1) }, [search, kind, status])

  const counts = {
    all: rows.length,
    Live: rows.filter((row) => row.status === 'Live').length,
    Scheduled: rows.filter((row) => row.status === 'Scheduled').length,
    Announcement: rows.filter((row) => row.kind === 'Announcement').length,
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (id) => {
    const row = getEvent(id)
    if (!row) return
    setEditingId(id)
    setForm({
      title: row.title,
      body: row.body,
      kind: row.kind,
      status: row.status,
      priority: row.priority,
      audience: row.audience,
      startAt: toInputDate(row.startAt),
      endAt: toInputDate(row.endAt),
    })
    setFormOpen(true)
  }

  const save = () => {
    if (!form.title.trim() || !form.body.trim() || !form.startAt || !form.endAt) {
      showToast('Title, body, start, and end are required', 'error')
      return
    }
    if (new Date(form.endAt) < new Date(form.startAt)) {
      showToast('End must be after start', 'error')
      return
    }
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      kind: form.kind,
      status: form.status,
      priority: form.priority,
      audience: form.audience,
      startAt: form.startAt,
      endAt: form.endAt,
    }
    if (editingId) updateEvent(editingId, payload)
    else createEvent(payload)
    setFormOpen(false)
    refresh()
    showToast('Saved in this sample calendar. Nothing was published to the app.', 'success')
  }

  const remove = () => {
    if (!removeId) return
    deleteEvent(removeId)
    setRemoveId(null)
    refresh()
    showToast('Removed from this sample calendar. The live app was not changed.', 'success')
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Events & announcements"
        description="Sample calendar only. Create, edit, and delete stay in this admin view. Nothing is pushed to user devices."
        actions={
          <button type="button" className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New sample item
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button type="button" onClick={() => { setKind('all'); setStatus('all') }}><KpiCard title="Total" value={counts.all} icon={Calendar} tone="slate" /></button>
        <button type="button" onClick={() => setStatus('Live')}><KpiCard title="Live now" value={counts.Live} icon={Sparkles} tone="emerald" /></button>
        <button type="button" onClick={() => setStatus('Scheduled')}><KpiCard title="Scheduled" value={counts.Scheduled} icon={Calendar} tone="sky" /></button>
        <button type="button" onClick={() => setKind('Announcement')}><KpiCard title="Announcements" value={counts.Announcement} icon={Megaphone} tone="violet" /></button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search title or copy" value={search} onChange={setSearch} />
        {['all', ...EVENT_KINDS].map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-xs ${kind === item ? 'bg-pink-500 text-white' : 'bg-white ring-1 ring-gray-200 dark:bg-gray-800'}`} onClick={() => setKind(item)}>
            {item === 'all' ? 'All types' : item}
          </button>
        ))}
        <select className="input-field max-w-[140px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {EVENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        </div>

      <Panel title="Calendar" action={<span className="text-[11px] text-gray-500">{filtered.length} shown</span>} padded={false}>
        {pageRows.length === 0 ? (
          <EmptyState title="Nothing in this sample filter" description="Clear filters or add a sample item." />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pageRows.map((row) => (
              <article key={row.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{row.title}</h2>
                    <StatusBadge tone="info">{row.kind}</StatusBadge>
                    <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>
                    <StatusBadge tone={priorityTone(row.priority)}>{row.priority}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{row.body}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {row.id} · {row.audience} · {formatWhen(row.startAt)} → {formatWhen(row.endAt)}
                    {row.kind !== 'Announcement' ? ` · ${row.participants} sample joins` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200 dark:ring-gray-600" onClick={() => openEdit(row.id)}>Edit</button>
                  <button type="button" className="rounded-md px-2 py-1 text-[11px] text-rose-700 ring-1 ring-rose-200" onClick={() => setRemoveId(row.id)}>Delete</button>
                </div>
              </article>
            ))}
        </div>
      )}
      </Panel>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }} />

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Edit sample item' : 'New sample item'}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">This form only updates the admin sample calendar.</p>
          <label className="block text-xs font-medium">Title
            <input className="input-field mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="block text-xs font-medium">Copy
            <textarea className="input-field mt-1 min-h-[80px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium">Type
              <select className="input-field mt-1" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {EVENT_KINDS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Status
              <select className="input-field mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {EVENT_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Priority
              <select className="input-field mt-1" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {EVENT_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Audience
              <select className="input-field mt-1" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {EVENT_AUDIENCES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium">Starts
              <input className="input-field mt-1" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            </label>
            <label className="block text-xs font-medium">Ends
              <input className="input-field mt-1" type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="button" className="rounded-md bg-violet-600 px-3 py-1.5 text-xs text-white" onClick={save}>Save sample</button>
          </div>
          </div>
      </Modal>

      <Modal isOpen={Boolean(removeId)} onClose={() => setRemoveId(null)} title="Remove sample item">
        <p className="text-sm text-gray-600 dark:text-gray-300">This only deletes the row in this admin calendar. The live app is not updated.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setRemoveId(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white" onClick={remove}>Delete sample</button>
        </div>
      </Modal>
    </div>
  )
}

export default Events
