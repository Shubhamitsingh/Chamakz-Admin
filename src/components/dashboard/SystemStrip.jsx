import Panel from '../Panel'

const Status = ({ label, value, ok, muted }) => (
  <div className="rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className={`mt-0.5 text-sm font-semibold ${muted ? 'text-gray-500' : ok ? 'text-emerald-700' : 'text-red-600'}`}>
      {value}
    </p>
  </div>
)

const SystemStrip = ({ health }) => (
  <Panel title="System">
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <Status
        label="Database"
        ok={health.firebase === 'ok'}
        value={
          health.firebase === 'ok'
            ? health.mock
              ? 'Local mock store'
              : 'Connected'
            : health.firebase === 'checking'
              ? 'Checking'
              : 'Unreachable'
        }
      />
      <Status label="Admin session" ok value="Signed in" />
      <Status label="API latency" muted value="No APM wired" />
      <Status label="Live media server" muted value="Not connected" />
    </div>
    {health.error ? <p className="mt-2 text-xs text-red-600">{health.error}</p> : null}
  </Panel>
)

export default SystemStrip
