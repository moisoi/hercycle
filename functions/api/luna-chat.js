const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct'
const MAX_BODY_BYTES = 28000
const MAX_MESSAGE_LENGTH = 1000
const ALLOWED_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal', 'unknown'])
const ALLOWED_TONES = new Set(['playful', 'balanced', 'serious'])
const ALLOWED_LOCALES = new Set(['en', 'am'])

const SYSTEM_PROMPT = `You are Luna, HerCycle’s signature AI companion for adult women (20+): magnetic, warm, witty, emotionally perceptive, deeply knowledgeable about women's bodies, and effortlessly confident—like an adored best friend with reproductive-health literacy and playful flirtatious charm.

VOICE, WIT, AND CONVERSATION STYLE
- Feel alive, warm, affectionate, and human—never stiff, robotic, clinical, or preachy. Never shame, lecture, or moralize.
- Understand single words, fragments, typos, slang, emojis, and shorthand using the conversation thread and cycle profile (e.g., if a user just types "cramps", "late", "horny", "lube?", "why though", "hotter", "another one", immediately grasp the intent from context and answer directly!).
- Maintain tight continuity with the recent conversation thread. Build on what was just discussed instead of resetting to generic intros.
- Vary openings, rhythm, humor, and structure. Never recycle stock lines like "Good question" or "I’m here for you" on repeat.
- If the user writes in Amharic (አማርኛ) or requests Amharic, respond naturally and warmly in fluent Amharic (with clear explanations of any medical terms).

CYCLE, HORMONES, AND WHOLE-BODY KNOWLEDGE
- Answer both foundational and complex questions thoroughly across menstrual cycles, follicular/ovulatory/luteal/menstrual physiology, cycle day estimation, estrogen/progesterone/LH/FSH/prostaglandins, cramps, bloating, breast tenderness, headaches, acne, sleep, mood shifts, PMS, PMDD, perimenopause, PCOS/endometriosis education, iron/magnesium/hydration/nutrition, exercise pacing, discharge changes, ovulation signs, fertility awareness, contraception, emergency contraception, and STI prevention/testing.
- Cycle length varies widely between people and months; calendar estimates are observations, never diagnoses, contraception, or guarantees of ovulation/pregnancy.
- Personalize gently from supplied check-in data only when relevant, and never infer intimacy consent from a cycle phase.
- Never diagnose conditions, prescribe dosages, or tell someone to stop prescribed medication. Calmly advise urgent medical evaluation for red-flag symptoms (sudden or severe pelvic/abdominal pain, soaking through a pad/tampon every hour, fainting/dizziness, fever with pelvic pain, foul discharge, or possible ectopic/pregnancy emergencies).

UNAPOLOGETIC ADULT INTIMACY, PLEASURE, AND FLIRTATION (18+ VERIFIED AUDIENCE)
- HerCycle’s audience is verified 18+ adults (20s+). When users ask about sex, desire, arousal, orgasms, clitoral/internal stimulation, lubrication, toys, menstrual sex, positions, fantasies, dirty talk, or bold/steamy adult intimacy, answer openly, playfully, flirty-wittily, and vividly without prudish holding back or lecturing!
- Match the heat level the adult user invites—from sweet romantic teasing to bold, sultry, passionate adult scenarios, dirty-talk lines, and steamy partner messages—while always keeping intimacy consensual between adults and remembering you are Luna (an AI companion, never impersonating a real-world partner without framing it clearly as a draft/scene).
- If anyone explicitly states they are under 18, immediately keep replies strictly non-sexual, non-flirty, and factual. Never generate non-consensual sexual content.

PRIVACY
- Never ask for real names, emails, addresses, phone numbers, or account credentials.`

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
  },
})

const cleanEnvString = (value) =>
  String(value || '')
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim()

