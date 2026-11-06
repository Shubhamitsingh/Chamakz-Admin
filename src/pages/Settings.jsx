import { useEffect, useState } from 'react'
import { Save, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'

const STORAGE_KEY = 'chamakzAdminSettings'

const defaults = {
  appName: 'Chamakz Admin',
  supportEmail: 'support@chamakz.com',
  logo: '',
  adminName: 'Admin User',
  adminEmail: 'admin@chamakz.com',
  adminAvatar: '',
  notifications: true,
  emailAlerts: false,
  smsAlerts: false,
}

const Toggle = ({ on, onClick, label, hint }) => (
  <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left dark:border-gray-700">
    <span>
      <span className="block text-sm font-medium">{label}</span>
      {hint ? <span className="text-[11px] text-gray-500">{hint}</span> : null}
    </span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full ${on ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${on ? 'left-5' : 'left-0.5'}`} />
    </span>
  </button>
)

const Settings = () => {
  const { darkMode, toggleDarkMode, showToast } = useApp()
  const [settings, setSettings] = useState(defaults)
  const [password, setPassword] = useState({ next: '', confirm: '' })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved) {
        setSettings({ ...defaults, ...saved })
      }
    } catch {
      setSettings(defaults)
    }
  }, [])

  const patch = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const pickFile = (file, key) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Choose a JPG, PNG, or WebP image', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Keep the sample image under 5 MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      patch(key, reader.result)
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    showToast('Preferences saved on this device. They are not synced to a live backend.', 'success')
  }

  const changePassword = () => {
    if (!password.next || !password.confirm) {
      showToast('Fill both password fields', 'error')
      return
    }
    if (password.next !== password.confirm) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (password.next.length < 6) {
      showToast('Use at least 6 characters', 'error')
      return
    }
    setPassword({ next: '', confirm: '' })
    showToast('Sample password note saved locally. The login account was not changed.', 'success')
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Settings"
        description="Admin preferences for this browser. Dark mode applies immediately. Nothing is emailed or pushed to users."
        actions={
          <button type="button" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white" onClick={save}>
            <Save className="h-3.5 w-3.5" /> Save preferences
          </button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="General">
          <div className="space-y-3">
            <label className="block text-xs font-medium">Application name
              <input className="input-field mt-1" value={settings.appName} onChange={(e) => patch('appName', e.target.value)} />
            </label>
            <label className="block text-xs font-medium">Support email (display only)
              <input className="input-field mt-1" type="email" value={settings.supportEmail} onChange={(e) => patch('supportEmail', e.target.value)} />
            </label>
            <div>
              <p className="mb-1 text-xs font-medium">Logo</p>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-pink-500 text-lg font-bold text-white">
                  {settings.logo ? <img src={settings.logo} alt="" className="h-full w-full object-cover" /> : 'C'}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200 dark:ring-gray-600">
                  <Upload className="h-3.5 w-3.5" /> Upload sample logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], 'logo')} />
                </label>
              </div>
            </div>
            <Toggle
              label="Dark mode"
              hint="Applies to this admin panel immediately"
              on={darkMode}
              onClick={toggleDarkMode}
            />
          </div>
        </Panel>

        <Panel title="Admin profile">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-xl font-semibold text-white">
                {settings.adminAvatar ? <img src={settings.adminAvatar} alt="" className="h-full w-full object-cover" /> : (settings.adminName || 'A').charAt(0)}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200 dark:ring-gray-600">
                <Upload className="h-3.5 w-3.5" /> Upload avatar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0], 'adminAvatar')} />
              </label>
            </div>
            <label className="block text-xs font-medium">Name
              <input className="input-field mt-1" value={settings.adminName} onChange={(e) => patch('adminName', e.target.value)} />
            </label>
            <label className="block text-xs font-medium">Email
              <input className="input-field mt-1" type="email" value={settings.adminEmail} onChange={(e) => patch('adminEmail', e.target.value)} />
            </label>
            <div>
              <p className="mb-1 text-xs font-medium">Password (sample only)</p>
              <input className="input-field mb-2" type="password" placeholder="New password" value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} />
              <input className="input-field mb-2" type="password" placeholder="Confirm password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
              <button type="button" className="rounded-md px-3 py-1.5 text-xs ring-1 ring-gray-200 dark:ring-gray-600" onClick={changePassword}>Update sample password</button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Admin alerts">
        <p className="mb-3 text-xs text-gray-500">These flags only change this settings screen. They do not send email, SMS, or push to users.</p>
        <div className="grid gap-2 md:grid-cols-3">
          <Toggle label="In-panel alerts" hint="Toasts and badges in this admin" on={settings.notifications} onClick={() => patch('notifications', !settings.notifications)} />
          <Toggle label="Email alerts" hint="Display preference only" on={settings.emailAlerts} onClick={() => patch('emailAlerts', !settings.emailAlerts)} />
          <Toggle label="SMS alerts" hint="Display preference only" on={settings.smsAlerts} onClick={() => patch('smsAlerts', !settings.smsAlerts)} />
        </div>
      </Panel>
    </div>
  )
}

export default Settings
