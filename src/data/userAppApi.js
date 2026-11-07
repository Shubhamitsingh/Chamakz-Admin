import { supabase } from '../lib/supabase'

const ready = () => {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function readTable(table, orderColumn = 'created_at', ascending = false) {
  const { data, error } = await ready().from(table).select('*').order(orderColumn, { ascending })
  if (error) throw error
  return data || []
}

export async function readOne(table) {
  const { data, error } = await ready().from(table).select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function insertRow(table, row) {
  const { data, error } = await ready().from(table).insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateRow(table, id, patch, idColumn = 'id') {
  const { data, error } = await ready().from(table).update(patch).eq(idColumn, id).select().single()
  if (error) throw error
  return data
}

export async function deleteRow(table, id, idColumn = 'id') {
  const { error } = await ready().from(table).delete().eq(idColumn, id)
  if (error) throw error
}

export async function loadHostPerformance() {
  const client = ready()
  const [sessionsResult, walletsResult, profilesResult] = await Promise.all([
    client.from('live_sessions').select('host_id, status, started_at, ended_at, peak_viewers'),
    client.from('host_earning_wallets').select('profile_id, host_inr_accrued, diamonds_received'),
    client.from('profiles').select('id, display_name, numeric_id, is_host'),
  ])
  if (sessionsResult.error) throw sessionsResult.error
  if (walletsResult.error) throw walletsResult.error
  if (profilesResult.error) throw profilesResult.error
  const wallets = Object.fromEntries((walletsResult.data || []).map((row) => [row.profile_id, row]))
  const hosts = (profilesResult.data || []).filter((row) => row.is_host)
  return hosts.map((host) => {
    const sessions = (sessionsResult.data || []).filter((row) => row.host_id === host.id)
    const hours = sessions.reduce((sum, session) => {
      const start = new Date(session.started_at).getTime()
      const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now()
      if (!Number.isFinite(start) || end < start) return sum
      return sum + (end - start) / 3600000
    }, 0)
    const peak = sessions.reduce((max, session) => Math.max(max, Number(session.peak_viewers) || 0), 0)
    const wallet = wallets[host.id]
    return {
      id: host.id,
      name: host.display_name,
      numericId: host.numeric_id,
      streams: sessions.length,
      hours,
      peakViewers: peak,
      earningsInr: wallet ? Number(wallet.host_inr_accrued) : 0,
      diamondsReceived: wallet ? Number(wallet.diamonds_received) : 0,
    }
  })
}
