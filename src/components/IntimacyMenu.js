import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCheck, FiRefreshCw, FiSend } from 'react-icons/fi'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { useTranslation } from 'react-i18next'

import { INTIMACY_MOTION_TOKENS } from '../lib/intimacyMotion'

const INTIMACY_RITUAL_CATALOG = [
  {
    id: 'warm-shoulder-oil',
    signals: ['green', 'yellow', ''],
    vibes: ['tender', 'playful'],
    terms: ['romantic', 'sensual'],
    minComfort: 0,
    enTitle: 'Warm oil shoulder & back ritual',
    amTitle: 'በሞቀ ዘይት የትከሻ እና የጀርባ እሽት',
    enBody:
      'Ten slow, unhurried minutes with warmed oil across shoulders and upper back—zero expectations beyond warmth and breathing together.',
    amBody:
      'ምንም ጫና ሳይኖር ለአስር ደቂቃ በሞቀ ዘይት ትከሻና ጀርባን በረጋ መንፈስ ማሸት እና አብሮ መተንፈስ።',
  },
  {
    id: 'kitchen-slow-dance',
    signals: ['green', 'yellow', ''],
    vibes: ['playful', 'tender'],
    terms: ['romantic', 'spontaneous'],
    minComfort: 1,
    enTitle: 'One slow song in dim light—phones away',
    amTitle: 'ስልኮችን አስቀምጦ በለስላሳ ሙዚቃ አብሮ መደነስ',
    enBody:
      'Put phones in another room, dim the lights, and sway together through one favourite song from start to finish.',
    amBody:
      'ስልኮችን አርቆ በማስቀመጥ በደብዛዛ ብርሃን ውስጥ አንድ ተወዳጅ ሙዚቃ እስኪያልቅ ተቃቅፎ መደነስ።',
  },
  {
    id: 'whispered-desire-card',
    signals: ['green', ''],
    vibes: ['naughty', 'playful'],
    terms: ['sexual', 'spontaneous'],
    minComfort: 3,
    enTitle: 'Three-minute whispered chemistry check-in',
    amTitle: 'የሶስት ደቂቃ የፍላጎት እና የቅርበት ሹክሹክታ',
    enBody:
      'Take turns whispering one thing you want tonight and one boundary that helps you relax completely—then move only at her pace.',
    amBody:
      'ዛሬ ማታ የሚያስደስትሽን አንድ ነገር እና ምቾት የሚሰጥሽን ድንበር በሹክሹክታ ተነጋገሩ፤ ሁሉም ነገር በአንቺ ፍጥነት ይሁን።',
  },
  {
    id: 'velvet-touch-map',
    signals: ['green', ''],
    vibes: ['naughty', 'tender'],
    terms: ['sensual', 'sexual'],
    minComfort: 4,
    enTitle: 'Guided touch map—hands & neck first',
    amTitle: 'ከእጅ እና ከአንገት የሚጀምር የፍቅር ንክኪ',
    enBody:
      'Start slowly with collarbones, neck, and wrists for five full minutes, letting every step forward be guided explicitly by her cue.',
    amBody:
      'ለአምስት ደቂቃ ያህል ከእጅና ከአንገት ጀምሮ በረጋ ንክኪ መጀመር እና ቀጣዩን እርምጃ በሙሉ ፈቃድሽ መምራት።',
  },
  {
    id: 'tea-and-cuddle-cocoon',
    signals: ['red', 'yellow', ''],
    vibes: ['tender', 'playful', 'naughty'],
    terms: ['romantic', 'sensual'],
    minComfort: 0,
    enTitle: 'Warm tea, soft blanket & zero-pressure closeness',
    amTitle: 'ትኩስ ሻይ፣ ለስላሳ ብርድ ልብስ እና ጸጥ ያለ እቅፍ',
    enBody:
      'Rest in your softest blanket with herbal tea—quiet company, forehead kisses only if wanted, or peaceful solo sanctuary space.',
    amBody:
      'በለስላሳ ብርድ ልብስ እና በትኩስ ሻይ ዘና ማለት—ከፈለግሽ ብቻ ጸጥ ያለ እቅፍ ወይም ሙሉ የግል እረፍት።',
  },
  {
    id: 'self-sanctuary-bath',
    signals: ['red', 'yellow', 'green', ''],
    vibes: ['tender', 'playful', 'naughty'],
    terms: ['sensual', 'spontaneous'],
    minComfort: 0,
    enTitle: 'Candlelit solo exhale & body gratitude',
    amTitle: 'በሻማ ብርሃን የራስ እንክብካቤ እና እረፍት',
    enBody:
      'Warm shower or bath, favourite lotion on calves and shoulders, and deep belly breaths purely for your own comfort.',
    amBody:
      'በሞቀ ውሃ መታጠብ፣ ጥሩ መዓዛ ያለው ሎሽን መቀባት እና ለራስሽ ብቻ የሚሆን ጸጥ ያለ የእረፍት ጊዜ መውሰድ።',
  },
]

