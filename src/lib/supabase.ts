import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Base URL for Supabase Edge Functions
export const EDGE_FUNCTION_BASE = `${supabaseUrl}/functions/v1`

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
  subscription_tier: 'free' | 'pro' | 'elite'
  stripe_subscription_id: string | null
  subscription_current_period_end: string | null
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
  athlete_confirmed: boolean
  coach_confirmed: boolean
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  athlete_id: string
  coach_id: string
  rating: number
  comment: string | null
  flagged: boolean
  created_at: string
}

// Coach Management Suite types

export interface AthleteRoster {
  id: string
  coach_id: string
  athlete_id: string
  notes: string | null
  added_at: string
}

export interface SessionNote {
  id: string
  coach_id: string
  athlete_id: string
  booking_id: string | null
  note_text: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  booking_id: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface ProgressReport {
  id: string
  coach_id: string
  athlete_id: string
  title: string
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  share_token: string
  is_shared: boolean
  period_start: string | null
  period_end: string | null
  created_at: string
}

export interface VideoSubmission {
  id: string
  coach_id: string
  athlete_id: string
  booking_id: string | null
  video_url: string
  title: string | null
  coach_feedback: string | null
  feedback_at: string | null
  created_at: string
}

export interface CoachSubscription {
  id: string
  coach_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tier: 'free' | 'pro' | 'elite'
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// AI Assistant types

export interface DrillHistory {
  id: string
  coach_id: string
  athlete_id: string
  drill_name: string
  drill_category: string | null
  drill_description: string | null
  source_url: string | null
  times_used: number
  last_used_at: string
  created_at: string
}

export interface SessionPlan {
  id: string
  coach_id: string
  athlete_id: string
  plan_title: string | null
  focus_area: string | null
  session_duration: number | null
  plan_content: any
  drills_used: string[]
  created_at: string
}

export interface AIChatHistory {
  id: string
  coach_id: string
  athlete_id: string | null
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Session Report Card
export interface SessionReport {
  id: string
  coach_id: string
  athlete_id: string
  booking_id: string
  session_date: string
  session_summary: string | null
  strength_1: string | null
  strength_2: string | null
  strength_3: string | null
  improvement_1: string | null
  improvement_2: string | null
  improvement_3: string | null
  drill_1_name: string | null
  drill_1_frequency: string | null
  drill_2_name: string | null
  drill_2_frequency: string | null
  drill_3_name: string | null
  drill_3_frequency: string | null
  next_session_objective: string | null
  session_rating: number | null
  skills_assessed: Record<string, unknown> | null
  is_visible_to_athlete: boolean
  created_at: string
  updated_at: string
}
