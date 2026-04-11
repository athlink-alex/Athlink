# Athlink MVP Architecture Plan

Sports coaching matchmaking app for South Bay LA. Athletes find coaches; coaches manage bookings. Stripe handles escrow: funds held until session completion.

---

## 1. Database Schema (Supabase)

### Tables

**users** (extends auth.users)
- `id` (uuid, PK, ref auth.users)
- `email` (text)
- `role` (enum: 'athlete' | 'coach' | 'admin')
- `first_name` (text)
- `last_name` (text)
- `phone` (text)
- `avatar_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**athlete_profiles**
- `user_id` (uuid, PK, ref users.id)
- `sports` (text[] - e.g., ['tennis', 'basketball'])
- `skill_level` (enum: 'beginner' | 'intermediate' | 'advanced')
- `age_group` (enum: 'youth' | 'teen' | 'adult')
- `location_zip` (text - for matching nearby coaches)
- `bio` (text)
- `emergency_contact_name` (text)
- `emergency_contact_phone` (text)

**coach_profiles**
- `user_id` (uuid, PK, ref users.id)
- `sports` (text[])
- `title` (text - e.g., "USPTA Certified Tennis Pro")
- `bio` (text)
- `years_experience` (int)
- `hourly_rate` (int - cents)
- `location_zip` (text)
- `service_radius_miles` (int)
- `is_verified` (bool)
- `stripe_account_id` (text - Connect account)
- `stripe_onboarding_complete` (bool)
- `id_verified` (bool)
- `background_checked` (bool)

**coach_credentials** (verification docs)
- `id` (uuid, PK)
- `coach_id` (uuid, ref coach_profiles.user_id)
- `type` (enum: 'certification' | 'background_check' | 'id_doc')
- `file_url` (text)
- `status` (enum: 'pending' | 'approved' | 'rejected')
- `reviewed_at` (timestamp)
- `notes` (text)

**sessions** (bookings)
- `id` (uuid, PK)
- `athlete_id` (uuid, ref users.id)
- `coach_id` (uuid, ref users.id)
- `sport` (text)
- `status` (enum: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed')
- `scheduled_at` (timestamp)
- `duration_minutes` (int)
- `location_address` (text)
- `location_lat` (float)
- `location_lng` (float)
- `hourly_rate` (int - snapshot at booking)
- `total_amount` (int - cents)
- `platform_fee_percent` (int - e.g., 15)
- `coach_payout` (int - cents, calculated)
- `stripe_payment_intent_id` (text)
- `stripe_transfer_id` (text)
- `cancellation_reason` (text)
- `cancelled_by` (uuid, ref users.id)
- `athlete_notes` (text)
- `coach_notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**session_reviews**
- `id` (uuid, PK)
- `session_id` (uuid, ref sessions.id)
- `reviewer_id` (uuid, ref users.id)
- `reviewee_id` (uuid, ref users.id)
- `role` (enum: 'athlete' | 'coach')
- `rating` (int - 1-5)
- `review` (text)
- `created_at` (timestamp)

**availability** (coach schedules)
- `id` (uuid, PK)
- `coach_id` (uuid, ref users.id)
- `day_of_week` (int - 0=Sunday)
- `start_time` (time)
- `end_time` (time)
- `is_recurring` (bool)
- `specific_date` (date - null if recurring)
- `is_blocked` (bool - for exceptions)

**conversations**
- `id` (uuid, PK)
- `session_id` (uuid, nullable - linked to booking or general)
- `participant_1_id` (uuid, ref users.id)
- `participant_2_id` (uuid, ref users.id)
- `created_at` (timestamp)

**messages**
- `id` (uuid, PK)
- `conversation_id` (uuid, ref conversations.id)
- `sender_id` (uuid, ref users.id)
- `content` (text)
- `read_at` (timestamp)
- `created_at` (timestamp)

### RLS Policies

- Users can read their own profile
- Coaches can read athlete profiles they have sessions with
- Athletes can read coach_profiles (public info)
- Sessions: participants can read their own sessions
- Messages: participants can read their conversations

---

## 2. Next.js App Structure

```
app/
├── (marketing)/                    # Public landing pages
│   ├── page.tsx                    # Landing page
│   ├── coaches/page.tsx            # Coach directory (public)
│   ├── coaches/[id]/page.tsx       # Coach public profile
│   └── layout.tsx
│
├── (auth)/                         # Auth pages (no sidebar)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── signup/athlete/page.tsx      # Athlete onboarding step 1
│   ├── signup/coach/page.tsx        # Coach onboarding step 1
│   ├── verify-email/page.tsx
│   └── layout.tsx
│
├── (app)/                          # Authenticated app
│   ├── layout.tsx                  # App shell with sidebar
│   ├── dashboard/page.tsx          # Role-based dashboard
│   │
│   ├── athlete/                    # Athlete routes
│   │   ├── find-coaches/page.tsx   # Search/map view
│   │   ├── bookings/page.tsx       # My sessions
│   │   ├── bookings/[id]/page.tsx
│   │   ├── messages/page.tsx
│   │   └── profile/page.tsx
│   │
│   └── coach/                      # Coach routes
│       ├── availability/page.tsx   # Set schedule
│       ├── bookings/page.tsx       # Incoming requests
│       ├── bookings/[id]/page.tsx
│       ├── earnings/page.tsx       # Payout history
│       ├── verification/page.tsx   # Upload credentials
│       ├── messages/page.tsx
│       └── profile/page.tsx
│
├── api/                            # Route handlers
│   ├── coaches/route.ts
│   ├── sessions/route.ts
│   ├── stripe/
│   │   ├── connect/route.ts        # Create Connect account
│   │   ├── webhook/route.ts        # Handle events
│   │   └── payout/route.ts         # Release funds
│   └── ...
│
├── actions/                        # Server actions
│   ├── bookings.ts
│   ├── coaches.ts
│   ├── messages.ts
│   └── profile.ts
│
├── components/
│   ├── ui/                         # shadcn components
│   ├── auth/
│   ├── booking/
│   ├── coaches/
│   ├── maps/
│   ├── messaging/
│   └── forms/
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-coach-search.ts
│   └── use-realtime.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── admin.ts                # Service role client
│   ├── stripe.ts
│   ├── geocode.ts                  # Address to lat/lng
│   └── utils.ts
│
└── types/
    └── database.ts                 # Generated Supabase types
```

