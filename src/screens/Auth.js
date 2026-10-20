import React, { useEffect, useState } from 'react'
import { Alert, Button, TextField } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { GiLotus } from 'react-icons/gi'
import { useTranslation } from 'react-i18next'

import { isSupabaseConfigured, supabase } from '../lib/supabase'

const authDestination = () => {
  try {
    if (window.sessionStorage.getItem('hercycle.pendingCheckIn')) return '/log'
    if (window.sessionStorage.getItem('hercycle.pendingIntimacy')) return '/intimacy'
    return '/'
  } catch {
    return '/'
  }
}

const Auth = ({ session }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (session) navigate(authDestination(), { replace: true })
  }, [session, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFeedback(null)

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFeedback({ severity: 'error', text: t('invalidEmail') })
      return
    }
    if (password.length < 8) {
      setFeedback({ severity: 'error', text: t('passwordTooShort') })
      return
    }

    setIsSubmitting(true)
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        })

      if (result.error) throw result.error

      if (result.data.session) {
        try {
          await seedFirstAccountPreferences(result.data.session.user.id)
        } catch (preferenceError) {
          // Authentication remains successful even if preference sync needs a retry.
          console.warn('Could not sync initial preferences:', preferenceError)
        }
        navigate(authDestination(), { replace: true })
      } else {
        setFeedback({ severity: 'success', text: t('signUpSuccess') })
      }
    } catch (error) {
      setFeedback({ severity: 'error', text: error.message || t('errorGeneric') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSignIn = mode === 'signin'

  if (session) {
    return (
      <main className="auth-page">
        <section className="auth-card" role="status">Returning you to your private space…</section>
      </main>
    )
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <main className="auth-page">
        <div className="auth-background-bloom auth-background-bloom-one" />
        <section className="auth-card auth-setup-card">
          <div className="auth-card-icon"><GiLotus aria-hidden="true" /></div>
          <span className="auth-eyebrow">YOUR SPACE, YOUR CHOICE</span>
          <h1>Explore as a guest.</h1>
          <p className="auth-description">
            You can use HerCycle without an account. Cycle check-ins and intimate reflections are only saved when you sign in.
          </p>
          <Link to="/" className="auth-return-button">Continue without signing in</Link>
        </section>
        <p className="auth-footnote">Use a private device for cycle and intimate health information.</p>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-background-bloom auth-background-bloom-one" />
      <div className="auth-background-bloom auth-background-bloom-two" />
      <Link className="auth-brand" to="/onboarding">
        <span className="app-brand-mark"><GiLotus aria-hidden="true" /></span>
        <span>hercycle</span>
      </Link>

      <section className="auth-card">
        <div className="auth-card-icon"><GiLotus aria-hidden="true" /></div>
        <span className="auth-eyebrow">A SPACE THAT IS YOURS</span>
        <h1>{isSignIn ? t('welcomeBack') : t('createYourAccount')}</h1>
        <p className="auth-description">{t('authHelp')}</p>

        {feedback && <Alert severity={feedback.severity} className="auth-alert">{feedback.text}</Alert>}

        <form onSubmit={handleSubmit} className="auth-form">
          <TextField
            fullWidth
            label={t('email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            fullWidth
            label={t('password')}
            type="password"
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            inputProps={{ minLength: 8 }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            className="onboarding-cta auth-submit"
          >
            {isSubmitting ? 'One moment…' : isSignIn ? t('signIn') : t('signUp')}
          </Button>
        </form>

        <div className="auth-mode-switch">
          <span>{isSignIn ? "New to HerCycle?" : 'Already have an account?'}</span>
          <button type="button" onClick={() => { setMode(isSignIn ? 'signup' : 'signin'); setFeedback(null) }}>
            {isSignIn ? t('signUp') : t('signIn')}
          </button>
        </div>
        <Link to="/onboarding" className="auth-back-link">Back to welcome</Link>
      </section>

      <p className="auth-footnote">Your private health information is never used for advertising.</p>
    </main>
  )
}

const seedFirstAccountPreferences = async (userId) => {
  let onboarding = {}
  let preferences = {}
  try {
    onboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
    preferences = JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}')
  } catch {
    return
  }

  const { data: existing, error: loadError } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (loadError) throw loadError
  if (existing || !onboarding.phase_selected) return

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    onboarding_completed: true,
    phase_selected: onboarding.phase_selected,
    tone_preference: onboarding.tone_preference || 'balanced',
    theme_preference: preferences.theme || 'light',
    font_size: preferences.fontSize || 'medium',
    hide_intimacy: Boolean(preferences.hideIntimacy),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export default Auth
