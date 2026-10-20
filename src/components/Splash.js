import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from './Logo'

export const SPLASH_MIN_MS = 600

/** Shows the logo for at least SPLASH_MIN_MS, and until the app is ready. */
const Splash = ({ ready, onDone }) => {
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), SPLASH_MIN_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (ready && minElapsed) onDone()
  }, [ready, minElapsed, onDone])

  return (
    <motion.div
      className="splash"
      role="status"
      aria-live="polite"
      aria-label="Loading HerCycle"
      exit={{ opacity: 0, transition: { duration: 0.24 } }}
    >
      <motion.div
        className="splash-logo"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo title="HerCycle" />
      </motion.div>
    </motion.div>
  )
}

export default Splash
