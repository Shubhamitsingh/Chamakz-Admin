import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import { useApp } from '../../context/AppContext'
import { deleteRow, insertRow, loadHostPerformance, readOne, readTable, updateRow } from '../../data/userAppApi'

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const when = (value) => value ? new Date(value).toLocaleString() : ''

function useRows(table, orderColumn = 'created_at', ascending = false) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await readTable(table, orderColumn, ascending))
    } catch (loadError) {
      setRows([])
      setError(loadError.message || 'Could not load records.')
    } finally {
      setLoading(false)
    }
  }, [table, orderColumn, ascending])
  useEffect(() => { reload() }, [reload])
  return { rows, loading, error, reload }
}

function Screen({ title, where, children }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={where} />
      {children}
    </div>
  )
}

function Note({ children }) {
  return <p className="text-xs text-gray-500">{children}</p>
}

function Status({ loading, error }) {
  if (loading) return <p className="text-sm text-gray-500">Loading…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  return null
}

function Field({ label, children }) {
  return (
    <label className="block text-xs text-gray-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

function TextInput(props) {
  return <input {...props} className="input-field w-full" />
}

function SaveButton({ children, ...props }) {
  return <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-pink-500 px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90" {...props}>{children}</button>
}

function RowButton({ children, onClick }) {
  return <button type="button" className="text-xs text-pink-600" onClick={onClick}>{children}</button>
}

async function save(action, showToast, message, reload) {
  try {
    await action()
    showToast(message, 'success')
    await reload()
    return true
  } catch (error) {
    showToast(error.message || 'The database did not save this change.', 'error')
    return false
  }
}

function DataTable({ columns, rows, empty }) {
  if (!rows.length) return <EmptyState title="No records found." description={empty} />
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs text-gray-500">
          <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2 font-medium">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.slug} className="border-t border-gray-100 dark:border-gray-800">
              {columns.map((column) => <td key={column.key} className="px-3 py-2 align-top">{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function WarningsPage() {
  const { showToast } = useApp()
  const { rows, loading, error, reload } = useRows('user_warnings')
  const [form, setForm] = useState({ user_label: '', reason: '', warning_count: 1, hold_account: false })
  const onSubmit = async (event) => {
    event.preventDefault()
    const count = Number(form.warning_count)
    if (!form.user_label.trim() || !form.reason.trim() || !Number.isInteger(count) || count < 0) {
      showToast('Enter the user, a reason, and a warning count of 0 or more.', 'error')
      return
    }
    const ok = await save(() => insertRow('user_warnings', {
      user_label: form.user_label.trim(),
      reason: form.reason.trim(),
      warning_count: count,
      hold_account: form.hold_account,
    }), showToast, 'Warning saved.', reload)
    if (ok) setForm({ user_label: '', reason: '', warning_count: 1, hold_account: false })
  }
  return (
    <Screen title="Warnings" where="User app: Profile menu → Warnings. The app shows a count up to 5. This page writes that count.">
      <Note>Removing a warning keeps the row and marks it removed. Holding an account records the request on the warning. It does not invent a suspension reason beyond this row.</Note>
      <form onSubmit={onSubmit} className="card grid gap-3 md:grid-cols-4">
        <Field label="User"><TextInput value={form.user_label} onChange={(event) => setForm({ ...form, user_label: event.target.value })} /></Field>
        <Field label="Reason"><TextInput value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
        <Field label="Count"><TextInput type="number" min="0" value={form.warning_count} onChange={(event) => setForm({ ...form, warning_count: event.target.value })} /></Field>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" checked={form.hold_account} onChange={(event) => setForm({ ...form, hold_account: event.target.checked })} /> Hold account</label>
        <SaveButton>Save warning</SaveButton>
      </form>
      <Status loading={loading} error={error} />
      {!loading && !error && (
        <DataTable
          empty="No warnings have been saved."
          rows={rows}
          columns={[
            { key: 'user', label: 'User', render: (row) => row.user_label },
            { key: 'reason', label: 'Reason', render: (row) => row.reason },
            { key: 'count', label: 'Count', render: (row) => row.warning_count },
            { key: 'date', label: 'Date', render: (row) => when(row.created_at) },
            { key: 'status', label: 'Status', render: (row) => `${row.status}${row.hold_account ? ' · hold' : ''}` },
            { key: 'action', label: '', render: (row) => row.status === 'active' ? <RowButton onClick={() => save(() => updateRow('user_warnings', row.id, { status: 'removed' }), showToast, 'Warning removed.', reload)}>Remove</RowButton> : null },
          ]}
        />
      )}
    </Screen>
  )
}

export function LevelsPage() {
  const { showToast } = useApp()
  const rules = useRows('level_rules', 'level', true)
  const profiles = useRows('profiles', 'display_name', true)
  const [audience, setAudience] = useState('user')
  const shown = rules.rows.filter((row) => row.audience === audience)
  const changeDiamonds = async (row, value) => {
    const diamonds = Number(value)
    if (!Number.isInteger(diamonds) || diamonds < 0) {
      showToast('Diamond requirement must be a whole number of 0 or more.', 'error')
      return
    }
    await save(() => updateRow('level_rules', row.id, { diamonds_required: diamonds }), showToast, 'Level requirement saved.', rules.reload)
  }
  const changeProfile = async (profile, field, value) => {
    const level = Number(value)
    if (!Number.isInteger(level) || level < 0 || level > 50) {
      showToast('Level must be a whole number from 0 to 50.', 'error')
      return
    }
    await save(() => updateRow('profiles', profile.id, { [field]: level }), showToast, 'Profile level saved.', profiles.reload)
  }
  return (
    <Screen title="Levels" where="User app: Profile → Level. The same milestone table is used for User level and Host level.">
      <Note>The app defines Lv0–Lv10, then Lv20, Lv30, Lv40 and Lv50. It does not define a diamond number for every level in between, so those rows were not invented.</Note>
      <div className="flex gap-2">
        {['user', 'host'].map((item) => (
          <button key={item} type="button" className={`rounded-md border px-3 py-1.5 text-sm ${audience === item ? 'border-pink-500 text-pink-600' : ''}`} onClick={() => setAudience(item)}>{item === 'user' ? 'User level' : 'Host level'}</button>
        ))}
      </div>
      <Status loading={rules.loading} error={rules.error} />
      {!rules.loading && !rules.error && (
        <DataTable
          empty="No level rules found."
          rows={shown}
          columns={[
            { key: 'level', label: 'Level', render: (row) => `Lv${row.level}` },
            { key: 'diamonds', label: 'Diamonds required', render: (row) => <TextInput className="input-field w-40" defaultValue={row.diamonds_required} key={`${row.id}-${row.diamonds_required}`} onBlur={(event) => { if (String(event.target.value) !== String(row.diamonds_required)) changeDiamonds(row, event.target.value) }} /> },
          ]}
        />
      )}
      <h2 className="text-sm font-semibold">Current level on each profile</h2>
      <Status loading={profiles.loading} error={profiles.error} />
      {!profiles.loading && !profiles.error && (
        <DataTable
          empty="No user profiles are in the database yet."
          rows={profiles.rows}
          columns={[
            { key: 'name', label: 'User', render: (row) => row.display_name },
            { key: 'user', label: 'User level', render: (row) => <TextInput className="input-field w-24" type="number" min="0" max="50" defaultValue={row.user_level} key={`${row.id}-u-${row.user_level}`} onBlur={(event) => { if (String(event.target.value) !== String(row.user_level)) changeProfile(row, 'user_level', event.target.value) }} /> },
            { key: 'host', label: 'Host level', render: (row) => <TextInput className="input-field w-24" type="number" min="0" max="50" defaultValue={row.host_level} key={`${row.id}-h-${row.host_level}`} onBlur={(event) => { if (String(event.target.value) !== String(row.host_level)) changeProfile(row, 'host_level', event.target.value) }} /> },
          ]}
        />
      )}
    </Screen>
  )
}

export function ReferralsPage() {
  const { showToast } = useApp()
  const list = useRows('referrals')
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({ invite_code: '', inviter_label: '', invitee_label: '', reward_diamonds: 50 })
  const loadSettings = useCallback(async () => {
    try { setSettings(await readOne('referral_settings')) } catch (error) { showToast(error.message, 'error') }
  }, [showToast])
  useEffect(() => { loadSettings() }, [loadSettings])
  return (
    <Screen title="Referrals" where="User app: Profile → Promotion. The on/off switch stays at Control → Feature Flags. This page is the invite list.">
      <Note>The app currently rewards 50 diamonds. Change the number here when that reward should change. Turning Referral on or off is still the Feature Flags switch.</Note>
      {settings && (
        <form className="card flex flex-wrap items-end gap-3" onSubmit={async (event) => {
          event.preventDefault()
          const reward = Number(event.target.reward.value)
          if (!Number.isInteger(reward) || reward < 0) { showToast('Reward must be a whole number of 0 or more.', 'error'); return }
          await save(() => updateRow('referral_settings', true, { reward_diamonds: reward }), showToast, 'Referral reward saved.', loadSettings)
        }}>
          <Field label="Reward diamonds"><TextInput name="reward" type="number" min="0" defaultValue={settings.reward_diamonds} key={settings.reward_diamonds} /></Field>
          <SaveButton>Save reward</SaveButton>
        </form>
      )}
      <form className="card grid gap-3 md:grid-cols-4" onSubmit={async (event) => {
        event.preventDefault()
        const reward = Number(form.reward_diamonds)
        if (!form.invite_code.trim() || !form.inviter_label.trim() || !form.invitee_label.trim() || !Number.isInteger(reward) || reward < 0) {
          showToast('Enter the code, both people, and the diamond reward.', 'error')
          return
        }
        const ok = await save(() => insertRow('referrals', { ...form, invite_code: form.invite_code.trim(), inviter_label: form.inviter_label.trim(), invitee_label: form.invitee_label.trim(), reward_diamonds: reward }), showToast, 'Referral saved.', list.reload)
        if (ok) setForm({ invite_code: '', inviter_label: '', invitee_label: '', reward_diamonds: settings?.reward_diamonds ?? 50 })
      }}>
        <Field label="Invite code"><TextInput value={form.invite_code} onChange={(event) => setForm({ ...form, invite_code: event.target.value })} /></Field>
        <Field label="Inviter"><TextInput value={form.inviter_label} onChange={(event) => setForm({ ...form, inviter_label: event.target.value })} /></Field>
        <Field label="Invited person"><TextInput value={form.invitee_label} onChange={(event) => setForm({ ...form, invitee_label: event.target.value })} /></Field>
        <Field label="Diamonds"><TextInput type="number" min="0" value={form.reward_diamonds} onChange={(event) => setForm({ ...form, reward_diamonds: event.target.value })} /></Field>
        <SaveButton>Add referral</SaveButton>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No one has been invited yet." rows={list.rows} columns={[
        { key: 'code', label: 'Invite code', render: (row) => row.invite_code },
        { key: 'from', label: 'Inviter', render: (row) => row.inviter_label },
        { key: 'to', label: 'Invited', render: (row) => row.invitee_label },
        { key: 'reward', label: 'Diamonds', render: (row) => row.reward_diamonds },
        { key: 'date', label: 'Date', render: (row) => when(row.created_at) },
      ]} />}
    </Screen>
  )
}

export function PrivateCallsPage() {
  const { showToast } = useApp()
  const list = useRows('private_calls', 'started_at')
  const [form, setForm] = useState({ caller_label: '', host_label: '', minutes: '', diamonds_charged: '', status: 'completed' })
  return (
    <Screen title="Private call log" where="One row is one finished video call: caller, host, minutes, and diamonds charged.">
      <form className="card grid gap-3 md:grid-cols-5" onSubmit={async (event) => {
        event.preventDefault()
        const minutes = Number(form.minutes)
        const diamonds = Number(form.diamonds_charged)
        if (!form.caller_label.trim() || !form.host_label.trim() || !(minutes >= 0) || !Number.isInteger(diamonds) || diamonds < 0) {
          showToast('Enter the caller, host, minutes, and diamonds charged.', 'error')
          return
        }
        const ok = await save(() => insertRow('private_calls', { ...form, caller_label: form.caller_label.trim(), host_label: form.host_label.trim(), minutes, diamonds_charged: diamonds }), showToast, 'Call saved.', list.reload)
        if (ok) setForm({ caller_label: '', host_label: '', minutes: '', diamonds_charged: '', status: 'completed' })
      }}>
        <Field label="Caller"><TextInput value={form.caller_label} onChange={(event) => setForm({ ...form, caller_label: event.target.value })} /></Field>
        <Field label="Host"><TextInput value={form.host_label} onChange={(event) => setForm({ ...form, host_label: event.target.value })} /></Field>
        <Field label="Minutes"><TextInput type="number" min="0" step="0.01" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: event.target.value })} /></Field>
        <Field label="Diamonds charged"><TextInput type="number" min="0" value={form.diamonds_charged} onChange={(event) => setForm({ ...form, diamonds_charged: event.target.value })} /></Field>
        <Field label="Status"><select className="input-field w-full" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{['completed', 'missed', 'cancelled', 'ongoing'].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <SaveButton>Add call</SaveButton>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No private calls have been recorded." rows={list.rows} columns={[
        { key: 'caller', label: 'Caller', render: (row) => row.caller_label },
        { key: 'host', label: 'Host', render: (row) => row.host_label },
        { key: 'minutes', label: 'Minutes', render: (row) => row.minutes },
        { key: 'diamonds', label: 'Diamonds charged', render: (row) => row.diamonds_charged },
        { key: 'time', label: 'Time', render: (row) => when(row.started_at) },
        { key: 'status', label: 'Status', render: (row) => row.status },
      ]} />}
    </Screen>
  )
}

