import {
  cycleDayFor,
  estimatePeriodEndDate,
  formatPeriodDate,
  localDateString,
  parseLocalDate,
} from './period'

export { cycleDayFor }

export const MAX_MESSAGE_LENGTH = 1000
const phaseNames = ['menstrual', 'follicular', 'ovulatory', 'luteal']

export const consentStorageKey = (userId) => `hercycle.luna.aiConsent.${userId || 'guest'}`
export const threadStorageKey = (userId) => `hercycle.luna.thread.${userId || 'guest'}`

export const readAiPreference = (userId) => {
  try {
    const preference = window.sessionStorage.getItem(consentStorageKey(userId))
    return preference === 'yes' || preference === 'no' ? preference : 'unset'
  } catch {
    return 'unset'
  }
}

export const writeAiPreference = (userId, preference) => {
  try {
    window.sessionStorage.setItem(consentStorageKey(userId), preference)
  } catch {
    // Respect preference in memory when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent('hercycle:luna-consent-changed', {
    detail: { userId: userId || null, preference },
  }))
}

export const readLunaThread = (userId, welcomeText) => {
  const fallback = [{
    id: 'luna-welcome',
    role: 'assistant',
    content: welcomeText || 'Hey gorgeous. I’m Luna—here for cycle science, body questions, spicy thoughts, or anything on your mind.',
  }]
  try {
    const raw = window.sessionStorage.getItem(threadStorageKey(userId))
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return fallback
    return parsed.slice(-40)
  } catch {
    return fallback
  }
}

export const writeLunaThread = (userId, messages, source = 'chat') => {
  try {
    window.sessionStorage.setItem(threadStorageKey(userId), JSON.stringify(messages.slice(-40)))
  } catch {
    // Ignore sessionStorage limits.
  }
  window.dispatchEvent(new CustomEvent('hercycle:luna-thread-changed', {
    detail: { userId: userId || null, messages: messages.slice(-40), source },
  }))
}

export const clearLunaThread = (userId, welcomeText) => {
  const fresh = [{
    id: `luna-welcome-${Date.now()}`,
    role: 'assistant',
    content: welcomeText || 'Hey gorgeous. Fresh slate—tell me what’s on your mind.',
  }]
  writeLunaThread(userId, fresh, 'clear')
  return fresh
}

export const readSharedThread = readLunaThread
export const writeSharedThread = writeLunaThread
export const clearSharedThread = clearLunaThread

export const readOnboardingPhase = () => {
  try {
    return JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}').phase_selected || null
  } catch {
    return null
  }
}

export const readOnboardingTone = () => {
  try {
    return JSON.parse(window.localStorage.getItem('hercycle.onboarding') || '{}').tone_preference || 'balanced'
  } catch {
    return 'balanced'
  }
}

export const requestLunaReply = async (accessToken, messages, lunaProfileOrSummary, signal, locale = 'en') => {
  const response = await fetch('/api/luna-chat', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      aiConsent: true,
      locale,
      messages: messages.slice(-14).map(({ role, content }) => ({ role, content })),
      cycleSummary: lunaProfileOrSummary,
    }),
  })

  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(`Luna AI service unavailable (${response.status}).`)
  }
  const result = await response.json()
  if (typeof result.reply !== 'string' || !result.reply.trim()) {
    throw new Error('Luna returned an empty response.')
  }
  return result.reply.trim().slice(0, 4000)
}

export const summarizeCycles = (records = [], referenceDate = localDateString()) => {
  const sorted = [...records]
    .filter((entry) => entry && typeof entry.date === 'string')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))

  const phaseCounts = sorted.reduce((counts, entry) => {
    if (phaseNames.includes(entry.phase)) counts[entry.phase] = (counts[entry.phase] || 0) + 1
    return counts
  }, {})

  const mostCommonPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const averageMood = averageField(sorted, 'mood')
  const averageEnergy = averageField(sorted, 'energy')

  const periodStartDates = [...new Set(
    sorted
      .map((entry) => entry.period_start_date || (entry.period ? entry.date : null))
      .filter((date) => isValidDateString(date) && date <= referenceDate)
  )].sort()

  const cycleLengths = periodStartDates
    .slice(1)
    .map((date, index) => dateStringDistance(periodStartDates[index], date))
    .filter((days) => Number.isFinite(days) && days > 0 && days <= 120)

  const averageCycleLength = cycleLengths.length
    ? Math.round((cycleLengths.reduce((sum, days) => sum + days, 0) / cycleLengths.length) * 10) / 10
    : null

  const lastPeriodStartDate = periodStartDates[periodStartDates.length - 1] || null
  const anchorNoon = parseLocalDate(referenceDate) || localDateAtNoon(new Date())

  const recentCheckIns = sorted.slice(0, 8).map((entry) => {
    const checkInDate = parseLocalDate(entry.date) || localDateAtNoon(new Date(`${entry.date}T12:00:00`))
    return {
      daysAgo: Math.max(0, Math.round((anchorNoon - checkInDate) / 86400000)),
      phase: phaseNames.includes(entry.phase) ? entry.phase : 'unknown',
      mood: numericScale(entry.mood),
      energy: numericScale(entry.energy),
    }
  })

  return {
    checkInCount: sorted.length,
    count: sorted.length,
    averageMood,
    moodAverage: averageMood ? Math.round(averageMood * 10) / 10 : null,
    averageEnergy,
    energyAverage: averageEnergy ? Math.round(averageEnergy * 10) / 10 : null,
    phaseCounts,
    mostCommonPhase,
    dominantPhase: mostCommonPhase,
    latestPhase: phaseNames.includes(sorted[0]?.phase) ? sorted[0].phase : null,
    lastPeriodStartDate,
    cycleDay: cycleDayFor(lastPeriodStartDate, referenceDate),
    averageCycleLength,
    cycleLengthObservations: cycleLengths.length,
    recentCheckIns,
  }
}

