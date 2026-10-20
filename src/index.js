import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import { initI18n } from './lib/i18n'
import { installSpotlight } from './lib/spotlight'
import { applyMotion, getMotionOn, getPrefs } from './lib/store'
import './styles/app.css'

initI18n()

// Motion comes only from the in-app switch. The OS setting is never read.
applyMotion(getMotionOn())

try {
  const prefs = getPrefs()
  document.documentElement.setAttribute('data-theme', prefs.theme)
  document.documentElement.setAttribute('data-font-size', prefs.fontSize)
} catch {
  // Browser storage may be disabled. The default theme applies.
}

installSpotlight()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Could not find the root element to mount HerCycle.')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
