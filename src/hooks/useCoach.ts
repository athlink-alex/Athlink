import { useState, useEffect } from 'react'
import { supabase, type CoachProfile, type AvailabilitySlot, type Review } from '../lib/supabase'

interface UseCoachReturn {
  coach: CoachProfile | null
  availability: AvailabilitySlot[]
  reviews: Review[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCoach(coachId: string | undefined): UseCoachReturn {
  const [coach, setCoach] = useState<CoachProfile | null>(null)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoach = async () => {
    if (!coachId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [coachResult, availabilityResult, reviewsResult] = await Promise.all([
        supabase.from('coach_profiles').select('*').eq('id', coachId).single(),
        supabase.from('availability_slots').select('*').eq('coach_id', coachId).eq('is_booked', false),
        supabase.from('reviews').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
      ])

      if (coachResult.error) throw coachResult.error

      setCoach(coachResult.data as CoachProfile)
      setAvailability((availabilityResult.data ?? []) as AvailabilitySlot[])
      setReviews((reviewsResult.data ?? []) as Review[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coach')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoach()
  }, [coachId])

  return { coach, availability, reviews, loading, error, refetch: fetchCoach }
}