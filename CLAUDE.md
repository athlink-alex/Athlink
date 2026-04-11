# CLAUDE.md — Athlink

> Read this file at the start of every session. This is the single source of truth for the Athlink project.

---

## What is Athlink?

Athlink is a **private sports coaching matchmaking app** — a marketplace that connects athletes and parents with vetted private coaches. Think of it as the "Airbnb for sports coaching."

- **Phase:** MVP — South Bay (Los Angeles) Beta Launch
- **Target market:** South Bay, CA (Hermosa Beach, Manhattan Beach, Redondo Beach, Torrance area)
- **Owner:** Alex (solo founder, youth baseball coach)

---

## Core Product Features

- **Dual onboarding flows** — separate flows for Athletes/Parents and Coaches
- **Manual coach verification** — coaches are manually reviewed and approved by admin before going live
- **Escrow-based payments** — funds are held in escrow via Stripe and only released to coaches after session completion is confirmed by both parties
- **Elite subscription tier** — $19/mo for athletes, unlocks priority booking (shown in gold UI)
- **Dispute system** — either party can flag a session; flagged disputes go to admin review
- **Review system** — athletes review coaches after confirmed session completion

### Explicitly OUT of MVP scope:
- No AI matchmaking
- No facility partnerships
- No insurance systems
- No group bookings (Phase 2)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (JS client) |
| Payments | Stripe — Stripe.js + Stripe Elements + Payment Intents (escrow) |
| Routing | React Router v6 |
| State management | React Context or Zustand |
| Hosting | TBD (Vercel recommended) |

---

## Database Schema (Supabase)

### `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | Unique |
| role | enum | `athlete` \| `coach` \| `admin` |
| membership_tier | enum | `free` \| `elite` |
| created_at | timestamp | |

### `athlete_profiles`
| Field | Type |
|---|---|
| id | uuid |
| user_id | uuid (FK → users) |
| name | text |
| sport | text |
| position | text |
| skill_level | enum: `beginner` \| `intermediate` \| `advanced` |
| goals | text |
| photo_url | text |

### `coach_profiles`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| user_id | uuid (FK → users) | |
| name | text | |
| bio | text | |
| sport | text | |
| certifications_url | text | Uploaded doc |
| hourly_rate | numeric | |
| experience_years | integer | |
| status | enum | `pending` \| `approved` \| `rejected` |
| avg_rating | numeric | Computed from reviews |
| photo_url | text | |

### `availability_slots`
| Field | Type |
|---|---|
| id | uuid |
| coach_id | uuid (FK → coach_profiles) |
| day_of_week | text |
| start_time | time |
| end_time | time |
| is_booked | boolean |

### `bookings`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| athlete_id | uuid | FK → users |
| coach_id | uuid | FK → coach_profiles |
| slot_id | uuid | FK → availability_slots |
| session_date | date | |
| status | enum | `scheduled` \| `completed` \| `disputed` \| `cancelled` |
| payment_status | enum | `escrow_held` \| `released` |
| amount | numeric | |
| stripe_payment_intent_id | text | |

### `reviews`
| Field | Type |
|---|---|
| id | uuid |
| booking_id | uuid (FK → bookings) |
| athlete_id | uuid |
| coach_id | uuid |
| rating | integer (1–5) |
| comment | text |
| created_at | timestamp |

### `disputes`
| Field | Type |
|---|---|
| id | uuid |
| booking_id | uuid (FK → bookings) |
| raised_by | uuid (FK → users) |
| reason | text |
| status | enum: `open` \| `resolved` |
| created_at | timestamp |

---

## All App Screens & Routes

