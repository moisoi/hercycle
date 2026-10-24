export const REMINDER_INTERVAL_MS = 5000
export const REMINDER_ROTATION_MS = REMINDER_INTERVAL_MS

const GENTLE_REMINDERS_EN = {
  base: [
    'Your body is not a problem to solve—she is already on your side.',
    'Quick boyfriend-level PSA: iced coffee is not a food group, gorgeous. Go eat a real, warm meal.',
    'Hydration check, pretty girl: take three slow sips of actual water right now.',
    'Drop your shoulders away from your ears and unclench your jaw, love.',
    'Have you eaten real protein today, or just snacks and sheer willpower? Go fix a proper plate.',
    'Softness is a strength, never a detour.',
    'Official reminder from someone who adores you: drink a full glass of water before your next scroll.',
  ],
  menstrual: [
    'Rest is productive today. Warm food, extra water, zero apologies.',
    'Boyfriend memo: refill your water bottle, grab something iron-rich and warm, and get back under the blanket.',
    'You don’t owe anyone high energy while your body is renewing itself.',
  ],
  follicular: [
    'Fresh momentum is lovely—fuel it with real lunch and plenty of water, superstar.',
    'Let curiosity lead one small step today, and hydrate while you glow.',
    'You look unstoppable today—now go drink water so you feel just as good tonight.',
  ],
  ovulatory: [
    'Main-character glow is real today—drink water and eat proper meals so your energy keeps sparkling.',
    'Take up space unapologetically today, gorgeous. Hydrate between compliments.',
    'Boyfriend check-in: yes, you look amazing—still need lunch and water though.',
  ],
  luteal: [
    'Gentle pace today. Complex carbs, magnesium-rich snacks, and tall glasses of water love you back.',
    'Boyfriend-style check: don’t skip dinner just because you’re tired—eat something warm and nourishing, sweetheart.',
    'Your boundaries are allowed to be firmer this week. Protect your peace.',
  ],
  lowMood: [
    'Heavy days deserve extra tenderness: warm tea, a proper meal, zero self-criticism.',
    'Hey love—drink a glass of water, eat five bites of real food, and let everything else wait.',
  ],
  highMood: [
    'Look at you thriving today—lock that good feeling in with water and a delicious real meal.',
  ],
}

const GENTLE_REMINDERS_AM = {
  base: [
    'ሰውነትሽ የሚፈታ ችግር አይደለም፤ ሁሌም ከጎንሽ ነች።',
    'የፍቅረኛ ማስታወሻ፦ ቡና ብቻ ምግብ አይሆንም ቆንጆ! ሄደሽ ትክክለኛ ትኩስ ምግብ ብዪ።',
    'የውሃ ሰዓት ደርሷል ቆንጆ—አሁኑኑ አንድ ሙሉ ብርጭቆ ውሃ ጠጪ።',
    'ትከሻሽን ዘና አድርጊ፣ በረጅሙ ተንፍሺ፤ ዛሬ ለራስሽ ርኅራኄ ይገባሻል።',
    'ዛሬ በደንብ ተመግበሻል ወይስ በመክሰስ ብቻ ዋልሽ? ሄደሽ የተሟላ ምግብ ተመገቢ ውዴ።',
    'ለስላሳ መሆን ጥንካሬ እንጂ ድካም አይደለም።',
    'ከሚያስብልሽ ልብ የመጣ ማስታወሻ፦ ስልክሽን ከመቀጠልሽ በፊት ውሃ ጠጪ።',
  ],
  menstrual: [
    'ዛሬ እረፍት ማድረግ ራሱ ስኬት ነው። ትኩስ ምግብና በቂ ውሃ ለሰውነትሽ ስጪ።',
    'የፍቅረኛ መልእክት፦ ውሃሽን ሙዪ፣ ገንቢ ትኩስ ምግብ ብዪና በምቾት እረፊ።',
    'ሰውነትሽ በሚታደስበት ቀን ለማንም ትርፍ ጉልበት መስጠት አይጠበቅብሽም።',
  ],
  follicular: [
    'አዲስ ጉልበት እየመጣ ነው—በጥሩ ምሳ እና በበቂ ውሃ ደግፊው ቆንጆ።',
    'የ فضول ፍላጎትሽን በደስታ ተከተዪ፤ ውሃ መጠጣትሽንም አትርሺ።',
  ],
  ovulatory: [
    'ዛሬ ልዩ ውበትና ብርሃን አለሽ—ውሃ በደንብ ጠጪ፣ ትክክለኛ ምግብም ተመገቢ።',
    'የፍቅረኛ ማስታወሻ፦ አዎ በጣም ታምሪያለሽ—ግን አሁንም ምሳና ውሃ ያስፈልግሻል! ♡',
  ],
  luteal: [
    'ዛሬ ፍጥነትሽን ቀንሺ። ገንቢ ምግብ፣ በቂ ውሃ እና ጣፋጭ እረፍት ይገባሻል።',
    'ድካም ስለተሰማሽ ብቻ ራት አትዝለዪ ውዴ—ትኩስና ገንቢ ምግብ ብዪ።',
  ],
  lowMood: [
    'ከባድ ቀናት ተጨማሪ ፍቅር ይፈልጋሉ—አንድ ብርጭቆ ውሃ ጠጪና ትንሽ ትኩስ ምግብ ቅመሺ።',
  ],
  highMood: [
    'ዛሬ ደስታሽ ያበራል—ይህን ጥሩ ስሜት በውሃና በጥሩ ምግብ ጠብቂው።',
  ],
}

