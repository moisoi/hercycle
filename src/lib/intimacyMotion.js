import { useEffect, useState } from 'react'

import { loadPreferences } from './care'

/**
 * Shared soft-botanical motion tokens, single-source coordination helpers,
 * live reduced-motion subscription, and readiness/comfort precedence logic
 * for the five Intimacy cards.
 *
 * Design principles:
 * - Genuine user state (`signal`, `comfort`, `desire`, `desireVibe`, `selectedTerms`)
 *   is strictly separated from transient decorative motion state (`activeEffect`).
 * - Readiness (`signal`) always takes precedence over `desire` heat and `desireVibe`.
 * - Missing/skipped comfort (`comfort === 0`) is treated as a gentle baseline (`2`),
 *   never as maximum comfort (`5`).
 * - Skipped desire (`desire === null`) is distinctly unrated, never coerced to `0`.
 * - Only the actively interacted control receives primary decorative motion; rapid
 *   selections replace the active effect via monotonic `seq` instead of stacking.
 */

export const INTIMACY_MOTION_TOKENS = Object.freeze({
  ease: [0.22, 1, 0.36, 1],
  pressScale: 0.985,
  pressDuration: 0.12,
  crossfadeDuration: 0.24,
  auraDuration: 0.62,
  moteDuration: 0.86,
  butterflyDuration: 1.08,
  shuffleLoadMs: 220,
  maxParticles: 4,
})

const MOOD_PARTICLE_PATHS = {
  tender: [
    { id: 't1', startX: -12, startY: 8, dx: -18, dy: -22, rot: -18, kind: 'petal' },
    { id: 't2', startX: 14, startY: 10, dx: 20, dy: -20, rot: 22, kind: 'petal' },
    { id: 't3', startX: -6, startY: -6, dx: -10, dy: -26, rot: 14, kind: 'mote' },
    { id: 't4', startX: 18, startY: -4, dx: 14, dy: -24, rot: -12, kind: 'mote' },
  ],
  playful: [
    { id: 'p1', startX: -16, startY: 6, dx: -14, dy: -26, curveX: -22, rot: -15, kind: 'mote' },
    { id: 'p2', startX: 12, startY: 8, dx: 22, dy: -24, curveX: 28, rot: 18, kind: 'mote' },
    { id: 'p3', startX: -4, startY: -8, dx: 8, dy: -28, curveX: -10, rot: 12, kind: 'petal' },
    { id: 'p4', startX: 20, startY: 2, dx: 16, dy: -20, curveX: 24, rot: -10, kind: 'mote' },
  ],
  naughty: [
    { id: 'n1', startX: -14, startY: 8, dx: -15, dy: -22, rot: -12, kind: 'mote' },
    { id: 'n2', startX: 15, startY: 8, dx: 17, dy: -22, rot: 15, kind: 'mote' },
    { id: 'n3', startX: -5, startY: -6, dx: -8, dy: -25, rot: 9, kind: 'petal' },
    { id: 'n4', startX: 9, startY: -6, dx: 12, dy: -24, rot: -11, kind: 'mote' },
  ],
}

export function prefersSystemReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

export function readEffectiveReducedMotion() {
  const domReduced =
    typeof document !== 'undefined' &&
    document.documentElement?.getAttribute('data-reduce-motion') === 'true'
  return Boolean(loadPreferences().reduceMotion || prefersSystemReducedMotion() || domReduced)
}

/**
 * Live hook combining OS `prefers-reduced-motion: reduce` and HerCycle's
 * in-app `reduceMotion` preference without polling.
 */
export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(() => readEffectiveReducedMotion())

  useEffect(() => {
    const sync = () => setReduced(readEffectiveReducedMotion())
    sync()

    const mql =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null

    window.addEventListener('hercycle:preferences-changed', sync)
    mql?.addEventListener?.('change', sync)
    return () => {
      window.removeEventListener('hercycle:preferences-changed', sync)
      mql?.removeEventListener?.('change', sync)
    }
  }, [])

  return reduced
}

/**
 * Art direction descriptor for the three expressive mood sub-cards.
 * Comparable timing & particle cap across all three; differentiated strictly
 * through motion character:
 * - `tender`: warm muted rose glow + slow drifting petal details
 * - `playful`: curved golden mote paths + occasional single delicate butterfly
 * - `naughty`: richer berry tones + restrained luminous edge (zero flames/flashing)
 */
