import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Splash from './components/Splash'
import Shell from './components/Shell'
import Onboarding from './screens/Onboarding'
import Today from './screens/Home'
import CheckIn from './screens/CheckIn'
import Intimacy from './screens/Intimacy'
import Journey from './screens/Journey'
import Insights from './screens/Insights'
import Settings from './screens/Settings'
import { initializeSupabase } from './lib/supabase'
import { syncAccount } from './lib/sync'
import { KEYS, useRaw, useStoredJson } from './lib/store'
import { getProfile } from './lib/repo'
import { SessionContext } from './lib/session'
import './i18n'
import './styles/app.css'

const EMPTY = Object.freeze({})

const App = () => {
  const [session, setSession] = useState(undefined)
  const [sync, setSync] = useState({ status: 'idle', message: '' })
  const [splashDone, setSplashDone] = useState(false)
  const onSplashDone = useCallback(() => setSplashDone(true), [])

  // Motion is controlled only by the in-app switch, never by the OS setting.
  const motionRaw = useRaw(KEYS.motion)
  const motionOn = motionRaw !== 'off'
  const profile = { ...getProfile(), ...useStoredJson(KEYS.profile, EMPTY) }

  useEffect(() => {
    document.documentElement.classList.toggle('motion-off', !motionOn)
  }, [motionOn])

  useEffect(() => {
    document.documentElement.dataset.font = profile.fontSize || 'medium'
  }, [profile.fontSize])

  useEffect(() => {
    // The client is configured at build time or from /api/config on Cloudflare Pages. Guest mode
    // still works when neither is available, so this always resolves to a session or null.
    let mounted = true
    let subscription = null
    initializeSupabase().then((client) => {
      if (!mounted) return
      if (!client) {
        setSession(null)
        return
      }
      const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) setSession(nextSession)
      })
      subscription = data.subscription
      client.auth
        .getSession()
        .then(({ data: result, error }) => {
          if (error) throw error
          if (mounted) setSession(result.session)
        })
        .catch(() => {
          if (mounted) setSession(null)
        })
    })
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) {
      setSync({ status: 'idle', message: '' })
      return undefined
    }
    let mounted = true
    setSync({ status: 'syncing', message: '' })
    syncAccount(userId)
      .then((result) => {
        if (mounted) setSync({ status: 'done', message: '', ...result })
      })
      .catch((error) => {
        if (mounted) setSync({ status: 'error', message: error.message })
      })
    return () => {
      mounted = false
    }
  }, [userId])

  const sessionValue = useMemo(() => ({ session: session ?? null, sync }), [session, sync])
  const onboarded = Boolean(profile.onboarded)
  const ready = session !== undefined

  return (
    <MotionConfig reducedMotion="never" transition={motionOn ? undefined : { duration: 0 }}>
      <SessionContext.Provider value={sessionValue}>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={onboarded ? <Navigate to="/" replace /> : <Onboarding />} />
            <Route element={onboarded ? <Shell /> : <Navigate to="/onboarding" replace />}>
              <Route index element={<Today />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="intimacy" element={<Intimacy />} />
              <Route path="journey" element={<Journey />} />
              <Route path="insights" element={<Insights />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SessionContext.Provider>
      <AnimatePresence>{!splashDone && <Splash key="splash" ready={ready} onDone={onSplashDone} />}</AnimatePresence>
    </MotionConfig>
  )
}

export default App
