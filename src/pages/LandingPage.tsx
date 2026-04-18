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

const COMING_SOON_SPORTS = [
  { emoji: '\u26BE', name: 'Softball' },
  { emoji: '\u26F3', name: 'Golf' },
  { emoji: '\uD83C\uDFC0', name: 'Basketball' },
  { emoji: '\u26BD', name: 'Soccer' },
  { emoji: '\uD83C\uDFBE', name: 'Tennis' },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: '\uD83D\uDCCB',
    title: 'Answer a few quick questions',
    desc: 'Share your position, skill level, and training goals. We use this to match you with the right coach.',
  },
  {
    step: 2,
    icon: '\uD83D\uDD0D',
    title: 'Find your coach',
    desc: 'Browse verified South Bay baseball coaches. See their background, specialty, pricing, and availability.',
  },
  {
    step: 3,
    icon: '\uD83D\uDCC5',
    title: 'Book a session',
    desc: 'Pick a time that works for you and pay securely through Athlink. Funds are only released after your session.',
  },
]

const WHY_ATHLINK = [
  {
    icon: '\u2705',
    title: 'Verified Coaches Only',
    desc: 'Every coach on Athlink is manually reviewed by our team before they can accept bookings. No unvetted strangers.',
  },
  {
    icon: '\uD83D\uDD12',
    title: 'Secure Escrow Payments',
    desc: 'Your payment is held securely and only released to the coach after your session is confirmed complete.',
  },
  {
    icon: '\uD83D\uDCCD',
    title: 'South Bay Local',
    desc: "We're built for the South Bay community — Hermosa Beach, Manhattan Beach, Redondo Beach, and Torrance.",
  },
  {
    icon: '\u26BE',
    title: 'Baseball Focused',
    desc: 'Athlink is built specifically for baseball development. Every coach, every session, every feature — tailored to the game.',
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const sectionReveal = {
  initial: prefersReducedMotion() ? {} : { opacity: 0, y: 30 },
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
  initial: prefersReducedMotion() ? {} : { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
})

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

      <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Landing navbar with transparent→solid scroll */}
      <LandingNav />

      {/* Landing page content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >

        {/* Section 2 — Hero */}
        <div className="relative overflow-hidden bg-[#F0F4FF] dark:bg-gray-950 transition-colors duration-200">
          <HeroBackground isDark={theme === 'dark'} />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-24 sm:pb-32 lg:pb-40">
            <div className="text-center relative z-10">
              <RotatingHeadline />
              <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Athlink connects baseball players and parents with verified local coaches. Browse coaches, book sessions, and pay securely — all in one place.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                {user ? (
                  <Link to={getDashboardLink()}>
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/get-started/athlete">
                      <Button size="lg">Find a Coach</Button>
                    </Link>
                    <Link to="/get-started/coach">
                      <Button variant="secondary" size="lg"
                        className="bg-white/80 border-gray-300 text-gray-700 hover:bg-white dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20">
                        Become a Coach
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
                Verified coaches &nbsp; Secure payments &nbsp; South Bay local
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 — Stats Bar */}
        <motion.div {...sectionReveal} className="bg-[#2563EB] dark:bg-blue-900 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-sm font-medium text-white dark:text-blue-100">
              <span><strong>5</strong> Verified Coaches</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span><strong>South Bay, CA</strong> — Hermosa, Manhattan, Redondo &amp; Torrance</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span><strong>Beta Launch</strong> — 2026</span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span><strong>100% Secure</strong> Stripe Payments</span>
            </div>
          </div>
        </motion.div>

        {/* Section 4 — How It Works */}
        <div id="how-it-works" className="bg-[#F9FAFB] dark:bg-gray-900 py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">How Athlink Works</h2>
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
                  className="bg-white dark:bg-gray-900 p-8 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#2563EB] text-white text-sm font-bold">{item.step}</span>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Section 5 — InfoTabs (NEW) */}
        <InfoTabs />

        {/* Section 6 — Coach Spotlight */}
        <div className="bg-white dark:bg-gray-950 py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Meet Our Coaches</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">All coaches are verified and background-checked before joining Athlink.</p>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {SPOTLIGHT_COACHES.map((coach, i) => (
                <motion.div
                  key={coach.name}
                  {...staggerChild(0.1 * i)}
                  className="bg-white dark:bg-gray-900 p-6 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-lg">
                      {coach.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-50">{coach.name}</h3>
                      <p className="text-sm text-[#2563EB]">{coach.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{coach.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm"> &middot; {coach.experience} yrs exp</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{coach.bio}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">${coach.rate}/hr</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div {...sectionReveal} className="text-center mt-8">
              <Link
                to={user ? '/coaches' : '/signup'}
                className="text-[#2563EB] hover:underline font-medium"
              >
                View All Coaches &rarr;
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Section 7 — Why Athlink */}
        <div className="bg-[#F9FAFB] dark:bg-gray-900 py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Why Choose Athlink?</h2>
            </motion.div>
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {WHY_ATHLINK.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...staggerChild(0.1 * i)}
                  className="bg-white dark:bg-gray-900 p-8 rounded-[8px] shadow-sm border border-[#E5E7EB] dark:border-gray-700 transition-colors duration-200"
                >
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Section 8 — Dual CTA */}
        <motion.div {...sectionReveal} className="bg-white dark:bg-gray-950 py-20 sm:py-24 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[8px] overflow-hidden border border-[#E5E7EB] dark:border-gray-700">
              {/* Athletes */}
              <div className="bg-blue-50 dark:bg-blue-950 p-10 sm:p-12 transition-colors duration-200">
                <span className="text-3xl mb-4 block">{'\u26BE'}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">
                  Find the right coach for your game
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Whether your kid is just picking up a bat or training for varsity, Athlink has a coach for every level.
                </p>
                <Link to="/get-started/athlete">
                  <Button>Find a Coach</Button>
                </Link>
              </div>
              {/* Coaches */}
              <div className="bg-[#F9FAFB] dark:bg-gray-900 p-10 sm:p-12 border-t md:border-t-0 md:border-l border-[#E5E7EB] dark:border-gray-700 transition-colors duration-200">
                <span className="text-3xl mb-4 block">{'\uD83C\uDFC6'}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">
                  Grow your coaching business
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join Athlink to reach motivated athletes in the South Bay. Set your own rates, manage your schedule, and get paid securely.
                </p>
                <Link to="/get-started/coach">
                  <Button variant="secondary">Apply to Coach</Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 9 — Coming Soon Sports */}
        <div className="bg-[#F9FAFB] dark:bg-gray-900 py-16 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...sectionReveal} className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-500">More Sports Coming Soon</h2>
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-2">
                Athlink is starting with baseball and expanding to more sports in 2026.
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
                  className="relative flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[8px] opacity-50 dark:opacity-40 cursor-not-allowed select-none"
                >
                  <span className="text-3xl mb-2">{sport.emoji}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{sport.name}</span>
                  <span className="mt-2 px-2 py-0.5 bg-[#E5E7EB] dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Section 10 — Footer */}
        <footer className="bg-gray-950 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left */}
              <div>
                <p className="text-white font-semibold text-lg">Athlink</p>
                <p className="text-sm mt-1">South Bay Beta &middot; 2026</p>
                <p className="text-sm mt-1 text-gray-500">Built for the diamond.</p>
              </div>
              {/* Center */}
              <div>
                <p className="text-white font-medium text-sm mb-3">Quick Links</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><Link to="/get-started/athlete" className="hover:text-white transition-colors">Find a Coach</Link></li>
                  <li><Link to="/get-started/coach" className="hover:text-white transition-colors">Become a Coach</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>
              {/* Right */}
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>All payments secured by Stripe</span>
                </div>
                <p className="text-gray-500">&copy; 2026 Athlink. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
    </>
  )
}