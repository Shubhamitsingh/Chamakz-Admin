import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import Panel from '../../components/Panel'
import { useApp } from '../../context/AppContext'
import { CATEGORIES, ROLES, categoryById } from '../../control/schema'
import { FEATURE_FLAGS, canEdit, countSettings, enabledFeatureCount, previewCall } from '../../control/logic'
import { useControl } from '../../control/ControlContext'
import { exportToCSV } from '../../utils/exportUtils'

const Demo = () => <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Demo config</span>

const RoleBar = () => {
  const { role, setRole } = useControl()
  return (
    <label className="flex items-center gap-2 text-xs text-gray-500">
      Acting as
      <select value={role} onChange={(event) => setRole(event.target.value)} className="input-field w-auto">
        {ROLES.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  )
}

export const ControlHome = () => {
  const { published, version, history } = useControl()
  const [query, setQuery] = useState('')
  const latest = history[0]
  const cards = [
    ['Active settings', countSettings(published)],
    ['Video rate', `${published.calls.videoRate} / min`],
    ['Diamonds per ₹1', published.diamonds.diamondsPerInr],
    ['Minimum withdrawal', `₹${published.withdrawals.minWithdrawal}`],
    ['Payment gateway', published.payments.enabled ? published.payments.provider : 'Off'],
    ['Features on', `${enabledFeatureCount(published.features)} / ${FEATURE_FLAGS.length}`],
    ['Maintenance', published.app.maintenance ? 'On' : 'Off'],
    ['Config version', `v${version}`],
    ['Last update', latest ? `${latest.adminName} · ${latest.role}` : '—'],
  ]
  const visible = CATEGORIES.filter((category) => `${category.title} ${category.group}`.toLowerCase().includes(query.trim().toLowerCase()))
  return (
    <div className="space-y-4">
      <PageHeader title="Super Admin Control Center" description="One mock configuration for rates, wallets, payments, and app rules. It is not sent to the phone app." actions={<div className="flex flex-wrap items-center gap-2"><Demo /><RoleBar /></div>} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="surface-raised rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings" className="input-field max-w-sm" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((category) => (
          <Link key={category.id} to={category.path} className="surface-raised rounded-lg border border-gray-200 bg-white p-4 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">{category.group}</p>
            <p className="mt-1 text-sm font-semibold">{category.title}</p>
            <p className="mt-1 text-xs text-gray-500">{category.summary}</p>
          </Link>
        ))}
        <Link to="/control/roles" className="surface-raised rounded-lg border border-gray-200 bg-white p-4 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">admin_permissions</p>
          <p className="mt-1 text-sm font-semibold">Roles & permissions</p>
          <p className="mt-1 text-xs text-gray-500">Who can view or publish each configuration group.</p>
        </Link>
        <Link to="/control/history" className="surface-raised rounded-lg border border-gray-200 bg-white p-4 hover:border-pink-300 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">audit</p>
          <p className="mt-1 text-sm font-semibold">Configuration history</p>
          <p className="mt-1 text-xs text-gray-500">Compare a change and restore an earlier published version.</p>
        </Link>
      </div>
    </div>
  )
}

