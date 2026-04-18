import { useState, useEffect } from 'react'
import { supabase, type CoachProfile } from '../lib/supabase'

interface UseCoachesParams {
  sport?: string
  search?: string
  minPrice?: number
  maxPrice?: number
}

interface UseCoachesReturn {
  coaches: CoachProfile[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCoaches(params: UseCoachesParams = {}): UseCoachesReturn {
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoaches = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('coach_profiles')
        .select('*')
        .eq('status', 'approved')
        .order('avg_rating', { ascending: false })

      if (params.sport) {
        query = query.eq('sport', params.sport)
      }

      if (params.search) {
        query = query.ilike('name', `%${params.search}%`)
      }

      if (params.minPrice !== undefined) {
        query = query.gte('hourly_rate', params.minPrice)
      }

      if (params.maxPrice !== undefined) {
        query = query.lte('hourly_rate', params.maxPrice)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setCoaches(data as CoachProfile[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coaches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoaches()
  }, [params.sport, params.search, params.minPrice, params.maxPrice])

  return { coaches, loading, error, refetch: fetchCoaches }
}