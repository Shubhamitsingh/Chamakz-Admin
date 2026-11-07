import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, UserCheck, UserX, X } from 'lucide-react'
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
import { useDataRevision } from '../data/liveStore'
import {
  HOST_APP_CATEGORIES,
  HOST_APP_STATUSES,
  approveHostApplication,
  formatWhen,
  getHostApplication,
  listHostApplications,
  rejectHostApplication,
  statusTone,
} from '../utils/hostApplicationsData'

const Avatar = ({ name }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
    {(name || '?').charAt(0)}
  </span>
)

const HostApplications = () => {
  const { showToast, markHostApplicationsAsSeen } = useApp()
  const revision = useDataRevision()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedId, setSelectedId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => { markHostApplicationsAsSeen?.() }, [markHostApplicationsAsSeen])

  const rows = useMemo(() => listHostApplications(), [tick, revision])
  const selected = selectedId ? getHostApplication(selectedId) : null
  const refresh = () => setTick((value) => value + 1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (category !== 'all' && row.category !== category) return false
      if (!q) return true
      return `${row.id} ${row.user.name} ${row.user.numericId} ${row.user.email} ${row.reason} ${row.category}`.toLowerCase().includes(q)
    })
  }, [rows, search, status, category])

  useEffect(() => { setPage(1) }, [search, status, category])

  const counts = {
    all: rows.length,
    Pending: rows.filter((row) => row.status === 'Pending').length,
    Approved: rows.filter((row) => row.status === 'Approved').length,
    Rejected: rows.filter((row) => row.status === 'Rejected').length,
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)

  const approve = () => {
    if (!confirm) return
    approveHostApplication(confirm.id, note.trim())
    setConfirm(null)
    setNote('')
    refresh()
    setSelectedId(confirm.id)
    showToast('Sample application marked approved. Host access was not granted on a live account.', 'success')
  }

  const reject = () => {
    if (!confirm) return
    if (!note.trim()) {
      showToast('Add a reject reason for this sample record', 'error')
      return
    }
    rejectHostApplication(confirm.id, note.trim())
    setConfirm(null)
    setNote('')
    refresh()
    setSelectedId(confirm.id)
    showToast('Sample application marked rejected. No email was sent.', 'success')
  }

  const exportRows = filtered.map((row) => ({
    id: row.id,
    user: `${row.user.name} (${row.user.numericId})`,
    email: row.user.email,
    category: row.category,
    status: row.status,
    applied: formatWhen(row.appliedAt),
    reason: row.reason,
  }))

  return (
    <div className="space-y-3">
      <PageHeader
        title="Host applications"
        description="Sample review queue. Approve and reject only update this admin view. Nothing is emailed and live host access is not changed."
        actions={<ExportButton data={exportRows} columns={[{ header: 'ID', accessor: 'id' }, { header: 'User', accessor: 'user' }, { header: 'Email', accessor: 'email' }, { header: 'Category', accessor: 'category' }, { header: 'Status', accessor: 'status' }, { header: 'Applied', accessor: 'applied' }, { header: 'Reason', accessor: 'reason' }]} filename="host-applications" disabled={exportRows.length === 0} />}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button type="button" onClick={() => setStatus('all')}><KpiCard title="Total" value={counts.all} icon={UserCheck} tone="slate" /></button>
        <button type="button" onClick={() => setStatus('Pending')}><KpiCard title="Pending" value={counts.Pending} icon={Clock} tone="amber" /></button>
        <button type="button" onClick={() => setStatus('Approved')}><KpiCard title="Approved" value={counts.Approved} icon={CheckCircle} tone="emerald" /></button>
        <button type="button" onClick={() => setStatus('Rejected')}><KpiCard title="Rejected" value={counts.Rejected} icon={UserX} tone="rose" /></button>
            </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search name, ID, email, or reason" value={search} onChange={setSearch} />
        {['all', ...HOST_APP_STATUSES].map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-xs ${status === item ? 'bg-pink-500 text-white' : 'bg-white ring-1 ring-gray-200 dark:bg-gray-800'}`} onClick={() => setStatus(item)}>
            {item === 'all' ? 'All' : item}
          </button>
        ))}
        <select className="input-field max-w-[160px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {HOST_APP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <Panel title="Applications" action={<span className="text-[11px] text-gray-500">{filtered.length} shown</span>} padded={false}>
        {pageRows.length === 0 ? (
          <EmptyState title="No applications match" description="Clear search or filters to see the sample queue." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2 font-medium">Applicant</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Applied</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.user.name} />
          <div>
                          <p className="font-medium">{row.user.name}</p>
                          <p className="font-mono text-[11px] text-gray-400">{row.user.numericId} · {row.user.city}</p>
          </div>
        </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{row.category}</td>
                    <td className="px-4 py-2.5"><StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge></td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{formatWhen(row.appliedAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200 dark:ring-gray-600" onClick={() => setSelectedId(row.id)}>Open</button>
                        {row.status === 'Pending' && (
                          <>
                            <button type="button" className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] text-white" onClick={() => { setConfirm({ id: row.id, action: 'approve' }); setNote('') }}>Approve</button>
                            <button type="button" className="rounded-md bg-rose-600 px-2 py-1 text-[11px] text-white" onClick={() => { setConfirm({ id: row.id, action: 'reject' }); setNote('') }}>Reject</button>
                          </>
                        )}
            </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
      </Panel>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }} />

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div>
                <p className="font-mono text-[11px] text-gray-400">{selected.id}</p>
                <h2 className="text-base font-semibold">{selected.user.name}</h2>
                <p className="text-xs text-gray-500">{selected.category} · {formatWhen(selected.appliedAt)}</p>
              </div>
              <button type="button" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={selected.user.name} />
                <div>
                  <p className="font-medium">{selected.user.name}</p>
                  <p className="font-mono text-[11px] text-gray-500">{selected.user.numericId}</p>
                  <p className="text-xs">{selected.user.email} · {selected.user.phone}</p>
                  <p className="text-xs text-gray-500">{selected.user.city}</p>
                </div>
              </div>
              <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
              <p className="text-sm"><span className="text-xs text-gray-500">Why they applied</span><br />{selected.reason}</p>
              <p className="text-sm"><span className="text-xs text-gray-500">Experience</span><br />{selected.experience}</p>
              <p className="text-sm"><span className="text-xs text-gray-500">Bio</span><br />{selected.bio}</p>
              <div>
                <p className="mb-1 text-xs text-gray-500">Sample documents (not live files)</p>
                <ul className="space-y-1 text-xs">
                  {selected.documents.map((doc) => (
                    <li key={doc.label} className="flex justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900">
                      <span>{doc.label}</span>
                      <span className="text-gray-500">{doc.name} · {doc.state}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {selected.reviewedAt && (
                <p className="text-xs text-gray-500">Reviewed {formatWhen(selected.reviewedAt)} by {selected.reviewedBy}</p>
              )}
              {selected.reviewNote && <p className="text-sm">{selected.reviewNote}</p>}
              {selected.rejectReason && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">{selected.rejectReason}</p>}
              <Link className="inline-block text-xs font-medium text-emerald-700" to={`/users/profile/${selected.user.id}`}>Open user profile</Link>
              {selected.status === 'Pending' && (
                <div className="flex gap-2">
                  <button type="button" className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white" onClick={() => { setConfirm({ id: selected.id, action: 'approve' }); setNote('') }}>Approve</button>
                  <button type="button" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white" onClick={() => { setConfirm({ id: selected.id, action: 'reject' }); setNote('') }}>Reject</button>
          </div>
        )}
            </div>
          </aside>
        </div>
      )}

      <Modal
        isOpen={Boolean(confirm)}
        onClose={() => { setConfirm(null); setNote('') }}
        title={confirm?.action === 'approve' ? 'Approve sample application' : 'Reject sample application'}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {confirm?.action === 'approve'
            ? 'This only marks the sample record as approved. It does not grant live host access or send a message to the user.'
            : 'This only marks the sample record as rejected. No email or in-app notice is sent.'}
        </p>
        <textarea
          className="input-field mt-3 min-h-[72px]"
          placeholder={confirm?.action === 'approve' ? 'Optional internal note' : 'Reject reason (required)'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => { setConfirm(null); setNote('') }}>Cancel</button>
          {confirm?.action === 'approve' ? (
            <button type="button" className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white" onClick={approve}>Approve sample</button>
          ) : (
            <button type="button" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white" onClick={reject}>Reject sample</button>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default HostApplications
