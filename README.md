# Athlink

**Private sports coaching marketplace** — connects athletes and parents with vetted private coaches in South Bay, Los Angeles. Think "Airbnb for sports coaching."

## Features

- **Dual onboarding flows** — separate 3-step athlete and 4-step coach onboarding
- **Manual coach verification** — coaches reviewed and approved by admin before going live
- **Escrow-based payments** — Stripe Payment Intents hold funds until both parties confirm session completion
- **Elite subscription tier** — $19/mo for athletes, unlocks priority booking (gold UI)
- **Session completion flow** — both athlete and coach must confirm before payment is released
- **Dispute system** — either party can flag a session for admin review
- **Review system** — athletes rate coaches after confirmed sessions
- **Role-based routing** — athletes, coaches, and admins see different dashboards and nav

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Auth & Database | Supabase |
| Payments | Stripe (Payment Intents + Elements) |
| Routing | React Router v7 |
| State Management | React Context + Zustand |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (with schema applied)
- A Stripe account (for payment processing)

### Installation

```bash
npm install
cp .env.example .env
# Fill in your .env with Supabase and Stripe keys
npm run dev
```

### Environment Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Supabase Setup

1. Run `supabase/schema_clean.sql` in your Supabase SQL editor to create all tables with RLS policies
2. Run `supabase/seed.sql` to insert 5 demo coaches with availability slots

### Stripe Setup

The app requires server-side endpoints for payment processing:
- `POST /api/create-payment-intent` — creates a PaymentIntent for booking payments
- `POST /api/create-elite-subscription` — creates a $19/mo recurring subscription

These can be implemented as Supabase Edge Functions or a separate backend.

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production (TypeScript check + Vite bundle)
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Project Structure

```
src/
├── App.tsx                          # Main router with all routes
├── main.tsx                         # React entry point
├── index.css                        # Global styles + Tailwind
├── context/
│   └── AuthContext.tsx               # Auth state (user, role, tier, signUp, signIn, signOut)
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx            # Layout wrapper (Navbar + Sidebar + content)
│   │   ├── Navbar.tsx               # Top nav, auth-aware
│   │   └── Sidebar.tsx              # Side nav, role-based links
│   ├── payments/
│   │   ├── BookingPayment.tsx       # Stripe CardElement for session booking
│   │   ├── EliteUpgrade.tsx         # Stripe CardElement for $19/mo Elite upgrade
│   │   └── DisputeModal.tsx         # Modal for filing session disputes
│   ├── ui/
│   │   ├── Avatar.tsx               # Circular avatar with initials fallback
│   │   ├── Badge.tsx                # Pill-shaped status badges
│   │   ├── Button.tsx               # Primary/secondary/ghost variants
│   │   ├── Card.tsx                 # White card with shadow-sm
│   │   └── StatsRow.tsx             # Dashboard stat cards
│   └── ProtectedRoute.tsx           # Role-based route guard
├── hooks/
│   ├── useAuth.ts                   # Re-export from AuthContext
│   ├── useCoaches.ts                # Fetch approved coaches with search/filter
│   ├── useCoach.ts                  # Fetch single coach with availability + reviews
│   ├── useBookings.ts               # Fetch bookings for current user
│   └── useAvailability.ts           # Fetch and update availability slots
├── lib/
│   ├── supabase.ts                  # Supabase client + type definitions
│   └── stripe.ts                    # Stripe client + constants
├── pages/
│   ├── LandingPage.tsx              # / — Hero, CTAs, feature cards
│   ├── SignUpPage.tsx               # /signup — Email + role selector
│   ├── LoginPage.tsx                # /login — Email/password, role-based redirect
│   ├── AthleteOnboarding.tsx        # /onboarding/athlete — 3-step wizard
│   ├── CoachOnboarding.tsx          # /onboarding/coach — 4-step wizard
│   ├── AthleteDashboard.tsx         # /dashboard/athlete — Stats, sessions, confirm
│   ├── CoachDashboard.tsx           # /dashboard/coach — Stats, bookings, earnings
│   ├── CoachDiscovery.tsx            # /coaches — Search, filter, coach cards
│   ├── CoachProfile.tsx             # /coaches/:id — Bio, availability, reviews
│   ├── BookingFlow.tsx              # /book/:coachId — Slot picker + Stripe pay
│   ├── ReviewSubmission.tsx          # /review/:sessionId — Star rating + comment
│   └── AdminDashboard.tsx           # /admin — 4-tab admin panel
├── types/
│   └── database.ts                  # Full TypeScript database types
supabase/
├── schema_clean.sql                 # All tables with RLS policies
├── seed.sql                         # 5 demo coaches with availability
└── migrations/                      # Supabase migrations
```

## Routes

| Route | Screen | Access |
|-------|--------|--------|
| `/` | Landing page | Public |
| `/signup` | Sign up + role selector | Public |
| `/login` | Login | Public |
| `/onboarding/athlete` | Athlete onboarding (3 steps) | Athlete |
| `/onboarding/coach` | Coach onboarding (4 steps) | Coach |
| `/dashboard/athlete` | Athlete dashboard | Athlete |
| `/dashboard/coach` | Coach dashboard | Approved coach |
| `/coaches` | Coach discovery + filters | Athlete |
| `/coaches/:id` | Coach profile page | Athlete |
| `/book/:coachId` | Booking flow (2 steps) | Athlete |
| `/review/:sessionId` | Review submission | Athlete |
| `/admin` | Admin dashboard | Admin only |

## Known Limitations

1. **Stripe backend endpoints** — `BookingPayment` and `EliteUpgrade` require server-side endpoints (`/api/create-payment-intent` and `/api/create-elite-subscription`). Implement as Supabase Edge Functions.
2. **Admin dashboard tabs** — Only the Coach Verification tab is fully functional. Payments, Analytics, and Feedback tabs show placeholder content.
3. **Availability editor** — Coach dashboard links to onboarding rather than inline editing.
4. **Photo upload** — Onboarding forms don't implement actual file upload for photo_url fields.
5. **Demo coach IDs** — Seed data uses placeholder user IDs; real Supabase auth user IDs are needed for foreign key constraints.

---

*Athlink · Phase 1 · South Bay Beta*