export async function onRequestPost({ request, env = {} }) {
  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ error: 'Cross-origin requests are not accepted.' }, 403)
  }

  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    return jsonResponse({ error: 'Send a JSON request.' }, 415)
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'This message is too long.' }, 413)
  }

  let payload
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'This message is too long.' }, 413)
    }
    payload = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'The request could not be read.' }, 400)
  }

  if (payload?.aiConsent !== true) {
    return jsonResponse({ error: 'Enable AI replies in Luna before sending a message.' }, 403)
  }

  const messages = sanitizeMessages(payload?.messages)
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return jsonResponse({ error: 'Add a message before asking Luna.' }, 400)
  }

  const authHeader = request.headers.get('Authorization') || ''
  const accessToken = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = [
    env.SUPABASE_URL,
    env.REACT_APP_SUPABASE_URL,
    env.VITE_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_URL,
  ]
    .map((candidate) => cleanEnvString(candidate).replace(/\/+$/, ''))
    .find(Boolean) || ''

  const supabaseKey = [
    env.SUPABASE_ANON_KEY,
    env.SUPABASE_PUBLISHABLE_KEY,
    env.REACT_APP_SUPABASE_ANON_KEY,
    env.REACT_APP_SUPABASE_KEY,
  ]
    .map((candidate) => cleanEnvString(candidate))
    .find((candidate) => isPublicSupabaseKey(candidate)) || ''

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: 'Luna AI is not configured with a public Supabase key.' }, 503)
  }
  if (!accessToken) {
    return jsonResponse({ error: 'Sign in is required for personalized AI replies.' }, 401)
  }

  if (!env.AI || typeof env.AI.run !== 'function') {
    return jsonResponse({ error: 'Luna AI is not enabled for this deployment.' }, 503)
  }

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      return jsonResponse({ error: 'Your session could not be verified. Please sign in again.' }, 401)
    }

    const context = sanitizeCycleSummary(payload?.cycleSummary)
    const locale = ALLOWED_LOCALES.has(payload?.locale) ? payload.locale : 'en'
    const languageDirective = locale === 'am'
      ? 'Preferred UI language: Amharic (አማርኛ). Reply naturally in Amharic unless the user explicitly asks for English.'
      : 'Preferred UI language: English (unless the user writes in Amharic, in which case match their language).'

    const contextMessage = context.checkInCount || context.activePhase || context.cycleDay
      ? `Optional self-reported cycle profile (phase, cycle day from logged period start, mood, energy, period timing, and retrospective cycle average when available; no name, email, account ID, or partner contacts): ${JSON.stringify(context)}. ${languageDirective}`
      : `The user has no saved check-ins yet. Do not invent personal cycle dates or averages. ${languageDirective}`

    const recentAssistantReplies = messages
      .filter((item) => item.role === 'assistant')
      .slice(-3)
      .map((item) => item.content.slice(0, 600))
    const recentReplyNote = recentAssistantReplies.length
      ? `Recent Luna replies to avoid repeating: ${JSON.stringify(recentAssistantReplies)}`
      : 'No earlier replies in this turn window.'

    const buildPromptMessages = (retry = false) => [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextMessage },
      {
        role: 'system',
        content: retry
          ? `Your draft echoed a previous message. Write a completely fresh, lively, specific reply to the latest user message without repeating structure or phrasing. ${recentReplyNote}`
          : `Keep full thread coherence with the messages below, understand shorthand/fragments from context, and vary phrasing. ${recentReplyNote}`,
      },
      ...messages,
    ]

    const model = env.LUNA_MODEL || DEFAULT_MODEL
    const generationOptions = { max_tokens: 850, temperature: 0.85, top_p: 0.93 }
    let result = await env.AI.run(model, { messages: buildPromptMessages(), ...generationOptions })
    let reply = extractModelReply(result)

    if (isRecentDuplicate(reply, recentAssistantReplies)) {
      result = await env.AI.run(model, { messages: buildPromptMessages(true), ...generationOptions })
      const retryReply = extractModelReply(result)
      if (retryReply.trim()) reply = retryReply
    }

    if (typeof reply !== 'string' || !reply.trim()) {
      return jsonResponse({ error: 'Luna could not create a reply just now.' }, 502)
    }

    return jsonResponse({ reply: reply.trim().slice(0, 4000), mode: 'ai' })
  } catch (error) {
    console.error('Luna AI request failed:', error?.name || 'UnknownError')
    return jsonResponse({ error: 'Luna is taking a quiet moment. Please try again.' }, 502)
  }
}

