const tones = {
  success: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  danger: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
  warning: 'text-amber-800 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
  info: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
}

const StatusBadge = ({ children, tone = 'neutral', icon: Icon }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${tones[tone] || tones.neutral}`}>
    {Icon ? <Icon className="w-3 h-3" /> : null}
    {children}
  </span>
)

export default StatusBadge
