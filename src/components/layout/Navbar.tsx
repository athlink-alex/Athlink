import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'

const ROLE_STYLES: Record<string, { label: string; className: string }> = {
  athlete: { label: 'Athlete', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  coach: { label: 'Coach', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  admin: { label: 'Admin', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_STYLES[role]
  if (!style) return null
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${style.className}`}>
      {style.label}
    </span>
  )
}

export function Navbar() {
  const { user, isAthlete, isCoach, isAdmin, membershipTier, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const isLanding = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMobileOpen(false)
  }

  // Landing page: transparent at top, solid after scroll
  // Other pages: always solid
  const navBg = isLanding
    ? isScrolled
      ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-sm'
      : 'bg-transparent'
    : 'bg-white dark:bg-gray-950 shadow-sm'

  const navBorder = isLanding && !isScrolled
    ? 'border-b border-transparent'
    : 'border-b border-[#E5E7EB] dark:border-gray-800'

  const logoColor = isLanding && !isScrolled
    ? 'text-white'
    : 'text-[#2563EB]'

  const textColor = isLanding && !isScrolled
    ? 'text-white/80 hover:text-white'
    : 'text-gray-700 dark:text-gray-300 hover:text-[#2563EB]'

  const mutedColor = isLanding && !isScrolled
    ? 'text-white/60'
    : 'text-gray-500 dark:text-gray-400'

  const themeToggleClass = isLanding && !isScrolled
    ? 'text-white/70 hover:bg-white/10 dark:text-yellow-400 dark:hover:bg-white/10'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-yellow-400'

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${navBg} ${navBorder}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className={`text-xl font-bold ${logoColor} transition-colors duration-300`}>
            Athlink
          </Link>

          {user ? (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-4">
                {membershipTier === 'elite' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    ELITE
                  </span>
                )}
                {isAdmin && (
                  <Link to="/admin" className={`text-sm font-medium ${textColor} transition-colors`}>
                    Admin
                  </Link>
                )}
                {isAthlete && (
                  <>
                    <Link to="/coaches" className={`text-sm font-medium ${textColor} transition-colors`}>
                      Find a Coach
                    </Link>
                    <Link to="/dashboard/athlete" className={`text-sm font-medium ${textColor} transition-colors`}>
                      Dashboard
                    </Link>
                  </>
                )}
                {isCoach && (
                  <Link to="/dashboard/coach" className={`text-sm font-medium ${textColor} transition-colors`}>
                    Dashboard
                  </Link>
                )}
                <span className={`text-sm ${mutedColor}`}>{user.email}</span>
                <RoleBadge role={user.role} />
                <button
                  onClick={handleSignOut}
                  className={`text-sm font-medium ${mutedColor} hover:text-gray-700 dark:hover:text-gray-200 transition-colors`}
                >
                  Log out
                </button>
                <ThemeToggle className={themeToggleClass} />
              </div>

              {/* Mobile hamburger + theme toggle */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle className={themeToggleClass} />
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className={`p-2 rounded-lg ${textColor} hover:bg-gray-100 dark:hover:bg-gray-800`}
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className={`text-sm font-medium ${textColor} transition-colors`}>
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-[8px] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Sign up
              </Link>
              <ThemeToggle className={themeToggleClass} />
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {user && mobileOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] dark:border-gray-800 py-4 space-y-2">
            {membershipTier === 'elite' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 mb-2">
                ELITE
              </span>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 rounded-[8px]">
                Admin
              </Link>
            )}
            {isAthlete && (
              <>
                <Link to="/coaches" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 rounded-[8px]">
                  Find a Coach
                </Link>
                <Link to="/dashboard/athlete" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 rounded-[8px]">
                  Dashboard
                </Link>
              </>
            )}
            {isCoach && (
              <Link to="/dashboard/coach" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 rounded-[8px]">
                Dashboard
              </Link>
            )}
            <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-2">
              <p className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">{user.email} <RoleBadge role={user.role} /></p>
              <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 rounded-[8px]">
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}