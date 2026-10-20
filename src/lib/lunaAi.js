import { formatPeriodDate, localDateString } from './period'

export const MAX_MESSAGE_LENGTH = 900
const phaseNames = ['menstrual', 'follicular', 'ovulatory', 'luteal']

export const consentStorageKey = (userId) => `hercycle.luna.aiConsent.${userId || 'guest'}`

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
    // The current component can still respect the preference in memory.
  }
  window.dispatchEvent(new CustomEvent('hercycle:luna-consent-changed', {
    detail: { userId: userId || null, preference },
  }))
}

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

export const requestLunaReply = async (accessToken, messages, cycleSummary, signal) => {
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
      messages: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      cycleSummary,
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

export const summarizeCycles = (records = []) => {
  const sorted = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const phaseCounts = sorted.reduce((counts, entry) => {
    if (phaseNames.includes(entry.phase)) counts[entry.phase] = (counts[entry.phase] || 0) + 1
    return counts
  }, {})
  const mostCommonPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const averageMood = averageField(sorted, 'mood')
  const averageEnergy = averageField(sorted, 'energy')
  const periodStartDates = [...new Set(sorted
    .map((entry) => entry.period_start_date)
    .filter((date) => isValidDateString(date) && date <= localDateString()))].sort()
  const cycleLengths = periodStartDates.slice(1).map((date, index) =>
    dateStringDistance(periodStartDates[index], date)
  ).filter((days) => Number.isFinite(days) && days > 0)
  const averageCycleLength = cycleLengths.length
    ? Math.round((cycleLengths.reduce((sum, days) => sum + days, 0) / cycleLengths.length) * 10) / 10
    : null
  const lastPeriodStartDate = periodStartDates[periodStartDates.length - 1] || null
  const today = localDateAtNoon(new Date())
  const recentCheckIns = sorted.slice(0, 8).map((entry) => {
    const checkInDate = localDateAtNoon(new Date(`${entry.date}T12:00:00`))
    return {
      daysAgo: Math.max(0, Math.round((today - checkInDate) / 86400000)),
      phase: phaseNames.includes(entry.phase) ? entry.phase : 'unknown',
      mood: numericScale(entry.mood),
      energy: numericScale(entry.energy),
    }
  })

  return {
    checkInCount: sorted.length,
    averageMood,
    averageEnergy,
    phaseCounts,
    mostCommonPhase,
    lastPeriodStartDate,
    averageCycleLength,
    cycleLengthObservations: cycleLengths.length,
    recentCheckIns,
  }
}

export const makeLocalReply = (message, summary = {}, currentPhase, tone = 'balanced', conversation = []) => {
  const query = String(message || '').toLowerCase().trim()
  const choose = (replies) => chooseLocalVariant(replies, conversation)
  const checkInCount = Math.max(0, Math.floor(Number(summary.checkInCount) || 0))
  const averageMood = numericScale(summary.averageMood)
  const averageEnergy = numericScale(summary.averageEnergy)
  const latestLoggedPhase = summary.recentCheckIns?.[0]?.phase
  const phase = latestLoggedPhase && latestLoggedPhase !== 'unknown'
    ? latestLoggedPhase
    : currentPhase || summary.mostCommonPhase
  const phaseLabel = phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : null

  if (/^(hi|hey|hello|hiya|good morning|good evening|what's up|whats up)[!.?\s]*$/.test(query)) {
    const greetings = [
      'Hello, lovely. I’m glad you’re here—what’s on your mind?',
      'Well, hello. What would you like to talk through today?',
      'Hey, sunshine. Come as you are; where shall we start?',
      'Hi there. I’m listening—what’s happening in your world?',
      'A pleasure to see you. What would feel helpful to chat about?',
    ]
    return choose(tone === 'playful' ? [greetings[2], greetings[3], greetings[0], greetings[1], greetings[4]] : greetings)
  }

  if (/^(thanks|thank you|thx|ty)[!.?\s]*$/.test(query)) {
    return choose([
      'You’re very welcome. I’m glad that helped.',
      'Anytime. What else would you like to untangle?',
      'Of course. Take what’s useful and leave the rest.',
      'You’re welcome, lovely. I’m here if another question comes up.',
    ])
  }

  if (/\bhow are you\b|\bhow's your day\b|\bhows your day\b/.test(query)) {
    return choose([
      'I don’t have a day of my own, but I’m here and ready to listen. How has yours been?',
      'I’m right here, curious and all ears. What kind of day are you having?',
      'No errands or coffee for me—just a little space for you. How are you feeling today?',
      'I’m here with a calm corner and an open mind. How are you arriving?',
    ])
  }

  if (/\b(joke|make me laugh|something funny)\b/.test(query)) {
    return choose([
      'Why did the period tracker bring a tiny umbrella? It heard the forecast might be a little cycle-y. I’ll see myself out.',
      'I tried to write a joke about hormones, but the timing was all over the place.',
      'What did one cycle phase say to the other? “Let’s not make this a regular thing.”',
      'My favorite period pun? I had one, but it’s gone with the flow.',
    ])
  }

  if (/\b(suicid|self.?harm|abuse|coerc|assault|unsafe at home)\b/.test(query)) {
    return choose([
      'I’m sorry you’re facing this. You deserve support and safety. If you’re in immediate danger, move to a safer place if you can and contact local emergency services or someone you trust. You don’t have to share details here.',
      'That sounds serious, and you deserve care without judgment. If there’s immediate danger, please reach local emergency help or a trusted person now. I can help you think through one safe next step.',
      'Your safety comes first. If someone may hurt you or you may hurt yourself, contact local emergency services or a trusted person who can stay with you. You can keep the details private here.',
      'I’m glad you said something. Please reach out to a trusted person or local crisis/emergency support, especially if you’re in immediate danger. We can take this one step at a time.',
    ])
  }

  if (/\b(severe|sudden|faint|fainting|very heavy|soaking|fever|possible pregnancy complication)\b/.test(query)
    && /\b(pain|pelvic|bleed|bleeding|period|pregnan|fever|cramp)\b/.test(query)) {
    return choose([
      'Severe or sudden pelvic pain, fainting, very heavy bleeding, fever with pelvic pain, or possible pregnancy complications need prompt medical attention. Please contact local emergency services or urgent care now.',
      'Those symptoms can need urgent assessment, especially severe pain, fainting, heavy bleeding, or fever with pelvic pain. Please seek urgent medical care rather than relying on a chat reply.',
      'I can’t assess this safely in chat. If the pain is severe or sudden, you feel faint, bleeding is very heavy, or pregnancy complications are possible, please get urgent medical help now.',
      'Please take those symptoms seriously. Contact a qualified clinician urgently or local emergency services if symptoms are severe, worsening, or you feel faint.',
    ])
  }

  if (/pattern|notice|check.?in|trend|learn/.test(query)) {
    if (checkInCount < 3) {
      return choose([
        `I can see ${checkInCount} saved ${checkInCount === 1 ? 'check-in' : 'check-ins'} so far, which isn’t enough to call a personal pattern. We can stick to what you’ve recorded and keep noticing over time.`,
        `Your log has ${checkInCount} ${checkInCount === 1 ? 'entry' : 'entries'} right now. I don’t want to turn a small sample into a story about your body; a few more check-ins may give us a clearer picture.`,
        `I’m only seeing ${checkInCount} saved ${checkInCount === 1 ? 'check-in' : 'check-ins'}, so I can describe those entries but not a trend yet. No need to track perfectly—just when it’s useful to you.`,
        `There are ${checkInCount} saved ${checkInCount === 1 ? 'note' : 'notes'} to work with. That’s a start, not enough to infer a pattern, and certainly not a prediction.`,
      ])
    }

    const facts = []
    if (averageMood !== null) facts.push(`average mood ${averageMood.toFixed(1)}/10`)
    if (averageEnergy !== null) facts.push(`average energy ${averageEnergy.toFixed(1)}/10`)
    if (summary.mostCommonPhase) facts.push(`${summary.mostCommonPhase} is the phase logged most often`)
    const snapshot = facts.length ? facts.join('; ') : 'you have logged check-ins across multiple days'
    return choose([
      `Here’s the factual snapshot from ${checkInCount} check-ins: ${snapshot}. It describes your entries, not a rule or a forecast.`,
      `Looking only at what you saved, I see ${snapshot} across ${checkInCount} check-ins. That’s an observation—not a prediction about what you’ll feel next.`,
      `Your logbook, not a rulebook: ${checkInCount} check-ins show ${snapshot}. What part of that feels most useful or surprising to you?`,
      `From ${checkInCount} check-ins, the clearest summary is ${snapshot}. Bodies vary, so I’d treat this as a note to explore rather than a conclusion.`,
    ])
  }

  if (/energy|tired|fatigue|sleep|exhaust/.test(query)) {
    if (averageEnergy !== null) {
      return choose([
        `Your saved energy ratings average ${averageEnergy.toFixed(1)}/10. That number can’t explain the cause by itself; sleep, stress, illness, food, and lots of other things can matter.`,
        `I can see an average energy rating of ${averageEnergy.toFixed(1)}/10 in your check-ins. It’s a snapshot, not a verdict. What has your energy felt like today?`,
        `Your logged energy averages ${averageEnergy.toFixed(1)} out of 10. If you’re feeling depleted, we can look at what’s been different lately without assuming it’s your cycle.`,
        `The entries you saved put average energy at ${averageEnergy.toFixed(1)}/10. Want to explore practical ways to make today gentler, or what might be affecting it?`,
      ])
    }
    return choose([
      'Energy shifts for many reasons, and I don’t have enough saved check-ins to compare your personal pattern. What has today been asking of you?',
      'I can’t tell what’s behind your energy without more context, and your cycle is only one possible influence. Would a practical reset or a little cycle science help more?',
      'Feeling tired can have many causes. I don’t have a saved energy trend to draw on, but we can start with what feels different today.',
      'I don’t see enough energy check-ins to describe a trend. For right now, what’s one thing you could make a little easier on yourself?',
    ])
  }

  if (/mood|sad|anxious|irritable|overwhelm|stress/.test(query)) {
    if (averageMood !== null) {
      return choose([
        `Your saved mood ratings average ${averageMood.toFixed(1)}/10. That’s a snapshot of your entries, not a judgment about you or an explanation of why you feel this way.`,
        `I can see an average mood rating of ${averageMood.toFixed(1)}/10 in your check-ins. A cycle can be one piece of the picture, but it can’t explain everything.`,
        `Your logged mood averages ${averageMood.toFixed(1)} out of 10. If today feels heavy, we can talk through what’s happening without forcing it into a pattern.`,
        `The mood notes you’ve saved average ${averageMood.toFixed(1)}/10. Would practical support, a gentle reset, or simply being heard feel best right now?`,
      ])
    }
    return choose([
      'I’m sorry things feel tender. You don’t need to justify that feeling. Would you like to tell me what’s weighing on you, or would a small grounding idea help?',
      'That sounds like a lot to carry. A cycle may be one influence, but it doesn’t explain everything. What would feel supportive in this moment?',
      'You’re allowed to feel exactly as you do. I can listen, help sort through what’s stressing you, or offer one small reset—your call.',
      'I hear you. No judgment and no need to make a pattern out of it. What has been the hardest part of today?',
    ])
  }

  if (/\b(role.?play|erotic|explicit|graphic|dirty talk|sexy story)\b/.test(query)) {
    return choose([
      'I can help you write a confident, flirty message or talk through pleasure and sexual health with warmth and no judgment. I’ll keep intimate scenes non-graphic and won’t pretend to be your real-life partner.',
      'We can make the tone playful, sensual, and consent-forward, or work on a message for someone you care about. I keep sexual content non-graphic and stay clear that I’m an AI companion.',
      'I’m happy to help with a classy flirt, a romantic note, or practical questions about pleasure and boundaries. I don’t create graphic scenes or impersonate a real partner.',
      'Let’s keep it warm and respectful: I can help draft a teasing-but-classy message or answer sexual-health questions, without graphic roleplay or pretending to be someone in your life.',
    ])
  }

  if (/contracept|birth.?control|condom|\bsti\b|\bstd\b|\bsex\b|sexually transmitted|sexual health|orgasm|arous|lubricat|\blube\b|pleasure|sex toy|menstrual sex|sex during (my )?period|emergency contracept/.test(query)) {
    return choose([
      'That’s a completely fair question. I can talk about anatomy, arousal, lubrication, orgasm, contraception, STI prevention, period sex, or pleasure in a clear, nonjudgmental way. Which part are you curious about?',
      'Sexual-health questions are welcome here—no shame and no assumptions. I can explain the basics and where evidence is uncertain; what would you like to know first?',
      'We can talk openly about pleasure and sexual health. I’ll keep it practical, inclusive, and consent-centered. Is your main question about how it works, reducing risk, or talking with a partner?',
      'I’m glad you asked. I can offer general education on contraception, STIs, arousal, lubrication, orgasm, or sex during a period. For personal treatment or testing choices, a clinician or pharmacist can help.',
    ])
  }

  if (/intimacy|desire|libido|partner|touch|flirt|consent|boundar|relationship|romantic|closeness/.test(query)) {
    return choose([
      'Your comfort and desire belong to you; neither a partner nor a cycle phase gets to decide them. I can help with communication, boundaries, pleasure, or finding words for what you want.',
      'Absolutely—we can talk about intimacy without judgment. Consent can be enthusiastic, specific, and changed at any time. What would you like help putting into words?',
      'There’s no single “right” level of desire, and it can shift for many reasons. I can help you explore what feels good, what doesn’t, or how to start a kind conversation.',
      'Let’s keep your wishes and boundaries at the centre. Would it help to talk about desire, feeling close, saying no, or asking for something you’d enjoy?',
    ])
  }

  if (/cycle length|length of (my )?cycle|average cycle|how long.{0,20}cycle/.test(query)) {
    if (summary.averageCycleLength !== null && summary.averageCycleLength !== undefined) {
      const intervalCount = Number(summary.cycleLengthObservations) || 1
      return choose([
        `Your saved period starts give ${intervalCount} interval${intervalCount === 1 ? '' : 's'}, averaging ${summary.averageCycleLength} days. That’s a retrospective average, not a prediction of your next cycle.`,
        `From ${intervalCount} interval${intervalCount === 1 ? '' : 's'} between period-start dates you recorded, the average is ${summary.averageCycleLength} days. Bodies vary, so I’d treat it as a snapshot rather than a rule.`,
        `The period-start dates in your log average ${summary.averageCycleLength} days apart across ${intervalCount} interval${intervalCount === 1 ? '' : 's'}. It describes past entries; it can’t guarantee what comes next.`,
        `Looking only at explicit period starts you saved, I calculate about ${summary.averageCycleLength} days on average (${intervalCount} interval${intervalCount === 1 ? '' : 's'}). Would you like help understanding what cycle length means?`,
      ])
    }
    return choose([
      'I need at least two distinct period-start dates to calculate an interval, and I don’t see enough saved yet. I won’t guess from cycle phases.',
      'I don’t have enough explicitly recorded period starts to work out your average cycle length. One or more dates would let me describe past intervals, not predict the next one.',
      'There aren’t two separate period-start dates in the saved context I can see, so I can’t calculate an average yet. I’d rather be accurate than fill in a number.',
      'I can explain cycle length generally, but I don’t see enough period-start dates to calculate your personal average. The estimate needs multiple starts.',
    ])
  }

  if (/last period|last menstrual|when did (my )?(last )?period|period start date/.test(query)) {
    if (summary.lastPeriodStartDate) {
      const dateLabel = formatPeriodDate(summary.lastPeriodStartDate, { weekday: undefined, year: 'numeric' })
      return choose([
        `The latest period start date you explicitly recorded is ${dateLabel}. That’s the date in your log, not a prediction.`,
        `Your saved record lists ${dateLabel} as the most recent period start.`,
        `I can see a period start dated ${dateLabel} in your cycle log. If that doesn’t look right, you can update the check-in.`,
        `The most recent period start I see in your saved entries is ${dateLabel}.`,
      ])
    }
    return choose([
      'I don’t see an explicitly saved period-start date in the cycle context available to me, so I can’t say when your last period began.',
      'There isn’t a period-start date in the saved entries I can see. I won’t infer it from a phase label or a mood check-in.',
      'I can’t find a recorded start date in the cycle summary available to me. If you log one, I can refer to that date later.',
      'I don’t have a saved period-start date to check right now; I’d rather not guess.',
    ])
  }

  if (/pain|cramp|bleed|spotting|period|symptom|pregnan|fertil|ovulat|pms|pmdd|menopaus|cycle/.test(query)) {
    return choose([
      'I can help with cycle and reproductive-health education, but I can’t diagnose or predict pregnancy from a check-in. If a symptom is severe, unusual, or a big change for you, contact a qualified clinician.',
      'Cycle experiences vary, and tracking can’t confirm ovulation or pregnancy. Tell me which symptom or cycle question you mean, and I’ll give you the clearest general information I can.',
      'I’m happy to unpack the science or practical options. I can’t diagnose symptoms, though; sudden or severe pain, very heavy bleeding, fainting, or fever with pelvic pain calls for prompt medical care.',
      'That’s worth understanding. I can explain common cycle symptoms and what’s known, while being honest about uncertainty. What part would you like to focus on?',
    ])
  }

  if (/phase|menstrual|follicular|ovulat|luteal/.test(query)) {
    if (phaseLabel) {
      return choose([
        `Your most recently logged phase is ${phaseLabel}. Experiences differ widely, so it’s context—not a script for your mood, energy, or desire.`,
        `The latest phase you selected was ${phaseLabel}. A phase label can help organize notes, but it can’t predict exactly how you’ll feel.`,
        `I can see ${phaseLabel} as your most recent logged phase. Want the science of that phase, common experiences, or practical care ideas?`,
        `Your latest check-in names the ${phaseLabel} phase. Bodies vary, and the phase alone doesn’t tell me what’s happening for you today.`,
      ])
    }
    return choose([
      'I don’t see a saved phase to personalize this yet. I can still explain the phases generally—what would you like to know?',
      'I don’t have a recent phase logged, and I won’t guess. If you tell me what you’re curious about, I can explain the cycle in general terms.',
      'There isn’t a recent phase in the saved context I can see. We can still talk through cycle science without personal data.',
      'I can explain any phase, but I don’t have a saved one to refer to right now. Is there a specific phase or symptom on your mind?',
    ])
  }

  return choose([
    'I’m listening. I can help with cycle questions, everyday life, relationships, or just sorting through a thought—where would you like to begin?',
    'That could go a few directions. What would help most: a clear answer, practical options, or space to think it through?',
    'Tell me what part matters most to you, and I’ll meet you there rather than steering everything back to your cycle.',
    'I’m here for the real question, not just the neat one. What would you like to untangle first?',
    'We can take this at your pace. What are you hoping to understand or decide?',
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

// Converts local check-ins into the record shape summarizeCycles expects. Notes and intimacy
// logs are deliberately left out; only the period start day is marked, and only once per run.
const previousDayKey = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setDate(date.getDate() - 1)
  return localDateString(date)
}

export const toCycleRecords = (checkins = {}) =>
  Object.keys(checkins)
    .sort()
    .map((date) => {
      const entry = checkins[date] || {}
      const previous = checkins[previousDayKey(date)]
      const continuesRun = Boolean(previous?.period)
      return {
        date,
        phase: entry.phase,
        mood: entry.mood,
        energy: entry.energy,
        period_start_date: entry.period && !continuesRun ? date : null,
      }
    })
