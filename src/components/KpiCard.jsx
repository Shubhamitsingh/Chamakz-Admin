import { Link } from 'react-router-dom'
import Sparkline from './Sparkline'

const TONES = {
  slate: { bar: 'bg-slate-400', icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', spark: '#64748b' },
  blue: { bar: 'bg-blue-600', icon: 'bg-blue-600 text-white', spark: '#2563eb' },
  sky: { bar: 'bg-sky-500', icon: 'bg-sky-500 text-white', spark: '#0284c7' },
  emerald: { bar: 'bg-emerald-600', icon: 'bg-emerald-600 text-white', spark: '#059669' },
  teal: { bar: 'bg-teal-600', icon: 'bg-teal-600 text-white', spark: '#0d9488' },
  amber: { bar: 'bg-amber-500', icon: 'bg-amber-500 text-white', spark: '#d97706' },
  orange: { bar: 'bg-orange-500', icon: 'bg-orange-500 text-white', spark: '#ea580c' },
  rose: { bar: 'bg-rose-600', icon: 'bg-rose-600 text-white', spark: '#e11d48' },
  violet: { bar: 'bg-violet-600', icon: 'bg-violet-600 text-white', spark: '#7c3aed' },
  pink: { bar: 'bg-pink-500', icon: 'bg-pink-500 text-white', spark: '#db2777' },
  indigo: { bar: 'bg-indigo-600', icon: 'bg-indigo-600 text-white', spark: '#4f46e5' },
}

const KpiCard = ({
  title,
  value,
  icon: Icon,
  href,
  trend,
  sparkline,
  unavailable,
  hint,
  tone = 'slate',
}) => {
  const colors = TONES[tone] || TONES.slate
  const sparkColor = trend?.direction === 'down' ? '#dc2626' : colors.spark

  const content = (
    <div className="relative h-full overflow-hidden rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <span className={`absolute inset-y-0 left-0 w-0.5 ${colors.bar}`} />
      <div className="flex items-start justify-between gap-2 pl-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 leading-tight">{title}</p>
        {Icon && (
          <span className={`rounded-md p-1 ${colors.icon}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2 pl-1">
        <div>
          <p className="text-lg font-semibold tabular-nums leading-none text-gray-900 dark:text-gray-50">
            {unavailable ? '—' : value}
          </p>
          {unavailable ? (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{hint || 'Not in data yet'}</p>
          ) : trend ? (
            <p
              className={`mt-1 text-[11px] font-medium ${
                trend.direction === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : trend.direction === 'up'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-500'
              }`}
            >
              {trend.label} {trend.hint || 'vs prior period'}
            </p>
          ) : hint ? (
            <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
          ) : null}
        </div>
        {!unavailable && sparkline?.length ? (
          <Sparkline data={sparkline} color={sparkColor} />
        ) : null}
      </div>
    </div>
  )

  if (href && !unavailable) {
    return (
      <Link to={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