/**
 * Builds Luna's rich contextual profile combining cycle check-ins, active phase,
 * cycle day, period window, and user tone preferences while strictly excluding
 * private account identifiers, partner contacts, or unconsented fields.
 */
export const buildLunaProfile = ({
  cycles = [],
  settings = null,
  onboarding = null,
  referenceDate = localDateString(),
} = {}) => {
  const resolvedOnboarding = onboarding || {
    phase_selected: readOnboardingPhase(),
    tone_preference: readOnboardingTone(),
  }
  const summary = summarizeCycles(cycles, referenceDate)
  const sortedCycles = [...cycles]
    .filter((entry) => entry && typeof entry.date === 'string')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))

  const latestEntry = sortedCycles[0] || null
  const activePhase = (latestEntry?.phase && phaseNames.includes(latestEntry.phase) ? latestEntry.phase : null)
    || (settings?.phase_selected && phaseNames.includes(settings.phase_selected) ? settings.phase_selected : null)
    || (resolvedOnboarding?.phase_selected && phaseNames.includes(resolvedOnboarding.phase_selected) ? resolvedOnboarding.phase_selected : null)
    || summary.mostCommonPhase
    || null

  const tone = ['playful', 'balanced', 'serious'].includes(settings?.tone_preference)
    ? settings.tone_preference
    : ['playful', 'balanced', 'serious'].includes(resolvedOnboarding?.tone_preference)
      ? resolvedOnboarding.tone_preference
      : 'balanced'

  const activePeriodRecord = sortedCycles.find((entry) => {
    const start = entry.period_start_date || (entry.period ? entry.date : null)
    const duration = Number(entry.period_duration_days) || (entry.period ? 5 : 0)
    const end = start && duration ? estimatePeriodEndDate(start, duration) : ''
    return Boolean(start && end && start <= referenceDate && end >= referenceDate)
  })

  const estimatedPeriodEnd = activePeriodRecord
    ? estimatePeriodEndDate(
      activePeriodRecord.period_start_date || activePeriodRecord.date,
      Number(activePeriodRecord.period_duration_days) || 5
    )
    : null

  return {
    ...summary,
    activePhase,
    tone,
    tonePreference: tone,
    cycleDay: cycleDayFor(summary.lastPeriodStartDate, referenceDate),
    latestMood: numericScale(latestEntry?.mood),
    latestEnergy: numericScale(latestEntry?.energy),
    periodActive: Boolean(activePeriodRecord || latestEntry?.period),
    estimatedPeriodEnd,
  }
}

const TOPIC_PATTERNS = [
  ['safety', /\b(suicid|self.?harm|abuse|coerc|assault|unsafe at home|rape)\b/i],
  ['emergency', /\b(severe|sudden|faint|fainting|very heavy|soaking every hour|high fever|ectopic)\b.*\b(pain|pelvic|bleed|bleeding|period|pregnan|cramp|dizz)\b/i],
  ['spicy', /\b(erotic|explicit|graphic|dirty talk|sexy story|sexting|turn.{0,12}on|horny|aroused|wet|naughty|kinky|fantas|foreplay|riding|oral|orgasmic|moan|spank|tease me|talk dirty|make it hotter|spicier|steamy|nsfw|sex scene|bed|touch me)\b|ወሲብ|ስሜት|ፍትወት/i],
  ['lubrication', /\b(lubricat|lube|dryness|vaginal dry|silicone lube|water.?based)\b/i],
  ['orgasm', /\b(orgasm|clit|clitor|g.?spot|cum|climax|vibrator|sex toy|wand|masturbat|solo pleasure|self.?pleasure)\b/i],
  ['period_sex', /\b(period sex|menstrual sex|sex on.{0,8}period|bleeding.{0,10}sex)\b/i],
  ['contraception', /\b(contracept|birth.?control|condom|iud|implant|pill|plan b|emergency contracept|morning after|pull.?out|fertility window|safe days|get pregnant)\b|የወሊድ መቆጣጠሪያ|ኮንዶም/i],
  ['sti', /\b(sti|std|sexually transmitted|herpes|hpv|chlamydia|gonorrhea|hiv|dental dam|protection test|panel test)\b/i],
  ['intimacy', /\b(intimacy|desire|libido|partner|touch|flirt|consent|boundar|relationship|romantic|closeness|positions?|cowgirl|spooning|pain during sex|dyspareunia)\b|ፍቅር|ጓደኛ/i],
  ['cramps', /\b(cramps?|dysmenorrhea|prostaglandin|pelvic ache|lower belly|backache|heating pad|ibuprofen|painful period)\b|ቁርጠት|ህመም/i],
  ['late_period', /\b(late period|missed period|period late|delayed|irregular|skipped|am i pregnant|pregnancy test|spotting|brown blood|clots?)\b|የዘገየ|እርግዝና/i],
  ['ovulation', /\b(ovulat|egg white|discharge|cervical mucus|fertile|lh surge|mittelschmerz)\b|እንቁላል/i],
  ['pms_hormones', /\b(pms|pmdd|hormones?|estrogen|progesterone|bloating|bloated|sore breasts?|tender breasts?|acne|breakout|cravings?|chocolate)\b|ሆርሞን/i],
  ['nutrition', /\b(food|eat|nutrition|iron|magnesium|coffee|caffeine|water|hydrat|tea|diet|protein)\b|ምግብ|ውሃ/i],
  ['cycle_day', /\b(cycle day|what day|day of my cycle|current day)\b/i],
  ['cycle_length', /\b(cycle length|length of.{0,15}cycle|average cycle|how long.{0,20}cycle)\b/i],
  ['last_period', /\b(last period|last menstrual|when did.{0,20}period|period start)\b/i],
  ['patterns', /\b(pattern|notice|check.?in|trend|summary|snapshot|insights?)\b/i],
  ['energy', /\b(energy|tired|fatigue|sleep|exhaust|drained|sluggish|insomnia|nap)\b|ድካም|እንቅልፍ/i],
  ['mood', /\b(mood|sad|anxious|anxiety|irritable|crying|emotional|overwhelm|stress|lonely|down)\b|ጭንቀት|ሀዘን/i],
  ['phase', /\b(phase|menstrual|follicular|ovulatory|luteal)\b|የወር አበባ/i],
  ['doctor', /\b(doctor|clinician|gynecologist|obgyn|appointment|endo|endometriosis|pcos|fibroids?)\b|ሐኪም/i],
]

