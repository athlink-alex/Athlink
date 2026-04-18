import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DisputeModal } from '../components/payments/DisputeModal'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { StatsRow } from '../components/ui/StatsRow'
import { AppLayout } from '../components/layout/AppLayout'

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
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Fetch athlete profile
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

      // Mark athlete as confirmed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ athlete_confirmed: true })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error confirming session:', updateError)
        return
      }

      // If coach already confirmed, both parties have confirmed — release escrow
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
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
              Welcome back, {firstName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ready to level up your game?</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {membershipTier === 'elite' ? (
              <Badge status="elite" />
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:text-gray-400">
                Free
              </span>
            )}
            <Link to="/coaches">
              <Button>Find a Coach</Button>
            </Link>
          </div>
        </div>

        {/* Membership Upgrade Banner */}
        {membershipTier !== 'elite' && (
          <div className="mb-8 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-50">Upgrade to Elite</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get priority booking and exclusive benefits for $19/mo</p>
            </div>
            <Link to="/onboarding/athlete">
              <Button size="sm" className="bg-[#F59E0B] hover:bg-[#D97706] text-white border-none">
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8">
          <StatsRow stats={stats} />
        </div>

        {/* Upcoming Sessions Mini-Calendar Widget */}
        <Card className="mb-8 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Upcoming Sessions</h3>
            <Link
              to="/dashboard/athlete/calendar"
              className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              View Full Calendar →
            </Link>
          </div>
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2563EB] mx-auto" />
          ) : upcomingSessions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming sessions</p>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{booking.coach_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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

        {/* Upcoming Sessions */}
        <Card className="mb-8">
          <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming sessions</p>
                <Link to="/coaches">
                  <Button variant="secondary" size="sm">Browse coaches</Button>
                </Link>
              </div>
            ) : (
              upcomingSessions.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">{booking.coach_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.sport} &middot; {new Date(booking.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {booking.amount && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">${(booking.amount / 100).toFixed(2)}</span>
                    )}
                    <Badge status={getBadgeStatus(booking.status)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Past Sessions with Confirm & Dispute */}
        <Card>
          <div className="p-6 border-b border-[#E5E7EB] dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Past Sessions</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {loading ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">No past sessions yet</div>
            ) : (
              pastSessions.map((booking) => (
                <div key={booking.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-50">{booking.coach_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.sport} &middot; {new Date(booking.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge status={getBadgeStatus(booking.status)} />
                  </div>

                  {/* Session completion and dispute actions */}
                  {booking.status === 'scheduled' && isPastSession(booking.session_date) && (
                    <div className="mt-3 flex items-center gap-3">
                      {!booking.athlete_confirmed ? (
                        <Button
                          size="sm"
                          loading={confirmingBookingId === booking.id}
                          onClick={() => handleConfirmSession(booking.id)}
                          className="bg-[#16A34A] hover:bg-green-700 text-white"
                        >
                          Confirm Session Complete
                        </Button>
                      ) : !booking.coach_confirmed ? (
                        <span className="text-sm text-[#D97706] bg-[#D97706]/10 px-3 py-1 rounded-full border border-[#D97706]/30">
                          Waiting for coach to confirm
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
                        <span className="ml-2 text-xs text-[#16A34A]">Payment released</span>
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