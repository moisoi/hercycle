import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiCamera,
  FiCheck,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogOut,
  FiMoon,
  FiShield,
  FiSun,
  FiTrash2,
  FiType,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { GiLotus } from 'react-icons/gi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import LanguageToggle from '../components/LanguageToggle'
import {
  deleteAccountOnDevice,
  getAccountProfile,
  saveAccountProfileDetails,
  signOutLocalAccount,
  updateAccountPassword,
} from '../lib/account'
import {
  clearLocalDeviceEntries,
  exportUserDataSnapshot,
  loadPreferences,
  savePreferences as persistPreferences,
} from '../lib/care'
import { CALM_EASE } from '../lib/entrance'
import { formatDisplayDate } from '../lib/period'
import { supabase } from '../lib/supabase'

const MAX_AVATAR_BYTES = 1_500_000

const ACCENT_PALETTES = [
  { key: 'rosewood', labelKey: 'accentRosewood', swatch: '#8f526f' },
  { key: 'addis', labelKey: 'accentAddis', swatch: '#b8833c' },
  { key: 'plum', labelKey: 'accentPlum', swatch: '#6d4578' },
  { key: 'linen', labelKey: 'accentLinen', swatch: '#6f7e6d' },
]

const toSafeIsoDate = (isoDateTime) => {
  if (!isoDateTime) return ''
  const raw = String(isoDateTime).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

const AccountInfo = ({ session }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const locale = String(i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .startsWith('am')
    ? 'am'
    : 'en'
  const isAmharic = locale === 'am'
  const userId = session?.user?.id || null

  const [, setAccountRev] = useState(0)
  const account = getAccountProfile(session)

  // Editable Profile State (explicit Save / Cancel + preserved edits on failure)
  const [savedName, setSavedName] = useState(() => account.displayName || '')
  const [savedAvatar, setSavedAvatar] = useState(() => account.avatarUrl || '')
  const [draftName, setDraftName] = useState(() => account.displayName || '')
  const [draftAvatar, setDraftAvatar] = useState(() => account.avatarUrl || '')
  const [nameError, setNameError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSavedNotice, setProfileSavedNotice] = useState('')
  const [profileSaveError, setProfileSaveError] = useState('')

  // Preferences State (persisted live with error preservation)
  const [preferences, setPreferences] = useState(() => loadPreferences())
  const [prefSavedFlash, setPrefSavedFlash] = useState(false)
  const [prefError, setPrefError] = useState('')

  // Security / Password Change State
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordFieldError, setPasswordFieldError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSavedNotice, setPasswordSavedNotice] = useState('')

  // Data Export & Protected Destructive Confirmations
  const [dataNotice, setDataNotice] = useState('')
  const [confirmClearEntries, setConfirmClearEntries] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

  const calmMotion = Boolean(preferences.reduceMotion)

  useEffect(() => {
    const syncAccount = () => {
      setAccountRev((rev) => rev + 1)
      const fresh = getAccountProfile(session)
      setSavedName(fresh.displayName || '')
      setSavedAvatar(fresh.avatarUrl || '')
    }
    const syncPrefs = () => setPreferences(loadPreferences())

    window.addEventListener('hercycle:account-changed', syncAccount)
    window.addEventListener('hercycle:preferences-changed', syncPrefs)
    return () => {
      window.removeEventListener('hercycle:account-changed', syncAccount)
      window.removeEventListener('hercycle:preferences-changed', syncPrefs)
    }
  }, [session])

  // Re-sync baseline if the active user session changes
  useEffect(() => {
    const fresh = getAccountProfile(session)
    setSavedName(fresh.displayName || '')
    setSavedAvatar(fresh.avatarUrl || '')
    setDraftName(fresh.displayName || '')
    setDraftAvatar(fresh.avatarUrl || '')
    setProfileSavedNotice('')
    setProfileSaveError('')
    setNameError('')
    setAvatarError('')
  }, [session, userId])

  const hasUnsavedProfileChanges = useMemo(
    () => draftName.trim() !== savedName.trim() || draftAvatar !== savedAvatar,
    [draftAvatar, draftName, savedAvatar, savedName]
  )

  const previewInitials = useMemo(() => {
    const clean = draftName.trim()
    if (!clean) return account.initials || 'H'
    const parts = clean.split(/\s+/).filter(Boolean)
    return parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }, [account.initials, draftName])

  const createdDateFormatted = useMemo(() => {
    const iso = toSafeIsoDate(account.createdAt)
    return iso ? formatDisplayDate(iso, locale) : '—'
  }, [account.createdAt, locale])

  const sessionDateFormatted = useMemo(() => {
    const iso = toSafeIsoDate(account.sessionStartedAt)
    return iso ? formatDisplayDate(iso, locale) : '—'
  }, [account.sessionStartedAt, locale])

  const sectionMotion = (index) =>
    calmMotion
      ? { initial: false, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.28, delay: 0.04 * index, ease: CALM_EASE },
        }

  const handleAvatarFileSelect = (event) => {
    const file = event.target?.files?.[0]
    if (!file) return
    setAvatarError('')
    setProfileSavedNotice('')
    setProfileSaveError('')

    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) {
      setAvatarError(t('accountAvatarInvalidType'))
      event.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t('accountAvatarTooLarge'))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraftAvatar(reader.result)
      }
    }
    reader.onerror = () => {
      setAvatarError(t('accountSaveError'))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setNameError('')
    setProfileSaveError('')
    setProfileSavedNotice('')

    if (draftName.trim().length > 48) {
      setNameError(t('accountNameTooLongError'))
      return
    }

    setProfileSaving(true)
    try {
      const updated = await saveAccountProfileDetails(session, {
        displayName: draftName.trim(),
        avatarUrl: draftAvatar,
      })
      setSavedName(updated.displayName || '')
      setSavedAvatar(updated.avatarUrl || '')
      setDraftName(updated.displayName || '')
      setDraftAvatar(updated.avatarUrl || '')
      setProfileSavedNotice(t('accountSavedConfirm'))
    } catch {
      // Preserve draftName & draftAvatar completely untouched so she never loses typed edits
      setProfileSaveError(t('accountSaveError'))
    } finally {
      setProfileSaving(false)
    }
  }

  const handleCancelProfileEdits = () => {
    setDraftName(savedName)
    setDraftAvatar(savedAvatar)
    setNameError('')
    setAvatarError('')
    setProfileSaveError('')
    setProfileSavedNotice('')
  }

  const updatePreference = async (key, value) => {
    setPrefError('')
    const previous = preferences
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    try {
      await persistPreferences(userId, next)
      setPrefSavedFlash(true)
    } catch {
      setPreferences(previous)
      setPrefError(t('accountSaveError'))
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordFieldError('')
    setPasswordSavedNotice('')

    if (newPassword.length < 8) {
      setPasswordFieldError(t('errorPasswordShort'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFieldError(t('errorPasswordMismatch'))
      return
    }

    setPasswordSaving(true)
    try {
      const result = await updateAccountPassword(session, {
        currentPassword,
        newPassword,
      })
      if (!result.ok) {
        if (result.reason === 'wrong_current_password') {
          setPasswordFieldError(t('accountPasswordWrongCurrent'))
        } else {
          setPasswordFieldError(t('accountSaveError'))
        }
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setIsPasswordOpen(false)
      setPasswordSavedNotice(t('accountPasswordSaved'))
    } catch {
      setPasswordFieldError(t('accountSaveError'))
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleExportSnapshot = () => {
    const payload = exportUserDataSnapshot(userId)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hercycle-account-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setDataNotice(t('exportDataDone'))
  }

  const handleClearEntries = () => {
    if (!confirmClearEntries) {
      setConfirmClearEntries(true)
      setConfirmDeleteAccount(false)
      return
    }
    clearLocalDeviceEntries(userId)
    setConfirmClearEntries(false)
    setDataNotice(t('clearLocalDone'))
  }

  const handleSignOut = async () => {
    signOutLocalAccount()
    if (supabase) {
      await supabase.auth.signOut().catch(() => {})
    }
    navigate('/signin')
  }

  const handleDeleteAccount = async () => {
    if (!confirmDeleteAccount) {
      setConfirmDeleteAccount(true)
      setConfirmClearEntries(false)
      return
    }
    clearLocalDeviceEntries(userId)
    await deleteAccountOnDevice(session)
    setConfirmDeleteAccount(false)
    navigate('/')
  }

  return (
    <div className="hc-account-page" data-testid="account-info-page">
      {/* 1. Personal, Welcoming Soft-Luxury Hero */}
      <motion.section
        className="hc-account-hero-card hc-spotlight-card"
        {...sectionMotion(0)}
      >
        <div className="hc-account-hero-avatar-wrap">
          <span className="hc-account-avatar-halo" aria-hidden="true" />
          <div className="hc-account-hero-avatar" data-testid="account-hero-avatar">
            {draftAvatar ? (
              <img src={draftAvatar} alt={savedName || t('accountAvatarLabel')} />
            ) : savedName || draftName.trim() ? (
              <span className="hc-account-hero-initials">{previewInitials}</span>
            ) : (
              <GiLotus className="hc-account-hero-lotus" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="hc-account-hero-copy">
          <span className="eyebrow-label">{t('accountHeroEyebrow')}</span>
          <h2>{t('accountHeroHeading')}</h2>
          <p>
            {savedName
              ? t('accountHeroIntroNamed', { name: savedName })
              : t('accountHeroIntro')}
          </p>
        </div>

        {!account.isAuthenticated && (
          <div className="hc-account-guest-note" data-testid="account-guest-banner">
            <div className="hc-account-guest-copy">
              <strong>{t('accountGuestBannerTitle')}</strong>
              <p>{t('accountGuestBannerBody')}</p>
            </div>
            <button
              type="button"
              className="hc-account-secondary-btn hc-spotlight-btn"
              onClick={() => navigate('/signin', { state: { from: '/account' } })}
            >
              <FiUser aria-hidden="true" />
              <span>{t('signIn')}</span>
            </button>
          </div>
        )}
      </motion.section>

      {/* 2. Section: Your Profile ("A little more you") */}
      <motion.section
        className="settings-card hc-account-section-card hc-spotlight-card"
        data-testid="account-section-profile"
        {...sectionMotion(1)}
      >
        <div className="hc-account-section-head">
          <div>
            <span className="eyebrow-label">{t('accountProfileEyebrow')}</span>
            <h3>{t('accountProfileHeading')}</h3>
            <p>{t('accountProfileSub')}</p>
          </div>
          {hasUnsavedProfileChanges && (
            <span className="hc-account-unsaved-pill" data-testid="account-unsaved-badge">
              {t('accountUnsavedBadge')}
            </span>
          )}
        </div>

        <form className="hc-account-profile-form" onSubmit={handleSaveProfile} noValidate>
          {/* Optional Neutral / Photo Emblem Row */}
          <div className="hc-account-avatar-editor">
            <div className="hc-account-avatar-preview">
              {draftAvatar ? (
                <img src={draftAvatar} alt={t('accountAvatarLabel')} />
              ) : draftName.trim() ? (
                <span>{previewInitials}</span>
              ) : (
                <GiLotus aria-hidden="true" />
              )}
            </div>

            <div className="hc-account-avatar-controls">
              <div className="hc-account-field-label-row">
                <span className="hc-account-field-title">{t('accountAvatarLabel')}</span>
                <span className="hc-field-kind-badge is-editable">
                  {t('accountEditableBadge')}
                </span>
              </div>
              <small className="hc-account-helper">{t('accountAvatarNeutralHint')}</small>

              <div className="hc-account-inline-btns">
                <input
                  id="account-avatar-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="visually-hidden"
                  onChange={handleAvatarFileSelect}
                />
                <button
                  type="button"
                  className="hc-account-secondary-btn hc-spotlight-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiCamera aria-hidden="true" />
                  <span>
                    {draftAvatar ? t('accountAvatarChangeBtn') : t('accountAvatarUploadBtn')}
                  </span>
                </button>
                {draftAvatar && (
                  <button
                    type="button"
                    className="hc-account-ghost-btn"
                    onClick={() => {
                      setDraftAvatar('')
                      setAvatarError('')
                      setProfileSavedNotice('')
                    }}
                  >
                    <FiX aria-hidden="true" />
                    <span>{t('accountAvatarRemoveBtn')}</span>
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="hc-account-field-validation" role="alert">
                  {avatarError}
                </p>
              )}
            </div>
          </div>

          {/* Editable Preferred Name Field */}
          <div className="hc-account-field-group">
            <div className="hc-account-field-label-row">
              <label htmlFor="account-preferred-name" className="hc-account-field-title">
                {t('accountDisplayNameLabel')}
              </label>
              <span className="hc-field-kind-badge is-editable">
                {t('accountEditableBadge')}
              </span>
            </div>
            <small id="account-preferred-name-help" className="hc-account-helper">
              {t('accountPreferredNameHelper')}
            </small>
            <input
              id="account-preferred-name"
              type="text"
              autoComplete="nickname"
              aria-describedby="account-preferred-name-help"
              aria-invalid={Boolean(nameError)}
              className="hc-account-text-input"
              placeholder={t('accountDisplayNamePlaceholder')}
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value)
                setNameError('')
                setProfileSavedNotice('')
                setProfileSaveError('')
              }}
            />
            {nameError && (
              <p className="hc-account-field-validation" role="alert">
                {nameError}
              </p>
            )}
          </div>

          {/* Clearly Distinguished Read-Only Account Metadata */}
          <div className="hc-account-readonly-grid">
            {account.isAuthenticated && (
              <div className="hc-account-readonly-item">
                <div className="hc-account-field-label-row">
                  <span className="hc-account-field-title">{t('email')}</span>
                  <span className="hc-field-kind-badge is-readonly">
                    <FiLock aria-hidden="true" />
                    {t('accountReadOnlyBadge')}
                  </span>
                </div>
                <strong className="hc-account-readonly-value" data-testid="account-readonly-email">
                  {account.email}
                </strong>
                <small className="hc-account-helper">{t('accountEmailReadOnlyHint')}</small>
              </div>
            )}

            <div className="hc-account-readonly-item">
              <div className="hc-account-field-label-row">
                <span className="hc-account-field-title">{t('accountMethodLabel')}</span>
                <span className="hc-field-kind-badge is-readonly">
                  <FiLock aria-hidden="true" />
                  {t('accountReadOnlyBadge')}
                </span>
              </div>
              <strong className="hc-account-readonly-value">
                {!account.isAuthenticated
                  ? t('accountMethodGuest')
                  : account.isLocalAccount
                  ? t('accountMethodLocal')
                  : t('accountMethodCloud')}
              </strong>
              {account.isAuthenticated && (
                <small className="hc-account-helper">
                  {t('accountMemberSinceLabel')}: {createdDateFormatted}
                </small>
              )}
            </div>
          </div>

          {/* Gentle Feedback Messages (Calm Checkmark — Zero Confetti) */}
          <AnimatePresence>
            {profileSavedNotice && (
              <motion.p
                className="hc-account-saved-confirm"
                data-testid="account-save-confirmation"
                role="status"
                initial={calmMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="hc-account-saved-check" aria-hidden="true">
                  <FiCheck />
                </span>
                <span>{profileSavedNotice}</span>
              </motion.p>
            )}
          </AnimatePresence>

          {profileSaveError && (
            <Alert severity="error" data-testid="account-save-error">
              {profileSaveError}
            </Alert>
          )}

          <div className="hc-account-form-actions">
            <button
              type="submit"
              disabled={profileSaving || !hasUnsavedProfileChanges}
              className="hc-account-primary-btn hc-spotlight-btn"
              data-testid="account-save-profile-btn"
            >
              <FiCheck aria-hidden="true" />
              <span>{profileSaving ? t('saving') : t('accountSaveButton')}</span>
            </button>

            <button
              type="button"
              disabled={profileSaving || !hasUnsavedProfileChanges}
              className="hc-account-cancel-btn"
              data-testid="account-cancel-profile-btn"
              onClick={handleCancelProfileEdits}
            >
              <span>{t('accountCancelButton')}</span>
            </button>
          </div>
        </form>
      </motion.section>

      {/* 3. Section: Your Preferences ("Make this space yours") */}
      <motion.section
        className="settings-card hc-account-section-card hc-spotlight-card"
        data-testid="account-section-preferences"
        {...sectionMotion(2)}
      >
        <div className="hc-account-section-head">
          <div>
            <span className="eyebrow-label">{t('accountPrefsEyebrow')}</span>
            <h3>{t('accountPrefsHeading')}</h3>
            <p>{t('accountPrefsSub')}</p>
          </div>
          {prefSavedFlash && (
            <span className="hc-account-saved-inline" role="status">
              <FiCheck aria-hidden="true" />
              <span>{t('accountSavedConfirm')}</span>
            </span>
          )}
        </div>

        {/* Language */}
        <div className="hc-account-pref-block">
          <div className="settings-section-heading">
            <span className="settings-section-icon">
              <TranslateRoundedIcon sx={{ fontSize: 18 }} />
            </span>
            <div>
              <h4>{t('languageSectionTitle')}</h4>
              <p>{t('languageSectionSub')}</p>
            </div>
            <div className="hc-account-lang-slot">
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* Appearance & Accent Palette */}
        <div className="hc-account-pref-block">
          <span className="hc-account-subhead">{t('appearance')}</span>
          <div className="settings-option-grid" role="radiogroup" aria-label={t('appearance')}>
            {[
              { key: 'light', label: t('lightMode'), icon: FiSun },
              { key: 'dark', label: t('darkMode'), icon: FiMoon },
              { key: 'system', label: t('systemMode'), icon: FiType },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={preferences.theme === key}
                className={`settings-choice hc-spotlight-btn${
                  preferences.theme === key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('theme', key)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {preferences.theme === key && (
                  <FiCheck className="settings-choice-check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <span className="hc-account-subhead">{t('accentPaletteLabel')}</span>
          <div
            className="hc-accent-palette-grid"
            role="radiogroup"
            aria-label={t('accentPaletteLabel')}
          >
            {ACCENT_PALETTES.map((pal) => (
              <button
                key={pal.key}
                type="button"
                role="radio"
                aria-checked={preferences.accentPalette === pal.key}
                className={`settings-choice hc-spotlight-btn${
                  preferences.accentPalette === pal.key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('accentPalette', pal.key)}
              >
                <span
                  className="hc-palette-swatch"
                  style={{ background: pal.swatch }}
                  aria-hidden="true"
                />
                <span>{t(pal.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility: Reading Size & Calm Motion */}
        <div className="hc-account-pref-block">
          <span className="hc-account-subhead">{t('accountAccessibilityLabel')}</span>
          <div
            className="settings-option-grid settings-option-grid-three"
            role="radiogroup"
            aria-label={t('fontSize')}
          >
            {[
              { key: 'small', label: t('smallText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
              { key: 'medium', label: t('mediumText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
              { key: 'large', label: t('largeText'), sample: isAmharic ? 'ሀለ' : 'Aa' },
            ].map(({ key, label, sample }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={preferences.fontSize === key}
                className={`settings-choice settings-text-choice settings-text-${key} hc-spotlight-btn${
                  preferences.fontSize === key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('fontSize', key)}
              >
                <strong>{sample}</strong>
                <span>{label}</span>
                {preferences.fontSize === key && (
                  <FiCheck className="settings-choice-check" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <div className="hc-settings-switch-row">
            <div>
              <strong>{t('motionReduceTitle')}</strong>
              <small>{t('motionReduceSub')}</small>
            </div>
            <button
              type="button"
              className={`settings-switch${preferences.reduceMotion ? ' is-on' : ''}`}
              role="switch"
              aria-checked={Boolean(preferences.reduceMotion)}
              aria-label={t('motionReduceTitle')}
              onClick={() => updatePreference('reduceMotion', !preferences.reduceMotion)}
            >
              <span />
            </button>
          </div>
        </div>

        {/* Communication & Check-in Rhythm */}
        <div className="hc-account-pref-block">
          <span className="hc-account-subhead">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />
            {t('accountCommLabel')}
          </span>
          <div className="hc-settings-switch-row">
            <div>
              <strong>{t('gentleRemindersToggleLabel')}</strong>
              <small>{t('gentleRemindersToggleSub')}</small>
            </div>
            <button
              type="button"
              className={`settings-switch${preferences.remindersEnabled !== false ? ' is-on' : ''}`}
              role="switch"
              aria-checked={preferences.remindersEnabled !== false}
              aria-label={t('gentleRemindersToggleLabel')}
              onClick={() =>
                updatePreference('remindersEnabled', preferences.remindersEnabled === false)
              }
            >
              <span />
            </button>
          </div>

          <div className="settings-option-grid settings-option-grid-three">
            {[
              { key: 'flexible', label: t('rhythmFlexible') },
              { key: 'few_times', label: t('rhythmFewTimes') },
              { key: 'weekly', label: t('rhythmWeekly') },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`settings-choice hc-spotlight-btn${
                  (preferences.checkinCadence || 'flexible') === item.key ? ' is-selected' : ''
                }`}
                onClick={() => updatePreference('checkinCadence', item.key)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {prefError && <Alert severity="error">{prefError}</Alert>}
      </motion.section>

      {/* 4. Section: Privacy and Security ("Your privacy, your choices") */}
      <motion.section
        className="settings-card hc-account-section-card hc-spotlight-card"
        data-testid="account-section-security"
        {...sectionMotion(3)}
      >
        <div className="hc-account-section-head">
          <div>
            <span className="eyebrow-label">{t('accountSecurityEyebrow')}</span>
            <h3>{t('accountSecurityHeading')}</h3>
            <p>{t('accountSecuritySub')}</p>
          </div>
        </div>

        <p className="hc-account-separation-banner">
          <FiShield aria-hidden="true" />
          <span>{t('accountHealthSeparationNote')}</span>
        </p>

        {/* Privacy Toggle: Hide Intimacy from Navigation */}
        <div className="hc-settings-switch-row">
          <div>
            <strong>{t('hideIntimacySection')}</strong>
            <small>{t('hideIntimacySub')}</small>
          </div>
          <button
            type="button"
            className={`settings-switch${preferences.hideIntimacy ? ' is-on' : ''}`}
            role="switch"
            aria-checked={Boolean(preferences.hideIntimacy)}
            aria-label={t('hideIntimacySection')}
            onClick={() => updatePreference('hideIntimacy', !preferences.hideIntimacy)}
          >
            <span />
          </button>
        </div>

        {/* Account Access & Password Verification */}
        {account.isAuthenticated && (
          <div className="hc-account-security-box">
            <div className="hc-account-security-top">
              <div>
                <strong>{t('password')}</strong>
                <small>{t('passwordMinHint')}</small>
              </div>
              <button
                type="button"
                className="hc-account-secondary-btn hc-spotlight-btn"
                aria-expanded={isPasswordOpen}
                onClick={() => {
                  setIsPasswordOpen((open) => !open)
                  setPasswordFieldError('')
                  setPasswordSavedNotice('')
                }}
              >
                <FiLock aria-hidden="true" />
                <span>
                  {isPasswordOpen ? t('accountCancelButton') : t('accountPasswordToggleBtn')}
                </span>
              </button>
            </div>

            {passwordSavedNotice && (
              <p className="hc-account-saved-confirm" role="status">
                <span className="hc-account-saved-check" aria-hidden="true">
                  <FiCheck />
                </span>
                <span>{passwordSavedNotice}</span>
              </p>
            )}

            <AnimatePresence initial={false}>
              {isPasswordOpen && (
                <motion.form
                  className="hc-account-password-form"
                  onSubmit={handlePasswordSubmit}
                  initial={calmMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={calmMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: CALM_EASE }}
                >
                  {account.isLocalAccount && (
                    <div className="hc-account-field-group">
                      <label htmlFor="account-current-password" className="hc-account-field-title">
                        {t('accountCurrentPassword')}
                      </label>
                      <div className="hc-account-password-wrap">
                        <input
                          id="account-current-password"
                          type={showPasswords ? 'text' : 'password'}
                          autoComplete="current-password"
                          className="hc-account-text-input"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value)
                            setPasswordFieldError('')
                          }}
                        />
                        <button
                          type="button"
                          className="hc-account-eye-btn"
                          aria-label={showPasswords ? t('hidePassword') : t('showPassword')}
                          onClick={() => setShowPasswords((v) => !v)}
                        >
                          {showPasswords ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="hc-account-field-group">
                    <label htmlFor="account-new-password" className="hc-account-field-title">
                      {t('accountNewPassword')}
                    </label>
                    <input
                      id="account-new-password"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="hc-account-text-input"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setPasswordFieldError('')
                      }}
                    />
                  </div>

                  <div className="hc-account-field-group">
                    <label htmlFor="account-confirm-password" className="hc-account-field-title">
                      {t('accountConfirmNewPassword')}
                    </label>
                    <input
                      id="account-confirm-password"
                      type={showPasswords ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="hc-account-text-input"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value)
                        setPasswordFieldError('')
                      }}
                    />
                  </div>

                  {passwordFieldError && (
                    <p className="hc-account-field-validation" role="alert">
                      {passwordFieldError}
                    </p>
                  )}

                  <div className="hc-account-form-actions">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="hc-account-primary-btn hc-spotlight-btn"
                    >
                      <FiCheck aria-hidden="true" />
                      <span>{passwordSaving ? t('saving') : t('accountSaveButton')}</span>
                    </button>
                    <button
                      type="button"
                      className="hc-account-cancel-btn"
                      onClick={() => {
                        setIsPasswordOpen(false)
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmNewPassword('')
                        setPasswordFieldError('')
                      }}
                    >
                      <span>{t('accountCancelButton')}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Active Session Card */}
        {account.isAuthenticated && (
          <div className="hc-account-session-card">
            <div className="hc-account-session-info">
              <span className="hc-account-session-title">{t('accountSessionCardTitle')}</span>
              <strong>{t('accountSessionCurrentDevice')}</strong>
              <small>
                {t('accountSessionStartedLabel')}: {sessionDateFormatted}
              </small>
              <small>{t('accountSessionRemoteNote')}</small>
            </div>
            <button
              type="button"
              className="hc-account-secondary-btn hc-spotlight-btn"
              onClick={handleSignOut}
              data-testid="account-signout-btn"
            >
              <FiLogOut aria-hidden="true" />
              <span>{t('signOutDevice')}</span>
            </button>
          </div>
        )}
      </motion.section>

      {/* 5. Section: Your Data ("Your data, always yours") */}
      <motion.section
        className="settings-card hc-account-section-card hc-spotlight-card"
        data-testid="account-section-data"
        {...sectionMotion(4)}
      >
        <div className="hc-account-section-head">
          <div>
            <span className="eyebrow-label">{t('accountDataEyebrow')}</span>
            <h3>{t('accountDataHeading')}</h3>
            <p>{t('accountDataSub')}</p>
          </div>
        </div>

        <div className="hc-account-export-row">
          <button
            type="button"
            className="hc-account-secondary-btn hc-spotlight-btn"
            onClick={handleExportSnapshot}
          >
            <FiDownload aria-hidden="true" />
            <span>{t('exportDataButton')}</span>
          </button>
        </div>

        {dataNotice && <Alert severity="success">{dataNotice}</Alert>}

        {/* Visually Separated Destructive Actions with Protected Two-Step Confirmation */}
        <div className="hc-account-danger-zone">
          <span className="hc-account-danger-eyebrow">{t('accountDangerZoneLabel')}</span>

          <div className="hc-account-danger-actions">
            <button
              type="button"
              className="hc-account-danger-btn"
              onClick={handleClearEntries}
            >
              <FiTrash2 aria-hidden="true" />
              <span>
                {confirmClearEntries ? t('clearLocalConfirm') : t('clearLocalButton')}
              </span>
            </button>
            {confirmClearEntries && (
              <button
                type="button"
                className="hc-account-cancel-btn"
                onClick={() => setConfirmClearEntries(false)}
              >
                <span>{t('accountCancelButton')}</span>
              </button>
            )}

            {account.isAuthenticated && (
              <button
                type="button"
                className="hc-account-danger-btn is-delete-account"
                data-testid="account-delete-btn"
                onClick={handleDeleteAccount}
              >
                <FiTrash2 aria-hidden="true" />
                <span>
                  {confirmDeleteAccount
                    ? t('accountDeleteConfirmBtn')
                    : t('accountDeleteAccountBtn')}
                </span>
              </button>
            )}
            {confirmDeleteAccount && (
              <button
                type="button"
                className="hc-account-cancel-btn"
                onClick={() => setConfirmDeleteAccount(false)}
              >
                <span>{t('accountCancelButton')}</span>
              </button>
            )}
          </div>

          {confirmDeleteAccount && (
            <p className="hc-account-danger-confirm-note" role="alert">
              {t('accountDeleteConfirmPrompt')}
            </p>
          )}
        </div>
      </motion.section>
    </div>
  )
}

export default AccountInfo
