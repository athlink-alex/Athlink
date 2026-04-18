import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase, EDGE_FUNCTION_BASE } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface BookingPaymentProps {
  amount: number // in cents
  coachId: string
  slotId: string
  sessionDate: string
  coachName?: string
  sport?: string
  onSuccess?: () => void
}

export function BookingPayment({
  amount,
  coachId,
  slotId,
  sessionDate,
  coachName,
  sport,
  onSuccess,
}: BookingPaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe has not loaded. Please refresh and try again.')
      return
    }

    if (!user) {
      setError('You must be logged in to make a booking.')
      return
    }

    setProcessing(true)

    try {
      // Step 1: Create a PaymentIntent on the server (Supabase Edge Function)
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${EDGE_FUNCTION_BASE}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ amount, coachId, slotId }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to create payment intent')
      }

      const { clientSecret, paymentIntentId } = await response.json()

      // Step 2: Confirm the payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not successful. Please try again.')
      }

      // Step 3: Insert the booking record
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          athlete_id: user.id,
          coach_id: coachId,
          slot_id: slotId,
          session_date: sessionDate,
          status: 'scheduled',
          payment_status: 'escrow_held',
          amount,
          stripe_payment_intent_id: paymentIntentId || paymentIntent.id,
          athlete_confirmed: false,
          coach_confirmed: false,
        })

      if (bookingError) {
        // Payment succeeded but booking insert failed — log for reconciliation
        console.error('Booking insert failed after successful payment:', bookingError)
        throw new Error('Payment succeeded but booking creation failed. Please contact support.')
      }

      // Step 4: Mark the slot as booked
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slotId)

      if (slotError) {
        console.error('Slot update failed:', slotError)
        // Non-fatal — the booking is still valid
      }

      // Step 5: Redirect / notify success
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Payment Details</h3>

      {/* Session summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          {coachName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Coach</span>
              <span className="font-medium text-gray-900 dark:text-gray-50">{coachName}</span>
            </div>
          )}
          {sport && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Sport</span>
              <span className="font-medium text-gray-900 dark:text-gray-50">{sport}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Date</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {new Date(sessionDate).toLocaleDateString()}
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-50">Total</span>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-50">
              ${(amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Escrow notice */}
      <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <svg
          className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-blue-800">
          Your payment will be held in escrow and only released to the coach after both parties
          confirm session completion.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Card input */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Information</label>
          <div className="border border-gray-300 dark:border-gray-700 rounded-md p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
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
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
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
              Processing payment...
            </span>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  )
}