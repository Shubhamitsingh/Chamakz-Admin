import { useState } from 'react'
import { getUserIconPath } from '../utils/userIcon'

const UserAvatar = ({ userId, name, size = 'md', className = '' }) => {
  const [iconError, setIconError] = useState(false)
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }
  
  const iconPath = getUserIconPath(userId || name || 'default')
  const displayName = name || 'U'
  const initial = displayName.charAt(0).toUpperCase()
  
  const rotationStyle = size === 'lg' || size === 'xl' ? { transform: 'rotate(-5deg)' } : { transform: 'rotate(-3deg)' }
  
  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex items-center justify-center border-2 border-pink-200 dark:border-pink-800 ${className}`} style={rotationStyle}>
      {!iconError ? (
        <img 
          src={iconPath} 
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => {
            console.warn(`Icon not found: ${iconPath} for user: ${userId || name}`)
            setIconError(true)
          }}
          loading="lazy"
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold ${textSizes[size]}`} style={rotationStyle}>
          {initial}
        </div>
      )}
    </div>
  )
}

export default UserAvatar
