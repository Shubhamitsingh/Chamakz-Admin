import { createContext, useContext, useMemo, useState } from 'react'
import { ROLES, defaultConfig } from './schema'
import { canEdit, diffCategory, stripSecrets, validateCategory } from './logic'

const ControlContext = createContext(null)

export const ControlProvider = ({ children }) => {
  const [published, setPublished] = useState(defaultConfig)
  const [drafts, setDrafts] = useState({})
  const [version, setVersion] = useState(1)
  const [role, setRole] = useState(ROLES[0])
  const [history, setHistory] = useState([{
    id: 'CFG-0001',
    version: 1,
    category: 'calls',
    adminId: 'ADM-001',
    adminName: 'Admin User',
    role: 'Super Admin',
    reason: 'Initial demo configuration',
    at: new Date().toISOString(),
    status: 'published',
    changes: [],
  }])

  const read = (id) => drafts[id] || published[id]

  const setField = (id, key, value) => {
    setDrafts((prev) => {
      const base = prev[id] || published[id]
      return { ...prev, [id]: { ...base, [key]: value } }
    })
  }

  const saveDraft = (id) => {
    if (!drafts[id]) return 'Nothing new to keep as a draft.'
    return ''
  }

  const discard = (id) => setDrafts((prev) => {
    const next = { ...prev }
    delete next[id]
    return next
  })

  const publish = (id, reason) => {
    if (!canEdit(role, id)) return { ok: false, errors: ['This role cannot publish that configuration.'] }
    const draft = read(id)
    const errors = validateCategory(id, draft)
    if (errors.length) return { ok: false, errors }
    const nextValues = stripSecrets(id, draft)
    const changes = diffCategory(id, published[id], nextValues)
    if (id === 'payments') {
      if (draft.secretKey) changes.push({ key: 'secretKey', label: 'Secret key', from: published[id].secretKeySet ? 'Hidden' : 'Not set', to: 'Hidden' })
      if (draft.webhookSecret) changes.push({ key: 'webhookSecret', label: 'Webhook secret', from: published[id].webhookSecretSet ? 'Hidden' : 'Not set', to: 'Hidden' })
    }
    if (!changes.length) return { ok: false, errors: ['No changes to publish.'] }
    if (!String(reason || '').trim()) return { ok: false, errors: ['Add a reason before publishing.'] }
    const nextVersion = version + 1
    setPublished((prev) => ({ ...prev, [id]: nextValues }))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setVersion(nextVersion)
    setHistory((prev) => [{
      id: `CFG-${String(nextVersion).padStart(4, '0')}`,
      version: nextVersion,
      category: id,
      adminId: 'ADM-001',
      adminName: 'Admin User',
      role,
      reason: reason.trim(),
      at: new Date().toISOString(),
      status: 'published',
      changes,
      before: published[id],
    }, ...prev])
    return { ok: true }
  }

  const rollback = (entryId, reason) => {
    const entry = history.find((row) => row.id === entryId)
    if (!entry?.before) return { ok: false, errors: ['This entry has no earlier snapshot to restore.'] }
    if (!canEdit(role, entry.category)) return { ok: false, errors: ['This role cannot roll back that configuration.'] }
    if (!String(reason || '').trim()) return { ok: false, errors: ['Add a reason before rolling back.'] }
    const nextVersion = version + 1
    setPublished((prev) => ({ ...prev, [entry.category]: entry.before }))
    setVersion(nextVersion)
    setHistory((prev) => [{
      id: `CFG-${String(nextVersion).padStart(4, '0')}`,
      version: nextVersion,
      category: entry.category,
      adminId: 'ADM-001',
      adminName: 'Admin User',
      role,
      reason: reason.trim(),
      at: new Date().toISOString(),
      status: 'rollback',
      changes: diffCategory(entry.category, published[entry.category], entry.before),
      before: published[entry.category],
    }, ...prev])
    return { ok: true }
  }

  const value = useMemo(() => ({
    published, drafts, version, role, setRole, history, read, setField, saveDraft, discard, publish, rollback,
  }), [published, drafts, version, role, history])

  return <ControlContext.Provider value={value}>{children}</ControlContext.Provider>
}

export const useControl = () => {
  const context = useContext(ControlContext)
  if (!context) throw new Error('Control Center must render inside ControlProvider')
  return context
}
