import { useState } from 'react'
import { hasAccess, type CoachTier, type FeatureKey } from '../../lib/subscriptions'
import { UpgradeModal } from './UpgradeModal'

interface UpgradeGateProps {
  tier: CoachTier
  feature: FeatureKey
  children: React.ReactNode
  /** If true, show content with a lock overlay instead of hiding entirely */
  overlay?: boolean
}

export function UpgradeGate({ tier, feature, children, overlay = false }: UpgradeGateProps) {
  const [showModal, setShowModal] = useState(false)

  if (hasAccess(tier, feature)) {
    return <>{children}</>
  }

  if (overlay) {
    return (
      <>
        <div className="relative">
          <div className="blur-sm opacity-60 pointer-events-none select-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-[8px] shadow-md border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium text-[#2563EB] hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Upgrade to unlock
            </button>
          </div>
        </div>
        {showModal && (
          <UpgradeModal
            feature={feature}
            currentTier={tier}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  // Hidden mode — show just the upgrade prompt
  return (
    <>
      <div className="p-6 text-center border border-dashed border-[#E5E7EB] dark:border-gray-700 rounded-[8px]">
        <svg className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">This feature requires a higher plan</p>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]"
        >
          View upgrade options &rarr;
        </button>
      </div>
      {showModal && (
        <UpgradeModal
          feature={feature}
          currentTier={tier}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}