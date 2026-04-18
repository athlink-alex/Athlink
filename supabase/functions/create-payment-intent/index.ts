// Supabase Edge Function: create-payment-intent
// Creates a Stripe PaymentIntent for escrow-based booking payments
//
// Required environment variables (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY - Stripe secret key (sk_test_... or sk_live_...)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { amount, coachId, slotId } = await req.json()

    if (!amount || !coachId || !slotId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, coachId, slotId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a PaymentIntent with the amount in cents
    // Escrow pattern: payment is captured immediately but held until
    // both parties confirm session completion
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount should already be in cents
      currency: 'usd',
      metadata: {
        coachId,
        slotId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})