const Field = ({ field, value, onChange, disabled }) => {
  if (field.type === 'toggle') {
    return (
      <button type="button" disabled={disabled} onClick={() => onChange(!value)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800">
        <span className="text-sm">{field.label}</span>
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${value ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{value ? 'On' : 'Off'}</span>
      </button>
    )
  }
  if (field.type === 'select') {
    return (
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
        <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="input-field">
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    )
  }
  if (field.type === 'textarea') {
    return (
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
        <textarea disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="input-field min-h-20" />
      </label>
    )
  }
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
      <input
        disabled={disabled}
        type={field.type === 'secret' ? 'password' : field.type === 'number' ? 'number' : field.input || 'text'}
        value={value ?? ''}
        step={field.step || (field.type === 'number' ? '1' : undefined)}
        placeholder={field.type === 'secret' ? 'Type to rotate. The saved value stays hidden.' : ''}
        onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
        className="input-field"
      />
      {field.hint ? <span className="mt-1 block text-[11px] text-gray-400">{field.hint}</span> : null}
    </label>
  )
}

const CallPreview = ({ calls, share }) => {
  const [minutes, setMinutes] = useState(5)
  const [balance, setBalance] = useState(10000)
  const [outcome, setOutcome] = useState('completed')
  const [pinned, setPinned] = useState(null)
  const [charged, setCharged] = useState([])
  const [message, setMessage] = useState('')
  const future = previewCall({ kind: 'video', minutes, outcome, balance, calls, share })
  const active = pinned ? previewCall({ kind: 'video', minutes: pinned.minutes, outcome: 'completed', balance, calls: { ...calls, videoRate: pinned.rate, videoEnabled: true }, share }) : null
  const start = () => {
    const rate = calls.videoRate
    setPinned({ txId: `CALL-${Date.now()}`, kind: 'video', minutes: Number(minutes), rate })
    setMessage('This sample call keeps the rate from the moment it started.')
  }
  const charge = () => {
    if (!pinned || !active?.ok) {
      setMessage(active?.reason || 'Start a sample call first.')
      return
    }
    if (charged.includes(pinned.txId)) {
      setMessage('Duplicate billing blocked for this transaction id.')
      return
    }
    setCharged((prev) => [...prev, pinned.txId])
    setMessage(`${pinned.txId} charged ${active.charge} diamonds from the user wallet. Host earning record: ${active.host}. Platform allocation: ${active.platform}.`)
  }
  return (
    <Panel title="Billing preview">
      <div className="grid gap-2 sm:grid-cols-4">
        <input type="number" value={minutes} onChange={(event) => setMinutes(event.target.value)} className="input-field" />
        <input type="number" value={balance} onChange={(event) => setBalance(event.target.value)} className="input-field" />
        <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="input-field">
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>
      <p className="mt-3 text-sm">{future.ok ? `Future video call: ${future.minutesBilled || 0} billed min × ${future.rate} = ${future.charge} diamonds. Host ${future.host}. Platform ${future.platform}.` : future.reason}</p>
      <p className="text-xs text-gray-500">{future.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={start}>Start sample call at current draft rate</button>
        <button type="button" className="btn-primary" onClick={charge} disabled={!pinned}>Charge once</button>
      </div>
      {pinned ? <p className="mt-2 text-xs text-gray-600">Active snapshot {pinned.txId} uses {pinned.rate} diamonds/min. Changing the draft rate does not change it.</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-800">{message}</p> : null}
    </Panel>
  )
}

export const ConfigPage = () => {
  const { categoryId } = useParams()
  const category = categoryById(categoryId)
  const { read, setField, drafts, publish, discard, role, published } = useControl()
  const { showToast } = useApp()
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState([])
  const [confirming, setConfirming] = useState(false)
  const allowed = canEdit(role, categoryId)
  if (!category) return <p className="text-sm">This configuration group does not exist.</p>
  const values = read(category.id)
  const sections = [...new Set(category.fields.map((field) => field.section))]
  const apply = () => {
    const result = publish(category.id, reason)
    if (!result.ok) {
      setErrors(result.errors)
      setConfirming(false)
      return
    }
    setErrors([])
    setReason('')
    setConfirming(false)
    showToast('Configuration published in this demo session', 'success')
  }
  const purchase = Number(values.diamondsPerInr || 0) * 1000
  const giftDiamonds = 4000
  const giftGross = giftDiamonds * Number(published.diamonds.giftValuation)
  const hostPart = giftGross * Number(published.withdrawals.hostShare) / 100
  return (
    <div className="space-y-4">
      <PageHeader title={category.title} description={category.summary} actions={<div className="flex flex-wrap items-center gap-2"><Demo /><RoleBar /></div>} />
      {!allowed && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{role} can view this group. Publishing is limited to a role with edit access.</p>}
      {category.id === 'payments' && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">Secrets typed here are discarded after publish and never shown again. This form cannot authorize a real payment.</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <Panel key={section} title={section}>
            <div className="space-y-3">
              {category.fields.filter((field) => field.section === section).map((field) => (
                <div key={field.key}>
                  <Field field={field} value={values[field.key]} disabled={!allowed} onChange={(value) => { setField(category.id, field.key, value); setErrors([]) }} />
                  {field.type === 'secret' && values[`${field.key}Set`] ? <p className="mt-1 text-[11px] text-gray-500">A secret was saved in this session and is hidden.</p> : null}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      {category.id === 'notifications' && (
        <Panel title="Template preview">
          <ul className="space-y-2 text-sm">
            <li>Payment: {values.paymentTemplate}</li>
            <li>Gift: {values.giftTemplate}</li>
            <li>Withdrawal: {values.withdrawalTemplate}</li>
            <li>Call: {values.callTemplate}</li>
          </ul>
        </Panel>
      )}
      {category.id === 'diamonds' && (
        <Panel title="Live calculation">
          <p className="text-sm">₹1,000 × {values.diamondsPerInr} diamonds per INR = {purchase.toLocaleString('en-IN')} diamonds issued.</p>
          <p className="mt-1 text-sm">{giftDiamonds.toLocaleString('en-IN')} gifted diamonds move from the user wallet to the host earning wallet. They are not issued again. Gross value ₹{giftGross.toLocaleString('en-IN')}. Host share ₹{hostPart.toLocaleString('en-IN')}.</p>
        </Panel>
      )}
      {category.id === 'calls' && <CallPreview calls={values} share={published.withdrawals} />}
      {errors.length > 0 && <ul className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" disabled={!drafts[category.id]} onClick={() => { discard(category.id); showToast('Draft discarded', 'success') }}>Cancel changes</button>
        <button type="button" className="btn-secondary" disabled={!allowed || !drafts[category.id]} onClick={() => showToast('Draft kept in this browser session', 'success')}>Save draft</button>
        <button type="button" className="btn-primary" disabled={!allowed} onClick={() => setConfirming(true)}>Review and publish</button>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <p className="text-sm font-medium">Publish {category.title}?</p>
            <p className="mt-1 text-xs text-gray-500">Calls already started keep their saved rate. This publish does not rewrite old transactions.</p>
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for the change" className="input-field mt-3" />
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary" onClick={apply}>Publish</button>
              <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const HistoryPage = () => {
  const { history, rollback, role } = useControl()
  const { showToast } = useApp()
  const [selected, setSelected] = useState(history[0]?.id || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const entry = history.find((row) => row.id === selected) || history[0]
  const rows = useMemo(() => history.map((row) => ({ id: row.id, version: row.version, category: row.category, admin: row.adminId, role: row.role, status: row.status, at: new Date(row.at).toLocaleString('en-IN') })), [history])
  return (
    <div className="space-y-4">
      <PageHeader title="Configuration history" description="Publishing adds a record. Rollback creates a new version instead of deleting history." actions={<div className="flex gap-2"><Demo /><button type="button" className="btn-secondary" onClick={() => exportToCSV(rows, 'control-history')}>Export</button></div>} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-[11px] uppercase text-gray-500">{['Version', 'Group', 'Admin', 'Role', 'Status', 'When'].map((label) => <th key={label} className="px-2 py-2">{label}</th>)}</tr></thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id} onClick={() => setSelected(row.id)} className={`cursor-pointer border-t border-gray-100 ${selected === row.id ? 'bg-pink-50' : ''}`}>
                <td className="px-2 py-2">v{row.version}</td>
                <td className="px-2 py-2">{row.category}</td>
                <td className="px-2 py-2">{row.adminId}</td>
                <td className="px-2 py-2">{row.role}</td>
                <td className="px-2 py-2">{row.status}</td>
                <td className="px-2 py-2">{new Date(row.at).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entry && (
        <Panel title={`${entry.id} · ${entry.reason}`}>
          {entry.changes?.length ? entry.changes.map((change) => (
            <p key={change.key} className="text-sm">{change.label}: {String(change.from)} → {String(change.to)}</p>
          )) : <p className="text-sm text-gray-500">Initial version.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rollback reason" className="input-field max-w-xs" />
            <button type="button" className="btn-ghost" disabled={!canEdit(role, entry.category) || !entry.before} onClick={() => {
              const result = rollback(entry.id, reason)
              if (!result.ok) setError(result.errors[0])
              else { setError(''); setReason(''); showToast('Earlier values published as a new version', 'success') }
            }}>Restore this earlier version</button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </Panel>
      )}
    </div>
  )
}

const PERMISSIONS = [
  ['calls', 'Call pricing'],
  ['withdrawals', 'Host earnings & withdrawals'],
  ['diamonds', 'Diamond conversion'],
  ['payments', 'Payment settings'],
  ['features', 'Feature flags'],
  ['safety', 'Safety review'],
  ['history', 'View audit history'],
]

export const RolesPage = () => (
  <div className="space-y-4">
    <PageHeader title="Roles & permissions" description="Payment secrets and financial rates stay with Super Admin. Other roles publish only the groups listed." actions={<Demo />} />
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase text-gray-500">
            <th className="px-2 py-2">Permission</th>
            {ROLES.map((role) => <th key={role} className="px-2 py-2">{role}</th>)}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map(([id, label]) => (
            <tr key={id} className="border-t border-gray-100">
              <td className="px-2 py-2">{label}</td>
              {ROLES.map((role) => {
                const allowed = role === 'Super Admin' || (id === 'history' ? true : canEdit(role, id))
                return <td key={role} className="px-2 py-2">{allowed ? 'Edit' : 'View'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-gray-500">Switch “Acting as” on a settings page to see publish get blocked. History stays readable for every role.</p>
  </div>
)