### Key Technical Decisions

- **App Router** with route groups for marketing/auth/app layouts
- **Server Actions** for mutations (bookings, profile updates)
- **Route Handlers** only for Stripe webhooks (needs raw body)
- **Supabase Realtime** for messaging
- **Vercel** for hosting (Edge functions compatible)

---

## 3. Stripe Escrow Flow

### Accounts

- **Platform Account**: Athlink holds funds
- **Coach Connect Accounts**: Express or Standard accounts for payouts

### Payment States

```
Booking Requested
      ↓
[Capture Payment] → PaymentIntent created, status=requires_capture
      ↓
Coach Confirms → capture funds (escrow held by Athlink)
      ↓
Session Completed → Coach marks complete
      ↓
[Release Payout] → transfer to coach (minus platform fee)
```

### Webhook Handlers

- `payment_intent.captured` → Confirm booking, notify users
- `account.updated` → Update coach onboarding status
- `transfer.paid` → Mark payout complete

### Edge Cases

- **Cancellation by athlete (24h+ before)**: Full refund
- **Cancellation by athlete (<24h)**: Platform keeps 50%, coach gets 50%
- **Cancellation by coach**: Full refund to athlete
- **No-show**: After 24h, manual review → release or refund
- **Dispute**: Hold funds, admin review

### Connect Onboarding

1. Coach clicks "Start Coaching"
2. Create Stripe Connect account
3. Generate onboarding link (with refresh/return URLs)
4. Redirect to Stripe
5. Webhook updates `stripe_onboarding_complete`

---

## 4. Dual Onboarding Flows

### Athlete Onboarding

**Step 1: Auth Signup**
- Email/password or OAuth (Google)
- Verify email

**Step 2: Profile Setup**
- Name, phone, avatar
- Sports selection (multi-select)
- Skill level (beginner/intermediate/advanced)
- Age group
- ZIP code (for coach matching)
- Emergency contact (optional)

**Step 3: Complete**
- Redirect to athlete dashboard
- "Find a Coach" CTA

### Coach Onboarding

**Step 1: Auth Signup**
- Same as athlete

**Step 2: Profile Setup**
- Name, phone, avatar
- Title/tagline
- Bio
- Sports taught (multi-select)
- Years experience
- Hourly rate
- Service radius
- ZIP code

**Step 3: Verification**
- ID upload (driver's license)
- Certifications (optional but boosts visibility)
- Background check consent

**Step 4: Stripe Connect**
- Create Connect account
- Redirect to Stripe onboarding
- Collect bank info, TOS acceptance

**Step 5: Set Availability**
- Weekly recurring schedule
- Specific date overrides

**Step 6: Complete**
- Profile pending review (if ID verification required)
- Or immediately live if auto-approved

### Flow Diagram

```
Landing Page
    ↓
Sign Up (select role)
    ↓
    ├─→ Athlete Flow ──→ Profile ──→ Dashboard
    │
    └─→ Coach Flow ──→ Profile ──→ Verification ──→ Stripe ──→ Availability ──→ Dashboard
```

---

## 5. Key Features (MVP Scope)

### In Scope

- [ ] Athlete/coach auth with role selection
- [ ] Coach profiles with sports/rate/location
- [ ] Coach search by sport + ZIP + radius
- [ ] Simple map view (Google Maps or Mapbox)
- [ ] Booking request flow with Stripe escrow
- [ ] In-app messaging (Supabase Realtime)
- [ ] Coach availability management
- [ ] Review system (post-session)
- [ ] Basic notifications (email)

### Out of Scope (Future)

- Group sessions / clinics
- Subscription packages
- Video chat integration
- Coach analytics dashboard
- Mobile native apps
- Calendar sync (Google/Outlook)
- Insurance integration
- Promo codes / referrals

---

## 6. South Bay LA Considerations

- Focus sports: Tennis, basketball, soccer, volleyball, swimming
- Initial ZIPs: 90254 (Hermosa), 90266 (Manhattan), 90278 (Redondo), 90501 (Torrance), 90277 (South Redondo)
- Marketing: Local clubs, high schools, parks & rec
- Seasonality: Outdoor sports weather-dependent
- Competition: Lessons.com, CoachUp, local club pros

---

## Next Steps

1. Set up Supabase project
2. Initialize Next.js with shadcn/ui
3. Configure Stripe Connect
4. Build auth flows
5. Create database tables with RLS
6. Build athlete onboarding
7. Build coach onboarding
8. Implement booking flow with escrow
9. Add messaging
10. Deploy to Vercel