function PairPage({ title, where, table, leftKey, rightKey, leftLabel, rightLabel, actionLabel, removeLabel }) {
  const { showToast } = useApp()
  const list = useRows(table)
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  return (
    <Screen title={title} where={where}>
      <form className="card grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault()
        if (!left.trim() || !right.trim()) { showToast('Enter both people.', 'error'); return }
        const ok = await save(() => insertRow(table, { [leftKey]: left.trim(), [rightKey]: right.trim() }), showToast, 'Saved.', list.reload)
        if (ok) { setLeft(''); setRight('') }
      }}>
        <Field label={leftLabel}><TextInput value={left} onChange={(event) => setLeft(event.target.value)} /></Field>
        <Field label={rightLabel}><TextInput value={right} onChange={(event) => setRight(event.target.value)} /></Field>
        <div className="flex items-end"><SaveButton>Save</SaveButton></div>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No records found." rows={list.rows} columns={[
        { key: 'left', label: leftLabel, render: (row) => row[leftKey] },
        { key: 'right', label: rightLabel, render: (row) => row[rightKey] },
        { key: 'date', label: 'Date', render: (row) => when(row.created_at) },
        { key: 'action', label: '', render: (row) => <RowButton onClick={() => save(() => deleteRow(table, row.id), showToast, removeLabel, list.reload)}>{actionLabel}</RowButton> },
      ]} />}
    </Screen>
  )
}

