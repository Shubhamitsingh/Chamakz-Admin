import { useMemo, useState } from 'react'
import {
  Activity,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KpiCard from '../components/KpiCard'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import IndiaChoropleth from '../components/geo/IndiaChoropleth'
import { buildGeoView, GEO_COUNTRIES, uniqueCities, uniqueStates } from '../utils/geoAnalyticsData'
import { formatCompact } from '../utils/dashboardFields'

const BAR_COLORS = ['#4f46e5', '#059669', '#e11d48', '#d97706', '#0284c7', '#7c3aed', '#db2777', '#0d9488', '#ea580c', '#2563eb']

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom' },
]

const GeoAnalytics = () => {
  const [preset, setPreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [country, setCountry] = useState('India')
  const [state, setState] = useState('all')
  const [city, setCity] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('users')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const view = useMemo(
    () => buildGeoView({ preset, customStart, customEnd, country, state, city }),
    [preset, customStart, customEnd, country, state, city]
  )

  const cityOptions = uniqueCities(state)

  const tableRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = view.table.filter((row) =>
      !query
        ? true
        : `${row.city} ${row.state} ${row.country}`.toLowerCase().includes(query)
    )
    const sorted = [...filtered].sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]
      if (typeof left === 'string') return sortDir === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
      return sortDir === 'asc' ? left - right : right - left
    })
    return sorted.map((row, index) => ({ ...row, rank: index + 1 }))
  }, [view.table, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(tableRows.length / perPage))
  const pageRows = tableRows.slice((page - 1) * perPage, page * perPage)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((value) => (value === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const setLocation = (nextState, nextCity = 'all') => {
    setCountry('India')
    setState(nextState)
    setCity(nextCity)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Geographical analytics"
        description="Sample location view for India. Mock data only — not live GPS or IP tracking."
      />

      <div className="filter-bar">
        {DATE_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPreset(item.id)
              setPage(1)
            }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              preset === item.id
                ? 'bg-pink-500 text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input-field max-w-[140px]" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input-field max-w-[140px]" />
          </>
        )}
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value)
            setState('all')
            setCity('all')
            setPage(1)
          }}
          className="input-field max-w-[150px]"
        >
          <option value="all">All countries</option>
          {GEO_COUNTRIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value)
            setCity('all')
            setPage(1)
          }}
          className="input-field max-w-[170px]"
        >
          <option value="all">All states</option>
          {uniqueStates().map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value)
            setPage(1)
          }}
          className="input-field max-w-[170px]"
        >
          <option value="all">All cities</option>
          {cityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Total users" value={formatCompact(view.kpis.totalUsers)} icon={Users} tone="blue" />
        <KpiCard title="Active users" value={formatCompact(view.kpis.activeUsers)} icon={Activity} tone="emerald" />
        <KpiCard title="New users" value={formatCompact(view.kpis.newUsers)} icon={TrendingUp} tone="sky" />
        <KpiCard title={`Top city · ${view.kpis.topCity}`} value={formatCompact(view.kpis.topCityUsers)} icon={MapPin} tone="violet" />
        <KpiCard title={`Top state · ${view.kpis.topState}`} value={formatCompact(view.kpis.topStateUsers)} icon={MapPin} tone="indigo" />
        <KpiCard title="Fastest region" value={view.kpis.fastestRegion} hint="Highest new-user share" icon={TrendingUp} tone="amber" />
      </div>

      <Panel
        title="All India states"
        action={<span className="text-[11px] text-gray-400">Color by region · size by users</span>}
      >
        {country !== 'all' && country !== 'India' ? (
          <p className="text-sm text-gray-500">
            State board is India-only. Use the table below for {country}.
          </p>
        ) : (
          <IndiaChoropleth
            states={view.allIndiaStates}
            selectedState={state === 'all' ? null : state}
            onSelectState={(name) => setLocation(name)}
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Top 10 states by users">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.topStates} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="users" name="Users" radius={2}>
                  {view.topStates.map((entry, index) => (
                    <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top 20 cities by users">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.topCities}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="city" hide />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="users" name="Users" radius={2}>
                  {view.topCities.map((entry, index) => (
                    <Cell key={entry.city} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Daily new users by location">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mumbai" name="Mumbai" stroke="#2563eb" dot={false} />
                <Line type="monotone" dataKey="bengaluru" name="Bengaluru" stroke="#059669" dot={false} />
                <Line type="monotone" dataKey="hyderabad" name="Hyderabad" stroke="#d97706" dot={false} />
                <Line type="monotone" dataKey="delhi" name="Delhi" stroke="#7c3aed" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Monthly growth by region">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="west" name="West" stroke="#2563eb" fill="#2563eb22" />
                <Area type="monotone" dataKey="south" name="South" stroke="#059669" fill="#05966922" />
                <Area type="monotone" dataKey="north" name="North" stroke="#d97706" fill="#d9770622" />
                <Area type="monotone" dataKey="east" name="East" stroke="#7c3aed" fill="#7c3aed22" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Active users by region">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.regions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="active" name="Active" radius={2}>
                  {view.regions.map((entry, index) => (
                    <Cell key={entry.label} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Fastest growing cities">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.fastestCities} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="city" width={88} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="growth" name="Growth %" radius={2}>
                  {view.fastestCities.map((entry, index) => (
                    <Cell key={entry.city} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Location comparison">
        <div className="mb-3">
          <SearchBar placeholder="Search city, state, or country" value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500 dark:border-gray-700">
                {[
                  ['rank', 'Rank'],
                  ['country', 'Country'],
                  ['state', 'State'],
                  ['city', 'City'],
                  ['users', 'Total users'],
                  ['active', 'Active'],
                  ['neu', 'New'],
                  ['growth', 'Growth %'],
                ].map(([key, label]) => (
                  <th key={key} className="py-2 pr-3">
                    <button type="button" onClick={() => toggleSort(key)} className="font-medium hover:text-gray-900">
                      {label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={`${row.city}-${row.state}`} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 pr-3 tabular-nums">{row.rank}</td>
                  <td className="py-2 pr-3">{row.country}</td>
                  <td className="py-2 pr-3">{row.state}</td>
                  <td className="py-2 pr-3 font-medium">{row.city}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.users.toLocaleString()}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.active.toLocaleString()}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.neu.toLocaleString()}</td>
                  <td className="py-2 pr-3 tabular-nums text-emerald-700">+{row.growth}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={tableRows.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => {
              setPerPage(value)
              setPage(1)
            }}
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { title: 'Top locations', rows: view.insights.top, field: 'users' },
          { title: 'Fastest growing', rows: view.insights.fastest, field: 'growth', suffix: '%' },
          { title: 'Low activity', rows: view.insights.low, field: 'active' },
          { title: 'High registrations', rows: view.insights.registrations, field: 'neu' },
          { title: 'Emerging cities', rows: view.insights.emerging, field: 'growth', suffix: '%' },
        ].map((card) => (
          <Panel key={card.title} title={card.title}>
            <ul className="space-y-2">
              {card.rows.map((row) => (
                <li key={`${card.title}-${row.city}`} className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{row.city}</span>
                  <span className="tabular-nums text-gray-500">
                    {card.suffix ? `+${row[card.field]}${card.suffix}` : formatCompact(row[card.field])}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export default GeoAnalytics
