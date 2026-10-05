import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Home from './screens/Home'
import Onboarding from './screens/Onboarding'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const App = () => {
  const [session, setSession] = useState(undefined)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let isMounted = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession)
    })

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error
        if (isMounted) setSession(data.session)
      })
      .catch((error) => {
        console.error('Unable to restore the Supabase session:', error)
        if (isMounted) setSession(null)
      })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <main className="configuration-message">
        <section>
          <h1>Connect HerCycle to Supabase</h1>
          <p>
            Add <code>REACT_APP_SUPABASE_URL</code> and{' '}
            <code>REACT_APP_SUPABASE_KEY</code> (or <code>REACT_APP_SUPABASE_ANON_KEY</code>) to your environment, then restart
            the app. See <code>.env.example</code> for the required names.
          </p>
        </section>
      </main>
    )
  }

  if (session === undefined) {
    return (
      <main className="configuration-message" aria-live="polite">
        <p>Loading your HerCycle session…</p>
      </main>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            session || hasCompletedOnboarding ? (
              <Home />
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            session || hasCompletedOnboarding ? (
              <Navigate to="/" replace />
            ) : (
              <Onboarding
                session={session}
                onComplete={() => setHasCompletedOnboarding(true)}
              />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
