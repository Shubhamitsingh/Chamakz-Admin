import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Ban,
  CheckCircle,
  MessageSquare,
  RotateCcw,
  Shield,
  VideoOff,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import {
  addUserNote,
  applyUserPatch,
  build360,
  formatDay,
  formatWhen,
  statusTone,
  verifyTone,
} from '../utils/userManagementData'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'wallet', label: 'Wallet & coins' },
  { id: 'live', label: 'Live streaming' },
  { id: 'dating', label: 'Dating & social' },
  { id: 'gifts', label: 'Gifts & transactions' },
  { id: 'logins', label: 'Login & devices' },
  { id: 'kyc', label: 'Verification & KYC' },
  { id: 'reports', label: 'Reports' },
  { id: 'admin', label: 'Admin actions' },
]

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-sm font-medium">{value || 'Not provided'}</p>
  </div>
)

const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useApp()
  const [tab, setTab] = useState('overview')
  const [tick, setTick] = useState(0)
  const [note, setNote] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [confirm, setConfirm] = useState(null)

  const data = useMemo(() => build360(userId), [userId, tick])

  if (!data) {
    return (
      <EmptyState
        title="User not found"
        description="This ID is not in the sample directory."
        actionLabel="Back to users"
        onAction={() => navigate('/users')}
      />
    )
  }

  const { user, onboarding, wallet, live, dating, gifts, logins, kyc, reports } = data

  const refresh = (message) => {
    setTick((value) => value + 1)
    if (message) showToast(message, 'success')
  }

  const act = (kind) => {
    if (kind === 'verify') applyUserPatch(user.id, { verification: 'Verified', auditAction: 'Verified user' })
    if (kind === 'suspend') applyUserPatch(user.id, { status: 'Suspended', auditAction: 'Suspended account' })
    if (kind === 'ban') applyUserPatch(user.id, { status: 'Blocked', auditAction: 'Banned account' })
    if (kind === 'restore') applyUserPatch(user.id, { status: 'Active', auditAction: 'Restored account' })
    if (kind === 'live') applyUserPatch(user.id, { restrictions: { ...user.restrictions, live: true }, auditAction: 'Restricted live streaming' })
    if (kind === 'chat') applyUserPatch(user.id, { restrictions: { ...user.restrictions, chat: true }, auditAction: 'Restricted chat' })
    setConfirm(null)
    refresh('Sample admin action saved locally')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={user.name}
        description={`User 360 · sample profile · ${user.numericId}`}
        actions={
          <Link to="/users" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700">
            Back to directory
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-xl font-semibold text-white">
              {user.name.charAt(0)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{user.name}</h2>
                <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                <StatusBadge tone={verifyTone(user.verification)}>{user.verification}</StatusBadge>
                {user.vip ? <StatusBadge tone="warning">VIP</StatusBadge> : null}
                {user.online ? <StatusBadge tone="success">Online</StatusBadge> : null}
              </div>
              <p className="text-xs text-gray-500">
                {user.numericId} · @{user.username} · {user.email}
              </p>
              <p className="text-[11px] text-gray-400">Registered {formatDay(user.registeredAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => { setEditName(user.name); setEditOpen(true) }}>Edit profile</button>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('verify')}><CheckCircle className="h-3.5 w-3.5" /> Verify</button>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('suspend')}><Ban className="h-3.5 w-3.5" /> Suspend</button>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700" onClick={() => setConfirm('ban')}>Ban</button>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('restore')}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard title="Coin balance" value={wallet.balance.toLocaleString()} tone="amber" />
        <KpiCard title="Total spending" value={wallet.spent.toLocaleString()} tone="rose" />
        <KpiCard title="Live hours" value={live.hours} tone="violet" />
        <KpiCard title="Total matches" value={dating.matches} tone="sky" />
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
              tab === item.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Panel title="Overview">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            <Field label="Full name" value={user.name} />
            <Field label="User ID" value={user.numericId} />
            <Field label="Username" value={`@${user.username}`} />
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <Field label="Date of birth / age" value={user.dob ? `${formatDay(user.dob)} · ${user.age}` : 'Not provided'} />
            <Field label="Gender" value={user.gender} />
            <Field label="Country / state / city" value={`${user.country} · ${user.state} · ${user.city}`} />
            <Field label="Registration date" value={formatWhen(user.registeredAt)} />
            <Field label="Last login" value={formatWhen(user.lastLogin)} />
            <Field label="Last active" value={formatWhen(user.lastActive)} />
            <Field label="Account status" value={user.status} />
            <Field label="User type" value={user.userType} />
            <Field label="Profile completion" value={`${user.profileComplete}%`} />
          </div>
        </Panel>
      )}

      {tab === 'onboarding' && (
        <Panel title="Onboarding journey" action={<span className="text-[11px] text-gray-400">{onboarding.percent}% complete · {onboarding.source}</span>}>
          <ol className="space-y-2">
            {onboarding.steps.map((item) => (
              <li key={item.label} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
                <span className="text-sm">{item.label}</span>
                <StatusBadge tone={item.status === 'completed' ? 'success' : item.status === 'skipped' ? 'neutral' : 'warning'}>
                  {item.status}
                </StatusBadge>
              </li>
            ))}
          </ol>
          {onboarding.incomplete.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">Incomplete: {onboarding.incomplete.map((item) => item.label).join(', ')}</p>
          )}
        </Panel>
      )}

      {tab === 'wallet' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            <KpiCard title="Balance" value={wallet.balance.toLocaleString()} tone="amber" />
            <KpiCard title="Purchased" value={wallet.purchased.toLocaleString()} tone="blue" />
            <KpiCard title="Promo" value={wallet.promo.toLocaleString()} tone="violet" />
            <KpiCard title="Received" value={wallet.received.toLocaleString()} tone="emerald" />
            <KpiCard title="Spent" value={wallet.spent.toLocaleString()} tone="rose" />
            <KpiCard title="Gifts sent" value={wallet.giftsSent.toLocaleString()} tone="orange" />
            <KpiCard title="Gifts received" value={wallet.giftsReceived.toLocaleString()} tone="teal" />
          </div>
          <Panel title="Wallet ledger" padded={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] uppercase text-gray-500">
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Coins</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Party</th>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {wallet.table.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2 tabular-nums">{row.coins}</td>
                    <td className="px-3 py-2"><StatusBadge tone={row.status === 'Success' ? 'success' : 'warning'}>{row.status}</StatusBadge></td>
                    <td className="px-3 py-2 text-xs">{row.party}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.ref}</td>
                    <td className="px-3 py-2 text-xs">{formatWhen(row.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {tab === 'live' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KpiCard title="Live sessions" value={live.sessions} tone="indigo" />
            <KpiCard title="Streaming hours" value={live.hours} tone="violet" />
            <KpiCard title="Total viewers" value={live.viewers.toLocaleString()} tone="sky" />
            <KpiCard title="Host earnings" value={live.earnings.toLocaleString()} hint={live.liveNow ? 'Currently live' : 'Not live'} tone="emerald" />
          </div>
          <Panel title="Session history">
            {live.history.length === 0 ? (
              <p className="text-sm text-gray-500">No host sessions in this sample. Gift send counts still appear for viewers.</p>
            ) : (
              <ul className="space-y-2">
                {live.history.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm dark:border-gray-700">
                    <span>{item.title}</span>
                    <span className="text-xs text-gray-500">{item.viewers} viewers · {item.gifts} gifts · {item.hours}h · {item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'dating' && (
        <Panel title="Dating & social">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="Likes sent" value={dating.likesSent} />
            <Field label="Likes received" value={dating.likesReceived} />
            <Field label="Matches" value={dating.matches} />
            <Field label="Conversations started" value={dating.conversations} />
            <Field label="Messages sent" value={dating.messages} />
            <Field label="Profile views" value={dating.views} />
            <Field label="Favorites" value={dating.favorites} />
            <Field label="Blocked users" value={dating.blockedUsers} />
            <Field label="Looking for" value={dating.preferences.lookingFor} />
            <Field label="Age range" value={dating.preferences.ageRange} />
            <Field label="Distance" value={dating.preferences.distance} />
            <Field label="Dating profile" value={`${dating.completion}%`} />
          </div>
          <p className="mt-3 text-[11px] text-gray-400">Message bodies and match chats are hidden. Counts only.</p>
        </Panel>
      )}

      {tab === 'gifts' && (
        <Panel title="Gifts & transactions" padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase text-gray-500">
                <th className="px-3 py-2">Gift</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Txn</th>
                <th className="px-3 py-2">Coins</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.value}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.from}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.to}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.tx}</td>
                  <td className="px-3 py-2">{row.coins}</td>
                  <td className="px-3 py-2"><StatusBadge tone="success">{row.status}</StatusBadge></td>
                  <td className="px-3 py-2 text-xs">{formatWhen(row.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === 'logins' && (
        <Panel title="Login & device history" padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase text-gray-500">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">OS / app</th>
                <th className="px-3 py-2">Approx. location</th>
                <th className="px-3 py-2">Alert</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-xs">{formatWhen(row.at)}</td>
                  <td className="px-3 py-2">{row.method}</td>
                  <td className="px-3 py-2">{row.device}</td>
                  <td className="px-3 py-2 text-xs">{row.os} · {row.app}</td>
                  <td className="px-3 py-2 text-xs">{row.location}</td>
                  <td className="px-3 py-2">{row.alert ? <StatusBadge tone="danger">Flagged</StatusBadge> : <StatusBadge>None</StatusBadge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === 'kyc' && (
        <Panel title="Verification & KYC">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Verification status" value={kyc.status} />
            <Field label="Document type" value={kyc.documentType} />
            <Field label="Submitted" value={formatDay(kyc.submittedAt)} />
            <Field label="Review status" value={kyc.review} />
            <Field label="Rejection reason" value={kyc.reason} />
            <Field label="Verified date" value={formatDay(kyc.verifiedAt)} />
            <Field label="Reviewing admin" value={kyc.reviewer} />
          </div>
          <p className="mt-3 text-[11px] text-gray-400">Document images and ID numbers are not shown in this admin view.</p>
        </Panel>
      )}

      {tab === 'reports' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Moderation summary">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reports received" value={reports.received} />
              <Field label="Reports submitted" value={reports.submitted} />
              <Field label="Warnings" value={reports.warnings} />
              <Field label="Suspensions" value={reports.suspensions} />
              <Field label="Appeal" value={reports.appeal} />
              <Field label="Categories" value={reports.categories.join(', ') || 'None'} />
            </div>
          </Panel>
          <Panel title="History">
            {reports.history.length === 0 ? (
              <p className="text-sm text-gray-500">No open reports on this sample account.</p>
            ) : (
              <ul className="space-y-2">
                {reports.history.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>{item.type} · {item.category}</span>
                    <StatusBadge tone="warning">{item.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {tab === 'admin' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Controls">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => { setEditName(user.name); setEditOpen(true) }}>Edit profile</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('verify')}><CheckCircle className="h-3.5 w-3.5" /> Verify</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('suspend')}><Ban className="h-3.5 w-3.5" /> Suspend</button>
              <button type="button" className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700" onClick={() => setConfirm('ban')}>Ban</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('restore')}><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('live')}><VideoOff className="h-3.5 w-3.5" /> Restrict live</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm('chat')}><MessageSquare className="h-3.5 w-3.5" /> Restrict chat</button>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">Actions update this session’s sample directory only.</p>
            <div className="mt-4">
              <textarea className="input-field min-h-[80px]" placeholder="Internal admin note" value={note} onChange={(e) => setNote(e.target.value)} />
              <button
                type="button"
                className="mt-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-gray-900"
                onClick={() => {
                  if (!note.trim()) return
                  addUserNote(user.id, note.trim())
                  setNote('')
                  refresh('Note added')
                }}
              >
                Add note
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {user.notes.map((item) => (
                <li key={item.id} className="rounded-md bg-gray-50 px-3 py-2 text-xs dark:bg-gray-900/40">
                  <p>{item.text}</p>
                  <p className="text-[11px] text-gray-400">{item.actor} · {formatWhen(item.at)}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Audit history">
            {user.audit.length === 0 ? (
              <p className="text-sm text-gray-500">No admin actions yet in this session.</p>
            ) : (
              <ul className="space-y-2">
                {user.audit.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <Shield className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
                    <span>
                      <span className="font-medium">{item.action}</span>
                      <span className="block text-[11px] text-gray-400">{item.actor} · {formatWhen(item.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit profile" size="sm">
        <label className="text-xs text-gray-500">Display name</label>
        <input className="input-field mt-1" value={editName} onChange={(e) => setEditName(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setEditOpen(false)}>Cancel</button>
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-gray-900"
            onClick={() => {
              applyUserPatch(user.id, { name: editName, auditAction: 'Edited profile' })
              setEditOpen(false)
              refresh('Name updated on sample profile')
            }}
          >
            Save
          </button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} title="Confirm admin action" size="sm">
        <p className="text-sm text-gray-600">This updates the sample directory only. Continue?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white" onClick={() => act(confirm)}>Confirm</button>
        </div>
      </Modal>
    </div>
  )
}

export default UserProfile
