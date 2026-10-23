import React, { useEffect, useState } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'

import AgeGate, { hasVerifiedAge } from './components/AgeGate'
import AppShell from './components/AppShell'
import AccountInfo from './screens/AccountInfo'
import Auth from './screens/Auth'
import CycleLog from './screens/CycleLog'
import Home from './screens/Home'
import Insights from './screens/Insights'
import Intimacy from './screens/Intimacy'
import Journey from './screens/Journey'
import LunaChat from './screens/LunaChat'
import Onboarding from './screens/Onboarding'
import Settings from './screens/Settings'
import { applyPreferencesToDocument, loadPreferences } from './lib/care'
import { readLocalSession } from './lib/account'
import {
  checkAndRefreshSixHourReturn,
  consumeFirstVisitEntranceFlag,
  prefersCalmMotion,
} from './lib/entrance'
import { attachGlobalSpotlight } from './lib/spotlight'
import { initializeSupabase } from './lib/supabase'

const AppRoutes = ({
  session,
  onAuthSuccess,
  hasCompletedOnboarding,
  onCompleteOnboarding,
  isFirstVisit,
  reducedMotion,
}) => {
  const canEnterApp = Boolean(session || hasCompletedOnboarding)

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          canEnterApp ? (
            <Navigate to="/" replace />
          ) : (
            <Onboarding
              session={session}
              onComplete={onCompleteOnboarding}
              isFirstVisit={isFirstVisit}
            />
          )
        }
      />
      <Route
        path="/auth"
        element={
          <Auth
            session={session}
            onAuthSuccess={onAuthSuccess}
            isFirstVisit={isFirstVisit}
          />
        }
      />
      <Route
        path="/signin"
        element={
          <Auth
            session={session}
            onAuthSuccess={onAuthSuccess}
            isFirstVisit={isFirstVisit}
          />
        }
      />
      <Route
        element={
          canEnterApp ? (
            <AppShell
              session={session}
              isFirstVisit={isFirstVisit}
              reducedMotion={reducedMotion}
            />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        }
      >
        <Route path="/" element={<Home session={session} />} />
        <Route path="/log" element={<CycleLog session={session} />} />
        <Route path="/cycle-log" element={<CycleLog session={session} />} />
        <Route path="/insights" element={<Insights session={session} />} />
        <Route path="/journey" element={<Journey session={session} />} />
        <Route
          path="/luna"
          element={<LunaChat key={session?.user?.id || 'guest'} session={session} />}
        />
        <Route path="/intimacy" element={<Intimacy session={session} />} />
        <Route path="/settings" element={<Settings session={session} />} />
        <Route
          path="/account"
          element={<AccountInfo key={session?.user?.id || 'guest'} session={session} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = ({ initialRouterEntries = null }) => {
  const [session, setSession] = useState(() => readLocalSession())
  const [ageVerified, setAgeVerified] = useState(() => hasVerifiedAge())
  const [reduceMotion, setReduceMotion] = useState(() => prefersCalmMotion())
  const [isFirstVisit, setIsFirstVisit] = useState(() => consumeFirstVisitEntranceFlag())
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    try {
      return window.localStorage.getItem('hercycle.onboarding.complete') === 'true'
    } catch {
      return false
    }
  })

  const handleCompleteOnboarding = () => {
    try {
      window.localStorage.setItem('hercycle.onboarding.complete', 'true')
    } catch {
      // Allow entry even if storage is unavailable.
    }
    setIsFirstVisit(false)
    setHasCompletedOnboarding(true)
    const isSyntheticDom =
      typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')
    if (!isSyntheticDom && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo(0, 0)
      } catch {
        // Ignore unimplemented scrollTo in test environments.
      }
    }
  }

  useEffect(() => {
    const detachSpotlight = attachGlobalSpotlight()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && checkAndRefreshSixHourReturn()) {
        setIsFirstVisit(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      detachSpotlight()
    }
  }, [])

  useEffect(() => {
    const syncMotion = (event) => {
      const uid = session?.user?.id || 'guest'
      const nextPrefs = event?.detail
        ? { ...loadPreferences(uid), ...event.detail }
        : loadPreferences(uid)
      applyPreferencesToDocument(nextPrefs)
      const osReduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      setReduceMotion(Boolean(nextPrefs.reduceMotion || osReduced))
    }

    syncMotion()

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null

    window.addEventListener('hercycle:preferences-changed', syncMotion)
    mediaQuery?.addEventListener?.('change', syncMotion)
    return () => {
      window.removeEventListener('hercycle:preferences-changed', syncMotion)
      mediaQuery?.removeEventListener?.('change', syncMotion)
    }
  }, [session?.user?.id])

  useEffect(() => {
    let isMounted = true
    let authSubscription = null

    const onLocalAccountChange = () => {
      if (!isMounted) return
      const localSess = readLocalSession()
      setSession((prev) => {
        if (localSess) return localSess
        if (prev?.isLocalSanctuary) return null
        return prev
      })
    }

    window.addEventListener('hercycle:account-changed', onLocalAccountChange)

    const restoreSupabaseSession = async () => {
      const client = await initializeSupabase()
      if (!isMounted) return
      if (!client) {
        const localSess = readLocalSession()
        if (localSess) setSession(localSess)
        return
      }

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (isMounted) setSession(nextSession || readLocalSession())
      })
      authSubscription = subscription

      try {
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        if (isMounted) setSession(data.session || readLocalSession())
      } catch (error) {
        console.error('Unable to restore the Supabase session:', error)
        if (isMounted) setSession(readLocalSession())
      }
    }

    restoreSupabaseSession().catch((error) => {
      console.error('Unable to initialize Supabase:', error)
      if (isMounted) setSession(readLocalSession())
    })

    return () => {
      isMounted = false
      window.removeEventListener('hercycle:account-changed', onLocalAccountChange)
      authSubscription?.unsubscribe()
    }
  }, [])

  const handleAuthSuccess = (nextSession) => {
    if (nextSession) {
      try {
        window.localStorage.setItem('hercycle.onboarding.complete', 'true')
      } catch {
        // Allow session transition even if localStorage is restricted.
      }
      setHasCompletedOnboarding(true)
    }
    setSession(nextSession)
  }

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      {!ageVerified ? (
        <AgeGate
          onVerified={() => setAgeVerified(true)}
          isFirstVisit={isFirstVisit}
          reducedMotion={reduceMotion}
        />
      ) : Array.isArray(initialRouterEntries) ? (
        <MemoryRouter
          initialEntries={initialRouterEntries}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes
            session={session}
            onAuthSuccess={handleAuthSuccess}
            hasCompletedOnboarding={hasCompletedOnboarding}
            onCompleteOnboarding={handleCompleteOnboarding}
            isFirstVisit={isFirstVisit}
            reducedMotion={reduceMotion}
          />
        </MemoryRouter>
      ) : (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes
            session={session}
            onAuthSuccess={handleAuthSuccess}
            hasCompletedOnboarding={hasCompletedOnboarding}
            onCompleteOnboarding={handleCompleteOnboarding}
            isFirstVisit={isFirstVisit}
            reducedMotion={reduceMotion}
          />
        </BrowserRouter>
      )}
    </MotionConfig>
  )
}

export default App
