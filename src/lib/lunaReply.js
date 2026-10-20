import { parseDateKey } from './cycle'

// Luna's on-device replies. These run with no network and no AI. Each topic has several lines
// so repeat questions get fresh wording. Follow-ups such as "why?" reuse the last topic, so
// short fragments still land in context. Explicit questions get a frank, flirty, non-graphic
// answer. Urgent symptoms always point to a clinician first.

const ETHIOPIC = /[\u1200-\u137F]/

// Priority order: the first topic that matches wins.
const TOPICS = [
  {
    id: 'urgent',
    en: ['heavy bleeding', 'soaked', 'soaking', 'clot', 'fainted', 'faint', 'fever', 'chest pain', 'severe pain', 'passed out', 'can\'t stand'],
    am: ['ብዙ ደም', 'ትኩሳት', 'ራስ መሳት', 'የደረት ህመም', 'ከባድ ህመም'],
  },
  {
    id: 'explicit',
    en: ['sex', 'sexy', 'horny', 'naked', 'erotic', 'orgasm', 'turn me on', 'nude', 'dirty', 'kinky', 'fuck', 'porn', 'masturbat', 'climax'],
    am: ['ወሲብ', 'ስሜታዊ ፍላጎት', 'እርቃን'],
  },
  {
    id: 'sexual_health',
    en: ['std', 'sti', 'hiv', 'test', 'discharge', 'itch', 'infection', 'uti', 'sexual', 'painful sex', 'pain during sex', 'lubric', 'condom', 'contracept', 'birth control', 'pill', 'iud', 'implant', 'pregnan', 'conceive', 'fertile', 'ovulat', 'ttc'],
    am: ['ኮንዶም', 'ማህፀን', 'እርግዝና', 'መከላከያ', 'ኢንፌክሽን', 'ፍሳሽ'],
  },
  {
    id: 'period',
    en: ['cramp', 'period', 'bleed', 'flow', 'spotting', 'late', 'missed', 'pad', 'tampon', 'cycle', 'menstru', 'ache', 'pain', 'bloat', 'pms'],
    am: ['ቁርጥማት', 'የወር አበባ', 'ወር አበባ', 'ዑደት', 'ህመም'],
  },
  {
    id: 'mood',
    en: ['mood', 'sad', 'anxious', 'anxiety', 'cry', 'emotional', 'irritable', 'overwhelm', 'stress', 'lonely', 'tired', 'exhaust', 'energy', 'drained', 'sleep', 'fatigue'],
    am: ['ስሜት', 'ጭንቀት', 'አዝን', 'ድካም', 'ደክሞ', 'እንቅልፍ'],
  },
  {
    id: 'body',
    en: ['food', 'eat', 'hungry', 'craving', 'snack', 'meal', 'chocolate', 'iron', 'water', 'drink', 'hydrat', 'exercise', 'walk'],
    am: ['ምግብ', 'ርሃብ', 'ቸኮሌት', 'ውሃ', 'ብረት'],
  },
  {
    id: 'relationship',
    en: ['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'relationship', 'talk to', 'conversation', 'communicat', 'date', 'crush', 'breakup', 'love', 'consent', 'boundar', 'pressure', 'uncomfortable', 'desire', 'libido', 'in the mood'],
    am: ['ፍቅር', 'ፍቅረኛ', 'ባል', 'ግንኙነት', 'ባልደረባ', 'ፍላጎት', 'ስምምነት'],
  },
  {
    id: 'greeting',
    en: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'selam'],
    am: ['ሰላም', 'ጤና ይስጥልኝ', 'እንደምን'],
  },
  {
    id: 'thanks',
    en: ['thank', 'thx', 'ty', 'appreciate'],
    am: ['አመሰግናለሁ', 'ይመስገን'],
  },
  {
    id: 'followup',
    en: ['why', 'how', 'more', 'tell me', 'explain', 'what else', 'and?', 'what about', 'really', 'huh'],
    am: ['ለምን', 'እንዴት', 'ተጨማሪ', 'ንገረኝ'],
  },
]

