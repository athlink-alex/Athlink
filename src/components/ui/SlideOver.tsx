import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function SlideOver({ open, onClose, children, title }: SlideOverProps) {
  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Desktop: right panel — Mobile: bottom sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-xl z-50 hidden md:flex md:flex-col"
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-[8px] hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl z-50 md:hidden flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-[#E5E7EB] dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-[8px] hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}