import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  free: { label: 'Free', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pro: { label: 'Pro', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  elite: { label: 'Elite', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
}

const isPastSession = (sessionDate: string) => new Date(sessionDate) < new Date()

export function CoachDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingWithAthlete[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null)
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null)
  const [unreportedSessions, setUnreportedSessions] = useState<UnreportedSession[]>([])

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

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

      // Fetch unreported past sessions
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

      // Mark coach as confirmed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ coach_confirmed: true })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error confirming session:', updateError)
        return
      }

      // If athlete already confirmed, both parties have confirmed — release escrow
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

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        {/* Header with Tier Badge */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Coach Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Welcome back, {profile?.name || 'Coach'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierBadge.className}`}>
              {tierBadge.label} Plan
            </span>
            {tier !== 'elite' && (
              <Link
                to="/pricing"
                className="text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]"
              >
                Upgrade &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* AI Assistant Promo — shown for free tier */}
        {tier === 'free' && (
          <Link to="/dashboard/coach/assistant" className="block mb-6">
            <div className="p-5 rounded-[8px] bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">AI Coaching Assistant</h3>
                  <p className="text-sm text-white/80 mt-1">Get drill recommendations & build session plans powered by real-time web search.</p>
                </div>
                <span className="px-4 py-2 bg-white/20 rounded-[8px] text-sm font-medium hover:bg-white/30 transition-colors">
                  Try it
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Pro/Elite upgrade nudge — free tier only */}
        {tier === 'free' && (
          <Link to="/pricing" className="block mb-6">
            <div className="p-4 rounded-[8px] border border-[#2563EB]/20 bg-[#2563EB]/5 hover:bg-[#2563EB]/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#2563EB]">Unlock messaging, session notes & revenue tools</p>
                    <p className="text-xs text-[#2563EB]/70">Upgrade to Pro for $29/mo</p>
                  </div>
                </div>
                <span className="text-[#2563EB] text-sm font-medium">&rarr;</span>
              </div>
            </div>
          </Link>
        )}

        {/* Pending Status Banner */}
        {profile?.status === 'pending' && (
          <div className="mb-6 p-4 bg-[#D97706]/10 border border-[#D97706]/30 rounded-[8px]">
            <p className="text-[#D97706]">
              Your profile is under review. You&apos;ll be able to accept bookings once approved.
            </p>
          </div>
        )}

        {profile?.status === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-[#DC2626]/30 rounded-[8px]">
            <p className="text-[#DC2626]">
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
                <p className="font-medium text-gray-900 dark:text-gray-50">
                  {unreportedSessions.length} session{unreportedSessions.length !== 1 ? 's need' : ' needs'} report{unreportedSessions.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your athletes are waiting for their session feedback.
                </p>
              </div>
              <Link to="/dashboard/coach/calendar">
                <Button size="sm" className="bg-[#D97706] hover:bg-[#B45309] text-white border-none">
                  Write Reports →
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/dashboard/coach/athletes" className="group">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-[#2563EB] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">My Athletes</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Roster & notes</p>
            </Card>
          </Link>

          <Link to="/dashboard/coach/messages" className="group">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-[#2563EB] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-4.288-1.014L3 21l1.055-3.71A7.97 7.97 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Messages</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Chat with athletes</p>
            </Card>
          </Link>

          <Link to="/dashboard/coach/revenue" className="group">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-[#2563EB] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 5.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3a.75.75 0 01.75.75v.75m0 2.25h-.75a.75.75 0 00-.75.75v1.5c0 .414.336.75.75.75H3" />
              </svg>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">Revenue</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Earnings & exports</p>
            </Card>
          </Link>

          <Link to="/dashboard/coach/assistant" className="group">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-[#2563EB] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47M19 14.5l2.47 2.47" />
              </svg>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">AI Assistant</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Drills & plans</p>
            </Card>
          </Link>
        </div>

        {/* Earnings & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Earnings</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending (escrow)</span>
                <span className="font-medium">${(pendingEarnings / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Released</span>
                <span className="font-medium text-[#16A34A]">${(releasedEarnings / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-[#E5E7EB] dark:border-gray-800 pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold">${((pendingEarnings + releasedEarnings) / 100).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/onboarding/coach"
                className="block text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                Edit Profile &rarr;
              </Link>
              <a
                href="#availability"
                className="block text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                Manage Availability &rarr;
              </a>
              <Link
                to="/dashboard/coach/qrcode"
                className="block text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                QR Code Card &rarr;
              </Link>
            </div>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <Card className="mb-8">
          <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Upcoming Bookings</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No upcoming bookings yet. They&apos;ll appear here once athletes book sessions.
              </div>
            ) : (
              upcomingSessions.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{booking.athlete_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(booking.session_date).toLocaleDateString()} &middot; ${(booking.amount / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={getBadgeStatus(booking.status)} />
                    <button
                      onClick={() => setDisputeBookingId(booking.id)}
                      className="text-xs text-[#DC2626] hover:text-red-700 underline"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Past Sessions */}
        <Card>
          <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Past Sessions</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">No past sessions yet.</div>
            ) : (
              pastSessions.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{booking.athlete_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          loading={confirmingBookingId === booking.id}
                          onClick={() => handleConfirmSession(booking.id)}
                          className="bg-[#16A34A] hover:bg-green-700 text-white"
                        >
                          Confirm Session Complete
                        </Button>
                      ) : !booking.athlete_confirmed ? (
                        <span className="text-sm text-[#D97706] bg-[#D97706]/10 px-3 py-1 rounded-full border border-[#D97706]/30">
                          Waiting for athlete to confirm
                        </span>
                      ) : null}

                      <button
                        onClick={() => setDisputeBookingId(booking.id)}
                        className="text-xs text-[#DC2626] hover:text-red-700 underline"
                      >
                        Dispute
                      </button>
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div className="mt-3">
                      <span className="text-sm text-[#16A34A] font-medium">Session completed</span>
                      {booking.payment_status === 'released' && (
                        <span className="ml-2 text-xs text-[#16A34A]">Payment released to you</span>
                      )}
                    </div>
                  )}

                  {booking.status === 'disputed' && (
                    <div className="mt-3">
                      <span className="text-sm text-[#DC2626] font-medium">Under dispute review</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Availability Editor */}
        <div className="mt-8" id="availability">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Availability</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Manage your weekly availability to help athletes find time slots that work for you.
            </p>
            {profile?.id && <AvailabilityEditor coachProfileId={profile.id} />}
          </Card>
        </div>
      </div>

      {/* Dispute Modal */}
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