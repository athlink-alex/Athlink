import { COACH_PLANS, type CoachTier } from '../lib/subscriptions'

export function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
          Coach Plans
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the plan that fits your coaching business. Upgrade anytime as you grow.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(COACH_PLANS) as CoachTier[]).map((planTier) => {
            const plan = COACH_PLANS[planTier]
            return (
              <div
                key={planTier}
                className={`relative rounded-[8px] border p-8 ${
                  planTier === 'elite'
                    ? 'border-[#F59E0B] shadow-lg'
                    : 'border-[#E5E7EB] dark:border-gray-700'
                }`}
              >
                {planTier === 'elite' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F59E0B] text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{plan.label}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-50">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-8 w-full py-3 rounded-[8px] text-sm font-semibold transition-colors ${
                    planTier === 'elite'
                      ? 'bg-[#F59E0B] text-white hover:bg-amber-600'
                      : planTier === 'pro'
                      ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'
                      : 'bg-[#F9FAFB] dark:bg-gray-800 text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started Free' : `Start ${plan.label} Trial`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 text-center mb-8">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                  <th className="text-left py-3 pr-4 text-gray-500 dark:text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {[
                  { feature: 'Dashboard & Bookings', free: true, pro: true, elite: true },
                  { feature: 'Athlete Roster', free: '5 max', pro: 'Unlimited', elite: 'Unlimited' },
                  { feature: 'AI Coaching Assistant', free: '3/day', pro: 'Unlimited', elite: 'Unlimited' },
                  { feature: 'Session Notes', free: false, pro: true, elite: true },
                  { feature: 'Direct Messaging', free: false, pro: true, elite: true },
                  { feature: 'Revenue Dashboard', free: false, pro: true, elite: true },
                  { feature: 'CSV Export', free: false, pro: true, elite: true },
                  { feature: 'QR Code Profile Card', free: false, pro: true, elite: true },
                  { feature: 'Online Coaching Tools', free: false, pro: true, elite: true },
                  { feature: 'Advanced Analytics', free: false, pro: false, elite: true },
                  { feature: 'AI Progress Reports', free: false, pro: false, elite: true },
                  { feature: 'Video Review & Feedback', free: false, pro: false, elite: true },
                  { feature: 'Priority Listing', free: false, pro: false, elite: true },
                  { feature: 'Auto-Reminders', free: false, pro: false, elite: true },
                ].map((row) => (
                  <tr key={row.feature} className="text-gray-700 dark:text-gray-300">
                    <td className="py-3 pr-4">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {typeof row.free === 'boolean'
                        ? row.free
                          ? <span className="text-[#16A34A]">&#10003;</span>
                          : <span className="text-gray-300 dark:text-gray-600">&#8212;</span>
                        : row.free}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.pro === 'boolean'
                        ? row.pro
                          ? <span className="text-[#16A34A]">&#10003;</span>
                          : <span className="text-gray-300 dark:text-gray-600">&#8212;</span>
                        : row.pro}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.elite === 'boolean'
                        ? row.elite
                          ? <span className="text-[#16A34A]">&#10003;</span>
                          : <span className="text-gray-300 dark:text-gray-600">&#8212;</span>
                        : row.elite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}