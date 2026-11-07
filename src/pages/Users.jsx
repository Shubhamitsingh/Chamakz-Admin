import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Ban, Eye, Pencil, Shield } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import { useDataRevision } from '../data/liveStore'
import {
  applyUserPatch,
  filterUsers,
  formatDay,
  formatWhen,
  segmentCounts,
  statusTone,
  uniqueValues,
  USER_SEGMENTS,
  verifyTone,
} from '../utils/userManagementData'

const SORT_KEYS = {
  name: (row) => row.name,
  coins: (row) => row.coins,
  registeredAt: (row) => new Date(row.registeredAt).getTime(),
  lastActive: (row) => new Date(row.lastActive).getTime(),
}

const Users = () => {
  const { segment: segmentParam } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast, markUsersAsSeen } = useApp()
  const revision = useDataRevision()
  const segment = USER_SEGMENTS.some((item) => item.id === segmentParam) ? segmentParam : 'all'
  const current = USER_SEGMENTS.find((item) => item.id === segment)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [country, setCountry] = useState('all')
  const [state, setState] = useState('all')
  const [city, setCity] = useState('all')
  const [userType, setUserType] = useState('all')
  const [status, setStatus] = useState('all')
  const [verification, setVerification] = useState('all')
  const [coinMin, setCoinMin] = useState('')
  const [coinMax, setCoinMax] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState('registeredAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [tick, setTick] = useState(0)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    markUsersAsSeen?.()
  }, [markUsersAsSeen])

  const counts = useMemo(() => segmentCounts(), [tick, revision])
  const rows = useMemo(() => {
    const list = filterUsers({
      segment,
      search,
      country,
      state,
      city,
      userType,
      status,
      verification,
      coinMin,
      coinMax,
      from,
      to,
    })
    const getter = SORT_KEYS[sortKey] || SORT_KEYS.registeredAt
    return [...list].sort((a, b) => {
      const av = getter(a)
      const bv = getter(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [segment, search, country, state, city, userType, status, verification, coinMin, coinMax, from, to, sortKey, sortDir, tick, revision])

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const pageRows = rows.slice((page - 1) * perPage, page * perPage)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const openProfile = (user) => navigate(`/users/profile/${user.id}`)

  const runAction = () => {
    if (!confirm) return
    if (confirm.kind === 'suspend') {
      applyUserPatch(confirm.user.id, { status: 'Suspended', auditAction: 'Suspended account', auditDetail: confirm.user.name })
      showToast(`${confirm.user.name} suspended (sample action)`, 'success')
    } else if (confirm.kind === 'restore') {
      applyUserPatch(confirm.user.id, { status: 'Active', auditAction: 'Restored account', auditDetail: confirm.user.name })
      showToast(`${confirm.user.name} restored (sample action)`, 'success')
    }
    setConfirm(null)
    setTick((value) => value + 1)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={current?.label || 'All Users'}
        description="Sample user directory for admin review. Mock data only — not live accounts."
        actions={
          <Link to="/users/analytics" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            User analytics
          </Link>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {USER_SEGMENTS.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-[11px] font-medium ${
              segment === item.id
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {item.label}
            <span className="ml-1 tabular-nums opacity-70">{counts[item.id]}</span>
          </Link>
        ))}
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <SearchBar placeholder="Search ID, name, username, or email" value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
          <select className="input-field max-w-[140px]" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1) }}>
            <option value="all">All countries</option>
            {uniqueValues('country').map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field max-w-[140px]" value={state} onChange={(e) => { setState(e.target.value); setPage(1) }}>
            <option value="all">All states</option>
            {uniqueValues('state').map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field max-w-[140px]" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }}>
            <option value="all">All cities</option>
            {uniqueValues('city').map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="input-field max-w-[130px]" value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1) }}>
            <option value="all">All types</option>
            <option>Viewer</option>
            <option>Host</option>
            <option>Agency</option>
          </select>
          <select className="input-field max-w-[130px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Suspended</option>
            <option>Blocked</option>
          </select>
          <select className="input-field max-w-[140px]" value={verification} onChange={(e) => { setVerification(e.target.value); setPage(1) }}>
            <option value="all">All verification</option>
            <option>Verified</option>
            <option>Pending</option>
            <option>Rejected</option>
            <option>None</option>
          </select>
          <input className="input-field max-w-[110px]" type="number" placeholder="Min coins" value={coinMin} onChange={(e) => { setCoinMin(e.target.value); setPage(1) }} />
          <input className="input-field max-w-[110px]" type="number" placeholder="Max coins" value={coinMax} onChange={(e) => { setCoinMax(e.target.value); setPage(1) }} />
          <input className="input-field max-w-[140px]" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          <input className="input-field max-w-[140px]" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>

        {pageRows.length === 0 ? (
          <EmptyState title="No users in this view" description="Try another segment or clear filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('coins')}>Coins</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Verification</th>
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('registeredAt')}>Registered</th>
                  <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort('lastActive')}>Last active</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/40">
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => openProfile(user)} className="flex items-center gap-2 text-left">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-xs font-semibold text-white">
                          {user.name.charAt(0)}
                        </span>
                        <span>
                          <span className="block font-medium">{user.name}</span>
                          <span className="block text-[11px] text-gray-500">@{user.username}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{user.numericId}</td>
                    <td className="px-3 py-2">
                      <p className="text-xs">{user.email}</p>
                      <p className="text-[11px] text-gray-500">{user.phone || 'Phone not provided'}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">{user.city}, {user.state}</td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={user.userType === 'Host' ? 'info' : user.userType === 'Agency' ? 'warning' : 'neutral'}>
                        {user.userType}{user.vip ? ' · VIP' : ''}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{user.coins.toLocaleString()}</td>
                    <td className="px-3 py-2"><StatusBadge tone={statusTone(user.status)}>{user.status}{user.online ? ' · Online' : ''}</StatusBadge></td>
                    <td className="px-3 py-2"><StatusBadge tone={verifyTone(user.verification)}>{user.verification}</StatusBadge></td>
                    <td className="px-3 py-2 text-xs">{formatDay(user.registeredAt)}</td>
                    <td className="px-3 py-2 text-xs">{formatWhen(user.lastActive)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button type="button" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => openProfile(user)} title="View profile">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => openProfile(user)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.status === 'Active' ? (
                          <button type="button" className="rounded-md p-1 text-amber-700 hover:bg-amber-50" onClick={() => setConfirm({ kind: 'suspend', user })} title="Suspend">
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button type="button" className="rounded-md p-1 text-emerald-700 hover:bg-emerald-50" onClick={() => setConfirm({ kind: 'restore', user })} title="Restore">
                            <Shield className="h-4 w-4" />
                          </button>
                        )}
          </div>
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
            totalItems={rows.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }}
          />
                </div>
      </Panel>

      <Modal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} title={confirm?.kind === 'restore' ? 'Restore account' : 'Suspend account'} size="sm">
        <p className="text-sm text-gray-600">
          {confirm?.kind === 'restore'
            ? `Restore ${confirm?.user.name} on this sample directory?`
            : `Suspend ${confirm?.user.name} on this sample directory? This does not write to a live backend.`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-gray-900" onClick={runAction}>Confirm</button>
          </div>
        </Modal>
    </div>
  )
}

export default Users
