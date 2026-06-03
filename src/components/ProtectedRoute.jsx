import { Navigate } from 'react-router-dom'
import { useAuth } from '../context'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <LoadingSpinner size="lg" />
  if (!session) return <Navigate to="/login" replace />
  return children
}
