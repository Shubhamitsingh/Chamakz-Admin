const Sparkline = ({ data = [], color = '#0f766e', width = 72, height = 24 }) => {
  if (!data.length) {
    return <div className="h-6 w-[72px]" />
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = data.length === 1 ? width : width / (data.length - 1)
  const points = data
    .map((value, index) => {
      const x = index * step
      const y = height - ((value - min) / range) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

export default Sparkline
