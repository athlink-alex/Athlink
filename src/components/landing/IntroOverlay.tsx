import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function IntroOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    sessionStorage.removeItem('athlink-intro-seen')

    const alreadySeen = sessionStorage.getItem('athlink-intro-seen')
    if (alreadySeen) {
      setShow(false)
      return
    }

    setShow(true)
    sessionStorage.setItem('athlink-intro-seen', 'true')

    const timer = setTimeout(() => {
      setShow(false)
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' as const }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#030712',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } }}
            exit={{ opacity: 0, y: -15, transition: { duration: 0.8, ease: 'easeInOut' as const } }}
            style={{
              color: '#ffffff',
              fontSize: '3rem',
              fontWeight: '700',
              letterSpacing: '0.2em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ATHLINK
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  )
}