import { useState, useEffect, useCallback } from 'react'
import { supabase, type AvailabilitySlot } from '../lib/supabase'

interface UseAvailabilityReturn {
  slots: AvailabilitySlot[]
  loading: boolean
  error: string | null
  refetch: () => void
  addSlot: (slot: Omit<AvailabilitySlot, 'id'>) => Promise<void>
  removeSlot: (slotId: string) => Promise<void>
  updateSlot: (slotId: string, updates: Partial<AvailabilitySlot>) => Promise<void>
}

export function useAvailability(coachId: string | undefined): UseAvailabilityReturn {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!coachId) {
      setSlots([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('coach_id', coachId)
        .order('day_of_week', { ascending: true })

      if (fetchError) throw fetchError
      setSlots((data ?? []) as AvailabilitySlot[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }, [coachId])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  const addSlot = async (slot: Omit<AvailabilitySlot, 'id'>) => {
    try {
      const { error: insertError } = await supabase
        .from('availability_slots')
        .insert(slot)

      if (insertError) throw insertError
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slot')
    }
  }

  const removeSlot = async (slotId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId)

      if (deleteError) throw deleteError
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove slot')
    }
  }

  const updateSlot = async (slotId: string, updates: Partial<AvailabilitySlot>) => {
    try {
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update(updates)
        .eq('id', slotId)

      if (updateError) throw updateError
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slot')
    }
  }

  return { slots, loading, error, refetch: fetchSlots, addSlot, removeSlot, updateSlot }
}