export function FollowsPage() {
  return <PairPage title="Follows" where="Who follows whom. Remove deletes that follow." table="user_follows" leftKey="follower_label" rightKey="following_label" leftLabel="Follower" rightLabel="Following" actionLabel="Remove" removeLabel="Follow removed." />
}

export function BlocksPage() {
  return <PairPage title="Blocks" where="User app: Block on a profile. This is not the Complaints page. Unblock deletes only this block." table="user_blocks" leftKey="blocker_label" rightKey="blocked_label" leftLabel="Blocked by" rightLabel="Blocked person" actionLabel="Unblock" removeLabel="Unblocked." />
}

export function PrivateChatsPage() {
  const { showToast } = useApp()
  const chats = useRows('private_chats')
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [pair, setPair] = useState({ participant_a: '', participant_b: '' })
  const [draft, setDraft] = useState({ sender_label: '', body: '' })
  const loadMessages = useCallback(async (chatId) => {
    const rows = await readTable('private_chat_messages', 'created_at', true)
    setMessages(rows.filter((row) => row.chat_id === chatId))
  }, [])
  useEffect(() => { if (selected) loadMessages(selected).catch((error) => showToast(error.message, 'error')) }, [selected, loadMessages, showToast])
  return (
    <Screen title="User-to-user chats" where="User app: Messages tab, private chats. The Chats menu is the support inbox and is not changed here.">
      <form className="card grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault()
        if (!pair.participant_a.trim() || !pair.participant_b.trim()) { showToast('Enter both people.', 'error'); return }
        const ok = await save(() => insertRow('private_chats', { participant_a: pair.participant_a.trim(), participant_b: pair.participant_b.trim() }), showToast, 'Chat saved.', chats.reload)
        if (ok) setPair({ participant_a: '', participant_b: '' })
      }}>
        <Field label="Person A"><TextInput value={pair.participant_a} onChange={(event) => setPair({ ...pair, participant_a: event.target.value })} /></Field>
        <Field label="Person B"><TextInput value={pair.participant_b} onChange={(event) => setPair({ ...pair, participant_b: event.target.value })} /></Field>
        <div className="flex items-end"><SaveButton>Open chat record</SaveButton></div>
      </form>
      <Status loading={chats.loading} error={chats.error} />
      {!chats.loading && !chats.error && <DataTable empty="No private chats found." rows={chats.rows} columns={[
        { key: 'a', label: 'Person A', render: (row) => row.participant_a },
        { key: 'b', label: 'Person B', render: (row) => row.participant_b },
        { key: 'open', label: '', render: (row) => <RowButton onClick={() => setSelected(row.id)}>Read</RowButton> },
      ]} />}
      {selected && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold">Messages</h2>
          {messages.length === 0 && <p className="text-sm text-gray-500">No records found.</p>}
          {messages.map((message) => (
            <div key={message.id} className="flex items-start justify-between gap-3 border-t border-gray-100 py-2 text-sm">
              <div>
                <p className="font-medium">{message.sender_label} · {when(message.created_at)}</p>
                <p className={message.hidden ? 'text-gray-400 line-through' : ''}>{message.body}</p>
              </div>
              {!message.hidden && <RowButton onClick={() => save(() => updateRow('private_chat_messages', message.id, { hidden: true }), showToast, 'Message hidden.', () => loadMessages(selected))}>Hide</RowButton>}
            </div>
          ))}
          <form className="grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
            event.preventDefault()
            if (!draft.sender_label.trim() || !draft.body.trim()) { showToast('Enter the sender and the message.', 'error'); return }
            const ok = await save(() => insertRow('private_chat_messages', { chat_id: selected, sender_label: draft.sender_label.trim(), body: draft.body.trim() }), showToast, 'Message saved.', () => loadMessages(selected))
            if (ok) setDraft({ sender_label: '', body: '' })
          }}>
            <Field label="Sender"><TextInput value={draft.sender_label} onChange={(event) => setDraft({ ...draft, sender_label: event.target.value })} /></Field>
            <Field label="Message"><TextInput value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></Field>
            <div className="flex items-end"><SaveButton>Save message</SaveButton></div>
          </form>
        </div>
      )}
    </Screen>
  )
}

