import { Card } from './Card'
import { motion } from 'framer-motion'
import { useCountUp, staggerContainer, staggerChild, prefersReducedMotion, CHART_COLORS } from '../../hooks/useAnimations'

interface StatItem {
  label: string
  value: string | number
  /** If true, render value with gradient text */
  gradient?: boolean
  /** If true, animate the number counting up */
  animate?: boolean
}

interface StatsRowProps {
  stats: StatItem[]
  className?: string
}

export function StatsRow({ stats, className = '' }: StatsRowProps) {
  const reducedMotion = prefersReducedMotion()

  return (
    <motion.div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} reducedMotion={reducedMotion} />
      ))}
    </motion.div>
  )
}

function StatCard({ stat, reducedMotion }: { stat: StatItem; reducedMotion: boolean }) {
  // Parse numeric value for count-up animation
  const numericValue = typeof stat.value === 'number'
    ? stat.value
    : parseFloat(String(stat.value).replace(/[^0-9.]/g, ''))

  const shouldAnimate = stat.animate !== false && !isNaN(numericValue) && !reducedMotion
  const animatedValue = useCountUp(numericValue, 1200, shouldAnimate)

  const prefix = typeof stat.value === 'string' ? String(stat.value).match(/^[^0-9]*/)?.[0] || '' : ''
  const suffix = typeof stat.value === 'string' ? String(stat.value).match(/[^0-9.]*$/)?.[0] || '' : ''
  const isPercent = typeof stat.value === 'string' && stat.value.includes('%')
  const isDollar = typeof stat.value === 'string' && stat.value.includes('$')

  const displayValue = shouldAnimate
    ? `${isDollar ? '$' : ''}${animatedValue.toFixed(isPercent || isDollar ? (isDollar ? 2 : 0) : 0)}${isPercent ? '%' : ''}`
    : stat.value

  const valueClass = stat.gradient !== false
    ? 'gradient-text text-2xl font-bold'
    : 'text-2xl font-bold text-[#2563EB]'

  return (
    <motion.div variants={staggerChild()}>
      <Card variant="glass" className="text-center">
        <p className={valueClass}>{displayValue}</p>
        <p className="text-sm text-white/50 mt-1">{stat.label}</p>
      </Card>
    </motion.div>
  )
}