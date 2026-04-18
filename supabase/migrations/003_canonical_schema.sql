-- ============================================================
-- Athlink Canonical Schema
-- Run this in your Supabase SQL Editor for a clean setup
-- ============================================================

-- Drop existing objects (clean slate)
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS availability_slots CASCADE;
DROP TABLE IF EXISTS coach_profiles CASCADE;
DROP TABLE IF EXISTS athlete_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS coach_status CASCADE;
DROP TYPE IF EXISTS skill_level CASCADE;
DROP TYPE IF EXISTS membership_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_coach_avg_rating() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ============================================================
-- Extensions and types
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'admin');
CREATE TYPE membership_tier AS ENUM ('free', 'elite');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE coach_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE booking_status AS ENUM ('scheduled', 'completed', 'disputed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('escrow_held', 'released');
CREATE TYPE dispute_status AS ENUM ('open', 'resolved');

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'athlete',
    membership_tier membership_tier NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE athlete_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    sport TEXT,
    position TEXT,
    skill_level skill_level,
    goals TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE coach_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- nullable for demo coaches
    name TEXT,
    bio TEXT,
    sport TEXT,
    certifications_url TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    status coach_status NOT NULL DEFAULT 'pending',
    avg_rating NUMERIC DEFAULT 0,
    photo_url TEXT,
    stripe_connect_account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id),
    coach_id UUID NOT NULL REFERENCES coach_profiles(id),
    slot_id UUID REFERENCES availability_slots(id),
    session_date DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'scheduled',
    payment_status payment_status NOT NULL DEFAULT 'escrow_held',
    amount NUMERIC NOT NULL DEFAULT 0,
    stripe_payment_intent_id TEXT,
    athlete_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    coach_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id),
    coach_id UUID NOT NULL REFERENCES coach_profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id)
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_athlete_profiles_updated_at BEFORE UPDATE ON athlete_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create public.users row when auth.users row is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, membership_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'athlete'),
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update coach avg_rating when a review is inserted or updated
CREATE OR REPLACE FUNCTION update_coach_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coach_profiles
    SET avg_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM reviews
        WHERE coach_id = NEW.coach_id
    )
    WHERE id = NEW.coach_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_rating_after_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_coach_avg_rating();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view coach user profiles" ON users
    FOR SELECT USING (role = 'coach');

CREATE POLICY "Authenticated users can view user basics" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Athlete profiles policies
CREATE POLICY "Athletes can view own profile" ON athlete_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Athletes can update own profile" ON athlete_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert own profile" ON athlete_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view athlete profiles" ON athlete_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.athlete_id = athlete_profiles.user_id
            AND bookings.coach_id IN (
                SELECT id FROM coach_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Coach profiles policies
CREATE POLICY "Anyone can view approved coaches" ON coach_profiles
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Coaches can view own profile" ON coach_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Coaches can update own profile" ON coach_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Coaches can insert own profile" ON coach_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all coach profiles" ON coach_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can update coach profiles" ON coach_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Availability slots policies
CREATE POLICY "Athletes can view coach availability" ON availability_slots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_profiles
            WHERE coach_profiles.id = availability_slots.coach_id
            AND coach_profiles.status = 'approved'
        )
    );

CREATE POLICY "Coaches can manage own availability" ON availability_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM coach_profiles
            WHERE coach_profiles.id = availability_slots.coach_id
            AND coach_profiles.user_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Athletes can view own bookings" ON bookings
    FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY "Athletes can create bookings" ON bookings
    FOR INSERT WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "Athletes can update own bookings" ON bookings
    FOR UPDATE USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_profiles
            WHERE coach_profiles.id = bookings.coach_id
            AND coach_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can update bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM coach_profiles
            WHERE coach_profiles.id = bookings.coach_id
            AND coach_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Athletes can create own reviews" ON reviews
    FOR INSERT WITH CHECK (
        athlete_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.athlete_id = auth.uid()
            AND bookings.status = 'completed'
        )
    );

CREATE POLICY "Admins can update reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Disputes policies
CREATE POLICY "Users can view own disputes" ON disputes
    FOR SELECT USING (
        raised_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = disputes.booking_id
            AND (bookings.athlete_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM coach_profiles
                    WHERE coach_profiles.id = bookings.coach_id
                    AND coach_profiles.user_id = auth.uid()
                ))
        )
    );

CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Admins can view all disputes" ON disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================================
-- Storage bucket for profile photos
-- ============================================================

-- Insert the avatars bucket (run via Supabase Dashboard > Storage or as SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload, anyone can view
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_coach_profiles_status ON coach_profiles(status);
CREATE INDEX idx_coach_profiles_sport ON coach_profiles(sport);
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_bookings_athlete_id ON bookings(athlete_id);
CREATE INDEX idx_bookings_coach_id ON bookings(coach_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX idx_availability_coach_id ON availability_slots(coach_id);

-- ============================================================
-- Demo coaches (user_id NULL since they have no auth.users entry)
-- ============================================================

INSERT INTO coach_profiles (id, user_id, name, sport, bio, hourly_rate, experience_years, status, avg_rating)
VALUES
    ('11111111-1111-1111-1111-111111111111', NULL, 'Marcus Reid', 'Baseball', 'Former D1 shortstop with 8 years coaching youth and high school athletes. Specializing in hitting mechanics and infield play.', 6500, 8, 'approved', 4.9),
    ('22222222-2222-2222-2222-222222222222', NULL, 'Sofia Navarro', 'Soccer', 'UEFA-licensed coach focused on technical development for U10-U18 players. Former collegiate player with passion for youth development.', 5500, 6, 'approved', 4.7),
    ('33333333-3333-3333-3333-333333333333', NULL, 'Darnell Okafor', 'Basketball', 'Former semi-pro player turned full-time trainer. Specializes in guard development and shooting mechanics.', 7000, 10, 'approved', 4.8),
    ('44444444-4444-4444-4444-444444444444', NULL, 'Priya Kapoor', 'Tennis', 'USPTA certified with 10 years coaching juniors. Focus on fundamentals and match strategy for competitive players.', 6000, 10, 'approved', 4.6),
    ('55555555-5555-5555-5555-555555555555', NULL, 'Jake Morrow', 'Baseball', 'Biomechanics-focused pitching coach for youth through collegiate athletes. Arm care and velocity development specialist.', 7500, 7, 'approved', 5.0);