export function KycPage() {
  const { showToast } = useApp()
  const list = useRows('kyc_reviews')
  const [form, setForm] = useState({ applicant_label: '', legal_name: '', selfie_path: '' })
  return (
    <Screen title="KYC review" where="User app: Become a creator and the KYC selfie. Host Applications stays a separate page.">
      <Note>The app currently waits about 2 seconds and continues. It does not upload the selfie yet. This page is ready for the photo path when that upload is connected. No photo is invented here.</Note>
      <form className="card grid gap-3 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault()
        if (!form.applicant_label.trim() || !form.legal_name.trim()) { showToast('Enter the applicant and legal name.', 'error'); return }
        const ok = await save(() => insertRow('kyc_reviews', { applicant_label: form.applicant_label.trim(), legal_name: form.legal_name.trim(), selfie_path: form.selfie_path.trim() || null, status: 'pending' }), showToast, 'KYC review saved.', list.reload)
        if (ok) setForm({ applicant_label: '', legal_name: '', selfie_path: '' })
      }}>
        <Field label="Applicant"><TextInput value={form.applicant_label} onChange={(event) => setForm({ ...form, applicant_label: event.target.value })} /></Field>
        <Field label="Legal name"><TextInput value={form.legal_name} onChange={(event) => setForm({ ...form, legal_name: event.target.value })} /></Field>
        <Field label="Selfie path"><TextInput value={form.selfie_path} onChange={(event) => setForm({ ...form, selfie_path: event.target.value })} placeholder="Empty until the app uploads a photo" /></Field>
        <SaveButton>Add review</SaveButton>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No KYC reviews found." rows={list.rows} columns={[
        { key: 'who', label: 'Applicant', render: (row) => row.applicant_label },
        { key: 'name', label: 'Legal name', render: (row) => row.legal_name },
        { key: 'photo', label: 'Selfie', render: (row) => row.selfie_path || 'No photo uploaded' },
        { key: 'status', label: 'Status', render: (row) => (
          <select className="input-field" value={row.status} onChange={(event) => save(() => updateRow('kyc_reviews', row.id, { status: event.target.value }), showToast, 'KYC status saved.', list.reload)}>
            {['pending', 'approved', 'rejected'].map((item) => <option key={item}>{item}</option>)}
          </select>
        ) },
      ]} />}
    </Screen>
  )
}

