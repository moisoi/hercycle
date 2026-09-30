import React, { useEffect, useState } from 'react'

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material'
import Home from './screens/Home'
import Onboarding from './screens/Onboarding'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/styles'
import { createTheme } from '@mui/styles'
import Home from './screens/Home'

import { supabase } from './lib/supabase'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6B2D5D' },
    secondary: { main: '#A8D5B8' },
    background: { default: '#F7F5F3' },
  },
  typography: { fontFamily: "'Inter', 'SF Pro Rounded', 'Helvetica Neue', sans-serif" }
})

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={session ? <Home /> : null} />

          <Route
            path="/onboarding"
            element={!session ? <Onboarding /> : <Navigate to="/" replace />}
          />

          <Route path="/onboarding" element={!session ? <Home /> : null} />

        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App