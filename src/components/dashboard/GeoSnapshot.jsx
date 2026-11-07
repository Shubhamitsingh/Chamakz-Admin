import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '../Panel'
import IndiaChoropleth from '../geo/IndiaChoropleth'
import { buildGeoView } from '../../utils/geoAnalyticsData'
import { formatCompact } from '../../utils/dashboardFields'

const GeoSnapshot = ({ preset = '7d' }) => {
  const navigate = useNavigate()
  const view = useMemo(() => buildGeoView({ preset, country: 'India' }), [preset])

  return (
    <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <Panel
          className="surface-raised flex h-full flex-col"
          title="Geography snapshot"
          action={
            <Link to="/geo-analytics" className="text-xs font-medium text-gray-600 hover:underline">
              Open full map
            </Link>
          }
        >
          <p className="mb-2 text-[11px] text-gray-400">Color tiles for every state — sample dataset, not GPS.</p>
          <IndiaChoropleth
            compact
            states={view.allIndiaStates}
            onSelectState={() => navigate('/geo-analytics')}
          />
        </Panel>
      </div>
      <div className="xl:col-span-5">
        <Panel
          className="surface-raised flex h-full flex-col"
          title="Top cities"
          action={<span className="text-[11px] text-gray-400">{view.kpis.topState} leads states</span>}
        >
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Users</p>
              <p className="text-sm font-semibold tabular-nums">{formatCompact(view.kpis.totalUsers)}</p>
            </div>
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Top city</p>
              <p className="truncate text-sm font-semibold">{view.kpis.topCity}</p>
            </div>
            <div className="rounded-md border border-gray-100 px-2 py-2 dark:border-gray-700">
              <p className="text-[11px] text-gray-500">Fastest</p>
              <p className="truncate text-sm font-semibold">{view.kpis.fastestRegion}</p>
            </div>
          </div>
          <ul className="mb-3 space-y-1.5">
            {view.topCities.slice(0, 6).map((item) => (
              <li key={item.city} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{item.city}</span>
                <span className="tabular-nums text-gray-500">{formatCompact(item.users)}</span>
                <span className="w-12 text-right text-[11px] text-emerald-700">+{item.growth}%</span>
              </li>
            ))}
          </ul>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.topStates.slice(0, 6)} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="users" name="Users" radius={2}>
                  {view.topStates.slice(0, 6).map((entry, index) => (
                    <Cell key={entry.name} fill={['#4f46e5', '#059669', '#e11d48', '#d97706', '#0284c7', '#7c3aed'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default GeoSnapshot
