import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import i18next from 'i18next'
import i18nextHttpBackend from 'i18next-http-backend'

import App from './App'
import './styles/index.css'

// Initialize translations before rendering components that call useTranslation.
i18next.use(i18nextHttpBackend).init({
  fallbackLng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  backend: { loadPath: '/locales/{{lng}}.json' },
})

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6B2D5D' },
    secondary: { main: '#A8D5B8' },
    background: { default: '#F7F5F3' },
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.Suspense>
  </React.StrictMode>
)
