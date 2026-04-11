-- Seed data for development/testing
-- This creates demo coaches that will appear in the discovery page

-- Note: Run this after the initial schema migration
-- These coaches use placeholder user_ids that won't exist in your auth.users
-- For a real setup, you'd need to create auth users first

-- Demo availability slots for coaches
INSERT INTO availability_slots (coach_id, day_of_week, start_time, end_time, is_booked)
SELECT
    id as coach_id,
    unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) as day_of_week,
    '09:00'::time as start_time,
    '17:00'::time as end_time,
    false as is_booked
FROM coach_profiles
WHERE status = 'approved';

-- Add some weekend availability too
INSERT INTO availability_slots (coach_id, day_of_week, start_time, end_time, is_booked)
SELECT
    id as coach_id,
    unnest(ARRAY['saturday', 'sunday']) as day_of_week,
    '10:00'::time as start_time,
    '14:00'::time as end_time,
    false as is_booked
FROM coach_profiles
WHERE status = 'approved';
