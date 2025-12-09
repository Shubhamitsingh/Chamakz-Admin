import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { loginAdmin, resetPassword } from '../firebase/auth'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginAdmin(formData.email, formData.password)

    if (result.success) {
      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedEmail', formData.email)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberedEmail')
      }
      
      // Login successful - redirect to dashboard
      navigate('/dashboard')
    } else {
      // Show error message
      setError(result.error || 'Login failed. Please check your credentials.')
    }

    setLoading(false)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }

    setResetLoading(true)
    setError('')
    
    const result = await resetPassword(resetEmail)
    
    if (result.success) {
      setResetSuccess(true)
      setTimeout(() => {
        setShowPasswordReset(false)
        setResetEmail('')
        setResetSuccess(false)
      }, 3000)
    } else {
      setError(result.error || 'Failed to send password reset email')
    }
    
    setResetLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('') // Clear error when user types
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="card backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4 shadow-lg"
            >
              <span className="text-white font-bold text-3xl">C</span>
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Chamak Admin</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access the admin panel
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@chamak.com"
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is a secure admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-white/80 text-sm"
        >
          Chamak Admin Panel v1.0.0
        </motion.div>
      </motion.div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => !resetLoading && setShowPasswordReset(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            
            {resetSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-medium mb-2">Email Sent!</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Check your email for password reset instructions.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@chamak.com"
                      className="input-field w-full"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      disabled={resetLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading || !resetEmail}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Login











