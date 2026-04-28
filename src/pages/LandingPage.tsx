import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import IntroOverlay from '../components/landing/IntroOverlay'
import { RotatingHeadline } from '../components/landing/RotatingHeadline'
import { InfoTabs } from '../components/landing/InfoTabs'
import { LandingNav } from '../components/landing/LandingNav'
import HeroBackground from '../components/landing/HeroBackground'
import { prefersReducedMotion } from '../hooks/useAnimations'

const COMING_SOON_SPORTS = [
  { emoji: '🏐', name: 'Volleyball' },
  { emoji: '⚽', name: 'Soccer' },
  { emoji: '🏀', name: 'Basketball' },
  { emoji: '🎾', name: 'Tennis' },
  { emoji: '⚾', name: 'Softball' },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: '📋',
    title: 'Answer a few quick questions',
    desc: 'Share your position, skill level, and training goals. We use this to match you with the right coach.',
  },
  {
    step: 2,
    icon: '🔍',
    title: 'Find your coach',
    desc: 'Browse verified Los Angeles baseball coaches. See their background, specialty, pricing, and availability.',
  },
  {
    step: 3,
    icon: '📅',
    title: 'Book a session',
    desc: 'Pick a time that works for you and pay securely through AthlinkPro. Funds are held in escrow and only released after your session.',
  },
]

const WHY_ATHLINK = [
  {
    icon: '✅',
    title: 'Verified Coaches Only',
    desc: 'Every coach on AthlinkPro is manually reviewed by our team before they can accept bookings. No unvetted strangers.',
  },
  {
    icon: '🔒',
    title: 'Secure Escrow Payments',
    desc: 'Your payment is held securely and only released to the coach after your session is confirmed complete.',
  },
  {
    icon: '📍',
    title: 'Los Angeles Local',
    desc: "We're built for the Los Angeles community — 5,000+ private coaches and 500K+ youth athletes, the largest youth sports market in the US.",
  },
  {
    icon: '⚾',
    title: 'Starting with Baseball',
    desc: 'AthlinkPro is built specifically for baseball coaching first, expanding to volleyball, soccer, basketball, and tennis across LA.',
  },
]

const SPOTLIGHT_COACHES = [
  {
    name: 'Marcus Reid',
    specialty: 'Hitting & Infield',
    rate: 65,
    rating: 4.9,
    experience: 8,
    bio: 'Former D1 shortstop with 8 years coaching youth and high school athletes.',
  },
  {
    name: 'Jake Morrow',
    specialty: 'Pitching & Arm Care',
    rate: 75,
    rating: 5.0,
    experience: 15,
    bio: 'Biomechanics-focused pitching coach for youth through collegiate athletes.',
  },
  {
    name: 'Darnell Okafor',
    specialty: 'Overall Development',
    rate: 70,
    rating: 4.8,
    experience: 12,
    bio: 'Former semi-pro player turned full-time trainer with 12 years coaching experience.',
  },
]

/* ── Animation helpers ── */

const reducedMotion = prefersReducedMotion()

const sectionReveal = {
  initial: reducedMotion ? {} : { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15 } },
  viewport: { once: true, amount: 0.2 },
}