export function getMoodSelectionArtDirection(vibe = 'tender', playfulVisitCount = 1) {
  const safeVibe = MOOD_PARTICLE_PATHS[vibe] ? vibe : 'tender'
  const visitNumber = Math.max(1, Number(playfulVisitCount) || 1)
  return {
    vibe: safeVibe,
    auraDuration: INTIMACY_MOTION_TOKENS.auraDuration,
    moteDuration: INTIMACY_MOTION_TOKENS.moteDuration,
    particles: MOOD_PARTICLE_PATHS[safeVibe].slice(0, INTIMACY_MOTION_TOKENS.maxParticles),
    hasButterfly: safeVibe === 'playful' && visitNumber % 2 === 1,
    hasLuminousEdge: safeVibe === 'naughty',
  }
}

/**
 * Computes pointer percentage origin inside a card element, defaulting cleanly
 * to `{ xPct: 50, yPct: 50 }` for keyboard activation (`Enter` / `Space` / arrows).
 */
export function resolveAuraOrigin(event) {
  if (!event || event.detail === 0) {
    return { xPct: 50, yPct: 50 }
  }
  const target = event.currentTarget
  if (!target || typeof target.getBoundingClientRect !== 'function') {
    return { xPct: 50, yPct: 50 }
  }
  const rect = target.getBoundingClientRect()
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return { xPct: 50, yPct: 50 }
  }
  if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
    return { xPct: 50, yPct: 50 }
  }
  const rawX = ((event.clientX - rect.left) / rect.width) * 100
  const rawY = ((event.clientY - rect.top) / rect.height) * 100
  return {
    xPct: Math.max(8, Math.min(92, Math.round(rawX))),
    yPct: Math.max(8, Math.min(92, Math.round(rawY))),
  }
}

/**
 * Produces the next single coordinated decorative effect, cleanly replacing any
 * prior in-flight effect without stacking. Returns `null` under reduced motion.
 */
export function nextCoordinatedEffect(previousEffect, source, payload = {}, reducedMotion = false) {
  if (reducedMotion) return null
  const nextSeq = (previousEffect?.seq || 0) + 1
  return {
    seq: nextSeq,
    source,
    ...payload,
  }
}

/**
 * Derives desire heat presentation without conflating `null` (Skipped / Unrated)
 * with `0` (Explicit 0/10 rating).
 */
export function describeDesireState(desire) {
  if (desire === null || desire === undefined || Number.isNaN(Number(desire))) {
    return {
      isUnrated: true,
      numericValue: null,
      fillPct: 0,
      glowAlpha: 0.03,
    }
  }
  const clamped = Math.max(0, Math.min(10, Math.round(Number(desire))))
  return {
    isUnrated: false,
    numericValue: clamped,
    fillPct: clamped * 10,
    glowAlpha: Number((0.04 + (clamped / 10) * 0.14).toFixed(3)),
  }
}

const MOOD_SPARK_POOLS = {
  tender: {
    en: [
      'Tonight’s spark: dim the lights, rest foreheads together for three slow breaths, and share one thing you appreciate about their warmth.',
      'Tonight’s spark: ask to be held quietly for ten unhurried minutes with zero expectation of rushing further.',
      'Tonight’s spark: warm oil across shoulders and collarbones—slow, attentive, and completely at your pace.',
    ],
    am: [
      'የዛሬ ሐሳብ፦ መብራቱን ቀንሳችሁ ለሦስት ጥልቅ ትንፋሽ ግንባር ለግንባር ተነካክታችሁ ቁሙ።',
      'የዛሬ ሐሳብ፦ ያለ ምንም ቸኮላ ለአሥር ደቂቃ በሙቀት ተቃቅፎ መቆየት።',
      'የዛሬ ሐሳብ፦ በሞቀ ቅባት አንገትና ትከሻን በዝግታና በእርጋታ ማሸት።',
    ],
  },
  playful: {
    en: [
      'Tonight’s spark: send a lighthearted two-choice invitation—slow shoulder massage at nine or one favourite song in dim light.',
      'Tonight’s spark: put phones in another room for fifteen minutes and trade one playful compliment each.',
      'Tonight’s spark: five unhurried minutes of cheek and collarbone kisses where laughter and pause are equally welcome.',
    ],
    am: [
      'የዛሬ ሐሳብ፦ ሁለት ቀላል ምርጫዎችን ላኪለት—ዘገምተኛ ማሳጅ ወይስ በደብዛዛ ብርሃን አንድ ሙዚቃ አብሮ መደነስ።',
      'የዛሬ ሐሳብ፦ ለአሥራ አምስት ደቂቃ ስልኮችን አርቃችሁ ጣፋጭ ጨዋታ ተጫወቱ።',
      'የዛሬ ሐሳብ፦ ለ5 ደቂቃ ያለ መቸኮል በጨዋታና በፍቅር ስሜትን ማሟሟቅ።',
    ],
  },
  naughty: {
    en: [
      'Tonight’s spark: share the exact pace you want tonight—slow hands first, clear check-ins, and unhurried attention.',
      'Tonight’s spark: whisper the spot on your neck or shoulders where you want their touch to linger first.',
      'Tonight’s spark: eyes-closed touch check-in—three unhurried minutes guided entirely by your voice.',
    ],
    am: [
      'የዛሬ ሐሳብ፦ ዛሬ ማታ የሚያስደስትሽን ትክክለኛ ፍጥነትና ንክኪ በግልጽ ንገሪው—ቀስ ብለህ በትኩረት ጀምር።',
      'የዛሬ ሐሳብ፦ በጣም የሚያስደስትሽን የአንገት ወይም የትከሻ ንክኪ በሹክሹክታ ንገሪው።',
      'የዛሬ ሐሳብ፦ ዓይንን ጨፍኖ በንክኪ ብቻ የሚደረግ የ3 ደቂቃ ቅርበት—ሙሉ መሪዋ አንቺው ነሽ።',
    ],
  },
}

