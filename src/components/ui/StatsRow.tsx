import { Card } from './Card'

interface StatItem {
  label: string
  value: string | number
}

interface StatsRowProps {
  stats: StatItem[]
  className?: string
}

export function StatsRow({ stats, className = '' }: StatsRowProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <p className="text-2xl font-bold text-[#2563EB]">{stat.value}</p>
          <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
        </Card>
      ))}
    </div>
  )
}