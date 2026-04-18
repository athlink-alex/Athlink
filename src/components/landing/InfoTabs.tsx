import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'verified', label: 'Verified Coaches', icon: '\u2705' },
  { id: 'payments', label: 'Secure Payments', icon: '\uD83D\uDD12' },
  { id: 'matching', label: 'Smart Matching', icon: '\u26BE' },
  { id: 'booking', label: 'Flexible Booking', icon: '\uD83D\uDCC5' },
  { id: 'local', label: 'South Bay Local', icon: '\uD83D\uDCCD' },
] as const

type TabId = (typeof TABS)[number]['id']

export function InfoTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('verified')

  return (
    <div className="bg-white dark:bg-gray-950 py-20 sm:py-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Everything You Need to Develop Your Game
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Athlink is built around one goal — connecting serious baseball players with the right coach.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tab labels — vertical on desktop, horizontal scroll on mobile */}
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:min-w-[240px] pb-2 md:pb-0 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onMouseEnter={() => setActiveTab(tab.id)}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap rounded-[8px] md:rounded-none md:rounded-l-[8px] border-l-4 transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-[#2563EB]/5 dark:bg-[#2563EB]/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-[#F9FAFB] dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] p-8 transition-colors duration-200"
              >
                {activeTab === 'verified' && <VerifiedCoachesPanel />}
                {activeTab === 'payments' && <SecurePaymentsPanel />}
                {activeTab === 'matching' && <SmartMatchingPanel />}
                {activeTab === 'booking' && <FlexibleBookingPanel />}
                {activeTab === 'local' && <SouthBayLocalPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Panel Components ── */

function VerifiedCoachesPanel() {
  const checks = [
    'Baseball background confirmed',
    'Coaching experience reviewed',
    'Identity verified',
  ]

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        Every coach is manually reviewed
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Before any coach can accept bookings on Athlink, our team reviews their baseball
        background, certifications, and coaching history. No unvetted strangers — only
        coaches we'd trust with our own kids.
      </p>
      <div className="space-y-3">
        {checks.map((text, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SecurePaymentsPanel() {
  const steps = ['Book Session', 'Payment Held in Escrow', 'Session Complete \u2192 Coach Paid']

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        Your money is protected until the session is done
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        When you book a session, your payment is held securely in escrow. The coach only
        gets paid after both you and the coach confirm the session was completed. Dispute
        resolution is built in.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
        {steps.map((step, i) => (
          <Fragment key={step}>
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * i, duration: 0.4 }}
              className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] text-sm font-medium text-gray-900 dark:text-gray-50 text-center"
            >
              {step}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.svg
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 * i + 0.15, duration: 0.3 }}
                className="w-5 h-5 text-gray-400 hidden sm:block flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function SmartMatchingPanel() {
  const needs = ['Hitting coach', 'South Bay area', 'Weekends']

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        Find the right coach for your specific game
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Tell us your position, skill level, and training goals. Athlink shows you coaches
        who specialize in exactly what you're working on — whether that's swing mechanics,
        arm care, or mental game.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
        {/* You need... */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] p-5"
        >
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">You need...</p>
          <ul className="space-y-2">
            {needs.map((n) => (
              <li key={n} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                {n}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center justify-center"
        >
          <svg className="w-8 h-8 text-[#2563EB] rotate-90 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.div>

        {/* Coach card preview */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex-1 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] p-5"
        >
          <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide mb-3">We show you...</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-sm">
              MR
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Marcus Reid</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hitting &amp; Infield · $65/hr</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function FlexibleBookingPanel() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const blueSlots = [0, 2, 4]
  const goldSlot = 5

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        Book sessions that fit your schedule
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Browse coaches by availability and book the times that work for you — mornings,
        evenings, or weekends. Elite members get priority access to high-demand time slots.
      </p>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const isBlue = blueSlots.includes(i)
          const isGold = i === goldSlot
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className={`flex flex-col items-center p-3 rounded-[8px] border ${
                isGold
                  ? 'border-[#F59E0B] bg-[#F59E0B]/10'
                  : isBlue
                  ? 'border-[#2563EB] bg-[#2563EB]/10'
                  : 'border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{day}</span>
              <div className={`w-full h-6 rounded-[4px] ${
                isGold
                  ? 'bg-[#F59E0B]/40'
                  : isBlue
                  ? 'bg-[#2563EB]/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`} />
              {isGold && (
                <span className="text-[10px] text-[#D97706] font-semibold mt-1">ELITE</span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function SouthBayLocalPanel() {
  const cities = ['Hermosa Beach', 'Manhattan Beach', 'Redondo Beach', 'Torrance', 'El Segundo']

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">
        Built for the South Bay community
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Athlink is focused on one area first — the South Bay of Los Angeles. Local coaches,
        local athletes, local community.
      </p>
      <div className="space-y-2">
        {cities.map((city, i) => (
          <motion.div
            key={city}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.35 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px]"
          >
            <span className="text-base">{'\u26BE'}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{city}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}