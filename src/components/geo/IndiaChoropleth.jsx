import { useMemo, useState } from 'react'

const REGION_ORDER = ['North', 'Northeast', 'West', 'Central', 'East', 'South', 'Islands']

const REGION_TONES = {
  North: { bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  Northeast: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-800 border-rose-200' },
  West: { bar: 'bg-violet-500', chip: 'bg-violet-50 text-violet-800 border-violet-200' },
  Central: { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-800 border-sky-200' },
  East: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-900 border-amber-200' },
  South: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  Islands: { bar: 'bg-slate-500', chip: 'bg-slate-100 text-slate-800 border-slate-200' },
}

const STATE_COLOR = {
  Delhi: '#4f46e5',
  'Uttar Pradesh': '#2563eb',
  Haryana: '#0ea5e9',
  Punjab: '#7c3aed',
  Uttarakhand: '#8b5cf6',
  Chandigarh: '#06b6d4',
  'Jammu and Kashmir': '#3b82f6',
  'Himachal Pradesh': '#6366f1',
  Ladakh: '#1d4ed8',
  Assam: '#e11d48',
  Tripura: '#db2777',
  Manipur: '#f43f5e',
  Meghalaya: '#ec4899',
  'Arunachal Pradesh': '#f97316',
  Nagaland: '#ef4444',
  Mizoram: '#e879f9',
  Sikkim: '#c026d3',
  Maharashtra: '#6d28d9',
  Gujarat: '#a855f7',
  Rajasthan: '#d946ef',
  Goa: '#9333ea',
  'Dadra and Nagar Haveli and Daman and Diu': '#be185d',
  'Madhya Pradesh': '#0284c7',
  Chhattisgarh: '#0891b2',
  'West Bengal': '#ea580c',
  Bihar: '#f59e0b',
  Odisha: '#d97706',
  Jharkhand: '#ca8a04',
  Karnataka: '#059669',
  'Tamil Nadu': '#10b981',
  Telangana: '#0d9488',
  Kerala: '#16a34a',
  'Andhra Pradesh': '#22c55e',
  Puducherry: '#65a30d',
  'Andaman and Nicobar': '#475569',
  Lakshadweep: '#0f766e',
}

const STATE_CODE = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  Assam: 'AS',
  Bihar: 'BR',
  Chhattisgarh: 'CG',
  Goa: 'GA',
  Gujarat: 'GJ',
  Haryana: 'HR',
  'Himachal Pradesh': 'HP',
  Jharkhand: 'JH',
  Karnataka: 'KA',
  Kerala: 'KL',
  'Madhya Pradesh': 'MP',
  Maharashtra: 'MH',
  Manipur: 'MN',
  Meghalaya: 'ML',
  Mizoram: 'MZ',
  Nagaland: 'NL',
  Odisha: 'OD',
  Punjab: 'PB',
  Rajasthan: 'RJ',
  Sikkim: 'SK',
  'Tamil Nadu': 'TN',
  Telangana: 'TS',
  Tripura: 'TR',
  'Uttar Pradesh': 'UP',
  Uttarakhand: 'UK',
  'West Bengal': 'WB',
  Delhi: 'DL',
  'Jammu and Kashmir': 'JK',
  Ladakh: 'LA',
  Chandigarh: 'CH',
  Puducherry: 'PY',
  'Andaman and Nicobar': 'AN',
  Lakshadweep: 'LD',
  'Dadra and Nagar Haveli and Daman and Diu': 'DD',
}

const IndiaChoropleth = ({ states, selectedState, onSelectState, compact = false }) => {
  const [hover, setHover] = useState(null)
  const grouped = useMemo(
    () =>
      REGION_ORDER.map((region) => ({
        region,
        items: states.filter((item) => item.region === region).sort((a, b) => b.users - a.users),
      })).filter((group) => group.items.length > 0),
    [states]
  )

  return (
    <div className="relative">
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {grouped.map((group) => {
          const tone = REGION_TONES[group.region] || REGION_TONES.Islands
          const regionTotal = group.items.reduce((sum, item) => sum + item.users, 0)
          return (
            <div key={group.region} className="rounded-lg border border-gray-100 p-2.5 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}>
                  {group.region}
                </span>
                <span className="text-[11px] tabular-nums text-gray-500">{regionTotal.toLocaleString()} users</span>
              </div>
              <div className={`grid gap-1.5 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {group.items.map((item) => {
                  const active = selectedState === item.name
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => onSelectState?.(item.name)}
                      onMouseEnter={() => setHover(item)}
                      onMouseLeave={() => setHover(null)}
                      className={`rounded-md px-2 py-1.5 text-left text-white transition-transform hover:scale-[1.03] ${
                        active ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                      }`}
                      style={{ background: STATE_COLOR[item.name] || '#4f46e5' }}
                    >
                      <p className="text-[10px] font-semibold tracking-wide opacity-90">{STATE_CODE[item.name] || item.name.slice(0, 2)}</p>
                      <p className={`truncate ${compact ? 'text-[11px]' : 'text-xs'} font-medium`}>{item.name}</p>
                      <p className="text-[11px] tabular-nums opacity-90">{item.users.toLocaleString()}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {!compact && (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="flex h-3 w-full">
            {grouped.map((group) => {
              const total = states.reduce((sum, item) => sum + item.users, 1)
              const share = group.items.reduce((sum, item) => sum + item.users, 0) / total
              const tone = REGION_TONES[group.region]
              return (
                <div
                  key={group.region}
                  className={tone.bar}
                  style={{ width: `${Math.max(share * 100, 2)}%` }}
                  title={`${group.region} ${(share * 100).toFixed(1)}%`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 px-2 py-1.5 text-[10px] text-gray-500">
            {REGION_ORDER.filter((region) => grouped.some((group) => group.region === region)).map((region) => (
              <span key={region} className="inline-flex items-center gap-1">
                <span className={`h-2 w-2 rounded-sm ${REGION_TONES[region].bar}`} />
                {region}
              </span>
            ))}
          </div>
        </div>
      )}

      {hover && (
        <div className="mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800">
          <p className="font-semibold">{hover.name}</p>
          <p className="text-gray-500">{hover.region} · {hover.cities?.length || 0} cities in sample</p>
          <div className="mt-1 grid grid-cols-4 gap-2 tabular-nums">
            <span>Users {hover.users.toLocaleString()}</span>
            <span>Active {hover.active.toLocaleString()}</span>
            <span>New {hover.neu.toLocaleString()}</span>
            <span className="text-emerald-700">+{hover.growth}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndiaChoropleth
