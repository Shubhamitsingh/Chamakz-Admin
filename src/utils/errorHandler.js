/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the application
 */

/**
 * Handle Firebase errors with user-friendly messages
 */
export const handleFirebaseError = (error, context = '') => {
  console.error(`❌ Error ${context}:`, error)
  
  const errorCode = error?.code || ''
  const errorMessage = error?.message || 'An unknown error occurred'
  
  let userMessage = 'An error occurred. Please try again.'
  let technicalMessage = errorMessage
  
  switch (errorCode) {
    case 'permission-denied':
      userMessage = 'Permission denied. Please check your access rights.'
      technicalMessage = `Permission denied: ${errorMessage}`
      break
      
    case 'unauthenticated':
      userMessage = 'You are not authenticated. Please log in again.'
      technicalMessage = `Authentication required: ${errorMessage}`
      break
      
    case 'not-found':
      userMessage = 'The requested resource was not found.'
      technicalMessage = `Resource not found: ${errorMessage}`
      break
      
    case 'failed-precondition':
      userMessage = 'A required index is missing. Please contact support.'
      technicalMessage = `Index required: ${errorMessage}`
      break
      
    case 'already-exists':
      userMessage = 'This item already exists.'
      technicalMessage = `Duplicate entry: ${errorMessage}`
      break
      
    case 'resource-exhausted':
      userMessage = 'Service temporarily unavailable. Please try again later.'
      technicalMessage = `Resource exhausted: ${errorMessage}`
      break
      
    case 'deadline-exceeded':
      userMessage = 'Request timed out. Please try again.'
      technicalMessage = `Timeout: ${errorMessage}`
      break
      
    case 'cancelled':
      userMessage = 'Operation was cancelled.'
      technicalMessage = `Cancelled: ${errorMessage}`
      break
      
    default:
      userMessage = errorMessage || 'An unexpected error occurred.'
      technicalMessage = errorMessage
  }
  
  return {
    userMessage,
    technicalMessage,
    errorCode,
    originalError: error
  }
}

/**
 * Create error state object for UI
 */
export const createErrorState = (error, context = '') => {
  const errorInfo = handleFirebaseError(error, context)
  
  return {
    hasError: true,
    message: errorInfo.userMessage,
    technicalMessage: errorInfo.technicalMessage,
    code: errorInfo.errorCode,
    canRetry: ['permission-denied', 'failed-precondition', 'deadline-exceeded'].includes(errorInfo.errorCode),
    showSupport: ['permission-denied', 'failed-precondition'].includes(errorInfo.errorCode)
  }
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  const retryableCodes = [
    'deadline-exceeded',
    'resource-exhausted',
    'unavailable',
    'internal'
  ]
  
  return retryableCodes.includes(error?.code || '')
}

/**
 * Format error for display in UI
 */
export const formatErrorForUI = (error, context = '') => {
  const errorInfo = handleFirebaseError(error, context)
  
  return {
    title: 'Error',
    message: errorInfo.userMessage,
    details: errorInfo.technicalMessage,
    action: errorInfo.errorCode === 'permission-denied' 
      ? 'Please update Firestore security rules'
      : null
  }
}
