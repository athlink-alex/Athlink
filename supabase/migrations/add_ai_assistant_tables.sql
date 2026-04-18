-- AI Coaching Assistant tables

-- Stores every drill ever recommended to a coach's athlete
CREATE TABLE drill_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  drill_name text NOT NULL,
  drill_category text, -- 'hitting' | 'pitching' | 'fielding' | 'speed' | 'mental'
  drill_description text,
  source_url text, -- where the drill was found online
  times_used integer DEFAULT 1,
  last_used_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

-- Stores full generated session plans
CREATE TABLE session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  plan_title text,
  focus_area text, -- what the session focuses on
  session_duration integer, -- in minutes
  plan_content jsonb, -- full structured plan
  drills_used text[], -- array of drill names used in this plan
  created_at timestamp DEFAULT now()
);

-- Stores AI chat history per coach
CREATE TABLE ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES coach_profiles(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athlete_profiles(id), -- optional context
  role text CHECK (role in ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- RLS policies
ALTER TABLE drill_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches own their drill history"
  ON drill_history FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Coaches own their session plans"
  ON session_plans FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Coaches own their chat history"
  ON ai_chat_history FOR ALL USING (
    coach_id IN (SELECT id FROM coach_profiles WHERE user_id = auth.uid())
  );