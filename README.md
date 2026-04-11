# Athlink

Sports coaching matchmaking app for South Bay Los Angeles. Connects athletes with vetted private coaches.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Auth & Database:** Supabase
- **Payments:** Stripe
- **Routing:** React Router v6
- **State Management:** React Context + Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Stripe account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Fill in your environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

Create the following tables in your Supabase project:

**users**
- id: uuid (primary key)
- email: text
- role: enum ('athlete', 'coach', 'admin')
- membership_tier: enum ('free', 'elite')
- created_at: timestamp

**athlete_profiles**
- id: uuid
- user_id: uuid (references users)
- name: text
- sport: text
- position: text
- skill_level: enum ('beginner', 'intermediate', 'advanced')
- goals: text
- photo_url: text

**coach_profiles**
- id: uuid
- user_id: uuid (references users)
- name: text
- bio: text
- sport: text
- certifications_url: text
- hourly_rate: numeric
- experience_years: integer
- status: enum ('pending', 'approved', 'rejected')
- avg_rating: numeric
- photo_url: text

**availability_slots**
- id: uuid
- coach_id: uuid (references coach_profiles)
- day_of_week: text
- start_time: time
- end_time: time
- is_booked: boolean

**bookings**
- id: uuid
- athlete_id: uuid
- coach_id: uuid
- slot_id: uuid
- session_date: date
- status: enum ('scheduled', 'completed', 'disputed', 'cancelled')
- payment_status: enum ('escrow_held', 'released')
- amount: numeric
- stripe_payment_intent_id: text

**reviews**
- id: uuid
- booking_id: uuid
- athlete_id: uuid
- coach_id: uuid
- rating: integer (1-5)
- comment: text
- created_at: timestamp

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── ProtectedRoute.tsx
│   └── ui/             # UI components
├── context/            # React Context
│   └── AuthContext.tsx
├── lib/                # Library configurations
│   ├── supabase.ts
│   └── stripe.ts
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   ├── AthleteOnboarding.tsx
│   ├── CoachOnboarding.tsx
│   ├── AthleteDashboard.tsx
│   ├── CoachDashboard.tsx
│   ├── CoachDiscovery.tsx
│   ├── CoachProfile.tsx
│   ├── BookingFlow.tsx
│   ├── ReviewSubmission.tsx
│   └── AdminDashboard.tsx
├── types/              # TypeScript types
│   └── database.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Features

- Dual onboarding flows for Athletes and Coaches
- Coach search and discovery
- Booking system with Stripe escrow payments
- Review system
- Admin dashboard for coach verification
- Role-based access control

## Next Steps

1. Set up Supabase tables with RLS policies
2. Configure Stripe Connect for coach payouts
3. Add email notifications
4. Implement real-time messaging
5. Add photo upload functionality
6. Set up hosting on Vercel
