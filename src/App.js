import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell'
import Splash from './components/Splash'
import Auth from './screens/Auth'
import CycleLog from './screens/CycleLog'
import Home from './screens/Home'
import Insights from './screens/Insights'
import Intimacy from './screens/Intimacy'
import Journey from './screens/Journey'
import Luna from './screens/Luna'
import Onboarding from './screens/Onboarding'
import Settings from './screens/Settings'
import { initializeSupabase } from './lib/supabase'
import { pullAccount } from './lib/sync'
import { isOnboarded } from './lib/store'
import { SPLASH_MIN_MS, waitForMinimum } from './lib/splash'

const App = () => {
  const [session, setSession] = useState(undefined)
  const [client, setClient] = useState(null)
  const [booted, setBooted] = useState(false)
  const [onboarded, setOnboarded] = useState(() => isOnboarded())

  useEffect(() => {
    const startedAt = Date.now()
    let isMounted = true
    let subscription = null

    const restore = async () => {
      const supabaseClient = await initializeSupabase()
      if (!isMounted) return
      if (!supabaseClient) {
        setSession(null)
        return
      }
      setClient(supabaseClient)
      const { data } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
        if (isMounted) setSession(nextSession)
      })
      subscription = data.subscription
      const { data: current, error } = await supabaseClient.auth.getSession()
      if (error) throw error
      if (isMounted) setSession(current.session)
    }

    restore()
      .catch((error) => {
        console.error('Unable to restore the session:', error)
        if (isMounted) setSession(null)
      })
      .finally(() => {
        waitForMinimum(startedAt, SPLASH_MIN_MS).then(() => {
          if (isMounted) setBooted(true)
        })
      })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Signed-in users pull their account data into the device cache, so the account wins.
  useEffect(() => {
    if (client && session?.user?.id) pullAccount(client, session.user.id)
  }, [client, session?.user?.id])

  if (!booted || session === undefined) return <Splash />

  const canEnter = Boolean(session || onboarded)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/onboarding"
          element={canEnter ? <Navigate to="/" replace /> : <Onboarding session={session} client={client} onComplete={() => setOnboarded(true)} />}
        />
        <Route path="/auth" element={<Auth session={session} client={client} />} />
        <Route element={canEnter ? <AppShell session={session} /> : <Navigate to="/onboarding" replace />}>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/log" element={<CycleLog session={session} client={client} />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/luna" element={<Luna session={session} client={client} />} />
          <Route path="/intimacy" element={<Intimacy session={session} client={client} />} />
          <Route path="/journey" element={<Journey session={session} client={client} />} />
          <Route path="/settings" element={<Settings session={session} client={client} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
