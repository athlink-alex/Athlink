import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'

interface NavItem {
  label: string
  to: string
  icon: string
  tier?: 'pro'
  badge?: number
}

const athleteNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard/athlete', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'My Schedule', to: '/dashboard/athlete/calendar', icon: 'M6.75 3v2.25M17.25 3v2.25M3 7.5h18M3 16.5h18M5.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z' },
  { label: 'Find a Coach', to: '/coaches', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
]

const coachNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard/coach', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Schedule', to: '/dashboard/coach/calendar', icon: 'M6.75 3v2.25M17.25 3v2.25M3 7.5h18M3 16.5h18M5.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25A2.25 2.25 0 015.25 3z' },
  { label: 'My Athletes', to: '/dashboard/coach/athletes', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', tier: 'pro' },
  { label: 'Messages', to: '/dashboard/coach/messages', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-4.288-1.014L3 21l1.055-3.71A7.97 7.97 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', tier: 'pro' },
  { label: 'Revenue', to: '/dashboard/coach/revenue', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 5.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3', tier: 'pro' },
  { label: 'QR Code', to: '/dashboard/coach/qrcode', icon: 'M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z', tier: 'pro' },
  { label: 'Online', to: '/dashboard/coach/online', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-6V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15v-6m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v0m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9', tier: 'pro' },
  { label: 'AI Assistant', to: '/dashboard/coach/assistant', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47M19 14.5l2.47 2.47' },
  { label: 'Availability', to: '/dashboard/coach#availability', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Analytics', to: '/dashboard/coach/analytics', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', tier: 'pro' },
  { label: 'Reports', to: '/dashboard/coach/reports', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', tier: 'pro' },
  { label: 'Subscription', to: '/dashboard/coach/subscription', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z' },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
]

function LockIcon() {
  return (
    <svg className="w-3 h-3 text-white/30 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const [unreportedCount, setUnreportedCount] = useState(0)

  useEffect(() => {
    if (user?.role !== 'coach') return

    const fetchUnreported = async () => {
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profileData?.id) return

      const { data: pastBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('coach_id', profileData.id)
        .lt('session_date', new Date().toISOString().split('T')[0])

      if (!pastBookings) return

      const bookingIds = pastBookings.map(b => b.id)
      const { data: reportedBookings } = await supabase
        .from('session_reports')
        .select('booking_id')
        .in('booking_id', bookingIds)

      const reportedIds = new Set(reportedBookings?.map(r => r.booking_id) || [])
      const unreported = pastBookings.filter(b => !reportedIds.has(b.id))

      setUnreportedCount(unreported.length)
    }

    fetchUnreported()
  }, [user])

  const navItems = (() => {
    if (user?.role === 'admin') return adminNav
    if (user?.role === 'coach') {
      return coachNav.map(item =>
        item.to === '/dashboard/coach/calendar' && unreportedCount > 0
          ? { ...item, badge: unreportedCount }
          : item
      )
    }
    return athleteNav
  })()

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-white/[0.06] bg-[#0A0E1A] min-h-[calc(100vh-4rem)]">
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to.includes('#') && location.pathname === item.to.split('#')[0])
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#2563EB]/20 to-transparent text-white border-l-2 border-[#2563EB]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border-l-2 border-transparent'
              }`}
            >
              <div className="relative">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2563EB] rounded-full shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
                )}
              </div>
              <span className="truncate">{item.label}</span>
              {item.tier && <LockIcon />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}