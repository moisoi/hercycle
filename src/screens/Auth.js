import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageToggle from '../components/LanguageToggle'
import Logo from '../components/Logo'
import { importGuestData, pullAccount } from '../lib/sync'
import { isOnboarded } from '../lib/store'

const Auth = ({ session, client }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (session) navigate(isOnboarded() ? '/' : '/onboarding', { replace: true })
  }, [session, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setFeedback(null)
    if (!client) {
      setFeedback({ type: 'error', text: t('auth.notConfigured') })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFeedback({ type: 'error', text: t('auth.errors.email') })
      return
    }
    if (password.length < 8) {
      setFeedback({ type: 'error', text: t('auth.errors.password') })
      return
    }

    setBusy(true)
    try {
      const result = mode === 'signin'
        ? await client.auth.signInWithPassword({ email: email.trim(), password })
        : await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
      if (result.error) throw result.error

      if (result.data.session?.user?.id) {
        // Guest entries from this device are copied into the account. Same-day account entries win.
        const imported = await importGuestData(client, result.data.session.user.id)
        if (!imported.ok) {
          setFeedback({ type: 'error', text: t('auth.importError', { error: imported.error }) })
        }
        await pullAccount(client, result.data.session.user.id)
        navigate(isOnboarded() ? '/' : '/onboarding', { replace: true })
        return
      }
      setFeedback({ type: 'info', text: t('auth.checkEmail') })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || t('auth.errors.generic') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="onboarding-shell auth-shell">
      <header className="onboarding-topbar">
        <Link to="/onboarding" className="onboarding-brand" aria-label={t('homeLabel')}>
          <Logo size={36} />
          <span>hercycle</span>
        </Link>
        <LanguageToggle />
      </header>

      <section className="onboarding-panel auth-panel">
        <span className="eyebrow-label">{t('auth.eyebrow')}</span>
        <h1>{mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}</h1>
        <p>{t('auth.copy')}</p>

        <div className="segmented" role="radiogroup" aria-label={t('auth.modeLabel')}>
          <button type="button" role="radio" aria-checked={mode === 'signin'} className={`segment${mode === 'signin' ? ' is-selected' : ''} spot`} onClick={() => setMode('signin')}>{t('auth.signIn')}</button>
          <button type="button" role="radio" aria-checked={mode === 'signup'} className={`segment${mode === 'signup' ? ' is-selected' : ''} spot`} onClick={() => setMode('signup')}>{t('auth.signUp')}</button>
        </div>

        <form className="auth-form" onSubmit={submit} noValidate>
          <label className="field" htmlFor="auth-email">
            <span className="field-label">{t('auth.email')}</span>
            <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field" htmlFor="auth-password">
            <span className="field-label">{t('auth.password')}</span>
            <input id="auth-password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="auth-password-help" />
            <small id="auth-password-help" className="field-help">{t('auth.passwordHelp')}</small>
          </label>
          <button type="submit" className="primary-button spot" disabled={busy}>
            {busy ? t('auth.working') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </button>
          {feedback && <p className={`save-state ${feedback.type === 'error' ? 'is-error' : 'is-saved'}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
        </form>

        <button type="button" className="link-button" onClick={() => navigate(isOnboarded() ? '/' : '/onboarding')}>
          {t('auth.continueGuest')}
        </button>
        <p className="privacy-note">{t('auth.privacy')}</p>
      </section>
    </main>
  )
}

export default Auth