| Route | Screen | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/signup` | Sign up + role selector | Public |
| `/login` | Login | Public |
| `/onboarding/athlete` | Athlete onboarding (3 steps) | Athlete |
| `/onboarding/coach` | Coach onboarding (4 steps) | Coach |
| `/dashboard/athlete` | Athlete dashboard | Athlete |
| `/dashboard/coach` | Coach dashboard | Approved coach |
| `/coaches` | Coach discovery + search/filter | Athlete |
| `/coaches/:id` | Coach profile page | Athlete |
| `/book/:coachId` | Booking flow (2 steps) | Athlete |
| `/review/:sessionId` | Review submission | Athlete |
| `/admin` | Admin dashboard | Admin role only |

---

## Screen Specs

### Landing Page (`/`)
- Hero: "Find your coach. Elevate your game."
- Two CTAs: "Find a Coach" + "Become a Coach"
- Feature highlights section
- Footer with beta label

### Sign Up (`/signup`)
- Email + password
- Role selector: two visual cards — "I'm an Athlete / Parent" vs "I'm a Coach"
- Selected card gets blue border highlight

### Athlete Onboarding — 3 steps (`/onboarding/athlete`)
1. Profile: name, photo upload, athlete age
2. Sport details: sport (dropdown), position, skill level, goals
3. Payment: Stripe card input + tier selection (Free vs Elite $19/mo — show visual difference)

### Coach Onboarding — 4 steps (`/onboarding/coach`)
1. Profile: name, bio, sport specialty, photo upload
2. Credentials: certification upload, years experience, highlights
3. Pricing & availability: hourly rate, session type, weekly availability grid (toggle slots)
4. Verification pending screen — "Your profile is under review." No dashboard access until approved.

### Athlete Dashboard (`/dashboard/athlete`)
- Welcome + name
- Stats: sessions booked, upcoming, total spent
- "Find a Coach" CTA
- Upcoming sessions list with status badges
- Membership badge (Free or Elite)

### Coach Discovery (`/coaches`)
- Search bar
- Filters: sport, location, price range slider, availability day checkboxes
- Coach cards grid (3 col desktop, 1 col mobile)
- Each card: photo, name, sport, star rating, price, "View Profile" button

### Coach Profile (`/coaches/:id`)
- Full bio, certifications, read-only availability calendar
- Reviews list with ratings
- Sticky right sidebar: price + "Book a Session" button
- Verified badge if approved

### Booking Flow (`/book/:coachId`) — 2 steps
1. Select time: available slots calendar. Elite members see priority slots highlighted gold.
2. Confirm & pay: session summary + Stripe payment. On success → escrow_held = true.

### Coach Dashboard (`/dashboard/coach`)
- Stats: total sessions, upcoming, earnings (pending vs released)
- Upcoming bookings list
- Availability editor
- Earnings panel

### Session Completion
- Both parties must confirm → status = completed, payment_status = released
- "Awaiting other party" state if only one confirms
- Dispute link on each session card

### Review Submission (`/review/:sessionId`)
- Star selector (1–5) + text area
- Updates coach avg_rating on submit

### Admin Dashboard (`/admin`) — role-protected
4 tabs:
1. Coach Verification — approve/reject pending coaches
2. Payment Oversight — all transactions table
3. Booking Analytics — total bookings, completion rate, revenue, active users
4. Feedback Monitoring — all reviews with flag option

---

## Design System

### Colors
| Token | Hex |
|---|---|
| Background | #FFFFFF |
| Surface | #F9FAFB |
| Border | #E5E7EB |
| Primary blue | #2563EB |
| Success green | #16A34A |
| Warning amber | #D97706 |
| Error red | #DC2626 |
| Elite gold | #F59E0B |

### Typography
- Font: **Geist Sans** or **Inter**
- Headings: bold
- Body: regular
- Labels: medium weight

### Components
- Border radius: 8px
- Card shadows: `shadow-sm`
- Status badges: pill-shaped
- Spacing: generous padding, clean section dividers

### Status Badge Colors
| Status | Color |
|---|---|
| Scheduled | Blue |
| Completed | Green |
| Pending | Amber |
| Disputed | Red |
| Elite | Gold |

---

## Stripe / Payment Logic

- Use **Stripe Payment Intents** for all bookings
- On booking confirmation → create PaymentIntent, hold funds (`escrow_held`)
- On session completion (both parties confirm) → release funds to coach (`released`)
- Store `stripe_payment_intent_id` on every booking row
- Elite subscription: $19/mo recurring subscription via Stripe Subscriptions
- Use Stripe Elements for all card input UI

---

## Demo Coaches (for testing/staging)

1. **Marcus Reid** — Baseball · Hitting Coach — $65/session — South Bay, CA — ⭐4.9 (58 reviews) — "Former D1 shortstop with 8 years coaching youth and high school athletes."
2. **Sofia Navarro** — Soccer · Skills & Conditioning — $55/session — South Bay, CA — ⭐4.7 (34 reviews) — "UEFA-licensed coach focused on technical development for U10–U18 players."
3. **Darnell Okafor** — Basketball · Guard Development — $70/session — South Bay, CA — ⭐4.8 (71 reviews) — "Former semi-pro player turned full-time trainer."
4. **Priya Kapoor** — Tennis · Junior Development — $60/session — South Bay, CA — ⭐4.6 (29 reviews) — "USPTA certified with 10 years coaching juniors."
5. **Jake Morrow** — Baseball · Pitching & Arm Care — $75/session — South Bay, CA — ⭐5.0 (19 reviews) — "Biomechanics-focused pitching coach for youth through collegiate athletes."

---

## Known Issues / Completed Fixes

- ✅ Post-questionnaire athlete flow now routes to `/coaches` results page (was stopping with no output in V2)
- Coach slide-over availability panel on coach cards — implemented

---

## How to Work With This Codebase

- Always check existing components before creating new ones
- All new pages go in `/src/pages/`, components in `/src/components/`
- Supabase client is initialized in `/src/lib/supabase.ts`
- Stripe is initialized in `/src/lib/stripe.ts`
- Auth state is managed via Context in `/src/context/AuthContext.tsx`
- Role-based route protection is in `/src/components/ProtectedRoute.tsx`
- When adding a new Supabase table, always add RLS policies
- Keep mobile responsiveness on every screen (1 col mobile, multi-col desktop)

---

*Athlink · Phase 1 South Bay Beta · Built by Alex*
