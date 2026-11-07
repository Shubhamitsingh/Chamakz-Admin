import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import ExportButton from '../components/ExportButton'
import { useApp } from '../context/AppContext'
import {
  FB_STATUSES,
  SENTIMENT_THEME,
  addFeedbackNote,
  buildInsights,
  emojiForRating,
  formatWhen,
  getFeedback,
  listFeedback,
  mutateFeedback,
  ratingTone,
  sentimentOf,
  statusTone,
} from '../utils/feedbackData'

const Stars = ({ value }) => (
  <span className="tracking-tight" aria-label={`${value} of 5`}>
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
)

const Avatar = ({ name, tone }) => (
  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${tone || 'bg-slate-600'}`}>
    {(name || '?').charAt(0)}
  </span>
)

const Feedback = () => {
  const { showToast, markFeedbackAsSeen } = useApp()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sentiment, setSentiment] = useState('all')
  const [starFilter, setStarFilter] = useState('all')
  const [sortKey, setSortKey] = useState('submittedAt')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedId, setSelectedId] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => { markFeedbackAsSeen?.() }, [markFeedbackAsSeen])

  const rows = useMemo(() => listFeedback(), [tick])
  const selected = selectedId ? getFeedback(selectedId) : null
  const refresh = () => setTick((value) => value + 1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (sentiment !== 'all' && sentimentOf(row.rating) !== sentiment) return false
      if (starFilter !== 'all' && row.rating !== Number(starFilter)) return false
      if (!q) return true
      return `${row.id} ${row.user.name} ${row.user.numericId} ${row.subject} ${row.message}`.toLowerCase().includes(q)
    }).sort((a, b) => {
      if (sortKey === 'rating') return b.rating - a.rating
      return new Date(b.submittedAt) - new Date(a.submittedAt)
    })
  }, [rows, status, sentiment, starFilter, search, sortKey])

  const insights = useMemo(() => buildInsights(filtered), [filtered])
  const theme = insights.mood.theme

  useEffect(() => { setPage(1) }, [search, status, sentiment, starFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)
  const filtersOn = status !== 'all' || sentiment !== 'all' || starFilter !== 'all' || search

  const reset = () => {
    setSearch('')
    setStatus('all')
    setSentiment('all')
    setStarFilter('all')
    setSortKey('submittedAt')
  }

  const setStatusOn = (id, next) => {
    mutateFeedback(id, { status: next }, { actor: 'Admin User', action: `Status → ${next}`, status: next })
    refresh()
    showToast(`Sample feedback marked ${next}`, 'success')
  }

  const exportRows = filtered.map((row) => ({
    id: row.id,
    user: `${row.user.name} (${row.user.numericId})`,
    rating: row.rating,
    emoji: emojiForRating(row.rating).emoji,
    category: row.category,
    type: row.type,
    message: row.message,
    submitted: formatWhen(row.submittedAt),
  }))
  const exportColumns = [
    { header: 'Feedback ID', accessor: 'id' },
    { header: 'User', accessor: 'user' },
    { header: 'Rating', accessor: 'rating' },
    { header: 'Emoji', accessor: 'emoji' },
    { header: 'Category', accessor: 'category' },
    { header: 'Type', accessor: 'type' },
    { header: 'Feedback', accessor: 'message' },
    { header: 'Submitted', accessor: 'submitted' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="User satisfaction"
        description="Sample in-app ratings. Counts and emoji follow the current filters. Nothing is emailed to users."
        actions={
          <div className="flex flex-wrap gap-2">
            {filtersOn && (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset filters
              </button>
            )}
            <ExportButton data={exportRows} columns={exportColumns} filename="feedback" disabled={exportRows.length === 0} />
          </div>
        }
      />

      <section className={`overflow-hidden rounded-2xl border ${theme.hero}`}>
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="flex items-center gap-4 px-5 py-4 lg:w-[320px] lg:shrink-0 lg:border-r lg:border-black/5 dark:lg:border-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={insights.mood.emoji}
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl text-[2.75rem] leading-none ${theme.emojiWrap}`}
                aria-label={insights.mood.label}
              >
                {insights.mood.emoji}
        </motion.div>
            </AnimatePresence>
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${theme.kicker}`}>Satisfaction</p>
              <p className="mt-0.5 text-[2rem] font-semibold tabular-nums leading-none tracking-tight">
                {insights.avg.toFixed(1)}
                <span className="ml-1 text-sm font-medium text-gray-400">/ 5</span>
              </p>
              <p className={`mt-1 text-sm font-medium ${theme.label}`}>{insights.mood.label}</p>
          </div>
          </div>
          <div className="grid min-h-[5.5rem] flex-1 grid-cols-5">
            {[
              { label: 'Received', value: insights.total.toLocaleString('en-IN'), hint: 'sample voices', onClick: () => { setSentiment('all'); setStarFilter('all') }, valueClass: 'text-slate-900 dark:text-white' },
              { label: 'Average', value: insights.avg.toFixed(1), hint: 'out of 5', valueClass: theme.label },
              { label: 'Positive', value: insights.positive, hint: `${insights.positivePct}% · 4–5★`, onClick: () => setSentiment(sentiment === 'Positive' ? 'all' : 'Positive'), active: sentiment === 'Positive', valueClass: SENTIMENT_THEME.Positive.value, wash: 'bg-emerald-50/90 dark:bg-emerald-950/25' },
              { label: 'Neutral', value: insights.neutral, hint: `${insights.neutralPct}% · 3★`, onClick: () => setSentiment(sentiment === 'Neutral' ? 'all' : 'Neutral'), active: sentiment === 'Neutral', valueClass: SENTIMENT_THEME.Neutral.value, wash: 'bg-amber-50/90 dark:bg-amber-950/25' },
              { label: 'Negative', value: insights.negative, hint: `${insights.negativePct}% · 1–2★`, onClick: () => setSentiment(sentiment === 'Negative' ? 'all' : 'Negative'), active: sentiment === 'Negative', valueClass: SENTIMENT_THEME.Negative.value, wash: 'bg-rose-50/90 dark:bg-rose-950/25' },
            ].map((item, index) => {
              const Tag = item.onClick ? 'button' : 'div'
              return (
                <Tag
                  key={item.label}
                  type={item.onClick ? 'button' : undefined}
                  onClick={item.onClick}
                  className={`flex flex-col justify-center px-2 py-3 text-left sm:px-4 ${index > 0 ? 'border-l border-black/5 dark:border-white/10' : ''} ${item.wash || ''} ${item.active ? 'ring-inset ring-1 ring-slate-900/15' : ''}`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className={`mt-1 text-lg font-semibold tabular-nums leading-none sm:text-xl ${item.valueClass}`}>{item.value}</p>
                  <p className="mt-1 hidden text-[11px] text-gray-400 sm:block">{item.hint}</p>
                </Tag>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">Rating mix · tap a bar to filter</p>
        <ul className="space-y-2">
          {insights.stars.map((item) => (
            <li key={item.star}>
              <button type="button" className="flex w-full items-center gap-2 text-left text-xs" onClick={() => setStarFilter(starFilter === item.star ? 'all' : item.star)}>
                <span className="w-8 text-lg leading-none">{item.emoji}</span>
                <span className="w-16 text-gray-500">{item.star}★</span>
                <div className={`h-2 flex-1 overflow-hidden rounded-full ${item.track}`}>
                  <div className={`h-full rounded-full ${item.bar} ${starFilter === item.star ? 'opacity-100' : 'opacity-85'}`} style={{ width: `${Math.max(item.pct, item.count ? 4 : 0)}%` }} />
        </div>
                <span className="w-16 text-right tabular-nums text-gray-600">{item.count} · {item.pct}%</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search name, ID, or message" value={search} onChange={setSearch} />
        {['all', ...FB_STATUSES].map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-xs ${status === item ? theme.chip : 'bg-white ring-1 ring-slate-200 dark:bg-gray-800'}`} onClick={() => setStatus(item)}>{item === 'all' ? 'All statuses' : item}</button>
        ))}
        <select className="input-field max-w-[150px]" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="submittedAt">Newest</option>
          <option value="rating">Highest rating</option>
        </select>
        </div>

      {pageRows.length === 0 ? (
        <EmptyState title="No voices match these filters" description="Reset filters to see the full sample inbox." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pageRows.map((row) => {
            const mood = emojiForRating(row.rating)
            const tone = ratingTone(row.rating)
            return (
              <article key={row.id} className={`rounded-xl border bg-white p-4 dark:bg-gray-800 ${tone.border}`}>
                <div className="flex gap-3">
                  <Avatar name={row.user.name} tone={tone.avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
              <div>
                        <p className="font-medium">{row.user.name}</p>
                        <p className="font-mono text-[11px] text-gray-400">{row.user.numericId}</p>
                      </div>
                      <span className="text-2xl leading-none" title={mood.label}>{mood.emoji}</span>
              </div>
                    <p className={`mt-1 text-xs ${tone.stars}`}><Stars value={row.rating} /> · {mood.label}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{row.category} · {row.type}</p>
                  </div>
                </div>
                <h2 className="mt-3 text-sm font-semibold">{row.subject}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">“{row.message}”</p>
                <p className="mt-2 text-[11px] text-gray-400">{formatWhen(row.submittedAt)} · {row.platform}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>
                  <button type="button" className={`rounded-full px-3 py-1 text-[11px] text-white ${tone.header}`} onClick={() => setSelectedId(row.id)}>Open</button>
                </div>
              </article>
            )
          })}
                  </div>
                )}

      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={(value) => { setPerPage(value); setPage(1) }} />

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setSelectedId(null)} />
          <aside className="relative z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className={`flex items-start justify-between px-4 py-4 text-white ${ratingTone(selected.rating).header}`}>
                <div>
                <p className="font-mono text-[11px] text-white/80">{selected.id}</p>
                <p className="text-3xl leading-none">{emojiForRating(selected.rating).emoji}</p>
                <h2 className="mt-1 text-base font-semibold">{selected.subject}</h2>
                <p className="text-xs text-white/80">{selected.rating}/5 · {emojiForRating(selected.rating).label}</p>
              </div>
              <button type="button" className="rounded-md p-1 hover:bg-white/10" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <p className={`rounded-xl p-4 text-sm leading-relaxed ${ratingTone(selected.rating).quote}`}>“{selected.message}”</p>
              <div className="flex items-center gap-3">
                <Avatar name={selected.user.name} tone={ratingTone(selected.rating).avatar} />
            <div>
                  <p className="font-medium">{selected.user.name}</p>
                  <p className="font-mono text-[11px] text-gray-500">{selected.user.numericId}</p>
                  <p className="text-xs">{selected.user.email}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{selected.category} · {selected.type} · {selected.platform} {selected.appVersion} · {formatWhen(selected.submittedAt)}</p>
              <Link className={`inline-block text-xs font-medium ${theme.link}`} to={`/users/profile/${selected.user.id}`}>Open user profile</Link>
              <textarea className="input-field min-h-[64px]" placeholder="Private admin note — not sent to the user" value={note} onChange={(e) => setNote(e.target.value)} />
              <button 
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs text-white ${theme.btn}`}
                onClick={() => {
                  if (!note.trim()) {
                    showToast('Write a note first', 'error')
                    return
                  }
                  addFeedbackNote(selected.id, note.trim())
                  setNote('')
                  refresh()
                  showToast('Note saved on this sample', 'success')
                }}
              >
                Save note
              </button>
              {selected.status !== 'Archived' && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="rounded-full border px-3 py-1.5 text-[11px]" onClick={() => setStatusOn(selected.id, 'Reviewed')}>Heard</button>
                  <button type="button" className="rounded-full border px-3 py-1.5 text-[11px]" onClick={() => setStatusOn(selected.id, 'Actioned')}>Actioned</button>
                  <button type="button" className="rounded-full border px-3 py-1.5 text-[11px]" onClick={() => setStatusOn(selected.id, 'Archived')}>Archive</button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default Feedback
