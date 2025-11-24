import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, Shield, Database, Bell, Palette } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Settings = () => {
  const { darkMode, toggleDarkMode, showToast } = useApp()
  const [settings, setSettings] = useState({
    appName: 'Chamak Admin',
    supportEmail: 'support@chamakadmin.com',
    logo: '',
    adminName: 'Admin User',
    adminEmail: 'admin@chamakadmin.com',
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
  })

  const handleSave = () => {
    showToast('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage application settings and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Menu */}
        <div className="space-y-2">
          {[
            { icon: Palette, label: 'General Settings', id: 'general' },
            { icon: Shield, label: 'Admin Profile', id: 'profile' },
            { icon: Bell, label: 'Notifications', id: 'notifications' },
            { icon: Database, label: 'System', id: 'system' },
          ].map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full card hover:shadow-lg transition-all flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">General Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Application Name</label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Application Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.logo}
                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                    placeholder="Logo URL"
                    className="input-field flex-1"
                  />
                  <button className="btn-secondary px-4">
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={toggleDarkMode}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dark Mode</span>
                    <div className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${darkMode ? 'ml-6' : 'ml-0.5'}`}></div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Admin Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Admin Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  A
                </div>
                <button className="btn-secondary">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Avatar
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={settings.adminName}
                  onChange={(e) => setSettings({ ...settings, adminName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Change Password</label>
                <input
                  type="password"
                  placeholder="New password"
                  className="input-field mb-2"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="input-field"
                />
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Notification Settings</h2>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Push Notifications', key: 'notifications' },
                { label: 'Email Alerts', key: 'emailAlerts' },
                { label: 'SMS Alerts', key: 'smsAlerts' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <span className="font-medium">{item.label}</span>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                    className={`w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-primary-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${settings[item.key] ? 'ml-6' : 'ml-0.5'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">System Management</h2>
            </div>

            <div className="space-y-3">
              <button className="w-full p-4 border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium">
                🔄 Backup Database
              </button>
              <button className="w-full p-4 border-2 border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors font-medium">
                ⚡ Clear Cache
              </button>
              <button className="w-full p-4 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                🔄 Reset Application
              </button>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSave}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save All Settings
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default Settings


