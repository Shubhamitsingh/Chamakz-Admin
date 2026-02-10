import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, Shield, Bell, Palette, Settings as SettingsIcon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../firebase/config'

const Settings = () => {
  const { darkMode, toggleDarkMode, showToast, user } = useApp()
  const [settings, setSettings] = useState({
    appName: 'Chamakz Admin',
    supportEmail: 'support@chamakzadmin.com',
    logo: '',
    adminName: 'Admin User',
    adminEmail: 'admin@chamakzadmin.com',
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'general')
        const settingsSnap = await getDoc(settingsRef)
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data()
          setSettings(prev => ({
            ...prev,
            ...data
          }))
          // Set avatar preview if exists
          if (data.adminAvatar) {
            setAvatarPreview(data.adminAvatar)
          }
        }
        
        // Also check Firebase Auth profile for avatar
        if (auth.currentUser?.photoURL) {
          setAvatarPreview(auth.currentUser.photoURL)
        }
      } catch (error) {
        console.log('Settings not found, using defaults')
      }
      setLoading(false)
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to Firebase
      const settingsRef = doc(db, 'settings', 'general')
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Also save to localStorage as backup
      localStorage.setItem('adminSettings', JSON.stringify(settings))

      showToast('Settings saved successfully', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Error saving settings', 'error')
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      showToast('Please fill all password fields', 'error')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    setSaving(true)
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, passwordData.newPassword)
        showToast('Password changed successfully', 'success')
        setPasswordData({ newPassword: '', confirmPassword: '' })
      } else {
        showToast('You must be logged in to change password', 'error')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showToast(`Error changing password: ${error.message}`, 'error')
    }
    setSaving(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error')
        return
      }
      
      setAvatarFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      showToast('Please select an image to upload', 'error')
      return
    }

    setUploadingAvatar(true)
    try {
      const timestamp = Date.now()
      // Use sanitized filename (remove spaces and special chars)
      const sanitizedName = avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `admin_avatars/${auth.currentUser?.uid || 'admin'}/${timestamp}_${sanitizedName}`
      const storageRef = ref(storage, filename)
      
      await uploadBytes(storageRef, avatarFile)
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update settings in Firestore
      const settingsRef = doc(db, 'settings', 'general')
      await updateDoc(settingsRef, {
        adminAvatar: downloadURL,
        updatedAt: new Date().toISOString()
      })
      
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL
        })
      }
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        adminAvatar: downloadURL
      }))
      
      setAvatarFile(null)
      showToast('Avatar uploaded successfully!', 'success')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showToast(`Error uploading avatar: ${error.message}`, 'error')
    }
    setUploadingAvatar(false)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center" style={{ transform: 'rotate(-5deg)' }}>
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Configure application settings and admin preferences</p>
      </motion.div>

      <div className="space-y-6">
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
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Admin Avatar" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {settings.adminName ? settings.adminName.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="btn-secondary cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {avatarFile ? 'Change Image' : 'Upload Avatar'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                  {avatarFile && (
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Save Avatar'}
                    </button>
                  )}
                </div>
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
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="New password"
                  className="input-field mb-2"
                  disabled={saving}
                />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="input-field mb-2"
                  disabled={saving}
                />
                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
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

          {/* Save Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Settings
              </>
            )}
          </motion.button>
      </div>
    </div>
  )
}

export default Settings


