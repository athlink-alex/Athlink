import { useState, useEffect } from 'react'
import { supabase, type Booking } from '../lib/supabase'
import { useAuth } from './useAuth'

interface UseBookingsReturn {
  bookings: Booking[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBookings(): UseBookingsReturn {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!user) {
      setBookings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query;

      if (user.role === 'coach') {
        // coach_id references coach_profiles.id, not users.id
        // Resolve the coach profile id first
        const { data: coachProfile } = await supabase
          .from('coach_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!coachProfile) {
          setBookings([])
          return
        }

        query = supabase
          .from('bookings')
          .select('*')
          .eq('coach_id', coachProfile.id)
          .order('session_date', { ascending: false })
      } else {
        query = supabase
          .from('bookings')
          .select('*')
          .eq('athlete_id', user.id)
          .order('session_date', { ascending: false })
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setBookings((data ?? []) as Booking[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [user?.id])

  return { bookings, loading, error, refetch: fetchBookings }
}