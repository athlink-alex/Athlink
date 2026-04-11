import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

if (!stripePublishableKey) {
  console.warn('Stripe environment variable not set. Please configure VITE_STRIPE_PUBLISHABLE_KEY')
}

export const stripePromise = loadStripe(stripePublishableKey)

export const ELITE_SUBSCRIPTION_PRICE = 1900 // $19.00 in cents
export const PLATFORM_FEE_PERCENT = 15

export function calculateCoachPayout(sessionAmount: number): number {
  return Math.round(sessionAmount * (1 - PLATFORM_FEE_PERCENT / 100))
}
