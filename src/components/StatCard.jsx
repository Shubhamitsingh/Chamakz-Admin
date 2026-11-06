import KpiCard from './KpiCard'

/** Compact KPI wrapper kept for existing imports. */
const StatCard = ({ title, value, icon, trend, href, sparkline, unavailable, hint }) => (
  <KpiCard
    title={title}
    value={value}
    icon={icon}
    href={href}
    trend={trend}
    sparkline={sparkline}
    unavailable={unavailable}
    hint={hint}
  />
)

export default StatCard
