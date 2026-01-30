/**
 * Centralized Date Formatting Utilities
 * Provides consistent date formatting across the application
 */

/**
 * Format Firebase Timestamp to date string
 */
export const formatDate = (timestamp, options = {}) => {
  if (!timestamp) return 'N/A'
  
  try {
    let date
    
    // Handle Firebase Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    }
    // Handle timestamp-like object with seconds
    else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000)
    }
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp
    }
    // Handle string or number
    else {
      date = new Date(timestamp)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    // Default format options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }
    
    return date.toLocaleDateString('en-US', defaultOptions)
  } catch (error) {
    console.warn('Date formatting error:', error)
    return 'N/A'
  }
}

/**
 * Format date with time
 */
export const formatDateTime = (timestamp, options = {}) => {
  if (!timestamp) return 'N/A'
  
  try {
    let date
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000)
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    return date.toLocaleDateString('en-US', defaultOptions)
  } catch (error) {
    console.warn('DateTime formatting error:', error)
    return 'N/A'
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  try {
    let date
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000)
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    }
    
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
    }
    
    return formatDate(timestamp)
  } catch (error) {
    console.warn('Relative time formatting error:', error)
    return 'N/A'
  }
}

/**
 * Format time only (HH:MM)
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  try {
    let date
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000)
    } else if (timestamp instanceof Date) {
      date = timestamp
    } else {
      date = new Date(timestamp)
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Time formatting error:', error)
    return 'N/A'
  }
}

/**
 * Get date object from timestamp
 */
export const getDateFromTimestamp = (timestamp) => {
  if (!timestamp) return null
  
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate()
    } else if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000)
    } else if (timestamp instanceof Date) {
      return timestamp
    } else {
      return new Date(timestamp)
    }
  } catch (error) {
    console.warn('Date conversion error:', error)
    return null
  }
}
