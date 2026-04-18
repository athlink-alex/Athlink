-- Session report cards (replaces/updates progress_reports for per-session use)
CREATE TABLE session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  session_date date NOT NULL,

  -- Section 1: Session Summary
  session_summary text,

  -- Section 2: Strengths Observed
  strength_1 text,
  strength_2 text,
  strength_3 text,

  -- Section 3: Development Areas
  improvement_1 text,
  improvement_2 text,
  improvement_3 text,

  -- Section 4: Next Session Drill Plan
  drill_1_name text,
  drill_1_frequency text,
  drill_2_name text,
  drill_2_frequency text,
  drill_3_name text,
  drill_3_frequency text,

  -- Section 5: Next Session Objective
  next_session_objective text,

  -- Overall rating
  session_rating integer CHECK (session_rating between 1 and 5),

  -- Skills snapshot (optional)
  skills_assessed jsonb,

  -- Metadata
  is_visible_to_athlete boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- RLS policies
ALTER TABLE session_reports ENABLE ROW LEVEL SECURITY;

-- Coach can read and write their own reports
CREATE POLICY "Coach owns session reports"
  ON session_reports FOR ALL
  USING (coach_id IN (
    SELECT id FROM coach_profiles WHERE user_id = auth.uid()
  ));

-- Athlete can read reports written for them
CREATE POLICY "Athlete can view their reports"
  ON session_reports FOR SELECT
  USING (
    athlete_id IN (
      SELECT id FROM athlete_profiles WHERE user_id = auth.uid()
    )
    AND is_visible_to_athlete = true
  );