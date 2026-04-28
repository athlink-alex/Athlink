import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DisputeModal } from '../components/payments/DisputeModal'
import { AvailabilityEditor } from '../components/AvailabilityEditor'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatsRow } from '../components/ui/StatsRow'
import { AppLayout } from '../components/layout/AppLayout'
import { COACH_PLANS, type CoachTier } from '../lib/subscriptions'
import { staggerContainer, staggerChild, useCountUp, prefersReducedMotion } from '../hooks/useAnimations'

interface UnreportedSession {
  id: string
  athlete_name: string
  session_date: string
}

interface BookingWithAthlete {
  id: string
  session_date: string
  status: 'scheduled' | 'completed' | 'disputed' | 'cancelled'
  payment_status: string
  amount: number
  athlete_name: string
  athlete_confirmed: boolean
  coach_confirmed: boolean
  athlete_id: string
}

const TIER_BADGE: Record<CoachTier, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-white/[0.06] text-white/50 border border-white/[0.08]' },
  pro: { label: 'Pro', className: 'bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30' },
}

const isPastSession = (sessionDate: string) => new Date(sessionDate) < new Date()

export function CoachDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingWithAthlete[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null)
  const [unreportedSessions, setUnreportedSessions] = useState<UnreportedSession[]>([])

  const rawTier = profile?.subscription_tier || 'free'
  const tier: CoachTier = rawTier === 'elite' ? 'pro' : (rawTier as CoachTier)

  const fetchData = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)

    const coachProfileId = profileData?.id
    if (!coachProfileId) {
      setLoading(false)
      return
    }

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        session_date,
        status,
        payment_status,
        amount,
        athlete_confirmed,
        coach_confirmed,
        athlete_id,
        athlete_profiles (name)
      `)
      .eq('coach_id', coachProfileId)
      .order('session_date', { ascending: true })

    if (bookingsData) {
      const formatted = bookingsData.map((b: any) => ({
        id: b.id,
        session_date: b.session_date,
        status: b.status,
        payment_status: b.payment_status,
        amount: b.amount,
        athlete_confirmed: b.athlete_confirmed,
        coach_confirmed: b.coach_confirmed,
        athlete_id: b.athlete_id,
        athlete_name: b.athlete_profiles?.name || 'Unknown',
      }))
      setBookings(formatted)

      const pastBookingIds = formatted
        .filter((b: any) => isPastSession(b.session_date))
        .map((b: any) => b.id)

      if (pastBookingIds.length > 0) {
        const { data: reportedBookings } = await supabase
          .from('session_reports')
          .select('booking_id')
          .in('booking_id', pastBookingIds)

        const reportedIds = new Set(reportedBookings?.map(r => r.booking_id) || [])
        const unreported = formatted
          .filter((b: any) => isPastSession(b.session_date) && !reportedIds.has(b.id))
          .map((b: any) => ({
            id: b.id,
            athlete_name: b.athlete_name,
            session_date: b.session_date,
          }))

        setUnreportedSessions(unreported)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleConfirmSession = async (bookingId: string) => {
    setConfirmingBookingId(bookingId)
    try {
      const booking = bookings.find(b => b.id === bookingId)
      if (!booking) return

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ coach_confirmed: true })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error confirming session:', updateError)
        return
      }

      if (booking.athlete_confirmed) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/release-escrow`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ bookingId }),
          }
        )

        if (!response.ok) {
          const err = await response.json()
          console.error('Escrow release failed:', err)
        }
      }

      await fetchData()
    } catch (err) {
      console.error('Error confirming session:', err)
    } finally {
      setConfirmingBookingId(null)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking? The athlete will be refunded.')) return
    setCancellingBookingId(bookingId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        console.error('Cancel failed:', err)
        return
      }

      await fetchData()
    } catch (err) {
      console.error('Error cancelling booking:', err)
    } finally {
      setCancellingBookingId(null)
    }
  }

  const handleDisputeSubmitted = () => {
    setDisputeBookingId(null)
    fetchData()
  }

  const getBadgeStatus = (status: string): 'scheduled' | 'completed' | 'disputed' | 'pending' => {
    switch (status) {
      case 'scheduled': return 'scheduled'
      case 'completed': return 'completed'
      case 'disputed': return 'disputed'
      default: return 'pending'
    }
  }

  const pendingEarnings = bookings
    .filter(b => b.status === 'scheduled' && b.payment_status === 'escrow_held')
    .reduce((sum, b) => sum + b.amount, 0)

  const releasedEarnings = bookings
    .filter(b => b.payment_status === 'released')
    .reduce((sum, b) => sum + b.amount, 0)

  const upcomingSessions = bookings.filter(b => !isPastSession(b.session_date) && b.status === 'scheduled')
  const pastSessions = bookings.filter(b => isPastSession(b.session_date) || b.status !== 'scheduled')

  const stats = [
    { label: 'Total Sessions', value: bookings.length },
    { label: 'Upcoming', value: upcomingSessions.length },
    { label: 'Earnings', value: `$${(releasedEarnings / 100).toFixed(2)}` },
  ]

  const tierBadge = TIER_BADGE[tier]
  const reducedMotion = prefersReducedMotion()

  const pendingAnim = useCountUp(pendingEarnings / 100, 1200, !reducedMotion)
  const releasedAnim = useCountUp(releasedEarnings / 100, 1200, !reducedMotion)
  const totalAnim = useCountUp((pendingEarnings + releasedEarnings) / 100, 1200, !reducedMotion)

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div>
            <h1 className="text-2xl font-bold text-white/90">
              Coach Dashboard
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Welcome back, {profile?.name || 'Coach'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierBadge.className}`}>
              {tierBadge.label} Plan
            </span>
            {tier !== 'pro' && (
              <Link
                to="/pricing"
                className="text-sm font-medium gradient-text hover:opacity-80 transition-opacity"
              >
                Upgrade &rarr;
              </Link>
            )}
          </div>
        </motion.div>

        {/* AI Assistant Promo */}
        {tier === 'free' && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/dashboard/coach/assistant" className="block mb-6">
              <div className="p-5 rounded-[8px] bg-gradient-to-r from-[#2563EB]/15 to-[#06B6D4]/10 border border-[#2563EB]/20 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-white/90">AI Coaching Assistant</h3>
                    <p className="text-sm text-white/50 mt-1">Get drill recommendations & build session plans powered by real-time web search.</p>
                  </div>
                  <span className="px-4 py-2 bg-white/[0.08] rounded-[8px] text-sm font-medium text-white/70 hover:bg-white/[0.12] transition-colors">
                    Try it
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Pro Upgrade Nudge */}
        {tier === 'free' && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Link to="/pricing" className="block mb-6">
              <div className="p-4 rounded-[8px] border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-white/80">Unlock messaging, session notes & revenue tools</p>
                      <p className="text-xs text-white/40">Upgrade to Pro for $39/mo</p>
                    </div>
                  </div>
                  <span className="gradient-text text-sm font-medium">&rarr;</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Pending Status Banner */}
        {profile?.status === 'pending' && (
          <div className="mb-6 p-4 bg-[#D97706]/10 border border-[#D97706]/30 rounded-[8px]">
            <p className="text-[#FBBF24]">
              Your profile is under review. You&apos;ll be able to accept bookings once approved.
            </p>
          </div>
        )}

        {profile?.status === 'rejected' && (
          <div className="mb-6 p-4 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[8px]">
            <p className="text-[#F87171]">
              Your profile was not approved. Please contact support for more information.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8">
          <StatsRow stats={stats} />
        </div>

        {/* Unreported Sessions Alert */}
        {unreportedSessions.length > 0 && (
          <div className="mb-8 p-4 bg-[#D97706]/10 border border-[#D97706]/30 rounded-[8px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white/90">
                  {unreportedSessions.length} session{unreportedSessions.length !== 1 ? 's need' : ' needs'} report{unreportedSessions.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-white/50">
                  Your athletes are waiting for their session feedback.
                </p>
              </div>
              <Link to="/dashboard/coach/calendar">
                <Button size="sm" variant="gradient">
                  Write Reports &rarr;
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Navigation Cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {[
            { to: '/dashboard/coach/athletes', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z', label: 'My Athletes', sub: 'Roster & notes' },
            { to: '/dashboard/coach/messages', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-4.288-1.014L3 21l1.055-3.71A7.97 7.97 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', label: 'Messages', sub: 'Chat with athletes' },
            { to: '/dashboard/coach/revenue', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 5.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3', label: 'Revenue', sub: 'Earnings & exports' },
            { to: '/dashboard/coach/assistant', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47M19 14.5l2.47 2.47', label: 'AI Assistant', sub: 'Drills & plans' },
          ].map((item) => (
            <motion.div key={item.label} variants={staggerChild()}>
              <Link to={item.to} className="group">
                <Card variant="glass" className="p-4 hover:bg-white/[0.07] hover:border-white/[0.1] transition-all">
                  <svg className="w-6 h-6 mb-2 gradient-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <p className="text-sm font-medium text-white/90">{item.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Earnings & Quick Actions */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Earnings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/50">Pending (escrow)</span>
                <span className="font-medium text-white/80">${reducedMotion ? (pendingEarnings / 100).toFixed(2) : pendingAnim.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Released</span>
                <span className="font-medium text-[#4ADE80]">${reducedMotion ? (releasedEarnings / 100).toFixed(2) : releasedAnim.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/[0.06] pt-3 flex justify-between">
                <span className="font-medium text-white/70">Total</span>
                <span className="font-bold gradient-text">${reducedMotion ? ((pendingEarnings + releasedEarnings) / 100).toFixed(2) : totalAnim.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/pricing" className="block gradient-text hover:opacity-80 transition-opacity font-medium">
                Manage Subscription &rarr;
              </Link>
              <Link to="/dashboard/coach/payouts" className="block gradient-text hover:opacity-80 transition-opacity font-medium">
                Payout Settings &rarr;
              </Link>
              <a href="#availability" className="block gradient-text hover:opacity-80 transition-opacity font-medium">
                Manage Availability &rarr;
              </a>
              <Link to="/dashboard/coach/qrcode" className="block gradient-text hover:opacity-80 transition-opacity font-medium">
                QR Code Card &rarr;
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Bookings */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card variant="glass" className="mb-8">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">Upcoming Bookings</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                  <p className="text-white/50 text-sm">Loading...</p>
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="p-6 text-center text-white/40">
                  No upcoming bookings yet. They&apos;ll appear here once athletes book sessions.
                </div>
              ) : (
                upcomingSessions.map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-medium text-white/90">{booking.athlete_name}</p>
                      <p className="text-sm text-white/40">
                        {new Date(booking.session_date).toLocaleDateString()} &middot; ${(booking.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={getBadgeStatus(booking.status)} />
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingBookingId === booking.id}
                        className="text-xs text-[#F87171] hover:text-red-400 underline disabled:opacity-50"
                      >
                        {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => setDisputeBookingId(booking.id)}
                        className="text-xs text-[#F87171] hover:text-red-400 underline"
                      >
                        Dispute
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Past Sessions */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <Card variant="glass">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">Past Sessions</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center text-white/40">Loading...</div>
              ) : pastSessions.length === 0 ? (
                <div className="p-6 text-center text-white/40">No past sessions yet.</div>
              ) : (
                pastSessions.map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-white/90">{booking.athlete_name}</p>
                        <p className="text-sm text-white/40">
                          {new Date(booking.session_date).toLocaleDateString()} &middot; ${(booking.amount / 100).toFixed(2)}
                        </p>
                      </div>
                      <Badge status={getBadgeStatus(booking.status)} />
                    </div>

                    {booking.status === 'scheduled' && isPastSession(booking.session_date) && (
                      <div className="mt-3 flex items-center gap-3">
                        {!booking.coach_confirmed ? (
                          <Button
                            size="sm"
                            variant="gradient"
                            loading={confirmingBookingId === booking.id}
                            onClick={() => handleConfirmSession(booking.id)}
                          >
                            Confirm Session Complete
                          </Button>
                        ) : !booking.athlete_confirmed ? (
                          <span className="text-sm text-[#FBBF24] bg-[#D97706]/10 px-3 py-1 rounded-full border border-[#D97706]/30">
                            Waiting for athlete to confirm
                          </span>
                        ) : null}

                        <button
                          onClick={() => setDisputeBookingId(booking.id)}
                          className="text-xs text-[#F87171] hover:text-red-400 underline"
                        >
                          Dispute
                        </button>
                      </div>
                    )}

                    {booking.status === 'completed' && (
                      <div className="mt-3">
                        <span className="text-sm text-[#4ADE80] font-medium">Session completed</span>
                        {booking.payment_status === 'released' && (
                          <span className="ml-2 text-xs text-[#4ADE80]">Payment released to you</span>
                        )}
                      </div>
                    )}

                    {booking.status === 'disputed' && (
                      <div className="mt-3">
                        <span className="text-sm text-[#F87171] font-medium">Under dispute review</span>
                      </div>
                    )}

                    {booking.status === 'cancelled' && (
                      <div className="mt-3">
                        <span className="text-sm text-white/40 font-medium">Booking cancelled</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Availability Editor */}
        <motion.div
          className="mt-8"
          id="availability"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Availability</h3>
            <p className="text-white/40 text-sm mb-4">
              Manage your weekly availability to help athletes find time slots that work for you.
            </p>
            {profile?.id && <AvailabilityEditor coachProfileId={profile.id} />}
          </Card>
        </motion.div>
      </div>

      {disputeBookingId && (
        <DisputeModal
          bookingId={disputeBookingId}
          onClose={() => setDisputeBookingId(null)}
          onSubmitted={handleDisputeSubmitted}
        />
      )}
    </AppLayout>
  )
}