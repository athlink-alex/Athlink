-- ============================================================
-- Athlink Coach Management Suite + Subscription Tiers
-- Migration 004
-- ============================================================

-- ─── COACH SUBSCRIPTION TIERS ─────────────────────────────

CREATE TYPE coach_tier AS ENUM ('free', 'pro', 'elite');

-- Add subscription columns to coach_profiles
ALTER TABLE coach_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier coach_tier DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp;

-- ─── ATHLETE ROSTER ───────────────────────────────────────

CREATE TABLE athlete_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  notes text,
  added_at timestamp DEFAULT now(),
  UNIQUE(coach_id, athlete_id)
);

ALTER TABLE athlete_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their roster"
  ON athlete_roster FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

-- ─── SESSION NOTES ────────────────────────────────────────

CREATE TABLE session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  note_text text NOT NULL,
  is_private boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their session notes"
  ON session_notes FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

-- ─── MESSAGES ─────────────────────────────────────────────

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

CREATE POLICY "Users can update read status on their messages"
  ON messages FOR UPDATE USING (
    recipient_id = auth.uid()
  );

-- ─── PROGRESS REPORTS ────────────────────────────────────

CREATE TABLE progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  strengths text[],
  areas_for_improvement text[],
  recommendations text[],
  share_token uuid DEFAULT gen_random_uuid(),
  is_shared boolean DEFAULT false,
  period_start date,
  period_end date,
  created_at timestamp DEFAULT now()
);

ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their progress reports"
  ON progress_reports FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

-- Allow public access via share token (for /reports/:token)
CREATE POLICY "Shared reports are viewable via token"
  ON progress_reports FOR SELECT USING (
    is_shared = true AND share_token = (current_setting('request.jwt.claims')::json->>'share_token')::uuid
  );

-- Also allow athletes to view their own reports
CREATE POLICY "Athletes can view their own reports"
  ON progress_reports FOR SELECT USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE user_id = auth.uid())
  );

-- ─── VIDEO SUBMISSIONS ────────────────────────────────────

CREATE TABLE video_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  video_url text NOT NULL,
  title text,
  coach_feedback text,
  feedback_at timestamp,
  created_at timestamp DEFAULT now()
);

ALTER TABLE video_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their video submissions"
  ON video_submissions FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can view their own video submissions"
  ON video_submissions FOR SELECT USING (
    athlete_id IN (SELECT id FROM athlete_profiles WHERE user_id = auth.uid())
  );

-- ─── COACH SUBSCRIPTIONS (Stripe tracking) ───────────────

CREATE TABLE coach_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier coach_tier NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(coach_id)
);

ALTER TABLE coach_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view their own subscription"
  ON coach_subscriptions FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

-- ─── INDEXES ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_athlete_roster_coach ON athlete_roster(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_coach ON session_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_athlete ON session_notes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_coach ON progress_reports(coach_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_athlete ON progress_reports(athlete_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_token ON progress_reports(share_token) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_video_submissions_coach ON video_submissions(coach_id);