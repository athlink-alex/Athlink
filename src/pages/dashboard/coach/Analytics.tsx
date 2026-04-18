import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { StatsRow } from '../../../components/ui/StatsRow'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

interface BookingData {
  id: string
  session_date: string
  status: string
  payment_status: string
  amount: number
  athlete_id: string
  athlete_name: string
  created_at: string
}

export function Analytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)

  const tier: CoachTier = (profile?.subscription_tier as CoachTier) || 'free'

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('coach_profiles')
      .select('id, subscription_tier')
      .eq('user_id', user.id)
      .single()

    setProfile(profileData)
    if (!profileData?.id) { setLoading(false); return }

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        session_date,
        status,
        payment_status,
        amount,
        athlete_id,
        created_at,
        athlete_profiles (name)
      `)
      .eq('coach_id', profileData.id)
      .order('session_date', { ascending: false })

    if (bookingsData) {
      setBookings(bookingsData.map((b: any) => ({
        id: b.id,
        session_date: b.session_date,
        status: b.status,
        payment_status: b.payment_status,
        amount: b.amount,
        athlete_id: b.athlete_id,
        athlete_name: b.athlete_profiles?.name || 'Unknown',
        created_at: b.created_at,
      })))
    }

    setLoading(false)
  }

  // Computed analytics
  const now = new Date()
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const bookingsLast30 = bookings.filter(b => new Date(b.session_date) >= last30)
  const bookingsLast90 = bookings.filter(b => new Date(b.session_date) >= last90)

  const completionRate = bookings.length > 0
    ? Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100)
    : 0

  const disputeRate = bookings.length > 0
    ? Math.round((bookings.filter(b => b.status === 'disputed').length / bookings.length) * 100)
    : 0

  const avgSessionValue = bookings.length > 0
    ? bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length / 100
    : 0

  const revenueLast30 = bookingsLast30
    .filter(b => b.payment_status === 'released')
    .reduce((sum, b) => sum + b.amount, 0) / 100

  const revenueLast90 = bookingsLast90
    .filter(b => b.payment_status === 'released')
    .reduce((sum, b) => sum + b.amount, 0) / 100

  // Unique athletes
  const uniqueAthletes30 = new Set(bookingsLast30.map(b => b.athlete_id)).size
  const uniqueAthletes90 = new Set(bookingsLast90.map(b => b.athlete_id)).size

  // Repeat rate
  const athleteBookingCounts: Record<string, number> = {}
  for (const b of bookings) {
    athleteBookingCounts[b.athlete_id] = (athleteBookingCounts[b.athlete_id] || 0) + 1
  }
  const repeatAthletes = Object.values(athleteBookingCounts).filter(c => c > 1).length
  const totalAthletes = Object.keys(athleteBookingCounts).length
  const repeatRate = totalAthletes > 0 ? Math.round((repeatAthletes / totalAthletes) * 100) : 0

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthBookings = bookings.filter(b => {
      const bd = new Date(b.session_date)
      return bd >= d && bd <= monthEnd
    })
    const revenue = monthBookings
      .filter(b => b.payment_status === 'released')
      .reduce((sum, b) => sum + b.amount, 0) / 100
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      bookings: monthBookings.length,
      revenue,
    }
  }).reverse()

  const peakMonth = monthlyTrend.reduce((max, m) => m.revenue > max.revenue ? m : max, monthlyTrend[0])

  const stats = [
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'Avg Session Value', value: `$${avgSessionValue.toFixed(2)}` },
    { label: 'Repeat Rate', value: `${repeatRate}%` },
    { label: 'Dispute Rate', value: `${disputeRate}%` },
  ]

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="analytics" overlay>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Performance insights & trends</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              &larr; Dashboard
            </button>
          </div>

          {/* Key Metrics */}
          <div className="mb-6">
            <StatsRow stats={stats} />
          </div>

          {/* Revenue Periods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue (30d)</p>
              <p className="text-2xl font-bold text-[#16A34A] mt-1">${revenueLast30.toFixed(2)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{bookingsLast30.length} sessions</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue (90d)</p>
              <p className="text-2xl font-bold text-[#2563EB] mt-1">${revenueLast90.toFixed(2)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{bookingsLast90.length} sessions</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Peak Month</p>
              <p className="text-2xl font-bold text-[#F59E0B] mt-1">{peakMonth?.month || 'N/A'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">${peakMonth?.revenue.toFixed(2) || '0.00'} revenue</p>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card className="mb-6">
            <div className="p-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Monthly Trend</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {monthlyTrend.map((m) => {
                  const maxRevenue = Math.max(...monthlyTrend.map(t => t.revenue), 1)
                  const widthPercent = (m.revenue / maxRevenue) * 100
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{m.month}</span>
                      <div className="flex-1 h-6 bg-[#F9FAFB] dark:bg-gray-800 rounded-[4px] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] rounded-[4px] transition-all duration-500"
                          style={{ width: `${Math.max(widthPercent, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                        ${m.revenue.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">
                        {m.bookings}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Athlete Breakdown */}
          <Card>
            <div className="p-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Athlete Breakdown</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{uniqueAthletes30}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active athletes (30d)</p>
              </div>
              <div className="text-center p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{uniqueAthletes90}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active athletes (90d)</p>
              </div>
              <div className="text-center p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
                <p className="text-2xl font-bold text-[#16A34A]">{repeatAthletes}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Repeat athletes</p>
              </div>
              <div className="text-center p-3 bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px]">
                <p className="text-2xl font-bold text-[#2563EB]">{repeatRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Retention rate</p>
              </div>
            </div>
          </Card>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}