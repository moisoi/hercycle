import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import './i18n'
import App from './App'
import SplashScreen from './components/SplashScreen'
import { applyDocumentPreferences, loadPreferences } from './lib/care'
import './styles/base.css'
import './styles/index.css'
import './styles/botanical.css'
import './styles/journey.css'

try {
  applyDocumentPreferences(loadPreferences())
} catch {
  // Browser storage may be restricted; defaults apply gracefully.
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
    <React.Suspense fallback={<SplashScreen visible variant="boot" />}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.Suspense>
  </React.StrictMode>
)
