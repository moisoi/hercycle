// Luna is an on-device companion. Replies are generated locally, so nothing a user types
// is sent to a third-party AI service. The tone is warm, witty, and frank about bodies,
// pleasure, and sex, but Luna never writes graphic explicit content. Health questions are
// answered with education, and anything urgent points to a clinician.

const ETHIOPIC = /[\u1200-\u137F]/

const PHASE_NAMES = {
  en: { menstrual: 'period', follicular: 'follicular', ovulatory: 'ovulation', luteal: 'luteal' },
  am: { menstrual: 'የወር አበባ', follicular: 'ፎሊኩላር', ovulatory: 'የእንቁላል', luteal: 'ሉቲያል' },
}

const INTENTS = [
  {
    id: 'urgent',
    priority: 3,
    en: ['heavy bleeding', 'soaked', 'fever', 'faint', 'fainted', 'severe', 'chest pain', 'emergency', 'blood clots'],
    am: ['ብዙ ደም', 'ትኩሳት', 'ራስ ስቶ', 'ከባድ ህመም'],
    reply: {
      en: [
        'That sounds like something a clinician should look at soon, especially heavy bleeding, fever, or severe pain. Please contact a health professional or urgent care now. I am here for everything else.',
      ],
      am: ['ይህ በፍጥነት ሐኪም ማየት ያለበት ሊሆን ይችላል፣ በተለይ ብዙ ደም መፍሰስ፣ ትኩሳት ወይም ከባድ ህመም ካለ። እባክሽ አሁን የጤና ባለሙያ ወይም የድንገተኛ ክፍል ጋር ተገናኚ።'],
    },
  },
  {
    id: 'explicit',
    priority: 2,
    en: ['fuck', 'fucking', 'dick', 'cock', 'pussy', 'naked', 'horny', 'wet', 'orgasm', 'suck', 'cum', 'nasty', 'sexy'],
    am: ['ወሲብ ብቻ', 'ራቁት'],
    reply: {
      en: [
        'Ooh, bold. I like bold. I will keep it witty and real rather than graphic. Are we talking about what feels good, how to make things comfortable, or how to ask for exactly what you want?',
        'Somebody is feeling spicy. Let us keep it sharp and honest: what would you like to know about pleasure, comfort, or talking to your partner about it?',
      ],
      am: ['ኧረ ደፋር ነሽ! ደፋርነትን እወዳለሁ። ዝርዝሩን ሳይሆን ጠቃሚውን ነገር በሳቅ እናውራ፦ ምን ይሰማሻል፣ እንዴት ምቾት ይሰጣል፣ ወይስ ምን እንደምትፈልጊ ለአጋርሽ እንዴት ትነግሪያለሽ?'],
    },
  },
  {
    id: 'sexpain',
    priority: 2,
    en: ['pain during sex', 'hurts during sex', 'painful sex', 'dryness', 'dry', 'lube', 'lubrication', 'lubricant', 'sore'],
    am: ['በወሲብ ጊዜ ህመም', 'ድርቀት'],
    reply: {
      en: [
        'Pain during sex is not something to just push through. Try more lubricant, slower pacing, and a clear signal to pause. If it keeps happening, a clinician can help figure out why.',
        'Dryness is really common and very fixable. Water or silicone lube, more foreplay, and a check-in with yourself before things start all help. Persistent pain is worth a clinician visit.',
      ],
      am: ['በወሲብ ጊዜ ህመም መታገስ አያስፈልግም። ቅባት (ሉብ) ጨምሪ፣ በዝግታ ሂጂ፣ እና ማቆም እንደምትፈልጊ ግልጽ ምልክት ስጪ። ደጋግሞ ከተከሰተ ሐኪም ጋር ተማከሪ።'],
    },
  },
  {
    id: 'contraception',
    priority: 1,
    en: ['contraception', 'contraceptive', 'birth control', 'condom', 'condoms', 'protection', 'pill', 'iud', 'implant', 'sti', 'std'],
    am: ['ኮንዶም', 'ጥንቃቄ', 'የእርግዝና መከላከያ'],
    reply: {
      en: [
        'Choosing contraception is personal. A clinician or pharmacist can walk you through the options. Condoms also help protect against STIs, which hormonal methods do not do on their own.',
      ],
      am: ['የእርግዝና መከላከያ ምርጫ የግልሽ ነው። ሐኪም ወይም ፋርማሲስት ሁሉንም አማራጮች ሊያስረዱሽ ይችላሉ። ኮንዶም የአባላዘር በሽታዎችን ለመከላከልም ይረዳል።'],
    },
  },
  {
    id: 'fertility',
    priority: 1,
    en: ['ovulation', 'ovulate', 'fertile', 'fertility', 'pregnant', 'pregnancy', 'conceive'],
    am: ['እንቁላል', 'እርግዝና', 'ነፍሰጡር'],
    reply: {
      en: [
        'Ovulation usually happens about 14 days before your next period, but it varies from person to person. The app estimate is a rough guide, not a guarantee. If pregnancy is a concern, a test or a clinician is the right next step.',
      ],
      am: ['እንቁላል መውጣት ብዙውን ጊዜ ቀጣዩ የወር አበባ ከመምጣቱ ~14 ቀን ቀደም ብሎ ነው፣ ግን ይለያያል። የመተግበሪያው ግምት መመሪያ ነው እንጂ ዋስትና አይደለም። እርግዝና የሚያሳስብሽ ከሆነ ምርመራ ወይም ሐኪም ቀጣዩ እርምጃ ነው።'],
    },
  },
  {
    id: 'cramps',
    priority: 1,
    en: ['cramp', 'cramps', 'cramping', 'ache', 'aching', 'pain', 'hurts', 'colic', 'bloated', 'bloating'],
    am: ['ቁርጠት', 'ህመም', 'ሆድ'],
    phaseLine: true,
    reply: {
      en: [
        'Cramps are common and often ease with a warm pack, gentle movement, and water. If the pain is severe or keeps getting worse, talk to a clinician.',
        'Period cramps can be rough. Heat, a slow walk, and something warm to drink often help. Tell me if it feels different from usual and I will help you think it through.',
      ],
      am: ['ቁርጠት የተለመደ ነው። ሙቅ ነገር በሆድሽ ላይ ማድረግ፣ በዝግታ መንቀሳቀስ እና ውሃ መጠጣት ብዙ ጊዜ ያቃልለዋል። ከባድ ከሆነ ወይም ከጊዜ ወደ ጊዜ ከጨመረ ሐኪም ጋር ተማከሪ።'],
    },
  },
  {
    id: 'period',
    priority: 1,
    en: ['period', 'periods', 'bleeding', 'flow', 'blood', 'spotting', 'late'],
    am: ['የወር አበባ', 'ደም', 'ዑደት'],
    phaseLine: true,
    reply: {
      en: [
        'Periods vary a lot: flow, length, and timing all differ between people and between months. Logging dates helps you learn your own normal, with no grades attached.',
      ],
      am: ['የወር አበባ ይለያያል፣ ፍሰቱም ሆነ ርዝመቱ ይለያያል። ቀኖችን መመዝገብ የራስሽን የተለመደ ሁኔታ ለማወቅ ይረዳል፣ ውጤት አያስፈልግም።'],
    },
  },
  {
    id: 'mood',
    priority: 1,
    en: ['mood', 'moody', 'sad', 'anxious', 'anxiety', 'emotional', 'stress', 'stressed', 'cry', 'crying', 'irritable', 'overwhelmed'],
    am: ['ስሜት', 'ጭንቀት', 'አዘንኩ', 'አለቀስኩ'],
    phaseLine: true,
    reply: {
      en: [
        'Mood can dip for many reasons, and cycle hormones are only one of them. Try naming the feeling out loud, taking a short walk, or calling someone you trust.',
        'That sounds heavy. You do not have to fix it right now. Let us start small: what is the loudest feeling today?',
      ],
      am: ['ስሜት ለብዙ ምክንያቶች ሊቀንስ ይችላል፣ የሆርሞን ለውጥ አንዱ ብቻ ነው። ስሜትሽን ጮክ ብሎ መናገር፣ አጭር ጉዞ ወይም ያመንሽውን ሰው መደወል ሊረዳ ይችላል።'],
    },
  },
  {
    id: 'energy',
    priority: 1,
    en: ['tired', 'tiredness', 'exhausted', 'fatigue', 'sleep', 'sleepy', 'energy', 'drained', 'insomnia'],
    am: ['ድካም', 'እንቅልፍ', 'ጉልበት'],
    phaseLine: true,
    reply: {
      en: [
        'Low energy is real. Protein, a short walk, and an earlier wind-down can help. Rest counts as productive, even when it does not look like it.',
      ],
      am: ['ድካም እውነተኛ ነው። ፕሮቲን ያለው ምግብ፣ አጭር የእግር ጉዞ እና ቀደም ብሎ ማረፍ ሊረዳ ይችላል። ማረፍም ስራ ነው!'],
    },
  },
  {
    id: 'food',
    priority: 1,
    en: ['hungry', 'food', 'eat', 'eating', 'water', 'drink', 'thirsty', 'meal', 'meals'],
    am: ['ምግብ', 'ውሃ', 'ርቦኛል', 'ተጠምቻለሁ'],
    reply: {
      en: [
        'Boyfriend voice on: have you had water today? And an actual meal, not just coffee and vibes? Drink up and eat something warm, babe. 💧🍲',
        'Water first, then food. Your body is doing a lot right now, so feed it like you mean it. 💧',
      ],
      am: ['የወንድ ጓደኛ ድምጽ ልጠቀም፦ ዛሬ ውሃ ጠጥተሻል? ቡና ብቻ አይደለም፣ እውነተኛ ምግብ ብሉ። ውሃ ጠጪ፣ ሞቅ ያለ ነገር ብዪ፣ ውዴ! 💧🍲'],
    },
  },
  {
    id: 'libido',
    priority: 1,
    en: ['libido', 'desire', 'want sex', 'sex drive', 'turned on', 'arousal', 'aroused', 'craving'],
    am: ['ፍላጎት', 'መፈለግ', 'ስሜት ይሰማኛል'],
    phaseLine: true,
    reply: {
      en: [
        'Desire moves around with mood, stress, sleep, and cycle phase. Whatever you feel is valid, and nothing has to be scheduled or performed.',
      ],
      am: ['ፍላጎት ከስሜት፣ ከጭንቀት፣ ከእንቅልፍና ከዑደት ደረጃ ጋር ይለዋወጣል። ያለሽ ስሜት ትክክል ነው፣ ምንም መርሃ ግብር ማውጣት አያስፈልግም።'],
    },
  },
  {
    id: 'sex',
    priority: 1,
    en: ['sex', 'sexual', 'intimacy', 'intimate', 'kiss', 'kissing', 'bed', 'foreplay', 'partner', 'boyfriend', 'husband'],
    am: ['ወሲብ', 'መሳሳም', 'አጋር', 'ፍቅር'],
    reply: {
      en: [
        'Sex should feel good and happen on your terms. Lube, slowing down, and telling your partner what works make a huge difference. You can change your mind at any point.',
        'Good sex is mostly communication with better timing. Try saying one thing you like and one thing you want to try next.',
      ],
      am: ['ወሲብ ደስ ሊያሰኝ እና በአንቺ ፍላጎት ብቻ መሆን አለበት። ቅባት፣ በዝግታ መሄድ እና የሚጠቅምሽን ለአጋርሽ መንገር ብዙ ይለውጣል። በማንኛውም ጊዜ ሃሳብሽን መቀየር ትችያለሽ።'],
    },
  },
  {
    id: 'flirt',
    priority: 1,
    en: ['cute', 'hot', 'handsome', 'miss you', 'flirt', 'beautiful', 'gorgeous', 'date', 'kiss me'],
    am: ['ቆንጆ', 'ናፍቀሽኛል', 'ናፍቆት'],
    reply: {
      en: [
        'Aww, you are making me blush, and I do not even have cheeks. Tell me one thing that made you smile today. 😉',
        'Flattery accepted, and returned with interest. Now, what is the best thing that happened to you this week?',
      ],
      am: ['ኧረ ታሳፍሪኛለሽ! ዛሬ ፈገግ ያሰኘሽን አንድ ነገር ንገሪኝ። 😉'],
    },
  },
  {
    id: 'cycle',
    priority: 1,
    en: ['cycle', 'phase', 'day', 'days', 'normal', 'regular', 'irregular', 'explain', 'why'],
    am: ['ዑደት', 'ደረጃ', 'ቀን'],
    phaseLine: true,
    reply: {
      en: [
        'Your cycle is a monthly rhythm, not a report card. Tell me what you are curious about and I will explain it simply.',
      ],
      am: ['ዑደትሽ የወር ምት ነው፣ የውጤት ካርድ አይደለም። ምን ማወቅ እንደምትፈልጊ ንገሪኝ፣ በቀላሉ አስረዳሻለሁ።'],
    },
  },
  {
    id: 'identity',
    priority: 1,
    en: ['who are you', 'what are you', 'luna', 'your name'],
    am: ['ማን ነሽ', 'ስምሽ', 'ሉና'],
    reply: {
      en: [
        'I am Luna, your companion for cycle questions, mood, and the things you are too curious to Google at 2am. Ask me anything.',
      ],
      am: ['እኔ ሉና ነኝ፣ ለዑደት ጥያቄዎች፣ ለስሜት እና ምሽት ላይ ብቻ ልትጠይቂኝ ለምትፈሪው ነገር ጓደኛሽ። ማንኛውንም ጠይቂኝ።'],
    },
  },
  {
    id: 'thanks',
    priority: 1,
    en: ['thanks', 'thank you', 'thx', 'ty'],
    am: ['አመሰግናለሁ', 'ታመሰግናለሽ'],
    reply: {
      en: ['Anytime. You are doing better than you think.'],
      am: ['በማንኛውም ጊዜ። ካሰብሽው በላይ ጥሩ እየሰራሽ ነው።'],
    },
  },
  {
    id: 'greeting',
    priority: 0,
    en: ['hi', 'hello', 'hey', 'morning', 'evening', 'yo', 'sup'],
    am: ['ሰላም', 'ሰላም ነሽ', 'እንደምን'],
    phaseLine: true,
    reply: {
      en: ['Hey you 🌙 How is your body and mood today?', 'Hi! Good to see you. What is on your mind?'],
      am: ['ሰላም ውዴ 🌙 ዛሬ ሰውነትሽ እና ስሜትሽ እንዴት ነው?'],
    },
  },
]