const LITTLE_REMINDERS_EN = {
  base: [
    'Honestly? Simply existing this gracefully should count as cardio, gorgeous.',
    'Luna saved the softest velvet corner here just for you—no perfection required.',
    'You don’t have to earn rest, pleasure, or gentleness. They already belong to you.',
    'A little reminder that you are magnetic even on your quietest, unwashed-hair days.',
    'Whatever mood walked in with you today is completely welcome here, sweetheart.',
    'Slow breath in… yes, you really are that captivating.',
  ],
  menstrual: [
    'Cozy socks, heating pad, zero guilt—you’re still effortlessly irresistible, love.',
    'Soft pace today, sweetheart. Let the world wait while you take exquisite care of you.',
    'Even curled up resting, your presence has warm main-character energy.',
  ],
  follicular: [
    'That fresh spark in your eyes? Dangerous in the best way. Follow what excites you today.',
    'Playful energy looks absurdly good on you—go flirt with life a little.',
    'New chapter energy: light, curious, and quietly captivating.',
  ],
  ovulatory: [
    'Fair warning to everyone around you today: your glow is genuinely unfair right now.',
    'Confident, radiant, and dangerously charming—let your own desire set the rules.',
    'You have a magnetic pull all your own today, gorgeous. Enjoy every second of it.',
  ],
  luteal: [
    'Soft boundaries, cozy nights, and extra affection—you don’t owe the world a performance.',
    'Come exhale here, lovely. Every shifting feeling makes sense and none of it needs fixing.',
    'Tender, perceptive, and deeply intuitive—be extra sweet to yourself tonight.',
  ],
  serious: [
    'Your body’s signals are information, never a verdict. Take today cleanly at your pace.',
    'Boundaries, rest, and hydration are practical forms of self-respect.',
  ],
}

