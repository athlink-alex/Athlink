import { type ReactNode } from 'react'

type BadgeStatus = 'scheduled' | 'completed' | 'pending' | 'disputed' | 'elite'

interface BadgeProps {
  status: BadgeStatus
  children?: ReactNode
  className?: string
}

const statusClasses: Record<BadgeStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  disputed: 'bg-red-100 text-red-800',
  elite: 'bg-[#F59E0B]/15 text-[#F59E0B]',
}

const defaultLabels: Record<BadgeStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  pending: 'Pending',
  disputed: 'Disputed',
  elite: 'Elite',
}

export function Badge({ status, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]} ${className}`}
    >
      {children ?? defaultLabels[status]}
    </span>
  )
}