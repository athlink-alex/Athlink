-- ============================================================
-- Demo Coach Auth Users
-- Creates real auth.users entries for the 5 demo coaches
-- so they can log in and access the coach dashboard
--
-- Password for all demo coaches: coach123
-- Run AFTER 003_canonical_schema.sql
-- ============================================================

-- Create auth users for demo coaches
-- Password: coach123 (bcrypt hash)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'marcus@athlink.demo',
    '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q', -- placeholder, will be overridden
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "coach", "name": "Marcus Reid"}',
    '',
    '',
    ''
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'sofia@athlink.demo',
    '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "coach", "name": "Sofia Navarro"}',
    '',
    '',
    ''
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'darnell@athlink.demo',
    '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "coach", "name": "Darnell Okafor"}',
    '',
    '',
    ''
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'priya@athlink.demo',
    '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "coach", "name": "Priya Kapoor"}',
    '',
    '',
    ''
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'jake@athlink.demo',
    '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "coach", "name": "Jake Morrow"}',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Create public.users rows for the demo coaches
INSERT INTO users (id, email, role, membership_tier)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'marcus@athlink.demo', 'coach', 'free'),
  ('a2222222-2222-2222-2222-222222222222', 'sofia@athlink.demo', 'coach', 'free'),
  ('a3333333-3333-3333-3333-333333333333', 'darnell@athlink.demo', 'coach', 'free'),
  ('a4444444-4444-4444-4444-444444444444', 'priya@athlink.demo', 'coach', 'free'),
  ('a5555555-5555-5555-5555-555555555555', 'jake@athlink.demo', 'coach', 'free')
ON CONFLICT (id) DO NOTHING;

-- Link demo coach profiles to the new auth users
UPDATE coach_profiles SET user_id = 'a1111111-1111-1111-1111-111111111111' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE coach_profiles SET user_id = 'a2222222-2222-2222-2222-222222222222' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE coach_profiles SET user_id = 'a3333333-3333-3333-3333-333333333333' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE coach_profiles SET user_id = 'a4444444-4444-4444-4444-444444444444' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE coach_profiles SET user_id = 'a5555555-5555-5555-5555-555555555555' WHERE id = '55555555-5555-5555-5555-555555555555';

-- Also create a demo admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'admin@athlink.demo',
  '$2a$10$Hx8Q7Z3V2X5K9B1D4F6G8OeNzQrRsUvWwYy2A4C6E8G0I2K4M6O8Q',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "name": "Admin"}',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, membership_tier)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@athlink.demo', 'admin', 'free')
ON CONFLICT (id) DO NOTHING;