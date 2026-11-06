import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, UserCheck, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import KpiCard from '../components/KpiCard'
import { buildUserAnalytics } from '../utils/userManagementData'

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
]

const COLORS = ['#4f46e5', '#059669', '#e11d48', '#d97706', '#0284c7', '#7c3aed', '#db2777', '#0d9488']

const UserAnalytics = () => {
  const [preset, setPreset] = useState('30d')
  const view = useMemo(() => buildUserAnalytics(preset), [preset])

  return (
    <div className="space-y-4">
      <PageHeader
        title="User analytics"
        description="Sample directory metrics. Mock data only — not production counts."
        actions={
          <Link to="/users" className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-700">
            Open directory
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              preset === item.id
                ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10">
        <KpiCard title="Registered" value={view.kpis.total} icon={Users} href="/users" tone="blue" />
        <KpiCard title="New" value={view.kpis.neu} icon={UserCheck} href="/users/new" tone="indigo" />
        <KpiCard title="DAU" value={view.kpis.dau} icon={Activity} href="/users/active" tone="emerald" />
        <KpiCard title="MAU" value={view.kpis.mau} tone="sky" />
        <KpiCard title="Online" value={view.kpis.online} href="/users/online" tone="teal" />
        <KpiCard title="Inactive" value={view.kpis.inactive} href="/users/inactive" tone="slate" />
        <KpiCard title="Verified" value={view.kpis.verified} icon={ShieldCheck} href="/users/verified" tone="violet" />
        <KpiCard title="VIP" value={view.kpis.vip} href="/users/vip" tone="amber" />
        <KpiCard title="Hosts" value={view.kpis.hosts} href="/users/hosts" tone="rose" />
        <KpiCard title="Viewers" value={view.kpis.viewers} href="/users/viewers" tone="orange" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="User growth">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="registered" name="Registered" stroke="#4f46e5" dot={false} />
                <Line type="monotone" dataKey="active" name="Active" stroke="#059669" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Retention">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.retention}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Bar dataKey="value" name="Retention %" radius={2}>
                  {view.retention.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Hosts vs viewers vs agency">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.mix}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={2}>
                  {view.mix.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title={`Onboarding completion · ${view.kpis.onboardingRate}%`}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={view.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="active" name="Active sample" stroke="#0d9488" fill="#0d948822" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="By country">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.byCountry} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="By state">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.byState}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={48} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={2}>
                  {view.byState.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="By city">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.byCity} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={2}>
                {view.byCity.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}

export default UserAnalytics
