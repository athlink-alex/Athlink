import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { StatsRow } from '../../../components/ui/StatsRow'
import { useCountUp, staggerContainer, staggerChild, prefersReducedMotion, CHART_COLORS } from '../../../hooks/useAnimations'

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
  const reducedMotion = prefersReducedMotion()

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

  // Sparkline data — daily revenue for mini chart
  const sparklineData = (() => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 180
    const result = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const dayStart = new Date(now.getTime() - (days - i * (days / Math.min(days, 30))) * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + (days / Math.min(days, 30)) * 24 * 60 * 60 * 1000)
      const dayRevenue = filteredBookings
        .filter(b => {
          const d = new Date(b.session_date)
          return d >= dayStart && d < dayEnd && b.payment_status === 'released'
        })
        .reduce((sum, b) => sum + b.amount, 0) / 100
      return { value: dayRevenue }
    })
    return result
  })()

  // Count-up animations
  const totalAnim = useCountUp(totalRevenue / 100, 1200, !reducedMotion)
  const releasedAnim = useCountUp(releasedTotal / 100, 1200, !reducedMotion)
  const escrowAnim = useCountUp(escrowTotal / 100, 1200, !reducedMotion)

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
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-white/90">Revenue</h1>
            <p className="text-sm text-white/50 mt-1">Track earnings and transactions</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/coach')}
            className="text-sm gradient-text hover:opacity-80 transition-opacity font-medium"
          >
            &larr; Dashboard
          </button>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                dateRange === range
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70'
              }`}
            >
              {range === 'all' ? 'All time' : `Last ${range === '7d' ? '7' : range === '30d' ? '30' : '90'} days`}
            </button>
          ))}
        </motion.div>

        {/* Stats with Sparkline */}
        <motion.div
          className="mb-6"
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={stat.label} variant="glass" className="text-center">
                {i === 0 && sparklineData.length > 0 && (
                  <div className="mb-2 -mx-1 -mt-1">
                    <ResponsiveContainer width="100%" height={40}>
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={CHART_COLORS.primary}
                          strokeWidth={1.5}
                          fill="url(#sparkFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="gradient-text text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerChild()}>
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80] mb-3" />
              <p className="text-sm text-white/50">Released to You</p>
              <p className="text-2xl font-bold text-[#4ADE80] mt-1">
                ${reducedMotion ? (releasedTotal / 100).toFixed(2) : releasedAnim.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 mt-1">Available for payout</p>
            </Card>
          </motion.div>
          <motion.div variants={staggerChild()}>
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#D97706] to-[#FBBF24] mb-3" />
              <p className="text-sm text-white/50">Held in Escrow</p>
              <p className="text-2xl font-bold text-[#FBBF24] mt-1">
                ${reducedMotion ? (escrowTotal / 100).toFixed(2) : escrowAnim.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 mt-1">Pending session completion</p>
            </Card>
          </motion.div>
          <motion.div variants={staggerChild()}>
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#DC2626] to-[#F87171] mb-3" />
              <p className="text-sm text-white/50">Disputes</p>
              <p className="text-2xl font-bold text-[#F87171] mt-1">{disputedCount}</p>
              <p className="text-xs text-white/30 mt-1">Sessions under review</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Export */}
        <motion.div
          className="flex justify-end mb-4"
          initial={reducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] glass-card text-sm font-medium text-white/70 hover:bg-white/[0.07] hover:text-white/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card variant="glass">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white/90">Transactions</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-sm">No transactions in this period.</div>
              ) : (
                filteredBookings.map((booking, i) => (
                  <div key={booking.id} className={`p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-white/90">{booking.athlete_name}</p>
                      <p className="text-xs text-white/40">
                        {new Date(booking.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        booking.payment_status === 'released'
                          ? 'bg-[#16A34A]/20 text-[#4ADE80]'
                          : 'bg-[#D97706]/20 text-[#FBBF24]'
                      }`}>
                        {booking.payment_status === 'released' ? 'Released' : 'Escrow'}
                      </span>
                      <span className="text-sm font-medium text-white/80">${(booking.amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}