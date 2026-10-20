import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiMessageCircle } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

// Floating shortcut to Luna. It hides while the user is in a form, so it never covers a field,
// and it hides on Luna's own page.
const LunaLauncher = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [inForm, setInForm] = useState(false)

  useEffect(() => {
    const onFocusIn = (event) => setInForm(Boolean(event.target?.closest?.('form')))
    const onFocusOut = (event) => {
      if (!event.relatedTarget || !event.relatedTarget.closest?.('form')) setInForm(false)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  if (inForm || location.pathname === '/luna') return null
  return (
    <button type="button" className="luna-launcher spot glow-radial" onClick={() => navigate('/luna')} aria-label={t('askLuna')}>
      <FiMessageCircle aria-hidden="true" />
      <span>{t('askLuna')}</span>
    </button>
  )
}

export default LunaLauncher
