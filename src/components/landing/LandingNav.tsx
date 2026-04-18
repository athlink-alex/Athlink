import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Button } from '../ui/Button'

export function LandingNav() {
  const { user, isAthlete, isCoach } = useAuth()
  const { theme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDark = theme === 'dark'

  const getDashboardLink = () => {
    if (isAthlete) return '/dashboard/athlete'
    if (isCoach) return '/dashboard/coach'
    return '/coaches'
  }

  const bg = isScrolled
    ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-sm'
    : 'bg-transparent'

  const border = isScrolled
    ? 'border-b border-[#E5E7EB] dark:border-gray-800'
    : 'border-b border-transparent'

  // At top: dark mode = white text, light mode = dark text (hero is light blue)
  const logoColor = isScrolled
    ? 'text-[#2563EB]'
    : isDark ? 'text-white' : 'text-gray-900'

  const textColor = isScrolled
    ? 'text-gray-700 dark:text-gray-300 hover:text-[#2563EB]'
    : isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'

  const themeClass = isScrolled
    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-yellow-400'
    : isDark
      ? 'text-white/70 hover:bg-white/10 dark:text-yellow-400 dark:hover:bg-white/10'
      : 'text-gray-500 hover:bg-gray-200/50 dark:text-yellow-400'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${bg} ${border}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className={`text-2xl font-bold ${logoColor} transition-colors duration-300`}>
            Athlink
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to={getDashboardLink()}>
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium ${textColor} transition-colors`}
                >
                  Log in
                </Link>
                <Link to="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
            <ThemeToggle className={themeClass} />
          </div>
        </div>
      </div>
    </nav>
  )
}