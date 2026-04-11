-- Athlink Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'admin');
CREATE TYPE membership_tier AS ENUM ('free', 'elite');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE coach_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE booking_status AS ENUM ('scheduled', 'completed', 'disputed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('escrow_held', 'released');
CREATE TYPE dispute_status AS ENUM ('open', 'resolved');

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'athlete',
    membership_tier membership_tier NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Athlete profiles
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

-- Coach profiles
CREATE TABLE coach_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    bio TEXT,
    sport TEXT,
    certifications_url TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    status coach_status NOT NULL DEFAULT 'pending',
    avg_rating NUMERIC DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Availability slots
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id),
    coach_id UUID NOT NULL REFERENCES coach_profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id)
);

-- Disputes
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_profiles_updated_at BEFORE UPDATE ON athlete_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update coach average rating
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

-- Trigger to update coach rating on new review
CREATE TRIGGER update_coach_rating_after_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_coach_avg_rating();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
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

-- Users can view coaches (needed for discovery)
CREATE POLICY "Users can view coach user profiles" ON users
    FOR SELECT USING (role = 'coach');

-- Athlete profiles policies
CREATE POLICY "Athletes can view own profile" ON athlete_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Athletes can update own profile" ON athlete_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert own profile" ON athlete_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coaches can view athlete profiles they have bookings with
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

-- Admins can view all coach profiles
CREATE POLICY "Admins can view all coach profiles" ON coach_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update coach profiles" ON coach_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Availability slots policies
CREATE POLICY "Anyone can view coach availability" ON availability_slots
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

CREATE POLICY "Coaches can view bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coach_profiles
            WHERE coach_profiles.id = bookings.coach_id
            AND coach_profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
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
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Insert demo coaches
INSERT INTO coach_profiles (id, user_id, name, sport, bio, hourly_rate, experience_years, status, avg_rating)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'demo-coach-1', 'Marcus Reid', 'Baseball', 'Former D1 shortstop with 8 years coaching youth and high school athletes. Specializing in hitting mechanics and infield play.', 6500, 8, 'approved', 4.9),
    ('22222222-2222-2222-2222-222222222222', 'demo-coach-2', 'Sofia Navarro', 'Soccer', 'UEFA-licensed coach focused on technical development for U10-U18 players. Former collegiate player with passion for youth development.', 5500, 6, 'approved', 4.7),
    ('33333333-3333-3333-3333-333333333333', 'demo-coach-3', 'Darnell Okafor', 'Basketball', 'Former semi-pro player turned full-time trainer. Specializes in guard development and shooting mechanics.', 7000, 10, 'approved', 4.8),
    ('44444444-4444-4444-4444-444444444444', 'demo-coach-4', 'Priya Kapoor', 'Tennis', 'USPTA certified with 10 years coaching juniors. Focus on fundamentals and match strategy for competitive players.', 6000, 10, 'approved', 4.6),
    ('55555555-5555-5555-5555-555555555555', 'demo-coach-5', 'Jake Morrow', 'Baseball', 'Biomechanics-focused pitching coach for youth through collegiate athletes. Arm care and velocity development specialist.', 7500, 7, 'approved', 5.0);

-- Create indexes for better performance
CREATE INDEX idx_coach_profiles_status ON coach_profiles(status);
CREATE INDEX idx_coach_profiles_sport ON coach_profiles(sport);
CREATE INDEX idx_bookings_athlete_id ON bookings(athlete_id);
CREATE INDEX idx_bookings_coach_id ON bookings(coach_id);
CREATE INDEX idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX idx_availability_coach_id ON availability_slots(coach_id);
