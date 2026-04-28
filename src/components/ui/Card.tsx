import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  /** Use glassmorphism variant for premium dark cards */
  variant?: 'default' | 'glass'
  /** Add a gradient accent border */
  gradient?: boolean
}

export function Card({ children, className = '', onClick, variant = 'default', gradient = false }: CardProps) {
  const baseClasses = onClick
    ? 'cursor-pointer hover:shadow-md transition-all duration-200'
    : 'transition-colors duration-200'

  const variantClasses = variant === 'glass'
    ? 'glass-card rounded-[8px] p-4'
    : 'rounded-[8px] bg-white dark:bg-gray-900 shadow-sm border border-[#E5E7EB] dark:border-gray-700 p-4'

  const gradientClasses = gradient
    ? ' !border-[#2563EB]/20 !bg-gradient-to-br !from-[#2563EB]/10 !to-[#06B6D4]/5'
    : ''

  const hoverClasses = variant === 'glass' && onClick
    ? ' hover:bg-white/[0.07] hover:border-white/[0.1]'
    : ''

  return (
    <div
      className={`${variantClasses} ${baseClasses} ${gradientClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}