import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import {
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageToggle from '../components/LanguageToggle'
import { HerCycleLogoMark } from '../components/SplashScreen'
import {
  saveAccountProfileName,
  signInLocalAccount,
  signUpLocalAccount,
} from '../lib/account'
import { initializeSupabase, supabase } from '../lib/supabase'

const isSafeInternalRoute = (candidate) => {
  if (!candidate || typeof candidate !== 'string') return false
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return false
  const pathname = candidate.split('?')[0]
  return !['/signin', '/auth', '/onboarding'].includes(pathname)
}

const resolveAuthDestination = (location, searchParams) => {
  try {
    if (window.sessionStorage.getItem('hercycle.pendingCheckIn')) return '/log'
    if (window.sessionStorage.getItem('hercycle.pendingIntimacy')) return '/intimacy'
  } catch {
    // Ignore storage read errors in restricted browsers.
  }
  const queryTarget = searchParams?.get?.('redirect') || ''
  if (isSafeInternalRoute(queryTarget)) return queryTarget
  const stateTarget = location?.state?.from
  if (isSafeInternalRoute(stateTarget)) return stateTarget
  return '/'
}

const seedFirstAccountPreferences = async (client, userId) => {
  if (!client || !userId) return
  let onboarding = {}
  let preferences = {}
  try {
    onboarding = JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}')
    preferences = JSON.parse(window.localStorage.getItem('hercycle.preferences') || '{}')
  } catch {
    return
  }

  const { data: existing, error: loadError } = await client
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (loadError || existing || !onboarding.phase_selected) return

  await client.from('user_settings').upsert(
    {
      user_id: userId,
      onboarding_completed: true,
      phase_selected: onboarding.phase_selected,
      tone_preference: onboarding.tone_preference || 'playful',
      theme_preference: preferences.theme || 'light',
      font_size: preferences.fontSize || 'medium',
      hide_intimacy: Boolean(preferences.hideIntimacy),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
}

const Auth = ({ session, onAuthSuccess }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const initialMode =
    searchParams.get('mode') === 'signup' || location.state?.mode === 'signup'
      ? 'signup'
      : 'signin'
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const targetDestination = resolveAuthDestination(location, searchParams)

  const completeSignInRedirect = useCallback(
    (activeSession) => {
      try {
        window.localStorage.setItem('hercycle.onboarding.complete', 'true')
      } catch {
        // Ignore storage write issues.
      }
      onAuthSuccess?.(activeSession)
      navigate(targetDestination, { replace: true })
    },
    [navigate, onAuthSuccess, targetDestination]
  )

  useEffect(() => {
    if (session) {
      navigate(targetDestination, { replace: true })
    }
  }, [session, navigate, targetDestination])

  const isSignIn = mode === 'signin'

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setFeedback(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFeedback({ severity: 'error', text: t('invalidEmail') })
      return
    }
    if (isSignIn && password.length < 6) {
      setFeedback({ severity: 'error', text: t('passwordRequired') })
      return
    }
    if (!isSignIn && password.length < 8) {
      setFeedback({ severity: 'error', text: t('passwordTooShort') })
      return
    }
    if (!isSignIn && password !== confirmPassword) {
      setFeedback({ severity: 'error', text: t('passwordMismatch') })
      return
    }

    setIsSubmitting(true)
    try {
      const client = supabase || (await initializeSupabase({ forceRetry: true }))
      if (!client) {
        const localOutcome = isSignIn
          ? signInLocalAccount({ email: cleanEmail, password })
          : signUpLocalAccount({ name: cleanName, email: cleanEmail, password })

        if (localOutcome.error) throw localOutcome.error
        if (localOutcome.session) {
          if (cleanName) {
            await saveAccountProfileName(localOutcome.session, cleanName).catch(() => {})
          }
          completeSignInRedirect(localOutcome.session)
        }
        return
      }

      const result = isSignIn
        ? await client.auth.signInWithPassword({ email: cleanEmail, password })
        : await client.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: cleanName ? { full_name: cleanName } : undefined,
            },
          })

      if (result.error) throw result.error

      const activeSession =
        result.data?.session || (await client.auth.getSession().catch(() => null))?.data?.session

      if (activeSession) {
        if (cleanName) {
          await saveAccountProfileName(activeSession, cleanName).catch(() => {})
        }
        seedFirstAccountPreferences(client, activeSession.user.id).catch(() => {})
        completeSignInRedirect(activeSession)
      } else {
        if (cleanName && result.data?.user) {
          await saveAccountProfileName({ user: result.data.user }, cleanName).catch(() => {})
        }
        setConfirmPassword('')
        setMode('signin')
        setFeedback({ severity: 'success', text: t('signUpSuccess') })
      }
    } catch (error) {
      setFeedback({ severity: 'error', text: error.message || t('errorGeneric') })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (session) {
    return (
      <main className="auth-page">
        <div className="hc-auth-topbar">
          <span />
          <LanguageToggle />
        </div>
        <section className="auth-card hc-auth-luxury-card hc-spotlight-card" role="status">
          {t('authReturning')}
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page" data-testid="auth-sanctuary-page">
      <div className="auth-background-bloom auth-background-bloom-one" aria-hidden="true" />
      <div className="auth-background-bloom auth-background-bloom-two" aria-hidden="true" />

      {/* Minimal, non-overlapping top utility bar */}
      <div className="hc-auth-topbar">
        <Link className="hc-auth-back-pill" to={targetDestination}>
          <FiArrowLeft aria-hidden="true" />
          <span>{t('hercycle')}</span>
        </Link>
        <LanguageToggle />
      </div>

      <motion.section
        className="auth-card hc-auth-luxury-card hc-spotlight-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hc-auth-crest">
          <HerCycleLogoMark size={48} pulse />
        </div>

        <div className="hc-auth-header">
          <span className="auth-eyebrow">{t('authEyebrow')}</span>
          <h1>{isSignIn ? t('welcomeBack') : t('createYourAccount')}</h1>
          <p className="auth-description">{t('authHelp')}</p>
        </div>

        {/* Smooth Sliding Segmented Mode Control */}
        <div className="hc-auth-mode-tabs" role="tablist" aria-label={t('authEyebrow')}>
          <button
            type="button"
            role="tab"
            aria-selected={isSignIn}
            className={`hc-auth-mode-tab${isSignIn ? ' is-active' : ''}`}
            onClick={() => {
              setMode('signin')
              setConfirmPassword('')
              setFeedback(null)
            }}
          >
            {isSignIn && (
              <motion.span
                layoutId="hc-auth-tab-pill"
                className="hc-auth-tab-pill"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                aria-hidden="true"
              />
            )}
            <span className="hc-auth-mode-tab-label">{t('signIn')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isSignIn}
            className={`hc-auth-mode-tab${!isSignIn ? ' is-active' : ''}`}
            onClick={() => {
              setMode('signup')
              setFeedback(null)
            }}
          >
            {!isSignIn && (
              <motion.span
                layoutId="hc-auth-tab-pill"
                className="hc-auth-tab-pill"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                aria-hidden="true"
              />
            )}
            <span className="hc-auth-mode-tab-label">{t('signUp')}</span>
          </button>
        </div>

        {feedback && (
          <Alert severity={feedback.severity} className="auth-alert">
            {feedback.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="auth-form hc-auth-luxury-form">
          {!isSignIn && (
            <div className="hc-auth-field">
              <label htmlFor="auth-full-name">{t('accountDisplayNameLabel')}</label>
              <div className="hc-auth-input-shell">
                <FiUser className="hc-auth-field-icon" aria-hidden="true" />
                <input
                  id="auth-full-name"
                  type="text"
                  autoComplete="name"
                  placeholder={t('accountDisplayNamePlaceholder')}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="hc-auth-field">
            <label htmlFor="auth-email">{t('email')}</label>
            <div className="hc-auth-input-shell">
              <FiMail className="hc-auth-field-icon" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder={t('authEmailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="hc-auth-field">
            <label htmlFor="auth-password">{t('password')}</label>
            <div className="hc-auth-input-shell">
              <FiLock className="hc-auth-field-icon" aria-hidden="true" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="hc-auth-eye-btn"
                data-testid="auth-password-toggle"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
            {!isSignIn && (
              <small className="hc-auth-field-hint">{t('passwordMinHint')}</small>
            )}
          </div>

          {!isSignIn && (
            <div className="hc-auth-field">
              <label htmlFor="auth-confirm-password">{t('confirmPassword')}</label>
              <div className="hc-auth-input-shell">
                <FiLock className="hc-auth-field-icon" aria-hidden="true" />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            className="auth-submit-button form-submit-button hc-spotlight-btn"
          >
            {isSubmitting ? t('oneMoment') : isSignIn ? t('signIn') : t('signUp')}
          </Button>
        </form>

        <div className="hc-auth-divider" aria-hidden="true">
          <span>{t('authOrDivider')}</span>
        </div>

        <Link to={targetDestination} className="hc-auth-guest-cta hc-spotlight-btn">
          <span>{t('authContinueGuest')}</span>
          <FiArrowRight aria-hidden="true" />
        </Link>

        <p className="hc-auth-trust-line">
          <FiShield aria-hidden="true" />
          <span>{t('authAdFootnote')}</span>
        </p>
      </motion.section>
    </main>
  )
}

export default Auth
