import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react'
import { handleFirebaseError } from '../utils/errorHandler'

/**
 * Reusable Error State Component
 * Displays error messages with retry functionality
 */
const ErrorState = ({
  error,
  context = '',
  onRetry,
  onContactSupport,
  className = ''
}) => {
  const errorInfo = error ? handleFirebaseError(error, context) : {
    userMessage: 'An error occurred',
    technicalMessage: 'Unknown error',
    errorCode: '',
    canRetry: false,
    showSupport: false
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-1">
            Error Loading Data
          </h3>
          
          <p className="text-red-800 dark:text-red-400 mb-3">
            {errorInfo.userMessage}
          </p>
          
          {errorInfo.errorCode === 'permission-denied' && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                ⚠️ Permission Issue
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                Please update Firestore security rules to allow access to this collection.
              </p>
            </div>
          )}
          
          {errorInfo.errorCode === 'failed-precondition' && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                ⚠️ Index Required
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                A Firestore index is required for this query. Please create it in Firebase Console.
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {errorInfo.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            
            {errorInfo.showSupport && onContactSupport && (
              <button
                onClick={onContactSupport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Contact Support
              </button>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-red-700 dark:text-red-500 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto">
                {errorInfo.technicalMessage}
                {errorInfo.errorCode && `\nError Code: ${errorInfo.errorCode}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ErrorState