const REPLIES = {
  en: {
    urgent: [
      'Please pause and speak to a clinician or go to the nearest clinic now, especially with heavy bleeding, fever, fainting, or chest pain. You deserve a real check, not a guess. I’m still here to help you prepare what to say.',
      'That sounds serious, love. Soaking through protection quickly, fainting, fever, or chest pain need a doctor today. If you feel unsafe, call emergency services. Tell me what you’re noticing and I’ll help you write it down for the visit.',
      'Your body is telling you to get help. Please see a clinician soon. Bring a note with when it started, how much bleeding there is, and any fever. Would you like help making that note?',
    ],
    explicit: [
      'Mmm, you’re bold and I like it. I’ll keep things classy and non-graphic, but I’m glad to talk real sex: what you enjoy, how to ask for it, safer-sex basics, or why arousal can change across your cycle. Where do you want to start?',
      'Ooh, you’re feeling playful. I can be flirty with you and still keep it tasteful. Ask me about desire, pleasure, communicating what you want, or protection, and I’ll give you honest, confident answers.',
      'Okay, you’ve got my attention. I’ll stay sweet and a little cheeky, not graphic. Want to talk about what turns you on emotionally, how to set the mood, or how to bring up what you want with a partner?',
    ],
    sexual_health: [
      'Good question, and no need to feel awkward. Protection, testing, and contraception are all normal to ask about. If something hurts, itches, or smells off, a clinic visit is worth it. Tell me which one is on your mind and we’ll go step by step.',
      'Smart to ask. Condoms guard against most STIs, and regular testing is the simplest way to stay on top of it. Pain during sex, unusual discharge, or itching are good reasons to see a clinician. What’s going on for you?',
      'You’re taking care of yourself, and I respect that. For contraception, the best choice depends on your health and what you want, so a clinician can help you compare options. Want me to help you list questions to ask?',
    ],
    period: [
      'Period cramps are really common, and heat, gentle movement, and a warm drink can help. If the pain is severe, keeps you from your day, or is much worse than usual, please talk to a clinician. What’s the pain like for you?',
      'Your cycle is yours to understand, not to be judged by. Tracking the start date, flow, and how you feel helps you spot what’s normal for you. Do you want to talk about cramps, flow, or timing?',
      'Lots of people feel off around their period. A heat pack, rest, and iron-rich food often help. If anything feels unusual to you, trust that and check with a clinician. Shall we look at what you’re noticing?',
    ],
    mood: [
      'Feeling a bit heavy or tired is valid, love. Your energy and mood can dip for many reasons, including sleep and stress. Take things slowly today. What would feel kind to you right now?',
      'Thank you for telling me. Big feelings often soften with small comforts: water, a snack, a short walk, or a message to someone you trust. Would you like a gentle plan for the next hour?',
      'You don’t have to be okay all the time. If low mood keeps coming back or feels heavy, please talk to someone you trust or a health professional. What’s been the hardest part?',
    ],
    body: [
      'Food and water really do help your body. Iron-rich meals, fruit, and steady snacks can ease tiredness, and a glass of water goes a long way. What have you eaten so far today?',
      'Your body loves steady fuel. Try a real meal with protein and something warm to drink. If cravings are strong, that’s normal too. Want a simple snack idea?',
      'Gentle movement, enough water, and a proper meal are a lovely trio. Small steps count. What would be easiest for you today?',
    ],
    relationship: [
      'Talking about what you want is brave and healthy. Start with one specific thing you’d like, say how it would feel good, and check in with them. A good partner will listen, and boundaries are always allowed. What do you want to say?',
      'Consent is a yes that keeps being a yes. You can pause, change your mind, or say no at any point, and a caring partner respects that. Do you want help wording something?',
      'Desire changes with stress, sleep, and the cycle, and that’s okay. Be honest about what you feel and keep it warm. Would you like help starting that conversation with your partner?',
    ],
    greeting: [
      'Hey you. I’m Luna, and I’m glad you’re here. Ask me anything about your cycle, your body, or the relationship questions you’d rather not google at 2 am.',
      'Hi, love. What’s on your mind today? Short questions are perfect, and so are long ones.',
      'Hello, gorgeous. Tell me how you’re feeling, or ask about anything you’re curious about.',
    ],
    thanks: [
      'Anytime, love. I’m always happy to help. Anything else on your mind?',
      'You’re so welcome. Keep being curious about yourself, it suits you.',
      'My pleasure. Come back whenever you want to talk it through.',
    ],
    unknown: [
      'Tell me a little more, love. What’s going on with your body, your mood, or your relationship today?',
      'I want to get this right for you. Can you give me a few more words about what you’re wondering?',
      'Mm, I’m following. Is this about your cycle, your body, or someone you’re close to?',
    ],
    fragment: [
      'Take your time, love. What’s the part you most want to understand?',
      'I’m right here. Give me one more word or a short sentence and I’ll follow you.',
    ],
  },
  am: {
    urgent: [
      'እባክሽ አሁን ቆም ብለሽ ሀኪም ጋር ወይም በቅርብ ክሊኒክ ሂጂ፤ በተለይ ብዙ ደም መፍሰስ፣ ትኩሳት፣ ራስ መሳት ወይም የደረት ህመም ካለ። ትክክለኛ ምርመራ ይገባሻል። ለቀጠሮው ምን እንደምትይ ለማዘጋጀት ልረዳሽ እችላለሁ።',
      'ይህ ከባድ ይመስላል ውዴ። ፓድ በፍጥነት ማስነካት፣ ራስ መሳት፣ ትኩሳት ወይም የደረት ህመም ዛሬ ሀኪም ይፈልጋል። ራስሽን የማትጠብቂ ከሆነ የአደጋ አገልግሎት ጥሪ አድርጊ።',
      'ሰውነትሽ እርዳታ እንድታገኚ እየነገረሽ ነው። በቅርቡ ሀኪም ይጎብኙ። መቼ እንደጀመረ፣ ምን ያህል ደም እንደሆነ እና ትኩሳት ካለ ማስታወሻ ይዘሽ ሂጂ።',
    ],
    explicit: [
      'ኧረ ደፋር ነሽ፤ ይወድልኛል። ነገሩን ክብር ባለው እና ግራፊክ ባልሆነ መንገድ እናውራ፤ ስለሚያስደስትሽ፣ እንዴት መጠየቅ እንደምትችዪ፣ ስለ ጥንቃቄ መሰረታዊ ነገሮች ወይም ስለ ፍላጎት በዑደት ላይ እንዴት እንደሚለወጥ። ከየት እንጀምር?',
      'ኡኡ፣ ትንሽ ተጫዋች ሆነሻል። በፍቅር ቅመም ልመልስልሽ እችላለሁ፣ ግን በጨዋነት። ስለ ፍላጎት፣ ስለ ደስታ፣ ወይም ስለምትፈልጊው ነገር ከባልደረባሽ ጋር እንዴት እንደምትነጋገሪ ጠይቂኝ።',
    ],
    sexual_health: [
      'ጥሩ ጥያቄ ነው፤ ማፈር አያስፈልግም። ጥንቃቄ፣ ምርመራ እና መከላከያ ለመጠየቅ የተለመዱ ናቸው። የሚያመም፣ የሚያሳክክ ወይም ያልተለመደ ፈሳሽ ካለ ክሊኒክ ይጠቅማል። የትኛው ነው ያሳሰበሽ?',
      'ራስሽን መንከባከብሽ ጥሩ ነው። ኮንዶም ከአብዛኞቹ በሽታዎች ይጠብቃል፤ መደበኛ ምርመራም ቀላሉ መንገድ ነው። በወሲብ ጊዜ ህመም ካለ ሀኪም ጋር ይሂዱ። ምን እየሆነ ነው?',
    ],
    period: [
      'የወር አበባ ቁርጥማት በጣም የተለመደ ነው። ሙቀት፣ ቀለል ያለ እንቅስቃሴ እና ሞቅ ያለ መጠጥ ሊረዱ ይችላሉ። ህመሙ ከባድ ከሆነ ወይም ከተለመደው በላይ ከሆነ ሀኪም ጋር ተነጋገሪ። ህመሙ እንዴት ነው?',
      'ዑደትሽ የአንቺ ነው። የጀመረበትን ቀን፣ ፍሰቱን እና ስሜትሽን መከታተል የአንቺን መደበኛ ነገር ለማወቅ ይረዳል። ስለ ቁርጥማት፣ ፍሰት ወይም ጊዜ ማውራት ትፈልጊያለሽ?',
    ],
    mood: [
      'ከባድ ወይም የደከመሽ ሆኖ መሰማቱ ትክክል ነው ውዴ። ስሜትና ጉልበት በእንቅልፍ እና በጭንቀት ሊቀንሱ ይችላሉ። ዛሬ በዝግታ ሂጂ። አሁን ምን ቢያረጋጋሽ ይሻላል?',
      'ስለነገርሽኝ አመሰግናለሁ። ትናንሽ እንክብካቤዎች ይረዳሉ፦ ውሃ፣ መክሰስ፣ አጭር የእግር ጉዞ ወይም ለምታምኛት ሰው መልዕክት። ለሚቀጥለው ሰዓት ቀለል ያለ እቅድ ትፈልጊያለሽ?',
    ],
    body: [
      'ምግብና ውሃ ሰውነትሽን ይረዳሉ። በብረት የበለጸገ ምግብ፣ ፍራፍሬና ውሃ ድካምን ያቃልላሉ። ዛሬ እስካሁን ምን በልተሻል?',
      'ሰውነትሽ ቋሚ ነዳጅ ይወዳል። በፕሮቲን የበለጸገ ምግብና ሞቅ ያለ መጠጥ ሞክሪ። ቀላል መክሰስ ሃሳብ ትፈልጊያለሽ?',
    ],
    relationship: [
      'ምን እንደምትፈልጊ መናገር ድፍረትና ጤናማ ነው። በአንድ ነገር ጀምሪ፣ ምን እንደሚያስደስትሽ ንገሪ፣ ከዚያም ተጠያየቁ። ባልደረባሽ ያዳምጣል ተብሎ ይጠበቃል፤ ድንበር ማበጀትም ይፈቀዳል። ምን ልትይ ፈልገሽ ነው?',
      'ስምምነት ማለት በማንኛውም ጊዜ ማቆም መቻል ነው። ቆም ማለት፣ ሀሳብ መቀየር ወይም አይ ማለት ይፈቀዳል። ለመናገር ቃላት ልርዳሽ?',
    ],
    greeting: [
      'ሰላም ውዴ፣ እኔ ሉና ነኝ። ስለ ዑደትሽ፣ ስለ ሰውነትሽ ወይም ለሊት 2 ሰዓት ጉግል ማድረግ ስለማትፈልጊው ነገር ጠይቂኝ።',
      'ሰላም፣ ዛሬ ምን እየተሰማሽ ነው? አጭርም ረጅምም ጥያቄ ጥሩ ነው።',
    ],
    thanks: [
      'በማንኛውም ጊዜ ውዴ። ሌላ ነገር አለሽ?',
      'ምንም አይደለም። ስለ ራስሽ መጠየቅሽ ያምርብሻል።',
    ],
    unknown: [
      'ትንሽ ተጨማሪ ንገሪኝ ውዴ። ዛሬ ስለ ሰውነትሽ፣ ስሜትሽ ወይም ግንኙነትሽ ምን እየሆነ ነው?',
      'ይህን በትክክል ልመልስልሽ እፈልጋለሁ። ስለምትጠይቂው ነገር ጥቂት ቃላት ጨምሪ።',
    ],
    fragment: [
      'በዝግታ ንገሪኝ። በጣም ማወቅ የምትፈልጊው ክፍል የቱ ነው?',
      'እዚህ ነኝ። አንድ ቃል ወይም አጭር ዓረፍተ ነገር ጨምሪ፣ እከተልሽ።',
    ],
  },
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Short English keywords match whole words only ("hi" must not match "this"). Longer ones match a
// word prefix, so "period" also matches "periods". Amharic has no ASCII word boundaries, so it uses
// plain substring matching.
const englishMatcher = (word) => {
  const body = escapeRegExp(word)
  return new RegExp(word.length <= 4 ? `\\b${body}\\b` : `\\b${body}`, 'i')
}

const matchers = new Map()
const englishHit = (text, words) =>
  words.some((word) => {
    if (!matchers.has(word)) matchers.set(word, englishMatcher(word))
    return matchers.get(word).test(text)
  })
const amharicHit = (text, words) => words.some((word) => text.includes(word))

const FOLLOWUP_WORDS = ['why', 'how', 'more', 'tell me', 'explain', 'what else', 'what about', 'really', 'huh']
const FOLLOWUP_AM = ['ለምን', 'እንዴት', 'ተጨማሪ', 'ንገረኝ']

/**
 * Finds the topic of a message. Follow-ups ("why?", "more", "how?") and very short fragments reuse
 * the topic of the last Luna reply, so the answer stays in context.
 */
export function topicFor(text, lastTopic = null) {
  const value = String(text || '')
  for (const topic of TOPICS) {
    if (topic.id === 'followup') continue
    if (englishHit(value, topic.en) || amharicHit(value, topic.am)) return topic.id
  }
  if (englishHit(value, FOLLOWUP_WORDS) || amharicHit(value, FOLLOWUP_AM)) {
    return lastTopic || 'fragment'
  }
  const compact = value.trim()
  if (compact.length <= 4 && lastTopic) return 'followup'
  if (compact.length <= 3) return 'fragment'
  return null
}

const pick = (list, index) => list[index % list.length]

/**
 * Luna's reply. `history` is the thread so far, used to vary wording and to answer follow-ups in
 * context. `profile` is the summary from buildLunaProfile and adds one personal line when relevant.
 */
export function replyTo(input, { lang = 'en', profile = {}, history = [] } = {}) {
  const text = String(input || '').trim()
  const isAmharic = lang === 'am' || ETHIOPIC.test(text)
  const bank = isAmharic ? REPLIES.am : REPLIES.en
  const lastLuna = [...history].reverse().find((item) => item.role === 'luna')
  const lastTopic = lastLuna?.topic || null
  const variant = history.filter((item) => item.role === 'luna').length

  if (!text) return { text: bank.unknown[0], topic: 'unknown' }

  let topic = topicFor(text, lastTopic) || 'unknown'
  if (topic === 'followup') topic = lastTopic || 'fragment'

  let line = topic === 'fragment'
    ? pick(bank.fragment, variant)
    : pick(bank[topic] || bank.unknown, variant)

  if (profile.phase && ['period', 'mood', 'body'].includes(topic)) {
    const phaseNote = isAmharic
      ? { menstrual: 'አሁን የወር አበባ ጊዜ ላይ ያለሽ ይመስላል።', follicular: 'አሁን ጉልበት እየጨመረ ያለበት ጊዜ ላይ ያለሽ ይመስላል።', ovulatory: 'አሁን ከፍታ ላይ ያለሽ ይመስላል።', luteal: 'አሁን ዝግ እያለ ያለ ጊዜ ላይ ያለሽ ይመስላል።' }
      : { menstrual: 'You’re in your period phase, so gentleness is the right pace.', follicular: 'You’re in the rising phase, when energy often climbs.', ovulatory: 'You’re near your peak phase, which many people find brighter.', luteal: 'You’re in the winding-down phase, so protecting your sleep matters.' }
    line = `${line} ${phaseNote[profile.phase] || ''}`.trim()
  }

  return { text: line, topic }
}

const dayDifference = (fromKey, toDate) => {
  const from = parseDateKey(fromKey)
  if (!from) return null
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
  return Math.round((b - a) / 86400000)
}

/**
 * The summary the AI endpoint accepts. It holds only counts, phases, averages, and the last period
 * start. Notes and intimacy entries are never included.
 */
export function toServerSummary(checkins = {}, profile = {}, today = new Date()) {
  const keys = Object.keys(checkins).filter((key) => parseDateKey(key)).sort()
  const phaseCounts = {}
  keys.forEach((key) => {
    const phase = checkins[key]?.phase
    if (phase) phaseCounts[phase] = (phaseCounts[phase] || 0) + 1
  })
  const entries = keys.map((key) => checkins[key] || {})
  const average = (field) => {
    const values = entries.map((entry) => entry[field]).filter(Number.isFinite)
    return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null
  }
  const mostCommonPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const recentCheckIns = keys.slice(-8).reverse().map((key) => ({
    daysAgo: dayDifference(key, today),
    phase: checkins[key]?.phase || 'unknown',
    mood: checkins[key]?.mood ?? null,
    energy: checkins[key]?.energy ?? null,
  }))
  return {
    checkInCount: keys.length,
    averageMood: average('mood'),
    averageEnergy: average('energy'),
    phaseCounts,
    mostCommonPhase,
    lastPeriodStartDate: profile.lastPeriodStart || null,
    averageCycleLength: null,
    cycleLengthObservations: 0,
    recentCheckIns,
  }
}