function itemTerms(item) {
  return Array.isArray(item.terms) ? item.terms : []
}

function selectContextualRituals({
  opennessSignal,
  comfortLevel = 0,
  vibe = 'tender',
  selectedTerms = [],
}) {
  const sig = opennessSignal || ''
  // Missing comfort (`0` = Skip) is treated as gentle baseline (`2`), never as level 5.
  const effectiveComfort = comfortLevel === 0 ? 2 : Math.max(1, Math.min(5, comfortLevel))
  const matched = INTIMACY_RITUAL_CATALOG.filter((item) => {
    const signalOk = item.signals.includes(sig)
    const comfortOk =
      sig === 'red' ? item.minComfort === 0 : item.minComfort <= effectiveComfort
    return signalOk && comfortOk
  })

  const prioritized = matched.sort((a, b) => {
    const aVibe = a.vibes[0] === vibe ? 3 : a.vibes.includes(vibe) ? 1.5 : 0
    const bVibe = b.vibes[0] === vibe ? 3 : b.vibes.includes(vibe) ? 1.5 : 0
    const aTerms = itemTerms(a).filter((tKey) => selectedTerms.includes(tKey)).length * 1.25
    const bTerms = itemTerms(b).filter((tKey) => selectedTerms.includes(tKey)).length * 1.25
    return bVibe + bTerms - (aVibe + aTerms)
  })

  return prioritized.length > 0 ? prioritized : INTIMACY_RITUAL_CATALOG.slice(-2)
}

const IntimacyMenu = ({
  opennessSignal,
  comfortLevel,
  vibe = 'tender',
  selectedTerms = [],
  triedIds = [],
  onMarkTried,
  onUseInComposer,
  reduceMotion = false,
}) => {
  const { t, i18n } = useTranslation()
  const locale = String(i18n.language || 'en').startsWith('am') ? 'am' : 'en'
  const [cursor, setCursor] = useState(0)

  const matchingRituals = useMemo(
    () =>
      selectContextualRituals({
        opennessSignal,
        comfortLevel,
        vibe,
        selectedTerms,
      }),
    [comfortLevel, opennessSignal, selectedTerms, vibe]
  )

  const currentIndex = matchingRituals.length ? cursor % matchingRituals.length : 0
  const current = matchingRituals.length ? matchingRituals[currentIndex] : null

  if (!current) return null

  const title = locale === 'am' ? current.amTitle : current.enTitle
  const body = locale === 'am' ? current.amBody : current.enBody
  const isTried = Array.isArray(triedIds)
    ? triedIds.includes(current.id)
    : Boolean(triedIds && triedIds[current.id])

  return (
    <motion.section
      className={`hc-intimacy-menu-card hc-menu-vibe-${vibe} hc-spotlight-card`}
      style={{ position: 'relative' }}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: INTIMACY_MOTION_TOKENS.ease }}
      data-testid="intimacy-ritual-menu"
    >
      <div className="hc-intimacy-menu-top">
        <span className="eyebrow-label">
          <AutoAwesomeRoundedIcon sx={{ fontSize: 14, mr: 0.6 }} />
          {t('intimacyMenu')}
        </span>

        <div className="hc-ritual-meta-right">
          <span className="hc-ritual-deck-count">
            {t('intimacyDeckCounter', {
              current: currentIndex + 1,
              total: matchingRituals.length,
            })}
          </span>
          <span className="hc-ritual-tag">
            {t(`intimacyVibe${vibe.charAt(0).toUpperCase()}${vibe.slice(1)}`)}
          </span>
          {selectedTerms.map((termKey) => (
            <span key={termKey} className={`hc-ritual-nuance-pill is-${termKey}`}>
              {t(termKey)}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current.id}-${opennessSignal || 'none'}`}
          className="hc-ritual-card-face"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{
            duration: INTIMACY_MOTION_TOKENS.crossfadeDuration,
            ease: INTIMACY_MOTION_TOKENS.ease,
          }}
        >
          <h3>{title}</h3>
          <p className="hc-ritual-body">{body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="hc-ritual-actions">
        {matchingRituals.length > 1 && (
          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            onClick={() => setCursor((prev) => prev + 1)}
          >
            <FiRefreshCw aria-hidden="true" />
            <span>{t('moodStageSpinPrompt')}</span>
          </button>
        )}

        <button
          type="button"
          className={`partner-copy-button hc-spotlight-btn${isTried ? ' is-tried' : ''}`}
          onClick={() => onMarkTried?.(current.id)}
        >
          <FiCheck aria-hidden="true" />
          <span>{isTried ? t('markTried') : t('tryIt')}</span>
        </button>

        {onUseInComposer && (
          <button
            type="button"
            className="partner-copy-button hc-spotlight-btn"
            onClick={() => onUseInComposer(`${title} — ${body}`)}
          >
            <FiSend aria-hidden="true" />
            <span>{t('moodStageCopyToComposer')}</span>
          </button>
        )}
      </div>
    </motion.section>
  )
}

export default IntimacyMenu
