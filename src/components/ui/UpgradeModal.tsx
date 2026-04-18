import { useState } from 'react'
import { COACH_PLANS, type CoachTier, type FeatureKey, requiredTier } from '../../lib/subscriptions'
import { supabase, EDGE_FUNCTION_BASE } from '../../lib/supabase'

interface UpgradeModalProps {
  feature: FeatureKey
  currentTier: CoachTier
  onClose: () => void
}

export function UpgradeModal({ feature, currentTier, onClose }: UpgradeModalProps) {
  const needed = requiredTier(feature)
  const plan = COACH_PLANS[needed]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const response = await fetch(`${EDGE_FUNCTION_BASE}/create-coach-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          tier: needed,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-[8px] shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Upgrade to {plan.label}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This feature requires the {plan.label} plan or higher.
          </p>
        </div>

        <div className="bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px] p-4 mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-50">{plan.label}</span>
            <span className="text-2xl font-bold text-[#2563EB]">
              ${plan.price}<span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/mo</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-[8px] bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting to checkout...' : `Upgrade to ${plan.label}`}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-[#DC2626] text-center">{error}</p>
        )}
      </div>
    </div>
  )
}