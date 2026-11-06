import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Toast = () => {
  const { notifications } = useApp()

  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300',
    error: 'border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300',
  }

  const icons = {
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`border rounded-md px-3 py-2 text-xs flex items-center gap-2 min-w-[240px] ${styles[notification.type] || styles.success}`}
          >
            {icons[notification.type] || icons.success}
            <span className="flex-1">{notification.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
