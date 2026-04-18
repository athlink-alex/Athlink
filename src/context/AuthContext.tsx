import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase, type User } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, role: 'athlete' | 'coach') => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAthlete: boolean
  isCoach: boolean
  isAdmin: boolean
  isApprovedCoach: boolean
  membershipTier: 'free' | 'elite'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApprovedCoach, setIsApprovedCoach] = useState(false)

  useEffect(() => {
    // Listen for auth changes — the callback must NOT be async or await anything,
    // because the Supabase JS client deadlocks if the onAuthStateChange callback
    // blocks. We fire user-data fetching in a separate microtask instead.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Set a fallback user immediately so the UI isn't blocked
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as User['role']) || 'athlete',
          membership_tier: 'free',
          created_at: new Date().toISOString()
        }
        setUser(fallbackUser)
        setLoading(false)

        // Fetch the real user profile in the background (non-blocking)
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: userData }) => {
            if (userData) setUser(userData)
          })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    // Force loading to false after 3 seconds as a fallback
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signUp = async (email: string, password: string, role: 'athlete' | 'coach') => {
    try {
      // The database trigger (handle_new_user) will auto-create the
      // public.users row from auth.users, reading the role from user_metadata.
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      })

      if (authError) throw authError

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isAthlete = user?.role === 'athlete'
  const isCoach = user?.role === 'coach'
  const isAdmin = user?.role === 'admin'
  const membershipTier = user?.membership_tier || 'free'

  // Check if coach is approved - fetched from coach profile status
  useEffect(() => {
    const fetchCoachStatus = async () => {
      if (isCoach && user?.id) {
        const { data } = await supabase
          .from('coach_profiles')
          .select('status')
          .eq('user_id', user.id)
          .single()

        setIsApprovedCoach(data?.status === 'approved')
      } else {
        setIsApprovedCoach(false)
      }
    }

    fetchCoachStatus()
  }, [isCoach, user?.id])

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAthlete,
    isCoach,
    isAdmin,
    isApprovedCoach,
    membershipTier,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