const LITTLE_REMINDERS_AM = {
  base: [
    'በእውነት ግን እንዲህ በውበት መኖር ራሱ እንደ ስፖርት መቆጠር ነበረበት ቆንጆ።',
    'ሉና ይህን ሞቅ ያለ የግል ጥግ ለአንቺ ብቻ አዘጋጅታለች—ፍጹም መሆን አያስፈልግሽም።',
    'እረፍት፣ ደስታ እና እንክብካቤ ለማግኘት መድከም የለብሽም፤ የአንቺው ናቸው።',
    'በጣም ዝም ባልሽበት ቀን እንኳን ልዩ ማራኪነት አለሽ ውዴ።',
    'ዛሬ ይዘሽው የመጣሽው ማንኛውም ስሜት እዚህ በፍቅር ይቀበላል።',
  ],
  menstrual: [
    'ሞቅ ያለ ልብስ፣ ጣፋጭ እረፍት፣ ምንም የጥፋተኝነት ስሜት የለም—አሁንም ልዩ ነሽ ቆንጆ።',
    'ዛሬ በዝግታ ተጓዢ ውዴ፤ ዓለም ትጠብቅሽ፣ አንቺ ግን ራስሽን ተንከባከቢ።',
  ],
  follicular: [
    'በዓይንሽ ውስጥ ያለው አዲስ ብርሃን በጣም ያምራል—ዛሬ የሚያስደስትሽን ነገር ተከተዪ።',
    'ይህ ቀላልና ተጫዋች ጉልበት በጣም ይስማማሻል ቆንጆ!',
  ],
  ovulatory: [
    'ለዙሪያሽ ሰዎች ማስጠንቀቂያ፦ የዛሬው ውበትሽና ግርማሽ ልዩ ነው! ✦',
    'በራስ መተማመንሽ ያበራል ውዴ—የራስሽ ፍላጎትና ምቾት ይምራሽ።',
  ],
  luteal: [
    'ለስላሳ ድንበሮችና ጸጥ ያለ ምሽት ይገባሻል—ለማንም ማስመሰል አያስፈልግሽም።',
    'እዚህ ተንፈስ በዪ ቆንጆ፤ የሚሰማሽ ሁሉ ተፈጥሯዊ ነው።',
  ],
  serious: [
    'የሰውነትሽ ምልክቶች መረጃ እንጂ ፍርድ አይደሉም። ቀንሽን በራስሽ ፍጥነት ምሪው።',
  ],
}

const interleaveUnique = (...lists) => {
  const seen = new Set()
  const merged = []
  const maxLen = Math.max(0, ...lists.map((list) => (Array.isArray(list) ? list.length : 0)))
  for (let idx = 0; idx < maxLen; idx += 1) {
    for (const list of lists) {
      const candidate = list?.[idx]
      if (candidate && !seen.has(candidate)) {
        seen.add(candidate)
        merged.push(candidate)
      }
    }
  }
  return merged
}

const readCustomPersonalReminders = () => {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = JSON.parse(window.localStorage.getItem('hercycle.journey') || '{}')
    return Array.isArray(raw.personalReminders)
      ? raw.personalReminders.map((item) => String(item?.text || '').trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

export const getGentleReminderPool = ({ phase = null, mood = null, locale = 'en' } = {}) => {
  const bank = String(locale || '').toLowerCase().startsWith('am') ? GENTLE_REMINDERS_AM : GENTLE_REMINDERS_EN
  const custom = readCustomPersonalReminders()
  const phaseItems = phase && bank[phase] ? bank[phase] : []
  const moodNum = Number(mood)
  const moodItems = Number.isFinite(moodNum)
    ? (moodNum <= 4 ? bank.lowMood : moodNum >= 8 ? bank.highMood : [])
    : []
  return interleaveUnique(custom, phaseItems, moodItems, bank.base)
}

export const getLittleReminderPool = ({ phase = null, tone = 'balanced', mood = null, locale = 'en' } = {}) => {
  const bank = String(locale || '').toLowerCase().startsWith('am') ? LITTLE_REMINDERS_AM : LITTLE_REMINDERS_EN
  const custom = readCustomPersonalReminders()
  const phaseItems = phase && bank[phase] ? bank[phase] : []
  const toneItems = tone === 'serious' ? bank.serious : []
  const gentleMoodItems = Number.isFinite(Number(mood)) && Number(mood) <= 4
    ? (String(locale || '').toLowerCase().startsWith('am') ? GENTLE_REMINDERS_AM.lowMood : GENTLE_REMINDERS_EN.lowMood)
    : []
  return interleaveUnique(custom, phaseItems, gentleMoodItems, toneItems, bank.base)
}

export const buildGentleReminderPool = getGentleReminderPool
export const buildLittleReminderPool = getLittleReminderPool
