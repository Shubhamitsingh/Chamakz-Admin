import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../PageHeader'
import { useEconomy } from '../../economy/EconomyContext'

const PRESETS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['month', 'This month'],
  ['custom', 'Custom'],
]

export const DemoMark = () => (
  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Demo data</span>
)

export const EconomyHeader = ({ title, description, actions }) => (
  <PageHeader title={title} description={description} actions={<div className="flex flex-wrap items-center gap-2"><DemoMark />{actions}</div>} />
)

export const DateFilters = () => {
  const { preset, setPreset, from, setFrom, to, setTo } = useEconomy()
  return (
    <div className="filter-bar surface-raised">
      {PRESETS.map(([id, label]) => (
        <button key={id} type="button" onClick={() => setPreset(id)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${preset === id ? 'bg-pink-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
      ))}
      {preset === 'custom' && (
        <>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input-field w-auto" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input-field w-auto" />
        </>
      )}
    </div>
  )
}

export const StatCard = ({ label, value, hint, delta, to }) => {
  const body = (
    <div className="surface-raised flex h-full min-h-[104px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-3.5 text-left dark:border-gray-700 dark:bg-gray-800">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div>
        <p className="text-xl font-semibold tabular-nums leading-none">{value}</p>
        <p className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-400">
          <span>{hint}</span>
          {delta != null && <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>}
        </p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{body}</Link> : body
}

export const Drawer = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
    <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
    <aside className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </aside>
  </div>
)

export const TableWrap = ({ children }) => <div className="overflow-x-auto">{children}</div>

export const th = 'px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'
export const td = 'px-3 py-2.5 text-sm align-middle'

export const statusClass = (status) => {
  if (['success', 'paid', 'approved', 'active', 'Verified'].includes(status)) return 'bg-emerald-50 text-emerald-700'
  if (['failed', 'rejected', 'frozen'].includes(status)) return 'bg-rose-50 text-rose-700'
  if (['refunded'].includes(status)) return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-600'
}

export const usePaged = (rows, size = 10) => {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(size)
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const current = Math.min(page, totalPages)
  const slice = useMemo(() => rows.slice((current - 1) * perPage, current * perPage), [rows, current, perPage])
  return { page: current, setPage, perPage, setPerPage, totalPages, slice, total: rows.length }
}
