# Supabase Setup Guide

## Quick Start

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to your project dashboard and find:
   - **Project URL**: Settings > API > URL
   - **Anon Key**: Settings > API > Project API keys > anon public

3. Add these to your `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. Open the SQL Editor in Supabase and run the migration:
   - Go to SQL Editor > New query
   - Copy contents of `001_initial_schema.sql`
   - Click "Run"

5. (Optional) Seed demo data:
   - Run `seed.sql` after the migration

## Schema Overview

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Extended auth user data with role |
| `athlete_profiles` | Athlete-specific info |
| `coach_profiles` | Coach info with approval status |
| `availability_slots` | Coach weekly schedule |
| `bookings` | Session bookings |
| `reviews` | Coach ratings |
| `disputes` | Session disputes |

### Enums

- `user_role`: athlete, coach, admin
- `membership_tier`: free, elite
- `skill_level`: beginner, intermediate, advanced
- `coach_status`: pending, approved, rejected
- `booking_status`: scheduled, completed, disputed, cancelled
- `payment_status`: escrow_held, released

### Row Level Security (RLS)

All tables have RLS enabled with these rules:
- Users can only view/modify their own data
- Coaches can view athlete profiles they work with
- Approved coach profiles are public for discovery
- Admins have full access

## Troubleshooting

### RLS blocking queries
If you get RLS errors during development:
1. Check you're using the correct anon key
2. Verify the user is authenticated
3. Check the RLS policy matches your use case

### Demo coaches not showing
The demo coaches are inserted with placeholder user_ids. In production, you'd create real auth users first.

### Stripe integration
Payment intents need to be created server-side or via Edge Functions for security. The current setup is for client-side testing only.
