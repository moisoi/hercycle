import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuLogIn, LuLogOut, LuUserPlus } from 'react-icons/lu'

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { isValidEmail } from '../lib/partner'

const MIN_PASSWORD = 8

/**
 * Sign-in and account creation. Accounts are optional: guest data stays on this device, and
 * signing in backs it up and syncs it. If the backend is not configured, say so plainly.
 */
const AuthPanel = ({ session, onSignedOut }) => {
  const { t } = useTranslation()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="notice warn" role="status">
        {t('auth.notConfigured')}
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="stack">
        <p>
          {t('auth.signedInAs', { email: session.user.email })}
        </p>
        <div className="row">
          <button
            type="button"
            className="btn ghost"
            onClick={async () => {
              setBusy(true)
              await supabase.auth.signOut()
              setBusy(false)
              onSignedOut?.()
            }}
            disabled={busy}
          >
            <LuLogOut aria-hidden="true" /> {t('auth.signOut')}
          </button>
        </div>
      </div>
    )
  }

  const emailInvalid = email.length > 0 && !isValidEmail(email)
  const passwordShort = password.length > 0 && password.length < MIN_PASSWORD
  const canSubmit = isValidEmail(email) && password.length >= MIN_PASSWORD && !busy

  const submit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInError) throw signInError
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password })
        if (signUpError) throw signUpError
        if (!data.session) setNotice(t('auth.checkEmail'))
      }
    } catch (failure) {
      setError(failure?.message || t('auth.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <div className="seg" role="group" aria-label={t('auth.mode')}>
        <button type="button" aria-pressed={mode === 'signin'} onClick={() => setMode('signin')}>
          {t('auth.signIn')}
        </button>
        <button type="button" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>
          {t('auth.create')}
        </button>
      </div>

      <label className="field">
        <span>{t('auth.email')}</span>
        <input
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailInvalid}
          aria-describedby="auth-email-help"
          required
        />
        <small id="auth-email-help" className={emailInvalid ? 'field-error' : ''}>
          {emailInvalid ? t('auth.emailInvalid') : t('auth.emailHelp')}
        </small>
      </label>

      <label className="field">
        <span>{t('auth.password')}</span>
        <input
          className="input"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={passwordShort}
          aria-describedby="auth-password-help"
          required
        />
        <small id="auth-password-help" className={passwordShort ? 'field-error' : ''}>
          {t('auth.passwordHelp', { count: MIN_PASSWORD })}
        </small>
      </label>

      {error && (
        <div className="notice warn" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice info" role="status">
          {notice}
        </div>
      )}

      <div className="row">
        <button type="submit" className="btn" disabled={!canSubmit}>
          {mode === 'signin' ? <LuLogIn aria-hidden="true" /> : <LuUserPlus aria-hidden="true" />}
          {busy ? t('auth.working') : mode === 'signin' ? t('auth.signIn') : t('auth.create')}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.88rem' }}>{t('auth.privacy')}</p>
    </form>
  )
}

export default AuthPanel
