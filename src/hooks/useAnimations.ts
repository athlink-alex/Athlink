import { useEffect, useState, useRef } from 'react'
import { useInView, type Variants } from 'framer-motion'

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Framer Motion variant: fade up from below
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// Framer Motion variant: container that staggers children
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

// Framer Motion variant: individual stagger child
export const staggerChild = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay },
  },
})

// Scroll-triggered reveal variant (fires once)
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

// Hook: animate a number from 0 to target
export function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      setValue(target)
      return
    }

    const start = performance.now()
    const from = 0

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, enabled])

  return value
}

// Hook: scroll-triggered inView detection with animation props
export function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: threshold })

  const animationProps = prefersReducedMotion()
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
        transition: { duration: 0.6, ease: 'easeOut' as const },
      }

  return { ref, inView, animationProps }
}

// Framer Motion props for card hover elevation
export const cardHoverProps = prefersReducedMotion()
  ? {}
  : {
      whileHover: { y: -4, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)' },
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
    }

// Chart color palette (brand-matched)
export const CHART_COLORS = {
  primary: '#2563EB',
  cyan: '#06B6D4',
  green: '#4ADE80',
  amber: '#FBBF24',
  red: '#F87171',
  purple: '#A78BFA',
} as const