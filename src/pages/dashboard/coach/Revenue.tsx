import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { StatsRow } from '../../../components/ui/StatsRow'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { type CoachTier } from '../../../lib/subscriptions'

interface BookingRecord {
  id: string
  session_date: string
  status: string
  payment_status: string
  amount: number
  athlete_name: string
}

export function Revenue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

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
        athlete_name: b.athlete_profiles?.name || 'Unknown',
      })))
    }

    setLoading(false)
  }

  const now = new Date()
  const filteredBookings = bookings.filter(b => {
    if (dateRange === 'all') return true
    const d = new Date(b.session_date)
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    return d >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  })

  const escrowTotal = filteredBookings
    .filter(b => b.payment_status === 'escrow_held')
    .reduce((sum, b) => sum + b.amount, 0)

  const releasedTotal = filteredBookings
    .filter(b => b.payment_status === 'released')
    .reduce((sum, b) => sum + b.amount, 0)

  const completedCount = filteredBookings.filter(b => b.status === 'completed').length
  const disputedCount = filteredBookings.filter(b => b.status === 'disputed').length
  const totalRevenue = escrowTotal + releasedTotal

  const stats = [
    { label: 'Total Revenue', value: `$${(totalRevenue / 100).toFixed(2)}` },
    { label: 'Released', value: `$${(releasedTotal / 100).toFixed(2)}` },
    { label: 'In Escrow', value: `$${(escrowTotal / 100).toFixed(2)}` },
    { label: 'Completed', value: completedCount },
  ]

  const exportCSV = () => {
    const rows = [
      ['Date', 'Athlete', 'Status', 'Payment Status', 'Amount'],
      ...filteredBookings.map(b => [
        new Date(b.session_date).toLocaleDateString(),
        b.athlete_name,
        b.status,
        b.payment_status,
        (b.amount / 100).toFixed(2),
      ]),
    ]

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `athlink-revenue-${dateRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="revenue_dashboard">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Revenue</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track earnings and transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/coach')}
                className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
              >
                &larr; Dashboard
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 mb-6">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F9FAFB] dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range === 'all' ? 'All time' : `Last ${range === '7d' ? '7' : range === '30d' ? '30' : '90'} days`}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mb-6">
            <StatsRow stats={stats} />
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Released to You</p>
              <p className="text-2xl font-bold text-[#16A34A] mt-1">${(releasedTotal / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Available for payout</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Held in Escrow</p>
              <p className="text-2xl font-bold text-[#D97706] mt-1">${(escrowTotal / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pending session completion</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Disputes</p>
              <p className="text-2xl font-bold text-[#DC2626] mt-1">{disputedCount}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sessions under review</p>
            </Card>
          </div>

          {/* Export */}
          <div className="flex justify-end mb-4">
            <UpgradeGate tier={tier} feature="csv_export">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
            </UpgradeGate>
          </div>

          {/* Transaction List */}
          <Card>
            <div className="p-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Transactions</h2>
            </div>
            <div className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">No transactions in this period.</div>
              ) : (
                filteredBookings.map((booking) => (
                  <div key={booking.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{booking.athlete_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(booking.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        booking.payment_status === 'released'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}>
                        {booking.payment_status === 'released' ? 'Released' : 'Escrow'}
                      </span>
                      <span className="text-sm font-medium">${(booking.amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}