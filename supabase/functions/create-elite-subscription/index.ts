// Supabase Edge Function: create-elite-subscription
// Creates a Stripe Customer + Subscription for the $19/mo Elite tier
//
// Required environment variables (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY      - Stripe secret key (sk_test_... or sk_live_...)
//   STRIPE_ELITE_PRICE_ID  - Stripe Price ID for the Elite $19/mo plan

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

    const ELITE_PRICE_ID = Deno.env.get('STRIPE_ELITE_PRICE_ID')

    if (!ELITE_PRICE_ID) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_ELITE_PRICE_ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, email } = await req.json()

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or retrieve Stripe customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 })
    let customerId: string

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabaseUserId: userId,
        },
      })
      customerId = customer.id
    }

    // Create subscription with payment_behavior default_incomplete
    // so we can confirm payment on the client side
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: ELITE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        user_id: userId,
        type: 'athlete_elite',
      },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating elite subscription:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})