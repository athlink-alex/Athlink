import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { AppLayout } from '../../../components/layout/AppLayout'
import { Card } from '../../../components/ui/Card'
import { UpgradeGate } from '../../../components/ui/UpgradeGate'
import { ChartTooltip } from '../../../components/ui/ChartTooltip'
import { type CoachTier } from '../../../lib/subscriptions'
import { useCountUp, staggerContainer, staggerChild, prefersReducedMotion, CHART_COLORS } from '../../../hooks/useAnimations'

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

  const rawTier = profile?.subscription_tier || 'free'
  const tier: CoachTier = rawTier === 'elite' ? 'pro' : (rawTier as CoachTier)
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

  const uniqueAthletes30 = new Set(bookingsLast30.map(b => b.athlete_id)).size
  const uniqueAthletes90 = new Set(bookingsLast90.map(b => b.athlete_id)).size

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
      bookings: monthBookings.length as number,
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

  // Donut chart data
  const newAthletes = Math.max(uniqueAthletes30 - repeatAthletes, 0)
  const donutData = [
    { name: 'Active (30d)', value: uniqueAthletes30, color: CHART_COLORS.primary },
    { name: 'Repeat', value: repeatAthletes, color: CHART_COLORS.cyan },
    { name: 'New', value: newAthletes, color: CHART_COLORS.green },
  ]

  // Count-up values
  const revenue30Anim = useCountUp(revenueLast30, 1200, !reducedMotion)
  const revenue90Anim = useCountUp(revenueLast90, 1200, !reducedMotion)

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <UpgradeGate tier={tier} feature="ai_tools" overlay>
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl font-bold text-white/90">Analytics</h1>
              <p className="text-sm text-white/50 mt-1">Performance insights & trends</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/coach')}
              className="text-sm gradient-text hover:opacity-80 transition-opacity font-medium"
            >
              &larr; Dashboard
            </button>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            className="mb-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={staggerChild()}>
                  <Card variant="glass" className="text-center">
                    <p className="gradient-text text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-white/50 mt-1">{stat.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Revenue Periods */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] mb-3" />
              <p className="text-sm text-white/50">Revenue (30d)</p>
              <p className="text-2xl font-bold gradient-text mt-1">
                ${reducedMotion ? revenueLast30.toFixed(2) : revenue30Anim.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 mt-1">{bookingsLast30.length} sessions</p>
            </Card>
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#4ADE80] mb-3" />
              <p className="text-sm text-white/50">Revenue (90d)</p>
              <p className="text-2xl font-bold gradient-text mt-1">
                ${reducedMotion ? revenueLast90.toFixed(2) : revenue90Anim.toFixed(2)}
              </p>
              <p className="text-xs text-white/30 mt-1">{bookingsLast90.length} sessions</p>
            </Card>
            <Card variant="glass" className="p-5">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] mb-3" />
              <p className="text-sm text-white/50">Peak Month</p>
              <p className="text-2xl font-bold text-[#FBBF24] mt-1">{peakMonth?.month || 'N/A'}</p>
              <p className="text-xs text-white/30 mt-1">${peakMonth?.revenue.toFixed(2) || '0.00'} revenue</p>
            </Card>
          </motion.div>

          {/* Monthly Trend — Area Chart */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card variant="glass" className="mb-6">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white/90">Monthly Trend</h2>
                <p className="text-xs text-white/40 mt-0.5">Revenue & booking volume</p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="blueCyanGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} />
                        <stop offset="100%" stopColor={CHART_COLORS.cyan} />
                      </linearGradient>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#475569', fontSize: 12 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <Tooltip content={<ChartTooltip valueFormatter={(v, name) => name === 'revenue' ? `$${v.toFixed(2)}` : String(v)} />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#blueCyanGradient)"
                      strokeWidth={2}
                      fill="url(#areaFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Revenue Trend + Athlete Breakdown side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend Line Chart */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card variant="glass" className="h-full">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-white/90">Revenue Trend</h2>
                  <p className="text-xs text-white/40 mt-0.5">6-month performance</p>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#475569', fontSize: 12 }}
                        axisLine={{ stroke: '#1E293B' }}
                        tickLine={{ stroke: '#1E293B' }}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${v}`}
                        tick={{ fill: '#475569', fontSize: 12 }}
                        axisLine={{ stroke: '#1E293B' }}
                        tickLine={{ stroke: '#1E293B' }}
                      />
                      <Tooltip content={<ChartTooltip valueFormatter={(v) => `$${v.toFixed(2)}`} />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART_COLORS.cyan}
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS.cyan, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS.cyan, stroke: '#0F1320', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Athlete Breakdown — Donut Chart */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card variant="glass" className="h-full">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-white/90">Athlete Breakdown</h2>
                  <p className="text-xs text-white/40 mt-0.5">Active & retention metrics</p>
                </div>
                <div className="p-4">
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label overlay */}
                    <div className="-mt-[105px] mb-[65px] text-center pointer-events-none">
                      <p className="text-2xl font-bold gradient-text">{totalAthletes}</p>
                      <p className="text-xs text-white/40">total</p>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      {donutData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-white/50">{entry.name}</span>
                          <span className="text-xs font-medium text-white/80">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Additional metrics below donut */}
                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                      <div className="text-center p-3 bg-white/[0.03] rounded-[8px]">
                        <p className="text-xl font-bold text-white/90">{uniqueAthletes90}</p>
                        <p className="text-xs text-white/40">Active (90d)</p>
                      </div>
                      <div className="text-center p-3 bg-white/[0.03] rounded-[8px]">
                        <p className="text-xl font-bold gradient-text">{repeatRate}%</p>
                        <p className="text-xs text-white/40">Retention rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </UpgradeGate>
      </div>
    </AppLayout>
  )
}