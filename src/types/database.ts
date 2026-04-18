export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'athlete' | 'coach' | 'admin'
          membership_tier: 'free' | 'elite'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'athlete' | 'coach' | 'admin'
          membership_tier?: 'free' | 'elite'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'athlete' | 'coach' | 'admin'
          membership_tier?: 'free' | 'elite'
          created_at?: string
        }
      }
      athlete_profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          sport: string | null
          position: string | null
          skill_level: 'beginner' | 'intermediate' | 'advanced' | null
          goals: string | null
          photo_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          sport?: string | null
          position?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | null
          goals?: string | null
          photo_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          sport?: string | null
          position?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | null
          goals?: string | null
          photo_url?: string | null
        }
      }
      coach_profiles: {
        Row: {
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
          stripe_connect_account_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          bio?: string | null
          sport?: string | null
          certifications_url?: string | null
          hourly_rate?: number | null
          experience_years?: number | null
          status?: 'pending' | 'approved' | 'rejected'
          avg_rating?: number | null
          photo_url?: string | null
          stripe_connect_account_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          bio?: string | null
          sport?: string | null
          certifications_url?: string | null
          hourly_rate?: number | null
          experience_years?: number | null
          status?: 'pending' | 'approved' | 'rejected'
          avg_rating?: number | null
          photo_url?: string | null
          stripe_connect_account_id?: string | null
        }
      }
      availability_slots: {
        Row: {
          id: string
          coach_id: string
          day_of_week: string
          start_time: string
          end_time: string
          is_booked: boolean
        }
        Insert: {
          id?: string
          coach_id: string
          day_of_week: string
          start_time: string
          end_time: string
          is_booked?: boolean
        }
        Update: {
          id?: string
          coach_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          is_booked?: boolean
        }
      }
      bookings: {
        Row: {
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
        Insert: {
          id?: string
          athlete_id: string
          coach_id: string
          slot_id: string
          session_date: string
          status?: 'scheduled' | 'completed' | 'disputed' | 'cancelled'
          payment_status?: 'escrow_held' | 'released'
          amount: number
          stripe_payment_intent_id?: string | null
          athlete_confirmed?: boolean
          coach_confirmed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string
          coach_id?: string
          slot_id?: string
          session_date?: string
          status?: 'scheduled' | 'completed' | 'disputed' | 'cancelled'
          payment_status?: 'escrow_held' | 'released'
          amount?: number
          stripe_payment_intent_id?: string | null
          athlete_confirmed?: boolean
          coach_confirmed?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          athlete_id: string
          coach_id: string
          rating: number
          comment: string | null
          flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          athlete_id: string
          coach_id: string
          rating: number
          comment?: string | null
          flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          athlete_id?: string
          coach_id?: string
          rating?: number
          comment?: string | null
          flagged?: boolean
          created_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          booking_id: string
          raised_by: string
          reason: string
          status: 'open' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          raised_by: string
          reason: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          raised_by?: string
          reason?: string
          status?: 'open' | 'resolved'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
