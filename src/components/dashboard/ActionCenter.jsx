import { Link } from 'react-router-dom'
import { AlertTriangle, Radio, Ticket, UserCheck, Wallet } from 'lucide-react'

const ActionCenter = ({ metrics, availability }) => {
  const items = [
    {
      label: 'Host applications',
      value: metrics.pendingHostApps,
      href: '/host-applications',
      icon: UserCheck,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
    },
    {
      label: 'Withdrawals',
      value: metrics.pendingWithdrawals,
      href: '/transactions',
      icon: Wallet,
      tone: 'text-teal-800 bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900',
    },
    {
      label: 'Safety reports',
      value: metrics.pendingReports,
      href: '/complaints',
      icon: AlertTriangle,
      urgent: metrics.highPriorityReports > 0,
      hint: metrics.highPriorityReports ? `${metrics.highPriorityReports} high priority` : null,
      tone: 'text-orange-800 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900',
    },
    {
      label: 'Support tickets',
      value: metrics.openTickets,
      href: '/tickets',
      icon: Ticket,
      tone: 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
    },
    {
      label: 'Live rooms',
      value: metrics.liveRooms,
      href: '#live-ops',
      icon: Radio,
      tone: 'text-rose-800 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900',
    },
    {
      label: 'Offline recharges',
      value: metrics.pendingRecharges,
      href: '/transactions',
      icon: Wallet,
      missing: !availability.recharges,
      tone: 'text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700',
    },
  ]

  const totalQueue = items.reduce((sum, item) => sum + (item.missing ? 0 : Number(item.value) || 0), 0)

  return (
    <section className="surface-raised rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
        <div>
          <h2 className="text-sm font-semibold">Action center</h2>
          <p className="text-[11px] text-gray-500">Work that needs an admin decision right now</p>
        </div>
        <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-gray-900">
          {totalQueue} open
        </span>
      </div>
      <div className="grid grid-cols-1 min-[376px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon
          const body = (
            <div className={`h-full border-r border-b border-gray-100 p-3 last:border-r-0 dark:border-gray-700 ${item.urgent ? 'bg-rose-50/70 dark:bg-rose-950/20' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-md border p-1 ${item.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.urgent ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-700">Urgent</span>
                ) : null}
              </div>
              <p className="mt-2 text-xl font-semibold tabular-nums leading-none">
                {item.missing ? '—' : item.value}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.label}</p>
              <p className="text-[11px] text-gray-400">
                {item.missing ? 'Collection not present' : item.hint || 'Open queue'}
              </p>
            </div>
          )
          if (item.href.startsWith('#')) {
            return (
              <a key={item.label} href={item.href} className="block hover:bg-gray-50 dark:hover:bg-gray-700/40">
                {body}
              </a>
            )
          }
          return (
            <Link key={item.label} to={item.href} className="block hover:bg-gray-50 dark:hover:bg-gray-700/40">
              {body}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default ActionCenter
