import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Could not find the root element to mount HerCycle.')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
