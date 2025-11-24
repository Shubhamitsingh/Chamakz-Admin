import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Loader from './Loader'

const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useApp()

  // Show loader while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the protected content
  return children
}

export default ProtectedRoute