export function HostPerformancePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    loadHostPerformance().then(setRows).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false))
  }, [])
  return (
    <Screen title="Host performance" where="User app: Settings → General → Performance. This is not the dashboard chart.">
      <Note>Streams, hours and peak viewers come from live session records. Earnings come from the host earning wallet. Pending payments are not added.</Note>
      <Status loading={loading} error={error} />
      {!loading && !error && <DataTable empty="No host profiles found." rows={rows} columns={[
        { key: 'name', label: 'Host', render: (row) => row.name },
        { key: 'streams', label: 'Streams', render: (row) => row.streams },
        { key: 'hours', label: 'Hours', render: (row) => row.hours.toFixed(2) },
        { key: 'peak', label: 'Peak viewers', render: (row) => row.peakViewers },
        { key: 'earn', label: 'Earnings', render: (row) => money(row.earningsInr) },
        { key: 'diamonds', label: 'Diamonds received', render: (row) => row.diamondsReceived },
      ]} />}
    </Screen>
  )
}

function SingletonPage({ title, where, note, table, fields }) {
  const { showToast } = useApp()
  const [row, setRow] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setRow(await readOne(table)); setError('') } catch (loadError) { setError(loadError.message) }
  }, [table])
  useEffect(() => { load() }, [load])
  if (error) return <Screen title={title} where={where}><p className="text-sm text-red-600">{error}</p></Screen>
  if (!row) return <Screen title={title} where={where}><p className="text-sm text-gray-500">Loading…</p></Screen>
  return (
    <Screen title={title} where={where}>
      {note ? <Note>{note}</Note> : null}
      <form key={row.updated_at} className="card space-y-3" onSubmit={async (event) => {
        event.preventDefault()
        const patch = {}
        fields.forEach((field) => {
          const value = event.target[field.name].value
          if (field.kind === 'boolean') patch[field.name] = event.target[field.name].checked
          else if (field.kind === 'countries') patch[field.name] = value.split(',').map((item) => item.trim()).filter(Boolean)
          else patch[field.name] = value
        })
        await save(() => updateRow(table, row.id, patch), showToast, 'Saved.', load)
      }}>
        {fields.map((field) => field.kind === 'boolean' ? (
          <label key={field.name} className="flex items-center gap-2 text-sm"><input name={field.name} type="checkbox" defaultChecked={row[field.name]} /> {field.label}</label>
        ) : (
          <Field key={field.name} label={field.label}>
            {field.kind === 'text' ? <textarea name={field.name} className="input-field min-h-40 w-full" defaultValue={field.kind === 'countries' ? '' : row[field.name] || ''} /> : <TextInput name={field.name} defaultValue={field.kind === 'countries' ? (row[field.name] || []).join(', ') : row[field.name] || ''} />}
          </Field>
        ))}
        <SaveButton>Save</SaveButton>
      </form>
    </Screen>
  )
}

