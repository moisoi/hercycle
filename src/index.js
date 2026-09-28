import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/styles'
import { createTheme } from '@mui/styles'
import App from './App'
import { useTranslation } from 'react-i18next'

// i18next setup
import i18next from 'i18next'
import i18nextHttpBackend from 'i18next-http-backend'

i18next
  .use(i18nextHttpBackend)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}.json' }
  })

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6B2D5D',
    },
    secondary: {
      main: '#A8D5B8',
    },
    background: {
      default: '#F7F5F3',
    },
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Rounded', 'Helvetica Neue', sans-serif",
  },
})

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)