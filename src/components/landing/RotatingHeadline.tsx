import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = ['Pro', 'Champion', 'Starter', 'Leader', 'Legend']

export function RotatingHeadline() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
      Train Like a{' '}
      <span className="inline-block relative align-bottom">
        <AnimatePresence mode="wait">
          <motion.span
            key={WORDS[index]}
            className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent"
            initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  )
}