export function CoinPacksPage() {
  const { showToast } = useApp()
  const list = useRows('coin_packs', 'diamonds', true)
  const [form, setForm] = useState({ name: '', price_inr: '', diamonds: '' })
  return (
    <Screen title="Coin packs" where="User app: Wallet recharge list. Diamond Purchases remains the old purchase history and is not this page.">
      <Note>The four packs already saved are the prices and diamond counts hardcoded in the wallet popups. Price is the discounted amount the user pays.</Note>
      <form className="card grid gap-3 md:grid-cols-4" onSubmit={async (event) => {
        event.preventDefault()
        const price = Number(form.price_inr)
        const diamonds = Number(form.diamonds)
        if (!form.name.trim() || !(price >= 0) || !Number.isInteger(diamonds) || diamonds < 0) { showToast('Enter a name, price in rupees, and diamond count.', 'error'); return }
        const ok = await save(() => insertRow('coin_packs', { name: form.name.trim(), price_inr: price, diamonds, is_active: true }), showToast, 'Coin pack saved.', list.reload)
        if (ok) setForm({ name: '', price_inr: '', diamonds: '' })
      }}>
        <Field label="Name"><TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Price (₹)"><TextInput type="number" min="0" step="0.01" value={form.price_inr} onChange={(event) => setForm({ ...form, price_inr: event.target.value })} /></Field>
        <Field label="Diamonds"><TextInput type="number" min="0" value={form.diamonds} onChange={(event) => setForm({ ...form, diamonds: event.target.value })} /></Field>
        <div className="flex items-end"><SaveButton>Add pack</SaveButton></div>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No coin packs found." rows={list.rows} columns={[
        { key: 'name', label: 'Name', render: (row) => row.name },
        { key: 'price', label: 'Price', render: (row) => money(row.price_inr) },
        { key: 'was', label: 'Shown original', render: (row) => row.original_price_inr == null ? '—' : money(row.original_price_inr) },
        { key: 'diamonds', label: 'Diamonds', render: (row) => row.diamonds },
        { key: 'active', label: 'Status', render: (row) => <RowButton onClick={() => save(() => updateRow('coin_packs', row.id, { is_active: !row.is_active }), showToast, 'Coin pack saved.', list.reload)}>{row.is_active ? 'Active · turn off' : 'Off · turn on'}</RowButton> },
      ]} />}
    </Screen>
  )
}

