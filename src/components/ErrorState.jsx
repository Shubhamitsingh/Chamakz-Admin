import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react'
import { handleFirebaseError } from '../utils/errorHandler'

const ErrorState = ({
  error,
  context = '',
  onRetry,
  onContactSupport,
  className = '',
}) => {
  const errorInfo = error
    ? handleFirebaseError(error, context)
    : {
        userMessage: 'An error occurred',
        technicalMessage: 'Unknown error',
        errorCode: '',
        canRetry: false,
        showSupport: false,
      }

  return (
    <div className={`rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-3 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Could not load data</h3>
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">{errorInfo.userMessage}</p>

          {errorInfo.errorCode === 'permission-denied' && (
            <p className="mt-2 text-[11px] text-red-700">Access was denied for this collection.</p>
          )}
          {errorInfo.errorCode === 'failed-precondition' && (
            <p className="mt-2 text-[11px] text-red-700">This query needs a database index.</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn-danger">
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
            {errorInfo.showSupport && onContactSupport && (
              <button type="button" onClick={onContactSupport} className="btn-secondary">
                <HelpCircle className="w-3.5 h-3.5" />
                Contact support
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorState
