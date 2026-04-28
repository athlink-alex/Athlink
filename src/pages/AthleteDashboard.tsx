import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DisputeModal } from '../components/payments/DisputeModal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatsRow } from '../components/ui/StatsRow'
import { AppLayout } from '../components/layout/AppLayout'
import { staggerContainer, staggerChild, prefersReducedMotion } from '../hooks/useAnimations'

interface AthleteProfile {
  name: string | null
}

interface BookingWithCoach {
  id: string
  session_date: string
  status: 'scheduled' | 'completed' | 'disputed' | 'cancelled'
  payment_status: string
  amount: number
  coach_name: string
  sport: string
  athlete_confirmed: boolean
  coach_confirmed: boolean
  coach_id: string
}

export function AthleteDashboard() {
  const { user, membershipTier } = useAuth()
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [bookings, setBookings] = useState<BookingWithCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null)
  const reducedMotion = prefersReducedMotion()

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('name')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData as AthleteProfile | null)

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          status,
          payment_status,
          amount,
          athlete_confirmed,
          coach_confirmed,
          coach_id,
          coach_profiles (name, sport)
        `)
        .eq('athlete_id', user.id)
        .order('session_date', { ascending: true })

      if (fetchError) {
        console.error('Error fetching bookings:', fetchError)
        return
      }

      const formatted = data?.map((booking: any) => ({
        id: booking.id,
        session_date: booking.session_date,
        status: booking.status,
        payment_status: booking.payment_status,
        amount: booking.amount,
        athlete_confirmed: booking.athlete_confirmed,
        coach_confirmed: booking.coach_confirmed,
        coach_id: booking.coach_id,
        coach_name: booking.coach_profiles?.name || 'Unknown',
        sport: booking.coach_profiles?.sport || '',
      })) || []

      setBookings(formatted)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [user])

  const handleConfirmSession = async (bookingId: string) => {
    setConfirmingBookingId(bookingId)
    try {
      const booking = bookings.find(b => b.id === bookingId)
      if (!booking) return

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ athlete_confirmed: true })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error confirming session:', updateError)
        return
      }

      if (booking.coach_confirmed) {
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

      await fetchBookings()
    } catch (err) {
      console.error('Error confirming session:', err)
    } finally {
      setConfirmingBookingId(null)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Cancel this booking? Your payment will be refunded.')) return
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

      await fetchBookings()
    } catch (err) {
      console.error('Error cancelling booking:', err)
    } finally {
      setCancellingBookingId(null)
    }
  }

  const handleDisputeSubmitted = () => {
    setDisputeBookingId(null)
    fetchBookings()
  }

  const getBadgeStatus = (status: string): 'scheduled' | 'completed' | 'disputed' | 'pending' => {
    switch (status) {
      case 'scheduled': return 'scheduled'
      case 'completed': return 'completed'
      case 'disputed': return 'disputed'
      default: return 'pending'
    }
  }

  const isPastSession = (sessionDate: string) => {
    return new Date(sessionDate) < new Date()
  }

  const firstName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete'

  const upcomingSessions = bookings.filter(b => !isPastSession(b.session_date) && b.status === 'scheduled')
  const pastSessions = bookings.filter(b => isPastSession(b.session_date) || b.status !== 'scheduled')

  const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0)

  const stats = [
    { label: 'Sessions Booked', value: bookings.length },
    { label: 'Upcoming', value: upcomingSessions.length },
    { label: 'Total Spent', value: `$${(totalSpent / 100).toFixed(2)}` },
  ]

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white/90">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/50 mt-1">Ready to level up your game?</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {membershipTier === 'pro' ? (
              <Badge status="pro" />
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-white/40 border border-white/[0.08]">
                Free
              </span>
            )}
            <Link to="/coaches">
              <Button variant="gradient" arrow>Find a Coach</Button>
            </Link>
          </div>
        </motion.div>

        {/* Upgrade Banner */}
        {membershipTier !== 'pro' && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-8 p-4 bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/5 border border-[#F59E0B]/20 rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white/80">Upgrade to Pro</p>
                <p className="text-sm text-white/50">Get priority booking and exclusive benefits for $29/mo</p>
              </div>
              <Link to="/pricing">
                <Button size="sm" variant="gradient">Upgrade Now</Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="mb-8">
          <StatsRow stats={stats} />
        </div>

        {/* Upcoming Sessions Widget */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card variant="glass" className="mb-8 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/90">Upcoming Sessions</h3>
              <Link
                to="/dashboard/athlete/calendar"
                className="text-xs gradient-text hover:opacity-80 transition-opacity font-medium"
              >
                View Full Calendar &rarr;
              </Link>
            </div>
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2563EB] mx-auto" />
            ) : upcomingSessions.length === 0 ? (
              <p className="text-sm text-white/40">No upcoming sessions</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" />
                      <div>
                        <p className="text-sm font-medium text-white/90">{booking.coach_name}</p>
                        <p className="text-xs text-white/40">
                          {booking.sport} · {new Date(booking.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Badge status={getBadgeStatus(booking.status)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Sessions Full */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card variant="glass" className="mb-8">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">Upcoming Sessions</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                  <p className="text-white/50 text-sm">Loading...</p>
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-white/40 mb-4">No upcoming sessions</p>
                  <Link to="/coaches">
                    <Button variant="secondary" size="sm">Browse coaches</Button>
                  </Link>
                </div>
              ) : (
                upcomingSessions.map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-medium text-white/90">{booking.coach_name}</p>
                      <p className="text-sm text-white/40">
                        {booking.sport} &middot; {new Date(booking.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {booking.amount && (
                        <span className="text-sm text-white/40">${(booking.amount / 100).toFixed(2)}</span>
                      )}
                      <Badge status={getBadgeStatus(booking.status)} />
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingBookingId === booking.id}
                        className="text-xs text-[#F87171] hover:text-red-400 underline disabled:opacity-50"
                      >
                        {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
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
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card variant="glass">
            <div className="p-6 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white/90">Past Sessions</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center text-white/40">Loading...</div>
              ) : pastSessions.length === 0 ? (
                <div className="p-6 text-center text-white/40">No past sessions yet</div>
              ) : (
                pastSessions.map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-white/90">{booking.coach_name}</p>
                        <p className="text-sm text-white/40">
                          {booking.sport} &middot; {new Date(booking.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge status={getBadgeStatus(booking.status)} />
                    </div>

                    {booking.status === 'scheduled' && isPastSession(booking.session_date) && (
                      <div className="mt-3 flex items-center gap-3">
                        {!booking.athlete_confirmed ? (
                          <Button
                            size="sm"
                            variant="gradient"
                            loading={confirmingBookingId === booking.id}
                            onClick={() => handleConfirmSession(booking.id)}
                          >
                            Confirm Session Complete
                          </Button>
                        ) : !booking.coach_confirmed ? (
                          <span className="text-sm text-[#FBBF24] bg-[#D97706]/10 px-3 py-1 rounded-full border border-[#D97706]/30">
                            Waiting for coach to confirm
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
                          <span className="ml-2 text-xs text-[#4ADE80]">Payment released</span>
                        )}
                        <Link to={`/review/${booking.id}`} className="ml-3 text-sm gradient-text hover:opacity-80 transition-opacity font-medium">
                          Leave Review &rarr;
                        </Link>
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
                        {booking.payment_status === 'released' && (
                          <span className="ml-2 text-xs text-[#4ADE80]">Refund issued</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
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