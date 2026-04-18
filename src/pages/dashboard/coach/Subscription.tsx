import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, EDGE_FUNCTION_BASE } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { COACH_PLANS, type CoachTier } from '../../../lib/subscriptions'

export function Subscription() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, name, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    setLoading(false)
  }

  const handleUpgrade = async (newTier: CoachTier) => {
    if (newTier === 'free') return
    setUpgrading(newTier)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setUpgrading(null)
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
          tier: newTier,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setUpgrading(null)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.')
      setUpgrading(null)
    }
  }

  const currentPlan = COACH_PLANS[tier]

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Subscription</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your plan</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/coach')}
            className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
          >
            &larr; Dashboard
          </button>
        </div>

        {/* Current Plan */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-1">{currentPlan.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/month`}
              </p>
            </div>
            {tier !== 'elite' && (
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Upgrade to unlock more features</p>
              </div>
            )}
          </div>
        </Card>

        {/* Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(COACH_PLANS) as CoachTier[]).map((planTier) => {
            const plan = COACH_PLANS[planTier]
            const isCurrent = planTier === tier
            const isUpgrade = ['free', 'pro', 'elite'].indexOf(planTier) > ['free', 'pro', 'elite'].indexOf(tier)

            return (
              <Card
                key={planTier}
                className={`p-6 relative ${isCurrent ? 'ring-2 ring-[#2563EB]' : ''} ${planTier === 'elite' ? 'border-amber-200 dark:border-amber-800' : ''}`}
              >
                {planTier === 'elite' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#F59E0B] text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{plan.label}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 text-center rounded-[8px] bg-[#F9FAFB] dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Plan
                  </div>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(planTier)}
                    loading={upgrading === planTier}
                    disabled={!!upgrading}
                  >
                    {upgrading === planTier ? 'Redirecting...' : planTier === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Elite'}
                  </Button>
                ) : (
                  <div className="w-full py-2.5 text-center rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Downgrade
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-[#DC2626]/30 rounded-[8px]">
            <p className="text-sm text-[#DC2626]">{error}</p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change my plan at any time?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your data is preserved, but access to tier-specific features will be limited. You can upgrade again to regain full access.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts. All plans are month-to-month and you can cancel anytime.',
              },
            ].map((faq) => (
              <Card key={faq.q} className="p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{faq.q}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}