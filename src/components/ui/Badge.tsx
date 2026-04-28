import { type ReactNode } from 'react'

type BadgeStatus = 'scheduled' | 'completed' | 'pending' | 'disputed' | 'pro'

interface BadgeProps {
  status: BadgeStatus
  children?: ReactNode
  className?: string
}

const statusClasses: Record<BadgeStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-[#2563EB]/20 dark:text-[#60A5FA]',
  completed: 'bg-green-100 text-green-800 dark:bg-[#16A34A]/20 dark:text-[#4ADE80]',
  pending: 'bg-amber-100 text-amber-800 dark:bg-[#D97706]/20 dark:text-[#FBBF24]',
  disputed: 'bg-red-100 text-red-800 dark:bg-[#DC2626]/20 dark:text-[#F87171]',
  pro: 'bg-[#1D9E75]/15 text-[#1D9E75] dark:bg-[#06B6D4]/20 dark:text-[#06B6D4]',
}

const defaultLabels: Record<BadgeStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  pending: 'Pending',
  disputed: 'Disputed',
  pro: 'Pro',
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