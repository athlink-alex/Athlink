import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type AllowedRole = 'athlete' | 'coach' | 'admin' | 'approved_coach'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: AllowedRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAthlete, isCoach, isAdmin, isApprovedCoach } = useAuth()
  const location = useLocation()
  const [checkingSession, setCheckingSession] = useState(false)

  // If loading is done but no user, check if there's an active session
  // that AuthContext hasn't processed yet (race condition on login)
  useEffect(() => {
    if (!loading && !user && !checkingSession) {
      setCheckingSession(true)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Session exists but AuthContext hasn't loaded the user yet
          // AuthContext's onAuthStateChange will handle it
          // Briefly wait for it to process
          const timeout = setTimeout(() => {
            setCheckingSession(false)
          }, 2000)
          return () => clearTimeout(timeout)
        } else {
          setCheckingSession(false)
        }
      })
    }
  }, [loading, user, checkingSession])

  // Show loading spinner while AuthContext is loading or we're checking for a session
  if (loading || checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    if (isAdmin) return <Navigate to="/admin" replace />
    if (isCoach) return <Navigate to="/dashboard/coach" replace />
    if (isAthlete) return <Navigate to="/dashboard/athlete" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
