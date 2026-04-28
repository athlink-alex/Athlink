import { useState } from 'react'
import { hasCoachAccess, type CoachTier, type CoachFeatureKey } from '../../lib/subscriptions'
import { UpgradeModal } from './UpgradeModal'

interface UpgradeGateProps {
  tier: CoachTier
  feature: CoachFeatureKey
  children: React.ReactNode
  overlay?: boolean
}

export function UpgradeGate({ tier, feature, children, overlay = false }: UpgradeGateProps) {
  const [showModal, setShowModal] = useState(false)

  if (hasCoachAccess(tier, feature)) {
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
              className="flex items-center gap-2 px-4 py-2 glass-card rounded-[8px] text-sm font-medium text-white/90 hover:bg-white/[0.08] transition-colors"
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

  return (
    <>
      <div className="p-6 text-center glass-card rounded-[8px] border-dashed !border-white/[0.1]">
        <svg className="w-8 h-8 mx-auto text-white/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm text-white/50 mb-2">This feature requires a higher plan</p>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm font-medium gradient-text hover:opacity-80 transition-opacity"
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