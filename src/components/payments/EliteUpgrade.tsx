import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ELITE_SUBSCRIPTION_PRICE } from '../../lib/stripe'
import { supabase, EDGE_FUNCTION_BASE } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function EliteUpgrade() {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe has not loaded. Please refresh and try again.')
      return
    }

    if (!user) {
      setError('You must be logged in to upgrade your membership.')
      return
    }

    setProcessing(true)

    try {
      // Step 1: Create a Stripe Subscription via Supabase Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${EDGE_FUNCTION_BASE}/create-elite-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to create subscription')
      }

      const { clientSecret, subscriptionId } = await response.json()

      // Step 2: Confirm the payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      // Step 3: Update the user's membership tier
      const { error: updateError } = await supabase
        .from('users')
        .update({ membership_tier: 'elite' })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update membership tier:', updateError)
        throw new Error('Payment succeeded but membership update failed. Please contact support.')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          {/* Elite gold badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 border-2 border-amber-300 rounded-full mb-4">
            <svg
              className="w-8 h-8"
              style={{ color: '#F59E0B' }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Elite!</h3>
          <p className="text-gray-600 mb-4">
            You now have access to priority booking and exclusive coach availability. Look for
            gold-highlighted slots when booking sessions.
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: '#F59E0B' }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            ELITE MEMBER
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Elite</h3>

      {/* Elite benefits */}
      <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: '#F59E0B' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5"
            style={{ color: '#F59E0B' }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className="font-semibold text-gray-900">$19/month</span>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Priority booking on premium time slots
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Gold Elite badge on your profile
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Early access to new coaches
          </li>
        </ul>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Card input */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
          <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                  invalid: {
                    color: '#dc2626',
                  },
                },
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full py-3 px-4 rounded-lg font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: '#F59E0B' }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            `Subscribe for $${(ELITE_SUBSCRIPTION_PRICE / 100).toFixed(2)}/month`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Cancel anytime. Your Elite benefits will remain active through the end of your billing
          period.
        </p>
      </form>
    </div>
  )
}