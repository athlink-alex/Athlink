-- Seed data for development/testing
-- This creates availability slots for approved coaches
--
-- Run AFTER 003_canonical_schema.sql and 005_demo_auth_users.sql

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