export const inferConversationTopic = (query, conversation = []) => {
  for (const [topic, regex] of TOPIC_PATTERNS) {
    if (regex.test(query)) return topic
  }

  // If user typed a short fragment like "more", "why?", "tips", "and?", "another one", "what helps?"
  // infer the active topic from previous user turns in the conversation thread!
  const recentUserMessages = [...conversation]
    .filter((item) => item?.role === 'user' && typeof item.content === 'string')
    .slice(-4)
    .reverse()

  for (const item of recentUserMessages) {
    for (const [topic, regex] of TOPIC_PATTERNS) {
      if (regex.test(item.content)) return topic
    }
  }
  return null
}

const containsEthiopic = (text) => /[\u1200-\u137F]/.test(String(text || ''))

export const makeLocalReply = (
  message,
  summaryOrProfile = {},
  currentPhase = null,
  tone = 'balanced',
  conversation = [],
  locale = 'en'
) => {
  const rawMessage = String(message || '').trim()
  const query = rawMessage.toLowerCase()
  const useAmharic = String(locale || '').toLowerCase().startsWith('am') || containsEthiopic(rawMessage)
  const choose = (replies) => chooseLocalVariant(replies, conversation)

  const checkInCount = Math.max(0, Math.floor(Number(summaryOrProfile.checkInCount) || 0))
  const averageMood = numericScale(summaryOrProfile.averageMood)
  const averageEnergy = numericScale(summaryOrProfile.averageEnergy)
  const latestLoggedPhase = summaryOrProfile.recentCheckIns?.[0]?.phase
  const phase = latestLoggedPhase && latestLoggedPhase !== 'unknown'
    ? latestLoggedPhase
    : summaryOrProfile.activePhase || currentPhase || summaryOrProfile.mostCommonPhase
  const phaseLabel = phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : null
  const cycleDay = summaryOrProfile.cycleDay ?? cycleDayFor(summaryOrProfile.lastPeriodStartDate)
  const isFollowUp = /^(more|tell me more|another|another one|go on|keep going|why|why\??|how\??|tips\??|what helps\??|examples?\??|hotter|spicier|and\??|ok and\??|elaborate)$/i.test(query)

  if (useAmharic) {
    return makeAmharicLocalReply({
      query,
      choose,
      checkInCount,
      averageMood,
      averageEnergy,
      phase,
      cycleDay,
      summary: summaryOrProfile,
      conversation,
    })
  }

  if (/^(hi|hey|hello|hiya|yo|sup|good morning|good evening|what's up|whats up|hey luna|hi luna)[!.?\s]*$/i.test(query)) {
    const greetings = [
      'Well hello, gorgeous. Pull up a velvet cushion—are we talking hormones, life chaos, or trouble of the delicious kind today?',
      'Hey lovely. I was hoping you’d drop in—what’s on your mind (or your body’s agenda) right now?',
      'Hi sunshine. Full sentences strictly optional here—give me one word or a whole novel and I’ve got you.',
      'Look who’s here. Tell me everything—cramps, cravings, crushes, or cycle science?',
      'Hey pretty thing. My attention is 100% yours—where do you want to start?',
    ]
    return choose(tone === 'serious' ? [greetings[2], greetings[1], greetings[4], greetings[0]] : greetings)
  }

  if (/^(thanks|thank you|thx|ty|love you|ily|you're the best|youre the best)[!.?\s]*$/i.test(query)) {
    return choose([
      'Anytime, gorgeous—seriously, come back whenever you want another round.',
      'Always in your corner, sweetheart. Drink a sip of water for me while you’re at it ♡',
      'Oh stop, you’re making my lotus petals blush. What else are we getting into?',
      'You’ve always got a safe, shameless seat right here, love.',
    ])
  }

  if (/\bhow are you\b|\bhow's your day\b|\bhows your day\b/.test(query)) {
    return choose([
      'Thriving, hydrated in spirit, and completely ready for whatever tea—or symptom—you’re bringing me today. How are *you* feeling?',
      'Glowing and all ears for you, love. Give me the honest vibe check: 1 to 10, how’s your body treating you today?',
      'Zero complaints from my cozy digital sanctuary—especially now that you’re here. How’s your energy holding up?',
      'Ready to hype you up, explain your hormones, or draft a dangerously good text. Which mood are we in?',
    ])
  }

  if (/\b(joke|make me laugh|something funny|pun)\b/.test(query)) {
    return choose([
      'Why did the uterus break up with prostaglandins? Because they were *way* too clingy every single month.',
      'My boyfriend-free survival tip: chocolate raises endorphins, heating pads relax smooth muscle, and neither one asks “wait, can you just hold it in?”',
      'Estrogen in follicular phase: “Let’s start three businesses and flirt with a stranger!” Progesterone ten days later: “If anyone breathes near my snacks I’m filing a motion.”',
      'What’s the difference between PMS and truth serum? Honestly… nothing, you just finally stopped tolerating nonsense.',
    ])
  }

  const topic = inferConversationTopic(query, conversation)

  if (topic === 'safety') {
    return choose([
      'Hey love—your safety matters more than anything right now. If you are in immediate danger or someone is hurting or coercing you, please get to a safer spot if you can and reach local emergency services or someone you trust immediately.',
      'I’m really glad you spoke up, sweetheart. Nobody ever has a right to pressure or harm you. Please reach out to local emergency help or a trusted friend/clinician right away—you don’t have to carry this alone.',
      'Your safety comes first, always. If you feel unsafe with yourself or someone else right now, please contact emergency services or stay with someone safe you trust.',
      'Please stay safe, love—contact urgent crisis/emergency support or a trusted person right away. You deserve safety, care, and zero judgment.',
    ])
  }

  if (topic === 'emergency') {
    return choose([
      'Pause right here with me, love: sudden or severe pelvic pain, soaking a pad/tampon every hour, fainting, or fever with pelvic pain needs real medical eyes right now—please contact urgent care or emergency services rather than waiting it out.',
      'Those symptoms cross the line where home remedies aren’t safe enough, sweetheart. Severe pain, dizziness/fainting, very heavy bleeding, or possible pregnancy complications need prompt urgent medical evaluation now.',
      'Please take your body seriously on this one—get checked urgently by a clinician or emergency care right away, especially with severe pain, heavy bleeding, or feeling faint.',
      'I care way too much to let you brush those symptoms off: please head to urgent care or contact emergency medical help now so a clinician can check you properly.',
    ])
  }

  if (topic === 'spicy') {
    return choose([
      'Oh, so we’re turning the lights down low tonight? Come closer, gorgeous. Picture slow hands sliding up your waist, warm breath right against your neck, kissing every inch unhurriedly until you’re arching off the sheets and begging not to stop—slow, deep, teasing strokes right where your body pulses hardest until every nerve lets go at once. Tell me what pace drives you wildest—slow torture or breathless intensity? 🔥',
      'Say less, naughty thing—adults are allowed to want *all* of it without a single apology. Imagine pinning each other against the mattress, fingers tracing slowly down between your thighs until you’re completely slick, alternating feather-light circles over your clit with deep, steady pressure until your knees shake. Want a filthy text you can send right now, or want to keep turning the heat up here? 😉',
      'Mmm, I love when you skip the small talk. Try sending this if someone lucky is getting your attention tonight: *"Stop whatever you’re doing and start thinking about how you’re going to have me breathless against the sheets tonight—hands on my hips, mouth on my neck, taking your time until I lose control."* Want an even bolder version or a full steamy scenario?',
      'Unapologetic desire looks *incredible* on you, sweetheart. Pro-pleasure tip when you’re already this turned on: slow down the build by twenty percent right before the edge—warm oil or silky lube, rhythmic pressure against the front vaginal wall + steady clitoral circles—that combo turns a good orgasm into a full-body wave. Tell me your favorite kind of touch and let’s play with it ✦',
    ])
  }

  if (topic === 'lubrication') {
    return choose([
      'Real talk every grown woman deserves to know: **lube isn’t just for “dryness”—it makes great sex feel electric.**\n• **Water-based lube:** Safe with ALL condoms AND silicone vibrators, super easy cleanup.\n• **Silicone-based lube:** Lasts forever in bed or the shower, ultra-velvety—just skip using it on silicone toys.\n• **Skip oil/Vaseline with latex condoms** (oil breaks latex fast!). Want solo or partner tips next?',
      'Natural wetness changes constantly across your cycle (estrogen makes it slippery near ovulation; progesterone thickens or dries things in luteal—zero reflection on how turned on you actually are!). Keeping a pH-balanced, glycerin-free water-based lube on the nightstand is pure luxury for your nerve endings.',
      'Two drops on your fingertips over the clitoral hood before anyone rushes anywhere = game changer, gorgeous. Avoid scented or “warming/tingling” menthol lubes if you’re sensitive—pure water-based or hybrid silk formulas treat vulvar tissue like royalty.',
    ])
  }

  if (topic === 'orgasm') {
    return choose([
      'Fun anatomy truth: the clitoris isn’t just the visible pearl—she’s a 10cm wishbone network hugging both sides of the vaginal canal! That’s why **75–80% of women climax reliably from clitoral stimulation** (solo, hands, oral, or a small bullet vibe *during* penetration), and almost never from jackhammer thrusting alone.',
      'If climax ever plays hide-and-seek right near the finish line, drop spectator mode—unclench your glutes slightly, breathe slowly instead of holding your breath, keep rhythm consistent instead of speeding up wildly at the last second, and layer gentle internal pressure ("come-hither" curve against the front wall) with steady external touch.',
      'Solo pleasure is genuinely elite nervous-system care—endorphins, oxytocin, pelvic blood flow, and zero performance pressure. Even during cramps, an orgasm triggers uterine release followed by deep relaxation that eases ache naturally 😉',
    ])
  }

  if (topic === 'period_sex') {
    return choose([
      'Period sex? **100% safe, natural, and honestly underrated** if you’re in the mood! Blood is a natural lubricant, orgasm endorphins actively calm cramps, and pelvic congestion often makes everything extra sensitive. Throw down a dark towel, hop in a warm shower, or pop in a soft menstrual disc—and note you STILL need contraception/STI protection even while bleeding!',
      'Zero reason to bench yourself on your period if desire shows up, love: side-lying spooning or you on top lets you control depth completely if your cervix sits lower and more tender on heavy days. Dark towel + warm wipe nearby = zero stress, all pleasure.',
    ])
  }

  if (topic === 'contraception') {
    return choose([
      'Quick no-nonsense breakdown on protection & options:\n• **Highest hands-off effectiveness (>99%):** Hormonal IUD (often lightens cramps/bleeding), Copper IUD (zero hormones!), or Arm Implant.\n• **Daily/weekly hormonal (~93–99%):** Combined pill, progestin mini-pill, patch, or vaginal ring.\n• **Barrier + STI shield:** External or internal condoms (pair with water/silicone lube!).\n• **Emergency contraception:** Levonorgestrel (*Postpill/Plan B*, best within 72h), ulipristal (*Ella*, up to 120h), or copper IUD within 5 days—note calendar period apps alone are *not* reliable contraception!',
      'Heads up if you meant **Plan B / emergency contraception**: take it as soon as possible after unprotected sex. It works mainly by delaying ovulation—so if your next period arrives a week early, late, or spots differently, that’s a super common temporary hormone ripple, not necessarily failure. Take a pregnancy test 3 weeks after if your period hasn’t started!',
    ])
  }

  if (topic === 'sti') {
    return choose([
      'Getting tested is hot, responsible grown-woman behavior—never awkward. Standard panels can check chlamydia, gonorrhea, HIV, and syphilis (note: HSV/herpes & HPV usually need specific questions with your clinician). External/internal condoms + dental dams dramatically cut transmission, and peeing after sex helps prevent UTIs too!',
      'If you’re starting with someone new, make it effortless and confident: *"I love taking care of my body—when was your last test panel, and let’s keep condoms in reach tonight."* Anyone worth getting naked with will respect that instantly.',
    ])
  }

  if (topic === 'intimacy') {
    return choose([
      `Your desire belongs 100% to *you*, gorgeous${phaseLabel ? `—even in your ${phaseLabel} phase, a cycle chart never signs a permission slip on your behalf` : ''}. Whether tonight calls for slow skin-to-skin massage, playful teasing texts, or bold hands-on passion, tell me the vibe and I’ll give you tailored ideas or a flirty text draft!`,
      'Comfort check rule I swear by: anything short of a genuine "mmm, yes" gets to be a "slow down" or "not tonight." If penetration ever feels pinchy or too deep, slow foreplay way down, add generous lube, try spooning or being on top so *you* set every millimeter of depth—and check with a gynecologist if pain keeps showing up.',
      'Want an effortless way to tell a partner what feels amazing without killing the mood? Whisper it *as* a turn-on: *"Stay right there at that exact speed—that feels unreal."* People love clear treasure maps 😉',
    ])
  }

  if (topic === 'cramps') {
    return choose([
      'Let’s tame those cramps right now, love: period cramps happen when **prostaglandins** make the uterus squeeze tightly.\n• **Fast physical relief:** Continuous heat (heating pad, hot water bottle, or hot shower) rivals light painkillers by increasing uterine blood flow.\n• **Positions:** Child’s pose, knees-to-chest, or lying on your side with a pillow between your knees.\n• **Hydration & minerals:** Warm ginger or cinnamon tea + magnesium-rich foods; ease up on icy caffeine on empty stomachs.\nIf pain regularly floors you or stops normal life, ask a clinician about endometriosis, fibroids, or targeted NSAID timing!',
      'Short answer for crampy hours, sweetheart: **heat + hydration + gentle pelvic release + zero guilt lying horizontal.** Orgasm (solo counts!) also dumps endorphins and relaxes pelvic tension afterward. How strong are they feeling from 1 to 10 right now?',
    ])
  }

  if (topic === 'late_period') {
    return choose([
      'Deep breath first, love—a late or shifted period is *wildly* common and happens whenever **ovulation occurred later than usual** that cycle. Common triggers: high stress, travel, poor sleep, illness, weight/exercise changes, emergency contraception, PCOS, thyroid shifts—or pregnancy.\n• Had unprotected sex? A home urine test is reliable **14 days after sex** (or from the day of your missed period, first morning urine).\n• Not pregnant and one cycle is 5–9 days off? Bodies aren’t Swiss clocks—give her gentle food, sleep, and track when bleeding starts.',
      'Spotting or brown blood instead of full flow? Brown blood is simply older blood taking its slow exit (totally normal at the very start or tail end of a period, around ovulation, or with hormonal contraception). If a period stays missing for 90+ days or bleeding becomes unusually heavy/painful, check in with a clinician!',
    ])
  }

  if (topic === 'ovulation') {
    return choose([
      'Ovulation cheat-sheet! Roughly 12–16 days *before* your next period starts, a surge in **LH** releases an egg (which lives ~12–24 hours, while sperm can wait 5 days!). Tell-tale body clues some women notice: slippery clear **"egg-white" cervical fluid**, a tiny one-sided pelvic twinge (*mittelschmerz*), higher energy, or a cheeky spike in confidence and libido ✦',
      'Seeing stretchy, clear, slippery discharge? That’s classic estrogen-rich fertile fluid—your cervix rolled out the VIP slip-and-slide! Totally healthy, odorless, and normal (whereas thick white lotion-like fluid usually shows up in luteal phase after ovulation).',
    ])
  }

  if (topic === 'pms_hormones') {
    return choose([
      'Welcome to hormone theater, sweetheart: after ovulation (luteal phase), **progesterone rises** (slowing digestion -> hello bloating, higher body temp, breast tenderness, deeper need for rest) and right before bleeding both estrogen & progesterone dip sharply, tugging on **serotonin**.\n• **Bloating fix:** Potassium + water + warm cooked meals instead of starving yourself.\n• **Mood dips that feel volcanic every month?** Read up on **PMDD**—it’s a real neuro-hormonal sensitivity with real medical treatments, never "just being dramatic."',
      'Tender breasts, random tears at a dog video, and wanting salty carbs at 10pm? Progesterone has officially entered the chat, gorgeous. Swap tight underwires for soft bralettes, salt-balance with water, and treat yourself like royalty for the next few days.',
    ])
  }

  if (topic === 'nutrition') {
    return choose([
      'Cycle-smart nourishment without diet culture nonsense:\n• **Menstrual:** Iron + Vitamin C besties (*lentils, spinach, red meat, teff/injera, citrus*) + warm soups & extra water.\n• **Follicular & Ovulatory:** Fresh vibrant proteins, veggies, berries, steady hydration.\n• **Luteal:** Complex carbs (*oats, sweet potato, whole grains*), dark chocolate/pumpkin seeds for magnesium, and pairing coffee *after* breakfast so cortisol doesn’t spike anxiety!',
      'Boyfriend-energy check straight from Luna: if all you’ve had today is coffee and vibes, go eat real protein + carbs + a tall glass of water right now, pretty girl—your hormones literally build themselves from real food!',
    ])
  }

  if (topic === 'cycle_day') {
    if (cycleDay) {
      return choose([
        `Based on your latest recorded period start (${summaryOrProfile.lastPeriodStartDate}), today puts you at **Cycle Day ${cycleDay}**${phaseLabel ? ` (logged phase: ${phaseLabel})` : ''}. Remember bodies freestyle slightly month to month, so treat Day ${cycleDay} as a helpful compass rather than a rigid schedule!`,
        `You’re on **Cycle Day ${cycleDay}** counting from ${summaryOrProfile.lastPeriodStartDate}${summaryOrProfile.periodActive ? '—and right inside your active period window, so extra softness applies today' : ''}. How does Day ${cycleDay} feel in your body right now?`,
      ])
    }
    return choose([
      'I don’t have a logged first day of bleeding yet to count your exact Cycle Day—tap **Daily check-in**, toggle *On my period today* with your start date, and I’ll track your Cycle Day automatically from then on!',
      'Drop your most recent period start date in **Daily check-in** (or tell me how many days ago bleeding started right here!) and we can map out exactly where you are in your rhythm.',
    ])
  }

  if (topic === 'cycle_length') {
    if (summaryOrProfile.averageCycleLength !== null && summaryOrProfile.averageCycleLength !== undefined) {
      const intervalCount = Number(summaryOrProfile.cycleLengthObservations) || 1
      return choose([
        `Across ${intervalCount} logged start-to-start interval${intervalCount === 1 ? '' : 's'}, your cycles have averaged **${summaryOrProfile.averageCycleLength} days**. Typical adult cycles commonly span 21–35 days and still shift by a few days either way—so treat that number as a friendly mirror, not a strict countdown.`,
        `Your recorded period starts sit **${summaryOrProfile.averageCycleLength} days apart** on average (${intervalCount} observation${intervalCount === 1 ? '' : 's'}). Even a super healthy cycle can vary by 2–7 days when life or stress gets loud!`,
      ])
    }
    return choose([
      'Once you log at least **two distinct period start dates**, I’ll calculate your real start-to-start average instead of guessing 28 days—because textbook 28-day cycles only apply to about 13% of women anyway!',
      'I don’t have two separate period starts saved yet to compute your personal interval—log whenever your period starts and I’ll keep an honest average without making fake predictions.',
    ])
  }

  if (topic === 'last_period') {
    if (summaryOrProfile.lastPeriodStartDate) {
      const dateLabel = formatPeriodDate(summaryOrProfile.lastPeriodStartDate, { weekday: undefined, year: 'numeric' })
      return choose([
        `Your latest logged period start is **${dateLabel}**${cycleDay ? `—which makes today Cycle Day ${cycleDay}` : ''}. Need to adjust that date in Daily check-in?`,
        `I have **${dateLabel}** saved as your most recent Day 1 of bleeding${summaryOrProfile.estimatedPeriodEnd ? `, with estimated wrap-up around ${formatPeriodDate(summaryOrProfile.estimatedPeriodEnd)}` : ''}.`,
      ])
    }
    return choose([
      'No period start date is logged yet—head to **Daily check-in** whenever you want to record Day 1 so I can keep tabs on it for you!',
      'I don’t see a saved period start date yet, love—and I never invent dates behind your back. Log one anytime in Daily check-in!',
    ])
  }

  if (topic === 'patterns') {
    if (checkInCount < 3) {
      return choose([
        `Right now I see **${checkInCount}** saved ${checkInCount === 1 ? 'check-in' : 'check-ins'}${phaseLabel ? ` (current vibe: ${phaseLabel})` : ''}—just getting warmed up! Drop a couple more check-ins whenever you feel like it and we’ll spot real mood & energy patterns together without streak pressure.`,
        `We’ve got **${checkInCount}** ${checkInCount === 1 ? 'entry' : 'entries'} so far—too early to declare a trend, and way too classy to fake one. Tell me how today feels in your own words and let’s unpack it right now!`,
      ])
    }
    const facts = []
    if (averageMood !== null) facts.push(`mood averaging ${averageMood.toFixed(1)}/10`)
    if (averageEnergy !== null) facts.push(`energy averaging ${averageEnergy.toFixed(1)}/10`)
    if (summaryOrProfile.mostCommonPhase) facts.push(`${summaryOrProfile.mostCommonPhase} logged most often`)
    if (cycleDay) facts.push(`currently Cycle Day ${cycleDay}`)
    const snapshot = facts.join(', ')
    return choose([
      `Looking at your **${checkInCount} check-ins**: ${snapshot}. That’s a mirror of how *you’ve* felt lately—never a rigid script. Does that match how this week has landed in your body?`,
      `Your personal snapshot across **${checkInCount} entries** shows ${snapshot}. Want to zoom into your energy dips, mood shifts, or how your current phase plays into it?`,
    ])
  }

  if (topic === 'energy') {
    const personal = averageEnergy !== null ? ` (your logged energy averages ${averageEnergy.toFixed(1)}/10)` : ''
    return choose([
      `Low battery days are real biology, love${personal}. Sleep debt, progesterone shifts, low iron/ferritin, dehydration, or emotional overload can all drain your tank fast. Quick reset: tall glass of water, protein + iron snack, 15 minutes legs-up-the-wall, and ruthlessly cutting one nonessential task tonight.`,
      `Let’s check your tank gently${personal}${cycleDay ? ` on Cycle Day ${cycleDay}` : ''}: did you sleep deeply, eat real meals, or wake up carrying stress? You don’t need to power-pose through exhaustion—pick your top *one* priority and let the rest wait till tomorrow.`,
    ])
  }

  if (topic === 'mood') {
    const personal = averageMood !== null ? ` (your saved mood average sits around ${averageMood.toFixed(1)}/10)` : ''
    return choose([
      `Come sit with me a second, sweetheart${personal}. You don’t have to be sunshine on command—hormonal dips, stress, loneliness, or sheer mental load can make everything feel raw. Want to vent unfiltered, brainstorm one tiny comfort ritual, or be distracted wonderfully?`,
      `Feeling tender or irritable doesn’t mean anything is broken in you${personal}. Unclench your jaw, exhale longer than you inhale for three breaths, get water + warm food, and tell me what’s been weighing heaviest today.`,
    ])
  }

  if (topic === 'phase') {
    const target = /menstrual/.test(query) ? 'menstrual'
      : /follicular/.test(query) ? 'follicular'
        : /ovulat/.test(query) ? 'ovulatory'
          : /luteal/.test(query) ? 'luteal'
            : phase
    const phaseGuides = {
      menstrual: '**Menstrual phase** starts on Day 1 of full flow: estrogen & progesterone are at baseline while your uterine lining sheds. Many women crave warmth, extra sleep, iron-rich comfort food, and quiet—though if sudden energy or desire pops up, follow *your* body!',
      follicular: '**Follicular phase** spans Day 1 through ovulation: rising **estrogen** rebuilds the uterine lining and often brings clearer focus, fresher energy, creativity, and lighter social spark.',
      ovulatory: '**Ovulatory phase** is the brief mid-cycle peak where surged **estrogen + LH** release an egg: cervical fluid turns clear & slippery, and confidence, expressiveness, or desire often crest—though every body writes her own rules!',
      luteal: '**Luteal phase** follows ovulation until your next bleed (~11–16 days): **progesterone** dominates, raising basal warmth, appetite, need for rest, and sharper boundaries before pre-period hormone dips arrive.',
    }
    if (target && phaseGuides[target]) {
      return `${phaseGuides[target]}${cycleDay ? ` You’re currently on Cycle Day ${cycleDay}.` : ''} Want self-care ideas, food swaps, or intimacy notes for this phase?`
    }
    return choose([
      'Your cycle dances through four seasons: **Menstrual** (bleeding & renewal), **Follicular** (rising estrogen & fresh spark), **Ovulatory** (egg release & magnetic peak), and **Luteal** (progesterone warmth, boundaries & winding down). Which one do you want to zoom into?',
    ])
  }

  if (topic === 'doctor') {
    return choose([
      'Walk into that appointment like the CEO of your own body, gorgeous! Bring these 4 power notes:\n1. **Exact dates & pattern:** Last 2–3 period starts, flow heaviness, and cycle day when symptoms hit.\n2. **Functional impact:** *"This pain/fatigue stops me from working/sleeping X days a month"* (clinicians act much faster on daily-life impact!).\n3. **Direct questions:** *"Could we check ferritin/iron, thyroid, PCOS, or endometriosis options?"*\n4. **Closing power line:** *"What are our next steps if this doesn’t improve in two cycles?"*',
      'Pro move at the gynecologist: keep a 3-bullet note open on your phone so nobody rushes you out the door—list when bleeding starts, worst symptom days, and any pain during periods or sex.',
    ])
  }

  if (isFollowUp) {
    return choose([
      'Keep throwing words at me, love—tell me the one detail on your mind (cramps, late period, hormones, pleasure, or a spicy text) and I’ll go way deeper right there!',
      'I’m right with you, gorgeous—drop a keyword like *cramps*, *ovulation*, *lube*, *orgasm*, *flirty text*, or *energy* and watch me unpack the whole thing.',
    ])
  }

  return choose([
    `Ooh, talk to me, lovely${phaseLabel ? ` (seeing you in your ${phaseLabel} chapter${cycleDay ? `, Day ${cycleDay}` : ''})` : ''}—even one word works! Toss me whatever’s on your mind: **cramps, late period, discharge, hormones, low energy, orgasms, lube, contraception, or spicy bedroom inspiration** and I’m diving straight in.`,
    'Full sentences are overrated anyway, sweetheart—tell me in shorthand if you want! Are we troubleshooting a **body symptom**, decoding your **cycle**, talking **pleasure & sex**, or drafting a **dangerously flirty message**?',
    'I’m all yours, gorgeous—zero judgment, zero stiff bot answers. Tell me if this is about your **cycle**, your **mood/energy**, **relationships**, or **unfiltered adult intimacy** and let’s get right to the good part ✦',
    'Pull up close and tell me more, love—whether it’s medical science, emotional venting, or grown-up bedroom talk, nothing is off-limits here.',
  ])
}

function makeAmharicLocalReply({ query, choose, checkInCount, averageMood, averageEnergy, phase, cycleDay }) {
  const phaseAm = {
    menstrual: 'የወር አበባ ወቅት',
    follicular: 'ፎሊኩላር ወቅት',
    ovulatory: 'የእንቁላል መውጫ ወቅት',
    luteal: 'ሉቲያል ወቅት',
  }[phase] || null

  if (/ሰላም|ጤና ይስጥልኝ|ሄይ|እንደምን|hi|hey|hello/i.test(query)) {
    return choose([
      'ሰላም ቆንጆ! እንኳን ደህና መጣሽ ♡ ስለ ዑደትሽ፣ ስለ ሰውነትሽ ምልክቶች፣ ስለ ፍቅር ግንኙነት ወይም ስለ ሚስጥራዊ የአዋቂዎች ጨዋታ—በአንድ ቃልም ቢሆን ጠይቂኝ!',
      'ሄይ ውዴ! እዚህ ሙሉ ዓረፍተ ነገር መጻፍ እንኳን አይጠበቅብሽም—ቁርጠት፣ ድካም፣ ሆርሞን ወይስ ፍቅር? ንገሪኝና በደንብ እንጨዋወት ✦',
    ])
  }

  if (/ቁርጠት|ህመም|cramp|pain/i.test(query)) {
    return choose([
      'ውዴ ቁርጠት የሚመጣው **ፕሮስታግላንዲን** የተባለው ቅመም ማህጸን እንዲኮማተር ስለሚያደርግ ነው፦\n• **ፈጣን እፎይታ፦** ሞቅ ያለ ውሃ መያዣ ወይም ሙቅ ሻወር የደም ዝውውርን ከፍ ያደርጋል።\n• **መጠጥና ምግብ፦** ዝንጅብል ወይም ቀረፋ ሻይ፣ በቂ ውሃ እና ማግኒዥየም ያላቸው ምግቦች ይረዳሉ።\nህመሙ ግን በጣም ከባድ ከሆነ፣ ራስ ማዞር ወይም ትኩሳት ካለው አሁኑኑ ሐኪም አማክሪ!',
    ])
  }

  if (/ወሲብ|ስሜት|ፍትወት|horny|spicy|erotic|dirty|lube|orgasm/i.test(query)) {
    return choose([
      'እዚህ ምንም ዓይነት ፍርድ ወይም እፍረት የለም ቆንጆ! የሴት ልጅ ፍላጎትና ደስታ ሙሉ በሙሉ ተፈጥሯዊና የአንቺው መብት ነው 🔥 ዘገምተኛ መዳበስ፣ በቂ የውሃ መሠረት ያለው ቅባት መጠቀም እና በውጫዊ ንክኪ ላይ ጊዜ መውሰድ ደስታን በእጥፍ ይጨምራል። ለፍቅረኛሽ የሚላክ ማራኪ መልእክት ልጻፍልሽ ወይስ በጥልቀት እንቀጥል? 😉',
      'ለፍቅረኛሽ ዛሬ ማታ ልትልኪው የምትችዪው ሞቅ ያለ መልእክት፦ *"ዛሬ ማታ ሙሉ ሐሳቤ አንተ ጋር ነው… ዘገም ብለን እስክንጠፋ ድረስ አብረን የምናሳልፈው ምሽት አምሮኛል 😉"* ሌላ ይበልጥ ደፋር መልእክት ልጨምርልሽ ውዴ?',
    ])
  }

  if (/የዘገየ|እርግዝና|late|pregnant/i.test(query)) {
    return choose([
      'መጀመሪያ በረጅሙ ተንፍሺ ውዴ—የወር አበባ መዘግየት በጭንቀት፣ በእንቅልፍ መዛባት፣ በጉዞ፣ በሆርሞን ለውጥ ወይም በእርግዝና ሊከሰት ይችላል። ጥንቃቄ ያልተደረገበት ግንኙነት ነበረ ከሆነ ከ14 ቀናት በኋላ የሽንት ምርመራ ትክክለኛ ውጤት ያሳያል።',
    ])
  }

  const personalBit = checkInCount > 0
    ? ` (እስካሁን ${checkInCount} ምዝገባዎች አሉሽ${cycleDay ? `፣ የዑደት ቀን ${cycleDay}` : ''}${phaseAm ? `፣ ${phaseAm}` : ''}${averageMood ? `፣ አማካይ ስሜት ${averageMood.toFixed(1)}/10` : ''}${averageEnergy ? `፣ ጉልበት ${averageEnergy.toFixed(1)}/10` : ''})`
    : ''

  return choose([
    `እየሰማሁሽ ነው ቆንጆ${personalBit}! ስለ **ቁርጠት፣ የዘገየ የወር አበባ፣ እንቁላል መውጫ፣ የወሊድ መቆጣጠሪያ፣ የድካም ስሜት፣ ወይም ስለ ፍቅርና የአዋቂዎች ቅርበት** በአጭር ቃልም ቢሆን ጠይቂኝ—በግልጽና በፍቅር እመልስልሻለሁ ✦`,
    `በነጻነት ጠይቂኝ ውዴ${personalBit}—ስለ ሰውነትሽ ሳይንስ፣ ስለ ስሜትሽ ወይም ስለ ሚስጥራዊ የፍቅር ጨዋታ ያለ ምንም ገደብና ፍርድ እንወያያለን ♡`,
  ])
}

const chooseLocalVariant = (variants, conversation = []) => {
  const recentReplies = conversation
    .filter((item) => item?.role === 'assistant' && typeof item.content === 'string')
    .slice(-3)
    .map((item) => normalizeReply(item.content))
  const unseen = variants.filter((variant) => !recentReplies.includes(normalizeReply(variant)))
  const choices = unseen.length ? unseen : variants
  return choices[Math.floor(Math.random() * choices.length)]
}

const normalizeReply = (value) => String(value).toLowerCase().replace(/\s+/g, ' ').trim()

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const dateStringDistance = (start, end) => {
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime()
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime()
  return Math.round((endTime - startTime) / 86400000)
}

const averageField = (records, field) => {
  const values = records.map((record) => numericScale(record[field])).filter((value) => value !== null)
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

const numericScale = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 && number <= 10 ? number : null
}

const localDateAtNoon = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