const DIRECTION_ADDONS = {
  en: {
    romantic: 'Light a candle, set phones aside, and keep tonight unhurried.',
    sensual: 'Start slowly with neck and shoulder warmth—zero rush.',
    sexual: 'Feeling drawn close tonight—stay attentive to my pace throughout.',
    spontaneous: 'Surprise me with a quiet moment together as soon as we unwind.',
  },
  am: {
    romantic: 'ሻማ አብርተን ስልኮቻችንን አርቀን የረጋ የፍቅር ምሽት እናሳልፍ።',
    sensual: 'ከአንገቴና ከትከሻዬ ጀምሮ ቀስ ብለህ በለስላሳ ንክኪ ጀምር።',
    sexual: 'ዛሬ ማታ የቅርበት ፍላጎት አለኝ—ሁሉም ነገር ግን በእኔ ፍጥነት ይሁን።',
    spontaneous: 'እንደተገናኘን ጸጥ ያለ የፍቅር ጊዜ በማዘጋጀት አስደንቀኝ።',
  },
}

const GENTLE_DIRECTION_ADDONS = {
  en: {
    romantic: 'Keep it soft—warm words, quiet company, and zero pressure.',
    sensual: 'Light hand-holding or a warm blanket together, only as comfortable.',
    sexual: 'Keep things gentle and check in before any next step.',
    spontaneous: 'A warm cup of tea and ten unhurried minutes together—zero rush.',
  },
  am: {
    romantic: 'በደግ ቃላትና በጸጥታ አብሮ በመሆን ያለ ጫና እናሳልፍ።',
    sensual: 'እጅ ለእጅ መያያዝ ወይም በሞቀ ብርድ ልብስ መቀመጥ—በምቾትሽ መጠን ብቻ።',
    sexual: 'ሁሉም ነገር በዝግታና በፈቃድ መጠየቅ ይመራ።',
    spontaneous: 'ትኩስ ሻይ እና አሥር የረጋ ደቂቃዎች አብሮ ማሳለፍ—ምንም ጥድፊያ የለም።',
  },
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

/**
 * Resolves stage spark prompt, partner note suggestion, and Luna handoff message
 * while strictly enforcing:
 *   Readiness (`signal`) > Comfort (`0` = unrated gentle baseline, `1..5`) > Mood & Direction.
 */
export function deriveIntimacySuggestionContext({
  signal = 'green',
  comfort = 0,
  desire = null,
  desireVibe = 'tender',
  selectedTerms = [],
  promptCursor = 0,
  locale = 'en',
  t,
}) {
  const safeLocale = locale === 'am' ? 'am' : 'en'
  const safeVibe = MOOD_SPARK_POOLS[desireVibe] ? desireVibe : 'tender'
  const idx = Math.abs(Number(promptCursor) || 0) % 3
  // Missing comfort (`0` = Skip) is treated as gentle baseline (`2`), NEVER max comfort (`5`).
  const effectiveComfort = comfort === 0 ? 2 : Math.max(1, Math.min(5, Number(comfort) || 2))
  const safeTerms = Array.isArray(selectedTerms) ? selectedTerms : []

  // 1. "Not today, and that is okay" (`red`) ALWAYS overrides heat & mood completely.
  if (signal === 'red') {
    const stagePrompt = t(`compassBoundarySpark_${idx}`)
    const suggestedPartnerNote = t('intimacyNoteRedBoundary')
    const lunaPrompt =
      safeLocale === 'am'
        ? 'ዛሬ ማታ ለቅርበት “ዛሬ አይደለም” የሚል ድንበር መርጫለሁ። ለራሴ እረፍት የሚሆን ወይም ለፍቅረኛዬ በደግነት የምልከው አጭር የድንበር መልእክት ንገሪኝ።'
        : 'I chose “Not today” for intimacy tonight. Share a calm solo rest idea or a kind, pressure-free boundary note I can keep in mind.'
    return {
      stagePrompt,
      suggestedPartnerNote,
      lunaPrompt,
      effectiveComfort,
      isBoundaryActive: true,
    }
  }

  // 2. "Maybe, with gentleness" (`yellow`) OR low/skipped comfort (`<= 2`) stays gentle & non-escalating.
  if (signal === 'yellow' || effectiveComfort <= 2) {
    const stagePrompt = t(`compassGentleSpark_${idx}`)
    const baseNote =
      signal === 'yellow' ? t('intimacyNoteYellowSlow') : t('intimacyNoteTender')
    const gentleAddons = GENTLE_DIRECTION_ADDONS[safeLocale] || GENTLE_DIRECTION_ADDONS.en
    const gentlePicked = safeTerms
      .map((key) => gentleAddons[key])
      .filter(Boolean)
      .slice(-2)
    const suggestedPartnerNote = gentlePicked.length
      ? `${baseNote} ${gentlePicked.join(' ')}`
      : baseNote
    const comfortDesc = comfort === 0 ? 'unrated' : `${comfort}/5`
    const lunaPrompt =
      safeLocale === 'am'
        ? `ዛሬ ማታ በረጋና ያልተቻኮለ ስሜት ላይ ነኝ (ምቾት ${comfortDesc})። ያለ ምንም ጫና ቅርበትን የሚያጠናክር ለስላሳ ሐሳብ ንገሪኝ።`
        : `I'm feeling open to slow, gentle closeness tonight (comfort: ${comfortDesc}). Share a calm, low-pressure way to connect or express my pace clearly.`
    return {
      stagePrompt,
      suggestedPartnerNote,
      lunaPrompt,
      effectiveComfort,
      isBoundaryActive: false,
    }
  }

  // 3. `green` readiness with comfort >= 3: mood & message directions shape prompts within comfort bounds.
  const pool = MOOD_SPARK_POOLS[safeVibe][safeLocale]
  const stagePrompt = pool[idx % pool.length]
  const baseNote = t(`intimacyNote${cap(safeVibe)}`)
  const dict =
    effectiveComfort === 3
      ? GENTLE_DIRECTION_ADDONS[safeLocale] || GENTLE_DIRECTION_ADDONS.en
      : DIRECTION_ADDONS[safeLocale] || DIRECTION_ADDONS.en
  const activeAddons = safeTerms
    .map((key) => dict[key])
    .filter(Boolean)
    .slice(-2)
  const suggestedPartnerNote = activeAddons.length
    ? `${baseNote} ${activeAddons.join(' ')}`
    : baseNote
  const desireDesc =
    desire === null || desire === undefined ? 'unrated' : `${Math.round(Number(desire))}/10`
  const lunaPrompt =
    safeLocale === 'am'
      ? `ዛሬ ማታ በ${t(`intimacyVibe${cap(safeVibe)}`)} ስሜት (ምቾት ${comfort}/5) ላይ ነኝ—ከምቾቴ ጋር የሚሄድ ጣፋጭ የቅርበት ሐሳብ ወይም መልእክት ንገሪኝ።`
      : `I'm exploring a ${safeVibe} mood tonight (openness: open, comfort: ${comfort}/5, warmth: ${desireDesc}). Suggest a thoughtful closeness idea or partner note within my pace.`

  return {
    stagePrompt,
    suggestedPartnerNote,
    lunaPrompt,
    effectiveComfort,
    isBoundaryActive: false,
  }
}
