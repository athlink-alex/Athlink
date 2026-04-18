// Supabase Edge Function: release-escrow
// Transfers held escrow funds to the coach's Stripe connected account
// Called when both athlete and coach confirm session completion
//
// Required environment variables (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY - Stripe secret key (sk_test_... or sk_live_...)
//   SUPABASE_URL      - Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_FEE_PERCENT = 15

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { bookingId } = await req.json()

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the booking with coach profile to get the Stripe connected account
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, coach_profiles!coach_id(stripe_connect_account_id, user_id)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify both parties have confirmed
    if (!booking.athlete_confirmed || !booking.coach_confirmed) {
      return new Response(
        JSON.stringify({ error: 'Both parties must confirm before releasing escrow' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify booking is in the right state
    if (booking.payment_status !== 'escrow_held') {
      return new Response(
        JSON.stringify({ error: 'Booking payment is not in escrow_held status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentIntentId = booking.stripe_payment_intent_id
    const coachProfile = booking.coach_profiles as { stripe_connect_account_id: string | null; user_id: string | null }

    // Calculate coach payout (minus platform fee)
    const sessionAmount = booking.amount as number
    const coachPayoutAmount = Math.round(sessionAmount * (1 - PLATFORM_FEE_PERCENT / 100))

    // If the coach has a Stripe Connect account, transfer funds to it
    // Otherwise, just mark as released (coach will need to set up Connect for future payouts)
    if (coachProfile?.stripe_connect_account_id && paymentIntentId) {
      try {
        // Create a transfer to the coach's connected account
        // The transfer uses the PaymentIntent's charge as the source
        const transfer = await stripe.transfers.create({
          amount: coachPayoutAmount,
          currency: 'usd',
          destination: coachProfile.stripe_connect_account_id,
          source_transaction: paymentIntentId,
          metadata: {
            booking_id: bookingId,
            platform_fee: String(sessionAmount - coachPayoutAmount),
            platform_fee_percent: String(PLATFORM_FEE_PERCENT),
          },
        })

        // Update booking with completed status and release
        await supabase
          .from('bookings')
          .update({
            status: 'completed',
            payment_status: 'released',
          })
          .eq('id', bookingId)

        return new Response(
          JSON.stringify({
            success: true,
            transferId: transfer.id,
            coachPayout: coachPayoutAmount,
            platformFee: sessionAmount - coachPayoutAmount,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (transferError) {
        console.error('Stripe transfer failed:', transferError)
        // Even if the transfer fails, mark as completed in DB but keep escrow held
        // Admin can manually resolve the transfer
        await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingId)

        return new Response(
          JSON.stringify({
            error: 'Transfer to coach account failed. Session marked as completed but payment remains held. Admin review required.',
            details: transferError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // No Stripe Connect account — mark completed and released
      // The coach needs to set up Stripe Connect to receive payouts
      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          payment_status: 'released',
        })
        .eq('id', bookingId)

      return new Response(
        JSON.stringify({
          success: true,
          note: 'Coach has no Stripe Connect account. Payment marked as released but no transfer made. Coach needs to set up Stripe Connect to receive payouts.',
          coachPayout: coachPayoutAmount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error releasing escrow:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})