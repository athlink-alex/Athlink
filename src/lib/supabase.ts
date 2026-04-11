import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for database tables
export interface User {
  id: string
  email: string
  role: 'athlete' | 'coach' | 'admin'
  membership_tier: 'free' | 'elite'
  created_at: string
}

export interface AthleteProfile {
  id: string
  user_id: string
  name: string | null
  sport: string | null
  position: string | null
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null
  goals: string | null
  photo_url: string | null
}

export interface CoachProfile {
  id: string
  user_id: string
  name: string | null
  bio: string | null
  sport: string | null
  certifications_url: string | null
  hourly_rate: number | null
  experience_years: number | null
  status: 'pending' | 'approved' | 'rejected'
  avg_rating: number | null
  photo_url: string | null
}

export interface AvailabilitySlot {
  id: string
  coach_id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_booked: boolean
}

export interface Booking {
  id: string
  athlete_id: string
  coach_id: string
  slot_id: string
  session_date: string
  status: 'scheduled' | 'completed' | 'disputed' | 'cancelled'
  payment_status: 'escrow_held' | 'released'
  amount: number
  stripe_payment_intent_id: string | null
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  athlete_id: string
  coach_id: string
  rating: number
  comment: string | null
  created_at: string
}