const staggerChild = (delay = 0.15) => ({
  initial: reducedMotion ? {} : { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
})

/* Shared dark-mode card classes (glass effect via Tailwind utilities) */
const glassCardDark = 'dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.06] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]'

/* ── Page ── */

export function LandingPage() {
  const { user, isAthlete, isCoach } = useAuth()
  const { theme } = useTheme()

  const getDashboardLink = () => {
    if (isAthlete) return '/dashboard/athlete'
    if (isCoach) return '/dashboard/coach'
    return '/coaches'
  }

  return (
    <>
      <IntroOverlay />

      <div className="min-h-screen bg-white dark:bg-[#070A14] transition-colors duration-200">
      <LandingNav />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        {/* Hero */}
        <div className="relative overflow-hidden bg-[#F0F4FF] dark:bg-[#070A14] transition-colors duration-200">
          <HeroBackground isDark={theme === 'dark'} />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-24 sm:pb-32 lg:pb-40">
            <div className="text-center relative z-10">
              <RotatingHeadline />
              <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                AthlinkPro connects baseball players and parents with verified local coaches in Los Angeles. Browse coaches, book sessions, and pay securely — all in one place.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg" variant="gradient" arrow>Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/get-started/athlete">
                      <Button size="lg" variant="gradient" arrow>Find a Coach</Button>
                    </Link>
                    <Link to="/get-started/coach">
                      <Button variant="secondary" size="lg"
                        className="bg-white/80 border-gray-300 text-gray-700 hover:bg-white dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white/80 dark:hover:bg-white/[0.1]">
                        Become a Coach
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {/* Trust bar with icons */}
              <motion.div
                className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400"
                initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Verified coaches
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Secure payments
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Los Angeles local
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats Bar — gradient */}
        <motion.div {...sectionReveal} className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-sm font-medium text-white/90">
              <span><strong className="text-white">Los Angeles</strong> — 5,000+ coaches &middot; 500K+ youth athletes</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span><strong className="text-white">Beta Launch</strong> — 2026</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span><strong className="text-white">100% Secure</strong> Stripe Payments</span>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <div className="bg-[#F9FAFB] dark:bg-[#0A0E1A] py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white/90">How AthlinkPro Works</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Getting started takes less than 2 minutes.</p>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {HOW_IT_WORKS.map((item, i) => (
                <motion.div
                  key={item.step}
                  {...staggerChild(0.15 * i)}
                  className={`p-8 rounded-[8px] bg-white shadow-sm border border-[#E5E7EB] ${glassCardDark} transition-colors duration-200`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white text-sm font-bold">{item.step}</span>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* InfoTabs */}
        <InfoTabs />

        {/* Coach Spotlight */}
        <div className="bg-white dark:bg-[#070A14] py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white/90">Meet Our Coaches</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">All coaches are verified and background-checked before joining AthlinkPro.</p>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {SPOTLIGHT_COACHES.map((coach, i) => (
                <motion.div
                  key={coach.name}
                  {...staggerChild(0.1 * i)}
                  className={`p-6 rounded-[8px] bg-white shadow-sm border border-[#E5E7EB] ${glassCardDark} transition-colors duration-200`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#06B6D4]/20 flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] font-bold text-lg">
                      {coach.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white/90">{coach.name}</h3>
                      <p className="text-sm text-[#2563EB] dark:text-[#60A5FA]">{coach.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white/90">{coach.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm"> &middot; {coach.experience} yrs exp</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{coach.bio}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white/90">${coach.rate}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/hr</span></p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...sectionReveal} className="text-center mt-8">
              <Link
                to={user ? '/coaches' : '/signup'}
                className="text-[#2563EB] dark:text-[#60A5FA] hover:underline font-medium"
              >
                View All Coaches &rarr;
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Why Athlink */}
        <div className="bg-[#F9FAFB] dark:bg-[#0A0E1A] py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white/90">Why Choose AthlinkPro?</h2>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {WHY_ATHLINK.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...staggerChild(0.1 * i)}
                  className={`p-8 rounded-[8px] bg-white shadow-sm border border-[#E5E7EB] ${glassCardDark} transition-colors duration-200`}
                >
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Dual CTA */}
        <motion.div {...sectionReveal} className="bg-white dark:bg-[#070A14] py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[8px] overflow-hidden border border-[#E5E7EB] dark:border-white/[0.06]">
              {/* Athletes */}
              <div className="bg-blue-50 dark:bg-white/[0.04] p-10 sm:p-12 transition-colors duration-200">
                <span className="text-3xl mb-4 block">{'⚾'}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Find the right coach for your game
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Whether your kid is just picking up a bat or training for varsity, AthlinkPro has a coach for every level.
                </p>
                <Link to="/get-started/athlete">
                  <Button variant="gradient" arrow>Find a Coach</Button>
                </Link>
              </div>
              {/* Coaches */}
              <div className="bg-[#F9FAFB] dark:bg-white/[0.02] p-10 sm:p-12 border-t md:border-t-0 md:border-l border-[#E5E7EB] dark:border-white/[0.06] transition-colors duration-200">
                <span className="text-3xl mb-4 block">{'🏆'}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Grow your coaching business
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Join AthlinkPro to reach motivated athletes in Los Angeles. Set your own rates, manage your schedule, and get paid securely.
                </p>
                <Link to="/get-started/coach">
                  <Button variant="gradient" arrow>Apply to Coach</Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon Sports */}
        <div className="bg-[#F9FAFB] dark:bg-[#0A0E1A] py-16 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500">More Sports Coming Soon</h2>
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-2">
                AthlinkPro is starting with baseball and expanding to volleyball, soccer, basketball, and tennis across LA.
              </p>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
            >
              {COMING_SOON_SPORTS.map((sport, i) => (
                <motion.div
                  key={sport.name}
                  {...staggerChild(0.08 * i)}
                  className={`relative flex flex-col items-center justify-center p-6 bg-gray-100 border border-[#E5E7EB] ${glassCardDark} rounded-[8px] opacity-50 dark:opacity-60 cursor-not-allowed select-none`}
                >
                  <span className="text-3xl mb-2">{sport.emoji}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{sport.name}</span>
                  <span className="mt-2 px-2 py-0.5 bg-[#E5E7EB] dark:bg-white/[0.08] text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#070A14] text-gray-400 py-12">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2563EB] to-transparent mb-12" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-white font-semibold text-lg">Athlink<span className="text-[#06B6D4]">Pro</span></p>
                <p className="text-sm mt-1 text-gray-500">Los Angeles Beta &middot; 2026</p>
                <p className="text-sm mt-1 text-gray-600">The platform built for private coaches.</p>
              </div>
              <div>
                <p className="text-white font-medium text-sm mb-3">Quick Links</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><Link to="/get-started/athlete" className="hover:text-white transition-colors">Find a Coach</Link></li>
                  <li><Link to="/get-started/coach" className="hover:text-white transition-colors">Become a Coach</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>All payments secured by Stripe</span>
                </div>
                <p className="text-gray-600">&copy; 2026 AthlinkPro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
    </>
  )
}