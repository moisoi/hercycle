import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell'
import Auth from './screens/Auth'
import CycleLog from './screens/CycleLog'
import Home from './screens/Home'
import Insights from './screens/Insights'
import Intimacy from './screens/Intimacy'
import LunaChat from './screens/LunaChat'
import Onboarding from './screens/Onboarding'
import Settings from './screens/Settings'
import { initializeSupabase } from './lib/supabase'

const App = () => {
  const [session, setSession] = useState(undefined)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    try {
      return window.localStorage.getItem('hercycle.onboarding.complete') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    let isMounted = true
    let authSubscription = null

    const restoreSupabaseSession = async () => {
      const client = await initializeSupabase()
      if (!isMounted) return
      if (!client) {
        setSession(null)
        return
      }

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (isMounted) setSession(nextSession)
      })
      authSubscription = subscription

      try {
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        if (isMounted) setSession(data.session)
      } catch (error) {
        console.error('Unable to restore the Supabase session:', error)
        if (isMounted) setSession(null)
      }
    }

    restoreSupabaseSession().catch((error) => {
      console.error('Unable to initialize Supabase:', error)
      if (isMounted) setSession(null)
    })

    return () => {
      isMounted = false
      authSubscription?.unsubscribe()
    }
  }, [])

  if (session === undefined) {
    return (
      <main className="configuration-message" aria-live="polite">
        <p>Loading your HerCycle session…</p>
      </main>
    )
  }

  const canEnterApp = Boolean(session || hasCompletedOnboarding)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/onboarding"
          element={
            canEnterApp ? (
              <Navigate to="/" replace />
            ) : (
              <Onboarding
                session={session}
                onComplete={() => setHasCompletedOnboarding(true)}
              />
            )
          }
        />
        <Route path="/auth" element={<Auth session={session} />} />
        <Route
          element={canEnterApp ? <AppShell session={session} /> : <Navigate to="/onboarding" replace />}
        >
          <Route path="/" element={<Home session={session} />} />
          <Route path="/log" element={<CycleLog session={session} />} />
          <Route path="/insights" element={<Insights session={session} />} />
          <Route path="/luna" element={<LunaChat key={session?.user?.id || 'guest'} session={session} />} />
          <Route path="/intimacy" element={<Intimacy session={session} />} />
          <Route path="/settings" element={<Settings session={session} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
