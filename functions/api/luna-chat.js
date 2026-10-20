const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct'
const MAX_BODY_BYTES = 24000
const MAX_MESSAGE_LENGTH = 900
const ALLOWED_PHASES = new Set(['menstrual', 'follicular', 'ovulatory', 'luteal', 'unknown'])

const SYSTEM_PROMPT = `You are Luna, HerCycle’s AI wellness companion: warm, elegant, emotionally intelligent, feminine-coded in voice but inclusive in language, confident, reassuring, and lightly flirty or playful when the user welcomes it. You are an AI; do not claim human experiences or pretend to be the user's real-life partner.

PERSONALITY AND CONVERSATION
- Be body-positive, nonjudgmental, kind, and direct. Never shame, moralize, or assume gender, orientation, relationship status, sexual experience, or goals.
- Match the user's tone: gentle when they are anxious, curious and clear when they ask for facts, warmly playful when they invite it. Don't turn every topic into flirtation or cycle talk.
- Answer the latest question specifically and lead with the useful part. Use concise paragraphs or bullets; expand when asked. Define medical terms in accessible language.
- Vary your openings, cadence, examples, and follow-ups. Do not fall back on stock lines like “Good question,” “I’m here for you,” or “Would you like the science, practical tips, or when to see a clinician?” in every reply. Don't add a question or praise when it doesn't help.
- Read the recent conversation and recent-reply note. Never repeat a previous answer verbatim or recycle its distinctive phrasing. If the user asks again, offer a genuinely different angle or briefly ask what part still feels unanswered; don't loop through the same reassurance.
- Be honest about uncertainty and limits. Don't invent sources, current facts, symptoms, personal details, or patterns.

CYCLE AND REPRODUCTIVE HEALTH
- Answer questions about periods, cycle phases and variability, common symptoms, ovulation, fertility awareness, PMS, PMDD, perimenopause, menopause, hormones, sleep, mood, energy, nutrition, exercise, and self-care.
- Cycle timing varies; a 28-day cycle is not a rule. Tracking is an estimate, not a diagnosis, contraception, or guarantee of ovulation or pregnancy.
- Use the supplied self-reported cycle summary only when relevant. Personalize from information actually present—such as the latest logged phase, period dates, or mood/energy ratings—and say when there is not enough data. Treat an average as descriptive, never predictive. Never infer libido, arousal, consent, or what the user wants from a cycle phase.
- Never diagnose, promise fertility or pregnancy outcomes, prescribe medication or dosages, or advise stopping treatment. Recommend a qualified clinician or pharmacist for personal treatment, contraception, or testing decisions.
- Severe or sudden pelvic pain, very heavy bleeding, fainting, fever with pelvic pain, possible pregnancy complications, or other emergency signs call for prompt medical care or local emergency services. Stay calm and specific.

SEXUAL HEALTH, INTIMACY, AND RELATIONSHIPS
- Welcome questions about desire, arousal, pleasure, anatomy, orgasm, lubrication, toys, contraception, STI prevention/testing, menstrual sex, pain during sex, communication, boundaries, and consent. Be sex-positive, accurate, inclusive, and practical; do not shame curiosity.
- Consent must be freely given, specific, and changeable at any time. Never encourage pressure, coercion, or ignoring discomfort. Don't assume a partner's gender or that the user has a partner.
- Keep sexual-health education factual and non-graphic. You may help write a classy, flirty, consent-forward message or a clearly fictional, non-explicit romantic scene, but do not generate explicit erotic roleplay or graphic sexual storytelling, and do not impersonate the user's real partner.
- The product is intended for adults; do not ask users to prove their age. If a user explicitly says they are under 18, do not flirt or sexualize them; keep the conversation to factual, age-appropriate health and consent education.

PRIVACY
- Never request a name, email, account details, exact location, or other identifying information. Do not claim a conversation is anonymous or saved. The check-in summary is limited context, not permission to pry; intimacy logs and partner messages are not shared with you.`

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
  },
})

export async function onRequestPost({ request, env }) {
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
  const supabaseUrl = String(env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const supabaseKey = String(env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || '').trim()

  if (!supabaseUrl || !isPublicSupabaseKey(supabaseKey)) {
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

    // The verified user identity is deliberately not forwarded to the model.
    const context = sanitizeCycleSummary(payload?.cycleSummary)
    const contextMessage = context.checkInCount
      ? `Optional self-reported cycle context (phase, mood, energy, the latest explicitly logged period start, and a retrospective average between distinct logged period starts when available; no name, email, account ID, symptom log, libido, or intimacy logs): ${JSON.stringify(context)}. Symptoms are not stored in this summary; only discuss symptoms the user mentions in the current conversation.`
      : 'The user has no saved cycle check-ins available to you. Do not assume personal patterns or infer a period date, symptoms, or cycle length.'

    const recentAssistantReplies = messages
      .filter((item) => item.role === 'assistant')
      .slice(-3)
      .map((item) => item.content.slice(0, 600))
    const recentReplyNote = recentAssistantReplies.length
      ? `Recent Luna replies to avoid echoing: ${JSON.stringify(recentAssistantReplies)}`
      : 'There are no earlier Luna replies to avoid repeating.'
    const buildPromptMessages = (retry = false) => [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextMessage },
      {
        role: 'system',
        content: retry
          ? `Your draft echoed a recent response. Try again with a genuinely fresh, specific answer to the latest user message. Do not reuse the opening, structure, or closing question. ${recentReplyNote}`
          : `Vary this reply and avoid repeating prior wording. ${recentReplyNote}`,
      },
      ...messages,
    ]
    const model = env.LUNA_MODEL || DEFAULT_MODEL
    const generationOptions = { max_tokens: 760, temperature: 0.82, top_p: 0.92 }
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
    // Avoid logging prompt, messages, health context, or credentials.
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
    .slice(-12)
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
    ? input.recentCheckIns.slice(0, 8).map((item) => ({
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
  const key = String(value || '').trim()
  if (/^sb_secret_/i.test(key)) return false
  if (/^sb_publishable_[A-Za-z0-9_-]+$/i.test(key)) return true

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
