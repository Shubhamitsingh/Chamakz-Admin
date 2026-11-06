import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Send, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SearchBar from '../components/SearchBar'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { useApp } from '../context/AppContext'
import {
  formatClock,
  formatDay,
  formatWhen,
  getChat,
  listChats,
  markChatRead,
  sameDay,
  sendChatMessage,
  setChatStatus,
} from '../utils/chatsData'

const Avatar = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
    {(name || '?').charAt(0)}
  </span>
)

const Chats = () => {
  const { showToast } = useApp()
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [showJump, setShowJump] = useState(false)
  const endRef = useRef(null)
  const scrollerRef = useRef(null)

  const chats = useMemo(() => listChats(), [tick])
  const selected = selectedId ? getChat(selectedId) : null
  const refresh = () => setTick((value) => value + 1)

  useEffect(() => {
    if (!selectedId && chats[0]) setSelectedId(chats[0].id)
  }, [chats, selectedId])

  useEffect(() => {
    if (!selectedId) return
    markChatRead(selectedId)
    refresh()
  }, [selectedId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages?.length, selectedId])

  const filtered = chats.filter((chat) => {
    const q = search.trim().toLowerCase()
    const matches = !q || `${chat.user.name} ${chat.user.numericId} ${chat.lastMessage} ${chat.topic}`.toLowerCase().includes(q)
    if (!matches) return false
    if (filter === 'unread') return chat.unread > 0
    if (filter === 'active') return chat.status === 'active'
    if (filter === 'closed') return chat.status === 'closed'
    return true
  })

  const counts = {
    all: chats.length,
    unread: chats.filter((chat) => chat.unread > 0).length,
    active: chats.filter((chat) => chat.status === 'active').length,
    closed: chats.filter((chat) => chat.status === 'closed').length,
  }

  const send = () => {
    if (!selected || !draft.trim() || selected.status === 'closed') return
    sendChatMessage(selected.id, draft.trim())
    setDraft('')
    refresh()
    showToast('Sample reply saved in this inbox. Nothing was sent to the user.', 'success')
  }

  const grouped = []
  if (selected) {
    selected.messages.forEach((msg, index) => {
      const prev = selected.messages[index - 1]
      if (!prev || !sameDay(prev.at, msg.at)) grouped.push({ type: 'day', at: msg.at, id: `d-${msg.id}` })
      grouped.push({ type: 'msg', ...msg })
    })
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Support chats"
        description="Sample inbox only. Replies stay in this admin view and are not delivered to users."
      />

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" style={{ height: 'calc(100vh - 150px)' }}>
        <div className="flex h-full">
          <aside className="flex w-80 shrink-0 flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
              <SearchBar placeholder="Search name, ID, or message" value={search} onChange={setSearch} />
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'active', label: 'Open' },
                  { id: 'closed', label: 'Closed' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-full px-2.5 py-1 text-[11px] ${filter === item.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-gray-100 dark:bg-gray-700'}`}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label} {counts[item.id]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState title="No chats match" description="Clear search or filters to see the sample inbox." />
              ) : (
                filtered.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => { setSelectedId(chat.id); setInfoOpen(false) }}
                    className={`flex w-full gap-3 border-b border-gray-100 px-3 py-3 text-left dark:border-gray-800 ${selectedId === chat.id ? 'bg-sky-50 dark:bg-sky-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/80'}`}
                  >
                    <Avatar name={chat.user.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{chat.user.name}</p>
                        <span className="shrink-0 text-[11px] text-gray-400">{formatWhen(chat.lastMessageAt)}</span>
                      </div>
                      <p className="font-mono text-[11px] text-gray-400">{chat.user.numericId} · {chat.topic}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-300">{chat.lastMessage}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StatusBadge tone={chat.status === 'closed' ? 'neutral' : 'success'}>{chat.status === 'closed' ? 'Closed' : 'Open'}</StatusBadge>
                        {chat.unread > 0 && (
                          <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-medium text-white">{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="relative flex min-w-0 flex-1 flex-col">
            {selected ? (
              <>
                <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={selected.user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selected.user.name}</p>
                      <p className="font-mono text-[11px] text-gray-500">{selected.user.numericId} · {selected.topic} · {selected.platform}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge tone={selected.status === 'closed' ? 'neutral' : 'success'}>{selected.status === 'closed' ? 'Closed' : 'Open'}</StatusBadge>
                    <button type="button" className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200 dark:ring-gray-600" onClick={() => setInfoOpen(true)}>Details</button>
                    {selected.status === 'closed' ? (
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200 dark:ring-gray-600"
                        onClick={() => { setChatStatus(selected.id, 'active'); refresh(); showToast('Sample chat reopened', 'success') }}
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-[11px] ring-1 ring-gray-200 dark:ring-gray-600"
                        onClick={() => { setChatStatus(selected.id, 'closed'); refresh(); showToast('Sample chat closed', 'success') }}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </header>

                <div
                  ref={scrollerRef}
                  className="relative flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4 dark:bg-gray-900"
                  onScroll={(event) => {
                    const el = event.currentTarget
                    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 180)
                  }}
                >
                  {grouped.map((row) => (
                    row.type === 'day' ? (
                      <p key={row.id} className="py-2 text-center text-[11px] text-gray-400">{formatDay(row.at)}</p>
                    ) : (
                      <div key={row.id} className={`flex ${row.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${row.sender === 'admin' ? 'rounded-br-md bg-pink-600 text-white' : 'rounded-bl-md border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}>
                          <p className="text-[11px] opacity-70">{row.senderName} · {formatClock(row.at)}</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{row.text}</p>
                        </div>
                      </div>
                    )
                  ))}
                  <div ref={endRef} />
                  <AnimatePresence>
                    {showJump && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-3 right-3 rounded-full bg-slate-900 p-2 text-white"
                        onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <footer className="border-t border-gray-200 p-3 dark:border-gray-700">
                  {selected.status === 'closed' ? (
                    <p className="text-xs text-gray-500">This sample thread is closed. Reopen it to add another local reply.</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        value={draft}
                        placeholder="Write a sample reply…"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      />
                      <button type="button" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={!draft.trim()} onClick={send}>
                        <Send className="h-4 w-4" /> Send
                      </button>
                    </div>
                  )}
                </footer>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState title="Select a chat" description="Pick a conversation from the sample inbox." />
              </div>
            )}

            <AnimatePresence>
              {infoOpen && selected && (
                <>
                  <motion.button type="button" aria-label="Close details" className="absolute inset-0 z-40 bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfoOpen(false)} />
                  <motion.aside
                    initial={{ x: 320 }}
                    animate={{ x: 0 }}
                    exit={{ x: 320 }}
                    className="absolute inset-y-0 right-0 z-50 w-80 overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold">Chat details</p>
                      <button type="button" className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setInfoOpen(false)}><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar name={selected.user.name} />
                      <div>
                        <p className="font-medium">{selected.user.name}</p>
                        <p className="font-mono text-[11px] text-gray-500">{selected.user.numericId}</p>
                        <p className="text-xs text-gray-500">{selected.user.email}</p>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Thread</dt><dd className="font-mono">{selected.id}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Topic</dt><dd>{selected.topic}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Platform</dt><dd>{selected.platform}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Status</dt><dd>{selected.status === 'closed' ? 'Closed' : 'Open'}</dd></div>
                      <div className="flex justify-between gap-2"><dt className="text-gray-500">Last message</dt><dd>{formatWhen(selected.lastMessageAt)}</dd></div>
                    </dl>
                    <Link className="mt-4 inline-block text-xs font-medium text-sky-700" to={`/users/profile/${selected.user.id}`}>Open user profile</Link>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Chats
