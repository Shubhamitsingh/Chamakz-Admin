import Panel from '../Panel'
import EmptyState from '../EmptyState'

const RANGES = {
  '12a': '12a–4a',
  '4a': '4a–8a',
  '8a': '8a–12p',
  '12p': '12p–4p',
  '4p': '4p–8p',
  '8p': '8p–12a',
}

const swatch = (count, max) => {
  if (!count) return { background: '#f8fafc', color: 'transparent', boxShadow: 'inset 0 0 0 1px #e2e8f0' }
  const ratio = count / max
  if (ratio <= 0.25) return { background: '#cffafe', color: '#0e7490' }
  if (ratio <= 0.5) return { background: '#67e8f9', color: '#155e75' }
  if (ratio < 1) return { background: '#2563eb', color: '#ffffff' }
  return { background: '#0f2744', color: '#ffffff' }
}

const Legend = () => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
    {[
      ['None', '#f8fafc', '#e2e8f0'],
      ['Low', '#cffafe', 'transparent'],
      ['Mid', '#67e8f9', 'transparent'],
      ['High', '#2563eb', 'transparent'],
      ['Peak', '#0f2744', 'transparent'],
    ].map(([label, background, border]) => (
      <span key={label} className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ background, boxShadow: border === 'transparent' ? undefined : `inset 0 0 0 1px ${border}` }} />
        {label}
      </span>
    ))}
  </div>
)

const ActivityHeatmap = ({ heatmap }) => {
  const cells = heatmap?.cells || []
  const max = Math.max(1, ...cells.flat().map((cell) => cell.count))
  const total = cells.flat().reduce((sum, cell) => sum + cell.count, 0)
  const peak = cells.flat().reduce((best, cell) => (cell.count > best.count ? cell : best), { count: 0 })

  return (
    <Panel
      className="surface-raised"
      title="User activity by day and time"
      action={<span className="text-[11px] text-gray-400">Last active in the selected range</span>}
    >
      {total === 0 ? (
        <EmptyState title="No activity in this range" description="Last-active times from the user collection will fill this grid." />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Legend />
            {peak.count > 0 && (
              <p className="text-[11px] text-slate-500">
                Peak <span className="font-semibold text-[#0f2744]">{peak.day} {RANGES[peak.slot] || peak.slot}</span> · {peak.count} users
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[44px_repeat(6,minmax(0,1fr))_52px] gap-1.5">
                <span />
                {heatmap.slots.map((slot) => (
                  <span key={slot} className="pb-1 text-center text-[11px] font-medium text-slate-500">{RANGES[slot] || slot}</span>
                ))}
                <span className="pb-1 text-right text-[11px] font-medium text-slate-500">Total</span>
                {cells.map((row) => {
                  const rowTotal = row.reduce((sum, cell) => sum + cell.count, 0)
                  return (
                    <div key={row[0].day} className="contents">
                      <span className="self-center text-xs font-medium text-slate-600">{row[0].day}</span>
                      {row.map((cell) => {
                        const tone = swatch(cell.count, max)
                        const isPeak = cell.count > 0 && cell.count === peak.count
                        return (
                          <span
                            key={`${cell.day}-${cell.slot}`}
                            title={`${cell.day} ${RANGES[cell.slot] || cell.slot}: ${cell.count} users`}
                            className="flex h-10 items-center justify-center rounded-md text-xs font-semibold tabular-nums"
                            style={{
                              ...tone,
                              outline: isPeak ? '2px solid #06b6d4' : undefined,
                              outlineOffset: isPeak ? '1px' : undefined,
                            }}
                          >
                            {cell.count || ''}
                          </span>
                        )
                      })}
                      <span className="self-center text-right text-xs font-semibold tabular-nums text-slate-700">{rowTotal}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

export default ActivityHeatmap
