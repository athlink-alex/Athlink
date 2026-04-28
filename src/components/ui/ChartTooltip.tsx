import { CHART_COLORS } from '../../hooks/useAnimations'

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color?: string
  }>
  label?: string
  /** Value formatter, e.g. (v) => `$${v}` */
  valueFormatter?: (value: number, name: string) => string
}

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass-card !rounded-[8px] !p-3 !bg-[#0F1320]/95">
      {label && (
        <p className="text-xs text-white/50 mb-1">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color || CHART_COLORS.primary }}
          />
          <span className="text-xs text-white/70">{entry.name}:</span>
          <span className="text-xs font-medium text-white/90">
            {valueFormatter ? valueFormatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}