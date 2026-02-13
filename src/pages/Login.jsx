import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, CheckCircle, TrendingUp, ShoppingCart } from 'lucide-react'
import { loginAdmin, resetPassword, getCurrentUser } from '../firebase/auth'
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
  const [emailError, setEmailError] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    // Clear previous errors
    setError('')
    setEmailError('')
    
    // Validate email format before submitting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    
    if (!formData.password) {
      setError('Please enter your password.')
      return
    }
    
    setLoading(true)

    try {
      console.log('🔐 Attempting login with:', formData.email)
      const result = await loginAdmin(formData.email, formData.password)
      console.log('🔐 Login result:', result)

      if (result.success) {
        console.log('✅ Login successful!')
        
        // Save remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('rememberedEmail', formData.email)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('rememberedEmail')
        }
        
        // Wait for auth state to update, then redirect
        // Check auth state multiple times to ensure it's updated
        let attempts = 0
        const maxAttempts = 10
        const checkAuthAndRedirect = () => {
          attempts++
          const currentUser = getCurrentUser()
          console.log('🔍 Checking auth state, attempt:', attempts, 'User:', currentUser ? 'Found' : 'Not found')
          
          if (currentUser) {
            console.log('✅ Auth state confirmed! Redirecting to dashboard...')
            navigate('/dashboard', { replace: true })
          } else if (attempts < maxAttempts) {
            // Wait 100ms and check again
            setTimeout(checkAuthAndRedirect, 100)
          } else {
            // Fallback: redirect anyway after max attempts
            console.log('⚠️ Auth state not updated, redirecting anyway...')
            navigate('/dashboard', { replace: true })
          }
        }
        
        // Start checking after a short delay
        setTimeout(checkAuthAndRedirect, 200)
      } else {
        // Show error message with better formatting
        const errorMessage = result.error || 'Login failed. Please check your credentials.'
        console.error('❌ Login failed:', errorMessage)
        
        // Format Firebase error messages for user
        let userFriendlyError = errorMessage
        if (errorMessage.includes('auth/user-not-found')) {
          userFriendlyError = 'No account found with this email address.'
        } else if (errorMessage.includes('auth/wrong-password')) {
          userFriendlyError = 'Incorrect password. Please try again.'
        } else if (errorMessage.includes('auth/invalid-email')) {
          userFriendlyError = 'Invalid email address format.'
        } else if (errorMessage.includes('auth/too-many-requests')) {
          userFriendlyError = 'Too many failed attempts. Please try again later.'
        } else if (errorMessage.includes('auth/network-request-failed')) {
          userFriendlyError = 'Network error. Please check your internet connection.'
        }
        
        setError(userFriendlyError)
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
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
    const value = e.target.value
    const fieldName = e.target.name
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }))
    
    setError('') // Clear error when user types
    
    // Email validation (only validate when user has typed something)
    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      // Only show error if user has typed something and it's invalid
      if (value.length > 0 && !emailRegex.test(value)) {
        setEmailError('Email is invalid.')
      } else {
        setEmailError('')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Stats (2/3 width) */}
      <div className="hidden lg:flex lg:w-2/3 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
        {/* Background Patterns - Subtle circular outlines */}
        <div className="absolute inset-0 opacity-15">
          {/* Top-left cluster - overlapping circles */}
          <div className="absolute -top-20 -left-20 w-96 h-96 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute top-10 left-10 w-80 h-80 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute top-32 left-32 w-64 h-64 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute top-16 left-16 w-72 h-72 border border-gray-300 dark:border-gray-700 rounded-full opacity-60" />
          
          {/* Bottom-right cluster - overlapping circles */}
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute bottom-40 right-40 w-80 h-80 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute bottom-60 right-60 w-64 h-64 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute bottom-30 right-30 w-72 h-72 border border-gray-300 dark:border-gray-700 rounded-full opacity-60" />
          
          {/* Center elements */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-56 h-56 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 border border-gray-300 dark:border-gray-700 rounded-full opacity-70" />
          
          {/* Additional subtle elements */}
          <div className="absolute top-1/4 right-1/4 w-48 h-48 border border-gray-300 dark:border-gray-700 rounded-full opacity-50" />
          <div className="absolute bottom-1/4 left-1/3 w-52 h-52 border border-gray-300 dark:border-gray-700 rounded-full opacity-50" />
          <div className="absolute top-3/4 left-1/5 w-44 h-44 border border-gray-300 dark:border-gray-700 rounded-full opacity-40" />
        </div>
        
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 bg-pink-300 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-purple-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-blue-300 rounded-full blur-3xl" />
        </div>
        
        {/* Additional decorative dots pattern */}
        <div className="absolute inset-0 opacity-8">
          <div className="absolute top-24 left-24 w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute top-40 left-40 w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute top-56 left-56 w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute bottom-32 right-32 w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute bottom-48 right-48 w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute bottom-64 right-64 w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute top-1/3 left-2/3 w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="absolute bottom-1/3 right-2/3 w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Character Illustration - Positioned in white space on left side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="absolute left-[30%] top-[12%] -translate-x-1/2 -translate-y-0 z-5 flex items-center justify-center pb-8"
        >
          <div className="w-80 h-80 md:w-[28rem] md:h-[28rem] lg:w-[36rem] lg:h-[36rem] xl:w-[40rem] xl:h-[40rem] flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <img
              src="/image.jpg"
              alt="Character illustration"
              className="w-full h-full object-contain drop-shadow-2xl"
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                maxHeight: '100%',
                mixBlendMode: 'multiply',
                filter: 'contrast(1.2) brightness(1.1) saturate(1.1)',
                WebkitFilter: 'contrast(1.2) brightness(1.1) saturate(1.1)',
                backgroundColor: 'transparent'
              }}
              onError={(e) => {
                // Try fallback images if image.jpg doesn't exist
                if (e.target.src.includes('image.jpg')) {
                  e.target.src = '/image.png'
                } else if (e.target.src.includes('image.png')) {
                  e.target.src = '/boyimage.png'
                } else {
                  e.target.style.display = 'none'
                }
              }}
            />
          </div>
        </motion.div>

        {/* Content */}
        <div className="relative z-10 flex flex-col p-12 h-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-1 h-8 bg-pink-500 rounded-full" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chamakz</h1>
          </motion.div>

          {/* Stats Cards - Positioned around the image */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Profit Card - Top of image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg w-full max-w-md relative z-20"
              style={{ marginBottom: '2rem', position: 'relative', top: '-12rem', left: '12rem' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Last Month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">624k</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    +8.24%
                  </p>
                </div>
                {/* Line Chart */}
                <div className="relative w-24 h-12">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <polyline
                      points="0,40 15,30 30,35 45,20 60,25 75,15 90,18 100,10"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Order Card - Bottom of image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg w-full max-w-md relative z-20"
              style={{ marginTop: '2rem', position: 'relative', top: '5rem', left: '4rem' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Last week</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">124k</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    +12.6%
                  </p>
                </div>
                {/* Bar Chart */}
                <div className="flex items-end gap-1 h-12">
                  {[30, 45, 35, 50, 42, 55, 48].map((height, i) => (
                    <div
                      key={i}
                      className="w-3 bg-purple-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Mountain/Wave Line at Bottom */}
        <div className="absolute left-0 right-0 w-full z-10 overflow-hidden" style={{ bottom: '-8rem' }}>
          <svg
            viewBox="0 0 1440 300"
            preserveAspectRatio="none"
            className="w-full h-64 md:h-80 lg:h-96 xl:h-[28rem]"
            style={{ display: 'block' }}
          >
            {/* Base layer - subtle wave */}
            <path
              d="M0,180 Q240,100 480,120 T960,110 T1440,130 L1440,300 L0,300 Z"
              fill="rgba(236, 72, 153, 0.08)"
            />
            {/* Middle layer - medium wave */}
            <path
              d="M0,200 Q360,80 720,120 T1440,140 L1440,300 L0,300 Z"
              fill="rgba(236, 72, 153, 0.12)"
            />
            {/* Top layer - main mountain line */}
            <path
              d="M0,240 Q180,120 360,150 Q540,180 720,150 Q900,120 1080,160 Q1260,200 1440,180 L1440,300 L0,300 Z"
              fill="rgba(236, 72, 153, 0.18)"
            />
            {/* Outline stroke for definition */}
            <path
              d="M0,240 Q180,120 360,150 Q540,180 720,150 Q900,120 1080,160 Q1260,200 1440,180"
              fill="none"
              stroke="rgba(236, 72, 153, 0.25)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Right Side - Login Form (1/3 width) */}
      <div className="flex-1 lg:flex-none lg:w-1/3 flex items-center justify-center bg-white dark:bg-gray-900 p-6 lg:p-12 relative overflow-hidden z-10">
        {/* Subtle background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-32 h-32 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute bottom-10 right-10 w-24 h-24 border border-gray-300 dark:border-gray-700 rounded-full" />
          <div className="absolute top-1/2 right-20 w-20 h-20 border border-gray-300 dark:border-gray-700 rounded-full opacity-50" />
        </div>
        
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 dark:bg-pink-900/10 rounded-full blur-3xl opacity-30" />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Welcome Message */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to ! <span className="text-2xl">👋</span>
            </h1>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {error}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Please check your credentials and try again.</p>
              </div>
            </motion.div>
          )}

          {/* Success Message (shown briefly before redirect) */}
          {loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Login successful! Redirecting to dashboard...</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6 relative z-10"
            style={{ position: 'relative', zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${emailError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  value={formData.email}
                  onChange={handleChange}
                  onInput={handleChange}
                  onFocus={(e) => {
                    // Select all text on focus for easy manual editing
                    e.target.select()
                  }}
                  placeholder="admin@chamak.com"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    emailError
                      ? 'border-red-500 focus:border-red-500 dark:bg-white dark:text-gray-900'
                      : 'border-gray-300 dark:border-gray-600 focus:border-pink-500 dark:bg-white dark:text-gray-900'
                  }`}
                  required
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={loading}
                  readOnly={false}
                  style={{ WebkitAppearance: 'none', cursor: 'text' }}
                />
                {formData.email && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: '' }))
                      setEmailError('')
                      // Focus back to email field after clearing
                      setTimeout(() => {
                        const emailInput = document.getElementById('login-email')
                        if (emailInput) emailInput.focus()
                      }, 10)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear email"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-pink-500 dark:bg-white dark:text-gray-900 transition-colors"
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
                  className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-0 checked:bg-pink-600 checked:border-pink-600"
                  disabled={loading}
                />
                <span className="text-gray-700 dark:text-gray-300">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium transition-colors"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password || !!emailError}
              onClick={(e) => {
                // Ensure button click is handled
                if (loading || !formData.email || !formData.password || !!emailError) {
                  e.preventDefault()
                  return
                }
                e.stopPropagation()
              }}
              className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold py-3.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:shadow-lg flex items-center justify-center gap-2 shadow-md relative z-10"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                zIndex: 10
              }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

        </motion.div>
      </div>

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
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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