const FOLLOW_UP = { en: ['tell me more', 'more', 'why', 'how', 'explain', 'and then', 'go on'], am: ['ተጨማሪ', 'ለምን', 'እንዴት'] }

const FALLBACK = {
  en: [
    'Tell me a little more. Is it your body, your mood, or the two of you? Even a word or two works.',
    'I want to get this right. Is it about your cycle, your mood, your body, or intimacy?',
  ],
  am: ['ትንሽ ተጨማሪ ንገሪኝ። ስለ ሰውነትሽ፣ ስለ ስሜትሽ ወይስ ስለ እናንተ ሁለታችሁ ነው?'],
}

const normalise = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokensOf = (text) => text.split(' ').filter(Boolean)

function scoreIntent(intent, text, tokens) {
  let score = 0
  for (const keyword of intent.en || []) {
    if (keyword.includes(' ')) {
      if (text.includes(keyword)) score += 2
    } else if (tokens.some((token) => token === keyword || (keyword.length >= 4 && token.startsWith(keyword)))) {
      score += 1
    }
  }
  // Amharic words attach to suffixes, so they are matched as substrings.
  for (const keyword of intent.am || []) {
    if (text.includes(keyword)) score += 1
  }
  return score
}

const pick = (list, index) => list[index % list.length]