export function TelegramPage() {
  return <SingletonPage title="Telegram popup" where="User app: the channel popup on Home." note="The link and text below are the ones currently written in the home popup." table="telegram_popup" fields={[{ name: 'link', label: 'Channel link', kind: 'line' }, { name: 'body', label: 'Popup text', kind: 'text' }, { name: 'is_enabled', label: 'Show the popup', kind: 'boolean' }]} />
}

export function NearbyPage() {
  return <SingletonPage title="Nearby" where="Turn Nearby on or off, and limit it to the countries you type." note="Separate country names with commas. Leave the list empty to show every country." table="nearby_settings" fields={[{ name: 'is_enabled', label: 'Nearby is on', kind: 'boolean' }, { name: 'countries', label: 'Countries to show', kind: 'countries' }]} />
}

export function NotificationSwitchesPage() {
  const { showToast } = useApp()
  const list = useRows('user_notification_settings', 'user_label', true)
  const [userLabel, setUserLabel] = useState('')
  const keys = [
    ['comments', 'Comments'],
    ['new_followers', 'New followers'],
    ['likes', 'Likes'],
    ['followed_host_live', 'Followed host is live'],
  ]
  return (
    <Screen title="User notification switches" where="Comments, new followers, likes, and followed host is live. These belong to one user.">
      <Note>Add the user, then turn each switch on or off. The change stays saved for that user.</Note>
      <form className="card flex flex-wrap items-end gap-3" onSubmit={async (event) => {
        event.preventDefault()
        if (!userLabel.trim()) { showToast('Enter the user.', 'error'); return }
        const ok = await save(() => insertRow('user_notification_settings', { user_label: userLabel.trim() }), showToast, 'Notification switches saved.', list.reload)
        if (ok) setUserLabel('')
      }}>
        <Field label="User"><TextInput value={userLabel} onChange={(event) => setUserLabel(event.target.value)} /></Field>
        <SaveButton>Add user switches</SaveButton>
      </form>
      <Status loading={list.loading} error={list.error} />
      {!list.loading && !list.error && <DataTable empty="No personal notification switches have been saved." rows={list.rows} columns={[
        { key: 'user', label: 'User', render: (row) => row.user_label },
        ...keys.map(([key, label]) => ({ key, label, render: (row) => <input type="checkbox" checked={row[key]} onChange={(event) => save(() => updateRow('user_notification_settings', row.id, { [key]: event.target.checked }), showToast, 'Switch saved.', list.reload)} /> })),
      ]} />}
    </Screen>
  )
}
