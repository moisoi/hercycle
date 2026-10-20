import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { MotionConfig } from 'framer-motion'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import english from './locales/en.json'
import App from './App'
import './styles/base.css'
import './styles/index.css'
import './styles/botanical.css'

// Bundle English strings with the app so production never falls back to
// untranslated camelCase keys when a separate locale request fails.
i18next.use(initReactI18next).init({
  resources: { en: { translation: english } },
  lng: 'en',
  fallbackLng: 'en',
  debug: false,
  initImmediate: false,
  interpolation: { escapeValue: false },
  parseMissingKeyHandler: (key) =>
    key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[._]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
})

try {
  const savedPreferences = JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}')
  if (savedPreferences.theme === 'dark' || savedPreferences.theme === 'system') {
    document.documentElement.setAttribute('data-theme', savedPreferences.theme)
  }
  if (['small', 'medium', 'large'].includes(savedPreferences.fontSize)) {
    document.documentElement.setAttribute('data-font-size', savedPreferences.fontSize)
  }
} catch {
  // Browser storage may be disabled; use the accessible default theme.
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#8F526F', light: '#C87890', dark: '#633D5B' },
    secondary: { main: '#82967A', light: '#B8C7A9', dark: '#596F55' },
    background: { default: '#FBF7F1', paper: '#FFFDF9' },
    text: { primary: '#56454F', secondary: '#897984' },
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Rounded', 'Helvetica Neue', sans-serif",
  },
})

const container = document.getElementById('root')

if (!container) {
  throw new Error('Could not find the root element to mount HerCycle.')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <React.Suspense fallback={<main className="configuration-message" role="status">Loading HerCycle…</main>}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </MotionConfig>
    </React.Suspense>
  </React.StrictMode>
)