function extractModelReply(result) {
  return typeof result === 'string'
    ? result
    : result?.response || result?.result?.response || ''
}

function isRecentDuplicate(candidate, recentReplies) {
  const normalizedCandidate = normalizeAssistantText(candidate)
  return Boolean(normalizedCandidate && recentReplies.some((reply) => normalizeAssistantText(reply) === normalizedCandidate))
}

function normalizeAssistantText(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

const sanitizeMessages = (items) => {
  if (!Array.isArray(items)) return []
  return items
    .slice(-14)
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({
      role: item.role,
      content: typeof item.content === 'string' ? item.content.trim().slice(0, MAX_MESSAGE_LENGTH) : '',
    }))
    .filter((item) => item.content.length > 0)
}

const sanitizeCycleSummary = (input) => {
  if (!input || typeof input !== 'object') return { checkInCount: 0 }
  const count = clampInteger(input.checkInCount, 0, 10000)
  const phaseCounts = {}

  if (input.phaseCounts && typeof input.phaseCounts === 'object') {
    for (const phase of ALLOWED_PHASES) {
      const value = clampInteger(input.phaseCounts[phase], 0, 10000)
      if (value > 0) phaseCounts[phase] = value
    }
  }

  const recentCheckIns = Array.isArray(input.recentCheckIns)
    ? input.recentCheckIns.slice(0, 10).map((item) => ({
      daysAgo: clampInteger(item?.daysAgo, 0, 3650),
      phase: ALLOWED_PHASES.has(item?.phase) ? item.phase : 'unknown',
      mood: clampScale(item?.mood),
      energy: clampScale(item?.energy),
    }))
    : []

  return {
    checkInCount: count,
    averageMood: clampScale(input.averageMood),
    averageEnergy: clampScale(input.averageEnergy),
    phaseCounts,
    mostCommonPhase: ALLOWED_PHASES.has(input.mostCommonPhase) ? input.mostCommonPhase : null,
    activePhase: ALLOWED_PHASES.has(input.activePhase) ? input.activePhase : null,
    tone: ALLOWED_TONES.has(input.tone) ? input.tone : 'balanced',
    cycleDay: input.cycleDay ? clampInteger(input.cycleDay, 1, 120) : null,
    periodActive: Boolean(input.periodActive),
    estimatedPeriodEnd: sanitizeDate(input.estimatedPeriodEnd),
    lastPeriodStartDate: sanitizeDate(input.lastPeriodStartDate),
    averageCycleLength: clampCycleLength(input.averageCycleLength),
    cycleLengthObservations: clampInteger(input.cycleLengthObservations, 0, 100),
    recentCheckIns,
  }
}

const clampInteger = (value, min, max) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : 0
}

const sanitizeDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

const clampCycleLength = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 && number <= 120
    ? Math.round(number * 10) / 10
    : null
}

const clampScale = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 && number <= 10
    ? Math.round(number * 10) / 10
    : null
}

const isPublicSupabaseKey = (value) => {
  const key = cleanEnvString(value)
  if (!key || /^sb_secret_/i.test(key) || /service_role/i.test(key)) return false
  if (/^sb_publishable_[A-Za-z0-9_.-]+$/i.test(key)) return true

  const jwtParts = key.split('.')
  if (jwtParts.length !== 3) return false
  try {
    const base64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    return JSON.parse(decoded).role === 'anon'
  } catch {
    return false
  }
}

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  })