function phaseLine({ profile, lang }) {
  if (!profile?.phase || !profile.day) return ''
  const name = PHASE_NAMES[lang]?.[profile.phase] || profile.phase
  return lang === 'am'
    ? ` አሁን የ${name} ደረጃ ላይ ነሽ (ቀን ${profile.day})፣ ስለዚህ ይህ የተለመደ ሊሆን ይችላል።`
    : ` You are on day ${profile.day} of your ${name} phase, so this may be part of that rhythm.`
}

/**
 * Replies to one message. `history` is the conversation so far, used to vary replies and to
 * resolve follow-ups like "tell me more" against the last topic.
 */
export function replyTo(input, { lang = 'en', profile = null, history = [] } = {}) {
  const raw = String(input || '').trim()
  const text = normalise(raw)
  const useLang = ETHIOPIC.test(raw) ? 'am' : lang === 'am' ? 'am' : 'en'
  // Vary by how many replies Luna has already given, so repeats are rare.
  const variant = history.filter((turn) => turn.role === 'luna').length
  const lastTopic = [...history].reverse().find((turn) => turn.role === 'luna' && turn.topic)?.topic || null

  if (!text) {
    return { text: pick(FALLBACK[useLang], variant), topic: null }
  }

  const tokens = tokensOf(text)
  const isFollowUp = FOLLOW_UP.en.some((phrase) => text === phrase || text.startsWith(`${phrase} `)) ||
    FOLLOW_UP.am.some((phrase) => raw.includes(phrase))

  if (isFollowUp && lastTopic) {
    const intent = INTENTS.find((item) => item.id === lastTopic)
    if (intent) {
      return { text: pick(intent.reply[useLang] || intent.reply.en, variant + 1), topic: intent.id }
    }
  }

  let best = null
  let bestScore = 0
  for (const intent of INTENTS) {
    const score = scoreIntent(intent, text, tokens) + (intent.priority || 0) * 0.01
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }

  if (!best || bestScore < 1) {
    return { text: pick(FALLBACK[useLang] || FALLBACK.en, variant), topic: null }
  }

  const replies = best.reply[useLang] || best.reply.en
  const out = pick(replies, variant)
  return { text: best.phaseLine ? out + phaseLine({ profile, lang: useLang }) : out, topic: best.id }
}

export const LUNA_INTENT_IDS = INTENTS.map((intent) => intent.id)
