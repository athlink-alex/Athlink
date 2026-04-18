// Create Coach Subscription Checkout Session
// Creates a Stripe Checkout Session for coach Pro or Elite tier

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email, tier } = await req.json()

    if (!userId || !email || !tier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, email, tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map tier to Stripe price ID
    const priceId = tier === 'elite'
      ? Deno.env.get('STRIPE_ELITE_COACH_PRICE_ID')
      : tier === 'pro'
      ? Deno.env.get('STRIPE_PRO_PRICE_ID')
      : null

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for tier: ${tier}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 })
    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId },
      })
      customerId = customer.id
    }

    // Create Checkout Session
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://athlink.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/coach/subscription?upgraded=true`,
      cancel_url: `${origin}/dashboard/coach/subscription?canceled=true`,
      metadata: {
        user_id: userId,
        type: 'coach_subscription',
        tier,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Coach subscription error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})