import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type AllowedRole = 'athlete' | 'coach' | 'admin' | 'approved_coach'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: AllowedRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAthlete, isCoach, isAdmin, isApprovedCoach } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  const hasAccess = allowedRoles.some((role) => {
    switch (role) {
      case 'athlete':
        return isAthlete
      case 'coach':
        return isCoach
      case 'admin':
        return isAdmin
      case 'approved_coach':
        return isApprovedCoach
      default:
        return false
    }
  })

  if (!hasAccess) {
    // Redirect to appropriate dashboard based on role
    if (isAdmin) return <Navigate to="/admin" replace />
    if (isCoach) return <Navigate to="/dashboard/coach" replace />
    if (isAthlete) return <Navigate to="/dashboard/athlete" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
