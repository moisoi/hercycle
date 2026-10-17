import React, { useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { motion } from 'framer-motion'
import { FiCheck, FiCopy, FiHeart, FiLock, FiShare2, FiShield, FiZap } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { localDateString } from '../lib/period'

const signals = [
  { key: 'green', icon: '✿' },
  { key: 'yellow', icon: '☼' },
  { key: 'red', icon: '♡' },
]

const terms = ['romantic', 'sensual', 'sexual', 'spontaneous']
const vibes = ['tender', 'playful', 'naughty']

const readPendingIntimacy = () => {
  if (!isSupabaseConfigured) return null
  try {
    return JSON.parse(window.sessionStorage.getItem('hercycle.pendingIntimacy') || 'null')
  } catch {
    return null
  }
}

const Intimacy = ({ session }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [initialDraft] = useState(readPendingIntimacy)
  const [signal, setSignal] = useState(initialDraft?.traffic_light || null)
  const [comfort, setComfort] = useState(Number(initialDraft?.intimacy_level) || 0)
  const [selectedTerms, setSelectedTerms] = useState(initialDraft?.preferred_terms || [])
  const [desire, setDesire] = useState(initialDraft?.libido ?? null)
  const [desireVibe, setDesireVibe] = useState(initialDraft?.desire_vibe || 'tender')
  const [cyclePhase, setCyclePhase] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(session?.user?.id))
  const [saveState, setSaveState] = useState('idle')
  const [saveNotice, setSaveNotice] = useState('')
  const [error, setError] = useState('')
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [partnerMessage, setPartnerMessage] = useState(() => t('intimacyNoteTender'))
  const [partnerPhone, setPartnerPhone] = useState('')
  const [shareNotice, setShareNotice] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadToday = async () => {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      const [intimacyResult, phaseResult] = await Promise.all([
        supabase
          .from('intimacy_logs')
          .select('libido, intimacy_level, traffic_light, preferred_terms, desire_vibe')
          .eq('user_id', session.user.id)
          .eq('date', localDateString())
          .maybeSingle(),
        supabase
          .from('cycles')
          .select('phase, date')
          .eq('user_id', session.user.id)
          .lte('date', localDateString())
          .order('date', { ascending: false })
          .limit(1),
      ])

      if (!isMounted) return
      if (intimacyResult.error) {
        setError(intimacyResult.error.message || t('errorGeneric'))
      } else if (intimacyResult.data) {
        const data = intimacyResult.data
        setDesire(data.libido ?? null)
        setComfort(data.intimacy_level ?? 0)
        setSignal(data.traffic_light || null)
        setSelectedTerms(data.preferred_terms || [])
        setDesireVibe(vibes.includes(data.desire_vibe) ? data.desire_vibe : 'tender')
        setPartnerMessage(t(`intimacyNote${capitalize(vibes.includes(data.desire_vibe) ? data.desire_vibe : 'tender')}`))
      }
      if (!phaseResult.error) setCyclePhase(phaseResult.data?.[0]?.phase || null)
      setIsLoading(false)
    }

    loadToday().catch((queryError) => {
      if (isMounted) {
        setError(queryError.message || t('errorGeneric'))
        setIsLoading(false)
      }
    })
    return () => { isMounted = false }
  }, [session?.user?.id, t])

  const updateVibe = (nextVibe) => {
    setDesireVibe(nextVibe)
    setPartnerMessage(t(`intimacyNote${capitalize(nextVibe)}`))
    setShareNotice('')
    setSaveNotice('')
    setSaveState('idle')
  }

  const toggleTerm = (term) => {
    setSaveState('idle')
    setSaveNotice('')
    setSelectedTerms((current) => current.includes(term)
      ? current.filter((item) => item !== term)
      : [...current, term])
  }

  const saveReflection = async (event) => {
    event.preventDefault()
    setError('')
    setSaveNotice('')

    if (!session?.user?.id) {
      setSaveState('preview')
      setSaveNotice(t('intimacyGuestPreview'))
      return
    }

    setSaveState('saving')
    try {
      const { error: saveError } = await supabase.from('intimacy_logs').upsert({
        user_id: session.user.id,
        libido: desire,
        intimacy_level: comfort,
        traffic_light: signal,
        preferred_terms: selectedTerms,
        desire_vibe: desireVibe,
        date: localDateString(),
      }, { onConflict: 'user_id,date' })
      if (saveError) throw saveError
      setSaveState('saved')
      try {
        window.sessionStorage.removeItem('hercycle.pendingIntimacy')
      } catch {
        // The saved database row is authoritative.
      }
    } catch (saveError) {
      console.error('Unable to save private reflection:', saveError)
      setError(saveError.message || t('errorGeneric'))
      setSaveState('idle')
    }
  }

  const signInToSave = () => {
    if (isSupabaseConfigured) {
      try {
        window.sessionStorage.setItem('hercycle.pendingIntimacy', JSON.stringify({
          libido: desire,
          intimacy_level: comfort,
          traffic_light: signal,
          preferred_terms: selectedTerms,
          desire_vibe: desireVibe,
        }))
      } catch {
        // Continue to sign-in without a temporary draft if storage is unavailable.
      }
    }
    navigate('/auth')
  }

  const copyMessage = async () => {
    const text = partnerMessage.trim()
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const copyField = document.createElement('textarea')
        copyField.value = text
        copyField.setAttribute('readonly', '')
        copyField.style.position = 'fixed'
        copyField.style.opacity = '0'
        document.body.appendChild(copyField)
        copyField.select()
        const copied = document.execCommand('copy')
        copyField.remove()
        if (!copied) throw new Error('Clipboard unavailable')
      }
      setShareNotice(t('intimacyMessageCopied'))
    } catch {
      setShareNotice(t('intimacyCopyUnavailable'))
    }
  }

  const shareWithPartner = async () => {
    const text = partnerMessage.trim()
    if (!text) return
    setShareNotice('')

    try {
      if (partnerPhone.trim()) {
        const phone = partnerPhone.replace(/[^\d+]/g, '')
        if (!/^\+?\d{5,15}$/.test(phone)) {
          setShareNotice(t('intimacyPhoneInvalid'))
          return
        }
        window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(text)}`
        setShareNotice(t('intimacySmsReady'))
        return
      }

      if (navigator.share) {
        await navigator.share({ title: t('intimacyShareTitle'), text })
        setShareNotice(t('intimacyShareReady'))
        return
      }

      await copyMessage()
    } catch (shareError) {
      if (shareError?.name !== 'AbortError') setShareNotice(t('intimacyShareUnavailable'))
    }
  }

  const extraFlirty = desire !== null && Number(desire) >= 8

  return (
    <div className="intimacy-page">
      <motion.section className="intimacy-privacy-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="intimacy-privacy-icon"><FiLock aria-hidden="true" /></div>
        <div>
          <span className="eyebrow-label">{t('intimacyEyebrow')}</span>
          <h2>{t('intimacyTitle')}</h2>
          <p>{t('intimacyDescription')}</p>
        </div>
        <span className="intimacy-privacy-badge"><FiShield aria-hidden="true" /> {t('intimacyPrivateBadge')}</span>
      </motion.section>

      {cyclePhase ? (
        <section className="intimacy-cycle-context">
          <span className="intimacy-cycle-context-icon" aria-hidden="true"><FiZap /></span>
          <p>{t('intimacyCycleContext', { phase: t(`phase.${cyclePhase}`) })}</p>
        </section>
      ) : (
        <section className="intimacy-cycle-context">
          <span className="intimacy-cycle-context-icon" aria-hidden="true"><FiZap /></span>
          <p>{t('intimacyCycleNoContext')}</p>
        </section>
      )}

      <form className="intimacy-form" onSubmit={saveReflection}>
        <section className="intimacy-section">
          <div className="intimacy-section-heading">
            <span className="form-step-number">01</span>
            <div><h3>{t('consentSignal')}</h3><p>{t('intimacySignalDescription')}</p></div>
          </div>
          <div className="consent-signal-grid" role="radiogroup" aria-label={t('consentSignal')}>
            {signals.map((item) => (
              <motion.button
                key={item.key}
                type="button"
                className={`consent-signal-card consent-signal-${item.key}${signal === item.key ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={signal === item.key}
                onClick={() => { setSignal(item.key); setSaveState('idle'); setSaveNotice('') }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="consent-signal-symbol" aria-hidden="true">{item.icon}</span>
                <span>{t(item.key)}</span>
              </motion.button>
            ))}
          </div>
          {signal && <motion.p className="consent-reflection" key={signal} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t(`intimacySignal_${signal}`)}</motion.p>}
        </section>

        <section className="intimacy-section">
          <div className="intimacy-section-heading">
            <span className="form-step-number">02</span>
            <div><h3>{t('intimacyLevel')}</h3><p>{t('intimacyComfortDescription')}</p></div>
          </div>
          <div className="comfort-scale" role="radiogroup" aria-label={t('intimacyLevel')}>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`comfort-scale-button${comfort === value ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={comfort === value}
                aria-label={value === 0 ? t('skip') : t('comfortLevelValue', { value })}
                onClick={() => { setComfort(value); setSaveState('idle'); setSaveNotice('') }}
              >
                {value === 0 ? t('skip') : value}
              </button>
            ))}
          </div>
        </section>

        <section className="intimacy-section intimacy-desire-section">
          <div className="intimacy-section-heading">
            <span className="form-step-number">03</span>
            <div><h3>{t('intimacyDesireTitle')}</h3><p>{t('intimacyDesireDescription')}</p></div>
          </div>
          <div className="intimacy-desire-topline">
            <span>{desire === null ? t('intimacyDesireNotChecked') : t('intimacyDesireRating', { value: desire })}</span>
            {desire !== null && Number(desire) >= 8 && <span className="intimacy-high-desire-badge"><FiZap aria-hidden="true" /> {t('intimacyHighDesire')}</span>}
          </div>
          <input
            className="intimacy-desire-range"
            type="range"
            min="1"
            max="10"
            step="1"
            value={desire ?? 5}
            onChange={(event) => { setDesire(Number(event.target.value)); setSaveState('idle'); setSaveNotice('') }}
            aria-label={t('intimacyDesireTitle')}
          />
          <div className="intimacy-desire-endpoints"><span>{t('intimacyDesireLow')}</span><span>{t('intimacyDesireHigh')}</span></div>
          <button type="button" className={`intimacy-skip-desire${desire === null ? ' is-selected' : ''}`} onClick={() => { setDesire(null); setSaveState('idle'); setSaveNotice('') }}>{t('skipDesire')}</button>
        </section>

        <section className="intimacy-section">
          <div className="intimacy-section-heading">
            <span className="form-step-number">04</span>
            <div><h3>{t('intimacyVibeTitle')}</h3><p>{t('intimacyVibeDescription')}</p></div>
          </div>
          <div className="intimacy-vibe-grid" role="radiogroup" aria-label={t('intimacyVibeTitle')}>
            {vibes.map((vibe) => (
              <button
                type="button"
                key={vibe}
                className={`intimacy-vibe-card intimacy-vibe-${vibe}${desireVibe === vibe ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={desireVibe === vibe}
                onClick={() => updateVibe(vibe)}
              >
                <span className="intimacy-vibe-icon" aria-hidden="true">{vibe === 'tender' ? '♡' : vibe === 'playful' ? '✧' : '✦'}</span>
                <strong>{t(`intimacyVibe${capitalize(vibe)}`)}</strong>
                <small>{t(`intimacyVibe${capitalize(vibe)}Description`)}</small>
                {desireVibe === vibe && <FiCheck className="intimacy-vibe-check" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="intimacy-term-list" role="group" aria-label={t('preferredTerms')}>
            {terms.map((term) => (
              <button
                type="button"
                key={term}
                className={`intimacy-term${selectedTerms.includes(term) ? ' is-selected' : ''}`}
                aria-pressed={selectedTerms.includes(term)}
                onClick={() => toggleTerm(term)}
              >
                <FiHeart aria-hidden="true" /> {t(term)}
              </button>
            ))}
          </div>
        </section>

        {extraFlirty && (
          <motion.section className="partner-spark-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="partner-spark-header">
              <span className="partner-spark-icon"><FiHeart aria-hidden="true" /></span>
              <div><span className="eyebrow-label">{t('intimacyPartnerEyebrow')}</span><h3>{t('intimacyPartnerTitle')}</h3></div>
              <span className="partner-spark-glint" aria-hidden="true">✦</span>
            </div>
            <p className="partner-spark-description">{t('intimacyPartnerDescription')}</p>
            {!isShareOpen ? (
              <Button type="button" variant="contained" className="partner-spark-open" startIcon={<FiShare2 aria-hidden="true" />} onClick={() => { setIsShareOpen(true); setShareNotice('') }}>
                {t('intimacyPartnerCompose')}
              </Button>
            ) : (
              <div className="partner-share-editor">
                <label className="partner-message-label" htmlFor="partner-note">{t('intimacyPartnerMessageLabel')}</label>
                <textarea id="partner-note" rows={3} maxLength={500} value={partnerMessage} onChange={(event) => { setPartnerMessage(event.target.value); setShareNotice('') }} />
                <label className="partner-phone-label" htmlFor="partner-phone">{t('intimacyPartnerPhoneLabel')}<span>{t('optional')}</span></label>
                <input id="partner-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder={t('intimacyPartnerPhonePlaceholder')} value={partnerPhone} onChange={(event) => setPartnerPhone(event.target.value)} />
                <div className="partner-share-actions">
                  <Button type="button" variant="contained" startIcon={<FiShare2 aria-hidden="true" />} onClick={shareWithPartner} disabled={!partnerMessage.trim()}>
                    {t('intimacyPartnerShare')}
                  </Button>
                  <button type="button" className="partner-copy-button" onClick={copyMessage} disabled={!partnerMessage.trim()}><FiCopy aria-hidden="true" /> {t('intimacyPartnerCopy')}</button>
                </div>
                {shareNotice && <p className="partner-share-notice" role="status">{shareNotice}</p>}
                <small className="partner-share-privacy"><FiShield aria-hidden="true" /> {t('intimacyPartnerPrivacy')}</small>
              </div>
            )}
          </motion.section>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {saveNotice && <Alert severity="info">{saveNotice}</Alert>}
        {!session && (
          <div className="intimacy-signin-note">
            <FiShield aria-hidden="true" />
            <span>{t('intimacyGuestDataNote')}</span>
            <button type="button" onClick={signInToSave}>{t('intimacySignInToSave')}</button>
          </div>
        )}
        <Button type="submit" variant="contained" fullWidth disabled={isLoading || saveState === 'saving'} className="form-submit-button">
          {saveState === 'saving' ? t('savingPrivateReflection') : saveState === 'saved' ? t('intimacySaved') : saveState === 'preview' ? t('intimacyPreviewReady') : session ? t('saveIntimacy') : t('previewIntimacy')}
        </Button>
      </form>
    </div>
  )
}

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default Intimacy
