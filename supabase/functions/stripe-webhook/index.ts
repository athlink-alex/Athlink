// Stripe Webhook Handler
// Handles: payment_intent.succeeded, payment_intent.canceled,
//          customer.subscription.created, customer.subscription.updated, customer.subscription.deleted

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      // ─── PAYMENT INTENT SUCCEEDED ─────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.booking_id

        if (bookingId) {
          // Update booking to mark escrow as held
          await supabase
            .from('bookings')
            .update({
              stripe_payment_intent_id: pi.id,
              payment_status: 'escrow_held',
            })
            .eq('id', bookingId)
        }
        break
      }

      // ─── SESSION COMPLETED → RELEASE ESCROW ──────────────
      // This is triggered by our own logic when both parties confirm,
      // but we also handle the case where Stripe auto-releases
      case 'payment_intent.captured': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.booking_id

        if (bookingId) {
          await supabase
            .from('bookings')
            .update({ payment_status: 'released' })
            .eq('id', bookingId)
        }
        break
      }

      // ─── PAYMENT CANCELED / REFUNDED ─────────────────────
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.booking_id

        if (bookingId) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', payment_status: 'released' })
            .eq('id', bookingId)
        }
        break
      }

      // ─── COACH SUBSCRIPTION CREATED ──────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (!userId) break

        // Determine tier from price ID
        const priceId = subscription.items.data[0]?.price?.id
        const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID')
        const elitePriceId = Deno.env.get('STRIPE_ELITE_COACH_PRICE_ID')

        let tier = 'free'
        if (priceId === elitePriceId) tier = 'elite'
        else if (priceId === proPriceId) tier = 'pro'

        // Update coach_profiles
        await supabase
          .from('coach_profiles')
          .update({
            subscription_tier: tier,
            stripe_subscription_id: subscription.id,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userId)

        // Upsert coach_subscriptions
        const { data: coachProfile } = await supabase
          .from('coach_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (coachProfile) {
          await supabase
            .from('coach_subscriptions')
            .upsert({
              coach_id: coachProfile.id,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              tier,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, { onConflict: 'coach_id' })
        }
        break
      }

      // ─── COACH SUBSCRIPTION DELETED ───────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (!userId) break

        // Downgrade to free
        await supabase
          .from('coach_profiles')
          .update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
            subscription_current_period_end: null,
          })
          .eq('user_id', userId)

        const { data: coachProfile } = await supabase
          .from('coach_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (coachProfile) {
          await supabase
            .from('coach_subscriptions')
            .update({
              tier: 'free',
              status: 'canceled',
              cancel_at_period_end: false,
            })
            .eq('coach_id', coachProfile.id)
        }
        break
      }

      // ─── ATHLETE ELITE SUBSCRIPTION ───────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const type = session.metadata?.type

        if (type === 'athlete_elite' && userId) {
          await supabase
            .from('users')
            .update({ membership_tier: 'elite' })
            .eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    return new Response('Webhook handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})