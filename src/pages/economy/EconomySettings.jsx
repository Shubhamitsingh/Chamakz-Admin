import { useState } from 'react'
import { EconomyHeader } from '../../components/economy/Chrome'
import { useEconomy } from '../../economy/EconomyContext'

const EconomySettings = () => {
  const { db, saveSettings } = useEconomy()
  const [form, setForm] = useState(db.settings)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  return (
    <div className="space-y-4">
      <EconomyHeader title="Economy Settings" description="These values apply to future demo calculations. Gifts and payments already saved keep their own rates." />
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Changing a rate does not rewrite history. A production change needs an authorized audit trail and must not be treated as a live money setting in this prototype.</div>
      <div className="grid max-w-xl gap-3">
        {[
          ['inrPerDiamondPurchase', 'Diamonds per ₹1'],
          ['inrValuePerEarnedDiamond', 'INR value per earned diamond'],
          ['hostSharePct', 'Host share %'],
          ['platformSharePct', 'Platform share %'],
          ['minWithdrawal', 'Minimum withdrawal'],
          ['maxWithdrawal', 'Maximum withdrawal'],
          ['minEligibleEarnings', 'Minimum eligible earnings'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-xs text-gray-500">{label}</span>
            <input type="number" value={form[key]} onChange={(event) => set(key, Number(event.target.value))} className="input-field" />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.manualCreditAllowed} onChange={(event) => set('manualCreditAllowed', event.target.checked)} />
          Manual admin credit allowed
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="button" className="btn-primary w-fit" onClick={() => setConfirming(true)}>Review changes</button>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center">
          <div className="w-full max-w-md rounded-t-xl bg-white p-4 shadow-xl sm:rounded-xl">
            <p className="text-sm font-medium">Apply these demo settings?</p>
            <p className="mt-1 text-sm text-gray-600">Host {form.hostSharePct}% + platform {form.platformSharePct}% must equal 100%.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => { try { saveSettings(form); setError(''); setConfirming(false) } catch (err) { setError(err.message); setConfirming(false) } }}>Apply</button>
              <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EconomySettings
