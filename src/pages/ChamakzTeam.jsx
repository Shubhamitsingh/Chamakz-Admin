import { useMemo, useState } from 'react'
import { ImagePlus, Megaphone, Send, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import SearchBar from '../components/SearchBar'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import KpiCard from '../components/KpiCard'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import {
  POSTERS,
  TEAM_AUDIENCES,
  TEAM_PRIORITIES,
  createTeamBroadcast,
  deleteTeamBroadcast,
  formatWhen,
  listTeamBroadcasts,
  priorityTone,
  statusTone,
} from '../utils/teamBroadcastsData'

const Cover = ({ row, className = 'h-28 w-40' }) => {
  if (row.image) {
    return <img src={row.image} alt="" className={`rounded-xl object-cover ${className}`} />
  }
  const poster = POSTERS[row.poster]
  if (!poster) return null
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${poster.className} ${className}`}>
      <span className="text-3xl leading-none">{poster.emoji}</span>
      <span className="mt-1 text-[11px] font-medium">{poster.label}</span>
    </div>
  )
}

const ChamakzTeam = () => {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('All users')
  const [priority, setPriority] = useState('Medium')
  const [image, setImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [removeId, setRemoveId] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  const rows = useMemo(() => listTeamBroadcasts(), [tick])
  const refresh = () => setTick((value) => value + 1)

  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase()
    if (audienceFilter !== 'all' && row.audience !== audienceFilter) return false
    if (!q) return true
    return `${row.id} ${row.title} ${row.body} ${row.audience}`.toLowerCase().includes(q)
  })

  const counts = {
    all: rows.length,
    Published: rows.filter((row) => row.status === 'Published').length,
    Draft: rows.filter((row) => row.status === 'Draft').length,
    withImage: rows.filter((row) => row.image || row.poster).length,
  }

  const pickImage = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Choose a JPG, PNG, or WebP image', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Keep the sample image under 5 MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
      setImageName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const save = (nextStatus) => {
    if (!title.trim()) {
      showToast('Add a title', 'error')
      return
    }
    if (!body.trim() && !image) {
      showToast('Add message copy or an image', 'error')
      return
    }
    createTeamBroadcast({ title, body, audience, priority, status: nextStatus, image, imageName })
    setTitle('')
    setBody('')
    setPriority('Medium')
    setImage(null)
    setImageName('')
    refresh()
    showToast(
      nextStatus === 'Published'
        ? 'Saved as a published sample notice. Nothing was sent to users.'
        : 'Saved as a draft in this admin inbox. Nothing was sent to users.',
      'success'
    )
  }

  const remove = () => {
    if (!removeId) return
    deleteTeamBroadcast(removeId)
    setRemoveId(null)
    refresh()
    showToast('Removed from this sample inbox. The live app was not changed.', 'success')
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Chamakz Team"
        description="Sample team notices with optional image. Saving stays in this admin inbox — nothing is emailed or pushed to users."
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard title="Total" value={counts.all} icon={Megaphone} tone="slate" />
        <KpiCard title="Published samples" value={counts.Published} icon={Send} tone="emerald" />
        <KpiCard title="Drafts" value={counts.Draft} icon={Megaphone} tone="amber" />
        <KpiCard title="With image" value={counts.withImage} icon={ImagePlus} tone="pink" />
      </div>

      <Panel title="Compose sample notice">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="input-field min-h-[96px]" placeholder="Message copy (optional if you attach an image)" value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium">Audience
                <select className="input-field mt-1" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  {TEAM_AUDIENCES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium">Priority
                <select className="input-field mt-1" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {TEAM_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Image</p>
            {image ? (
              <div className="relative overflow-hidden rounded-2xl border border-pink-100">
                <img src={image} alt="" className="h-40 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-3 py-2 text-[11px] text-white">
                  <span className="truncate">{imageName}</span>
                  <button type="button" className="rounded-full bg-white/20 px-2 py-0.5" onClick={() => { setImage(null); setImageName('') }}>Remove</button>
                </div>
              </div>
            ) : (
              <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-pink-300 bg-gradient-to-br from-pink-50 to-violet-50 text-center dark:border-pink-800 dark:from-pink-950/30 dark:to-violet-950/20">
                <ImagePlus className="h-7 w-7 text-pink-500" />
                <span className="mt-2 text-sm font-medium text-pink-700 dark:text-pink-300">Attach an image</span>
                <span className="mt-0.5 text-[11px] text-gray-500">JPG, PNG, WebP · under 5 MB · stays local</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0])}
                />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200 dark:ring-gray-600" onClick={() => save('Draft')}>Save draft</button>
              <button type="button" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white" onClick={() => save('Published')}>
                <Send className="h-3.5 w-3.5" /> Save sample
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search notices" value={search} onChange={setSearch} />
        {['all', ...TEAM_AUDIENCES].map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-xs ${audienceFilter === item ? 'bg-pink-500 text-white' : 'bg-white ring-1 ring-gray-200 dark:bg-gray-800'}`} onClick={() => setAudienceFilter(item)}>
            {item === 'all' ? 'All audiences' : item}
          </button>
        ))}
      </div>

      <Panel title="Sample inbox" action={<span className="text-[11px] text-gray-500">{filtered.length} shown</span>} padded={false}>
        {filtered.length === 0 ? (
          <EmptyState title="No sample notices" description="Save a draft or sample notice above." />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((row) => (
              <article key={row.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                <button type="button" className="shrink-0 text-left" onClick={() => (row.image || row.poster) && setLightbox(row)}>
                  <Cover row={row} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{row.title}</h2>
                    <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>
                    <StatusBadge tone={priorityTone(row.priority)}>{row.priority}</StatusBadge>
                    <StatusBadge tone="info">{row.audience}</StatusBadge>
                  </div>
                  {row.body && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{row.body}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{row.id} · {row.author} · {formatWhen(row.createdAt)}{row.imageName ? ` · ${row.imageName}` : ''}</p>
                </div>
                <button type="button" className="shrink-0 rounded-md px-2 py-1 text-[11px] text-rose-700 ring-1 ring-rose-200" onClick={() => setRemoveId(row.id)}>Delete</button>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Modal isOpen={Boolean(removeId)} onClose={() => setRemoveId(null)} title="Remove sample notice">
        <p className="text-sm text-gray-600 dark:text-gray-300">This only deletes the row in this admin inbox. Users are not notified.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200" onClick={() => setRemoveId(null)}>Cancel</button>
          <button type="button" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white" onClick={remove}>Delete sample</button>
        </div>
      </Modal>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setLightbox(null)} aria-label="Close image">
            <X className="h-5 w-5" />
          </button>
          {lightbox.image ? (
            <img src={lightbox.image} alt="" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
          ) : (
            <Cover row={lightbox} className="h-64 w-80" />
          )}
        </div>
      )}
    </div>
  )
}

export default ChamakzTeam
