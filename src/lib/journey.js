import { supabase } from './supabase'

export const JOURNEY_STORAGE_KEY = 'hercycle.journey'

export const GARDEN_STAGES = [
  {
    stage: 1,
    minPoints: 0,
    key: 'seedbed',
    nameEn: 'Sunlit Seedbed',
    nameAm: 'ፀሐያማ የዘር መደብ',
    subtitleEn: 'Open garden earth holding quiet seeds of self-understanding—never rushing.',
    subtitleAm: 'ለትንንሽ የራስ ግንዛቤ እርምጃዎች የተዘጋጀ ለምለም መደብ።',
  },
  {
    stage: 2,
    minPoints: 20,
    key: 'sprouts',
    nameEn: 'Morning Dew Sprouts',
    nameAm: 'የማለዳ ጤዛ ቡቃያዎች',
    subtitleEn: 'First tender shoots emerging—never wilting, even if weeks pass between check-ins.',
    subtitleAm: 'የመጀመሪያዎቹ ለምለም ቅጠሎች—በጸጥታ ሳምንታትም ፈጽሞ አይጠውልጉም።',
  },
  {
    stage: 3,
    minPoints: 50,
    key: 'tendrils',
    nameEn: 'Leafy Stems & Calyx Buds',
    nameAm: 'ለምለም ግንዶችና እምቡጦች',
    subtitleEn: 'Rooted botanical stems and early flower buds gathering steady warmth.',
    subtitleAm: 'ለምለም ቅርንጫፎችና እምቡጦች በሙቀት እያደጉ ናቸው።',
  },
  {
    stage: 4,
    minPoints: 90,
    key: 'bloom',
    nameEn: 'Open Garden Bloom',
    nameAm: 'ፈክቶ ያበበ የአትክልት ስፍራ',
    subtitleEn: 'Chamomile, lavender, and rosewood blossoms opening freely under open sky.',
    subtitleAm: 'ፈክተው ያበቡ አበቦች ወርቃማ ቢራቢሮዎችን እየሳቡ ነው።',
  },
  {
    stage: 5,
    minPoints: 140,
    key: 'sanctuary',
    nameEn: 'Thriving Open Sanctuary',
    nameAm: 'ብሩህ ሕያው የአትክልት ስፍራ',
    subtitleEn: 'Every seed in full living bloom—thriving at your own rhythm without pressure.',
    subtitleAm: 'የግል የአትክልት ስፍራሽ ሙሉ በሙሉ አብቧል—ሁሌም በራስሽ ፍጥነት ያበራል።',
  },
]

export const FLEXIBLE_CADENCES = [
  {
    id: 'unhurried',
    titleEn: 'Whenever I feel like it',
    titleAm: 'በፈለግኩበት ጊዜ ብቻ',
    descEn: 'Completely freeform—check in once a week, once a month, or whenever something feels worth noting.',
    descAm: 'ያለ ምንም ገደብ—በሳምንትም ሆነ በወር አንዴ በፈለግሽ ጊዜ ብቻ።',
  },
  {
    id: 'weekly-gentle',
    titleEn: 'One or two calm moments a week',
    titleAm: 'በሳምንት አንድ ወይም ሁለት ጊዜ',
    descEn: 'A light rhythm for noticing broader shifts without daily tracking fatigue.',
    descAm: 'ያለ ዕለታዊ ድካም አጠቃላይ ለውጦችን በረጋ መንፈስ ለማስተዋል።',
  },
  {
    id: 'phase-transitions',
    titleEn: 'Around phase shifts & period days',
    titleAm: 'በወቅት ሽግግር እና በወር አበባ ቀናት',
    descEn: 'Focus only on key transitions when energy or flow noticeably changes.',
    descAm: 'ጉልበት ወይም ፈሳሽ በሚቀየርባቸው ዋና ቀናት ላይ ብቻ ማተኮር።',
  },
  {
    id: 'quiet-daily',
    titleEn: 'Brief daily reflection (zero streak rules)',
    titleAm: 'አጭር ዕለታዊ ምልከታ (ያለ ተከታታይ ግዴታ)',
    descEn: 'Thirty quiet seconds when convenient—skipping days never resets anything.',
    descAm: 'ሲመችሽ ለ30 ሰከንድ—ቀን መዝለል ምንም ነገር አይቀንስም።',
  },
]

export const JOURNAL_THEMES = [
  {
    id: 'neutral',
    accentKey: 'linen',
    swatch: '#78756E',
    surfacePreview: 'linear-gradient(135deg, #FAF9F6 0%, #F1EFEA 100%)',
    titleEn: 'Warm Stone & Oat (Neutral)',
    titleAm: 'ገለልተኛ የድንጋይ እና አጃ ቀለም',
    descEn: 'Calm, understated neutral linen & stone—free of pink or floral accents.',
    descAm: 'ጸጥ ያለ፣ ከሮዝ ቀለም ነጻ የሆነ የተረጋጋ ገጽታ።',
  },
  {
    id: 'rosewood',
    accentKey: 'rosewood',
    swatch: '#8F526F',
    surfacePreview: 'linear-gradient(135deg, #FFFDF9 0%, #F9EDF2 100%)',
    titleEn: 'Botanical Rosewood',
    titleAm: 'የሮዝዉድ ውበት',
    descEn: 'HerCycle’s signature warm ivory and muted rosewood editorial palette.',
    descAm: 'ዋና ለስላሳ የሮዝዉድ እና ክሬም ቀለም።',
  },
  {
    id: 'addis',
    accentKey: 'addis',
    swatch: '#B8833C',
    surfacePreview: 'linear-gradient(135deg, #FFFDF8 0%, #F9F0DF 100%)',
    titleEn: 'Sunlit Ochre & Honey',
    titleAm: 'ወርቃማ ማለዳ እና ማር',
    descEn: 'Earthy golden warmth inspired by morning light and woven cotton.',
    descAm: 'የማለዳ ፀሐይና የጥጥ ሙቀት የሚሰጥ ወርቃማ ቀለም።',
  },
  {
    id: 'plum',
    accentKey: 'plum',
    swatch: '#6D4578',
    surfacePreview: 'linear-gradient(135deg, #FDFBFF 0%, #F1ECF7 100%)',
    titleEn: 'Evening Dusk Plum',
    titleAm: 'የምሽት ፕለም ጸጥታ',
    descEn: 'Serene twilight violet and cool botanical mist for quiet evenings.',
    descAm: 'ለምሽት እረፍት ተስማሚ የሆነ ጸጥ ያለ ወይንጠጅ ቀለም።',
  },
]

export const PERSONAL_INTENTIONS = [
  {
    id: 'gentle-reflection',
    code: '01',
    titleEn: 'Make quiet space for reflection',
    titleAm: 'ለሐቀኛ የዕለት ምልከታ ጸጥ ያለ ጊዜ መስጠት',
    descriptionEn: 'Notice how mood and energy feel today without labeling any day good or bad.',
    descriptionAm: 'ቀናትን ጥሩ ወይም መጥፎ ሳትዪ ስሜትሽንና ጉልበትሽን በርኅራኄ ማስተዋል።',
  },
  {
    id: 'cycle-literacy',
    code: '02',
    titleEn: 'Learn more about my cycle science',
    titleAm: 'የዑደቴን ሳይንስ በጥልቀት መረዳት',
    descriptionEn: 'Explore short, reviewed menstrual-health guides at your own curiosity pace.',
    descriptionAm: 'አጫጭር ሳይንሳዊ ትምህርቶችን በራስሽ ጊዜና ፍላጎት ማንበብ።',
  },
  {
    id: 'rest-without-guilt',
    code: '03',
    titleEn: 'Honor rest, nourishment, and hydration',
    titleAm: 'እረፍት፣ ምግብና ውሃን ያለ ጥፋተኝነት ስሜት ማክበር',
    descriptionEn: 'Treat quieter energy days as valid signals rather than productivity failures.',
    descriptionAm: 'ዝቅተኛ ጉልበት ያላቸውን ቀናት እንደ ተፈጥሯዊ ምልክት መቀበል።',
  },
  {
    id: 'body-autonomy',
    code: '04',
    titleEn: 'Keep boundaries and personal comfort first',
    titleAm: 'የግል ድንበርና ምቾቴን ሁሌም ማስቀደም',
    descriptionEn: 'Practice naming what feels supportive, comfortable, or off-limits without pressure.',
    descriptionAm: 'ምን እንደሚስማማሽና ምን እንደማይመችሽ በነጻነት መለየት።',
  },
]

export const LEARNING_COLLECTIONS = [
  {
    id: 'cycle-variability',
    categoryEn: 'Cycle Science',
    categoryAm: 'የዑደት ሳይንስ',
    readMinutes: 2,
    titleEn: 'Beyond the 28-Day Myth: How Real Cycles Work',
    titleAm: 'ከ28 ቀን አፈ-ታሪክ ባሻገር፦ እውነተኛ ዑደት እንዴት ይሠራል?',
    summaryEn:
      'Only ~13% of adult cycles are exactly 28 days. Healthy cycles commonly span 21–35 days, and most month-to-month shifts happen in the follicular phase before ovulation—not because your body is “late” or broken.',
    summaryAm:
      'ከአዋቂ ሴቶች መካከል ልክ በ28 ቀን የሚመጣ ዑደት ያላቸው 13% ገደማ ብቻ ናቸው። ጤናማ ዑደት ከ21 እስከ 35 ቀናት ሊረዝም ይችላል፤ የቀናት ለውጥም ብዙውን ጊዜ የሚፈጠረው እንቁላል ከመውጣቱ በፊት ባለው ፎሊኩላር ወቅት ነው።',
    takeawaysEn: [
      'Day 1 is the first day of full menstrual flow (not light pre-period spotting).',
      'Ovulation shifts when stress, travel, illness, or sleep changes pause the brain-ovary signal.',
      'Calendar estimates support personal reflection—never contraception or clinical diagnosis.',
    ],
    takeawaysAm: [
      'ቀን 1 የሚቆጠረው ሙሉ የወር አበባ ፈሳሽ ከጀመረበት ቀን ጀምሮ ነው።',
      'ጭንቀት፣ ጉዞ፣ ህመም ወይም የእንቅልፍ ለውጥ እንቁላል የሚወጣበትን ቀን ሊያራዝም ይችላል።',
      'የቀን መቁጠሪያ ግምቶች ለግንዛቤ እንጂ ለወሊድ መቆጣጠሪያ አያገለግሉም።',
    ],
    quiz: [
      {
        id: 'q1',
        questionEn: 'What counts as Cycle Day 1 when tracking your menstrual cycle?',
        questionAm: 'በዑደት አቆጣጠር "ቀን 1" ተብሎ የሚያዝው የትኛው ቀን ነው?',
        optionsEn: [
          'The day your period completely finishes',
          'The first day of full menstrual bleeding',
          'Exactly 14 days after your previous period',
        ],
        optionsAm: [
          'የወር አበባ ሙሉ በሙሉ ያለቀበት ቀን',
          'ሙሉ የወር አበባ ፈሳሽ የጀመረበት የመጀመሪያ ቀን',
          'ካለፈው የወር አበባ ልክ 14 ቀን በኋላ',
        ],
        correctIndex: 1,
        explanationEn:
          'Clinicians and researchers count Cycle Day 1 from the first day of full menstrual flow, counting forward until the start of the next period.',
        explanationAm:
          'የሕክምና ባለሙያዎች ቀን 1 ብለው የሚቆጥሩት ሙሉ የወር አበባ መፍሰስ የጀመረበትን የመጀመሪያ ቀን ነው።',
      },
      {
        id: 'q2',
        questionEn: 'When a period arrives a week later than expected, which phase usually lengthened?',
        questionAm: 'የወር አበባ ከተጠበቀው አንድ ሳምንት ዘግይቶ ሲመጣ ብዙውን ጊዜ የረዘመው የትኛው ወቅት ነው?',
        optionsEn: [
          'The follicular phase before ovulation (ovulation happened later)',
          'The bleeding phase always doubles first',
          'Every healthy body locks permanently to 28 days',
        ],
        optionsAm: [
          'እንቁላል ከመውጣቱ በፊት ያለው ፎሊኩላር ወቅት (እንቁላል ዘግይቶ ወጣ)',
          'የደም መፍሰስ ወቅት ሁሌም እጥፍ ይሆናል',
          'ጤናማ ሰውነት ሁሌም በ28 ቀን ብቻ ይመጣል',
        ],
        correctIndex: 0,
        explanationEn:
          'When stress, travel, or sleep shifts delay ovulation, the follicular phase stretches—and your period typically follows ~12–16 days after ovulation occurs.',
        explanationAm:
          'ጭንቀት ወይም የእንቅልፍ መዛባት እንቁላል መውጣትን ሲያዘገይ ፎሊኩላር ወቅት ይረዝማል።',
      },
    ],
  },
  {
    id: 'prostaglandins-relief',
    categoryEn: 'Body Comfort',
    categoryAm: 'የሰውነት ምቾት',
    readMinutes: 2,
    titleEn: 'Cramps, Prostaglandins & Evidence-Based Relief',
    titleAm: 'ቁርጠት፣ ፕሮስታግላንዲን እና ሳይንሳዊ የእፎይታ መንገዶች',
    summaryEn:
      'Menstrual cramps happen when lipid messengers called prostaglandins trigger uterine muscle contractions to shed the lining. Continuous gentle heat increases local blood flow and eases tension.',
    summaryAm:
      'የወር አበባ ቁርጠት የሚፈጠረው ፕሮስታግላንዲን የተባሉ ቅመሞች የማህጸን ጡንቻ እንዲኮማተር ሲያደርጉ ነው። ተከታታይ ሙቀት የደም ዝውውርን በመጨመር ጡንቻውን ያረጋጋል።',
    takeawaysEn: [
      'Topical heat (~40°C warm pad or bath) helps relax smooth muscle tension.',
      'Prostaglandins also affect nearby gut smooth muscle, explaining common Day 1–2 digestive shifts.',
      'Severe pain that disrupts daily life deserves evaluation by a qualified clinician.',
    ],
    takeawaysAm: [
      'ሞቅ ያለ ውሃ መያዣ ወይም ሙቅ ሻወር የማህጸን መኮማተርን በተፈጥሮ ያረጋጋል።',
      'ፕሮስታግላንዲን በአቅራቢያ ያለውን አንጀትም ስለሚነካ በወር አበባ ጊዜ የሆድ ለውጥ ሊያመጣ ይችላል።',
      'የዕለት ተዕለት ሕይወትን የሚያስተጓጉል ከባድ ህመም ካለ ሐኪም ማማከር ተገቢ ነው።',
    ],
    quiz: [
      {
        id: 'q1',
        questionEn: 'Why do bowel habits often shift right as a period begins?',
        questionAm: 'የወር አበባ ሲጀምር የሆድ እንቅስቃሴ ለውጥ ብዙውን ጊዜ ለምን ይከሰታል?',
        optionsEn: [
          'Prostaglandins stimulate smooth muscle in both the uterus and nearby intestines',
          'Hydration stops working during menstruation',
          'It only happens when something is medically wrong',
        ],
        optionsAm: [
          'ፕሮስታግላንዲን የማህጸንንም ሆነ የአቅራቢያ አንጀት ለስላሳ ጡንቻ ስለሚያነቃቃ',
          'በወር አበባ ጊዜ ውሃ መጠጣት ስለማይሠራ',
          'ከባድ በሽታ ሲኖር ብቻ ስለሚከሰት',
        ],
        correctIndex: 0,
        explanationEn:
          'Prostaglandins act locally on smooth muscle tissue in both the uterus and digestive tract, making mild Day 1–2 changes common.',
        explanationAm:
          'ፕሮስታግላንዲን በማህጸንና በአንጀት ለስላሳ ጡንቻዎች ላይ ስለሚሠራ በመጀመሪያዎቹ ቀናት የተለመደ ነው።',
      },
      {
        id: 'q2',
        questionEn: 'When is menstrual pain a clear reason to consult a qualified clinician?',
        questionAm: 'የቁርጠት ህመም መቼ ነው ሐኪም ማማከር የሚያስፈልገው?',
        optionsEn: [
          'Never—everyone is expected to endure severe pain silently',
          'Whenever pain is severe, sudden, worsening, or interferes with daily activities',
          'Only after age 45',
        ],
        optionsAm: [
          'በፍጹም—ሁሉም ሰው በዝምታ መቻል አለበት',
          'ህመሙ ከባድ፣ ድንገተኛ፣ እየባሰ የሚሄድ ወይም የዕለት ኑሮን የሚያስተጓጉል ሲሆን',
          'ከ45 ዓመት በኋላ ብቻ',
        ],
        correctIndex: 1,
        explanationEn:
          'Educational tools support awareness, never diagnosis—severe or disruptive pelvic pain always merits professional clinical care.',
        explanationAm: 'ከባድ ወይም ኑሮን የሚያስተጓጉል ህመም ምንጊዜም የሕክምና ክትትል ይገባዋል።',
      },
    ],
  },
  {
    id: 'pleasure-consent',
    categoryEn: 'Autonomy & Comfort',
    categoryAm: 'ነጻ ምርጫ እና ምቾት',
    readMinutes: 3,
    titleEn: 'Desire Patterns, Comfort & Enthusiastic Consent',
    titleAm: 'የፍላጎት ንድፎች፣ ምቾት እና ነጻ ስምምነት',
    summaryEn:
      'Desire can be spontaneous or responsive—emerging only after calm, unpressured connection. Cycle phases never measure consent, readiness, or obligation.',
    summaryAm:
      'የቅርበት ፍላጎት በድንገት ወይም ዘና ባለ ንክኪ ቀስ ብሎ ሊመጣ ይችላል። የዑደት ወቅት በፍጹም የፍላጎት መለኪያ አይደለም።',
    takeawaysEn: [
      'A cycle tracker phase never implies consent or obligation.',
      'Unscented water-based lubricant protects delicate tissue and pairs safely with latex condoms.',
      'Boundaries can change at any moment without explanation.',
    ],
    takeawaysAm: [
      'የዑደት ወቅት በፍጹም የስምምነት ወይም የግዴታ ምልክት አይደለም።',
      'ሽታ የሌለው የውሃ መሠረት ያለው ቅባት ከኮንዶም ጋር በደህንነት ይሠራል።',
      'በማንኛውም ደቂቃ ሐሳብሽን የመቀየር ሙሉ መብት አለሽ።',
    ],
    quiz: [
      {
        id: 'q1',
        questionEn: 'Which lubricant type pairs safely with both latex condoms and silicone items?',
        questionAm: 'ከኮንዶምም ሆነ ከሲሊኮን ቁሳቁሶች ጋር በደህንነት የሚሠራው የቅባት ዓይነት የቱ ነው?',
        optionsEn: [
          'Petroleum jelly or mineral oil',
          'Unscented water-based lubricant',
          'Perfumed body lotion',
        ],
        optionsAm: [
          'ቫዝሊን ወይም የሕፃናት ዘይት',
          'ሽታ የሌለው የውሃ መሠረት ያለው ቅባት (Water-based lubricant)',
          'ሽቶ ያለው የሰውነት ሎሽን',
        ],
        correctIndex: 1,
        explanationEn:
          'Unscented water-based formulas preserve latex integrity, protect silicone surfaces, and respect mucosal pH.',
        explanationAm: 'ሽታ የሌለው የውሃ መሠረት ያለው ቅባት ኮንዶም እንዳይቀደድ ይጠብቃል፤ ለሰውነትም ተስማሚ ነው።',
      },
    ],
  },
  {
    id: 'nourishment-energy',
    categoryEn: 'Nourishment',
    categoryAm: 'ምግብ እና ጉልበት',
    readMinutes: 2,
    titleEn: 'Iron, Hydration & Steady Energy Across Your Month',
    titleAm: 'ብረት (Iron)፣ ውሃ እና ዘላቂ ጉልበት በወሩ ሙሉ',
    summaryEn:
      'Menstrual blood loss makes stored iron (ferritin) a common factor in fatigue—and pairing plant iron sources like teff, lentils, and dark greens with Vitamin C supports absorption.',
    summaryAm:
      'በወር አበባ ወቅት የሚወጣው ደም የብረት ክምችትን ሊቀንስ ይችላል። እንደ ጤፍ፣ ምስር እና ቆስጣ ያሉ ምግቦችን ከቫይታሚን ሲ ጋር መመገብ አጠቃቀሙን ይጨምራል።',
    takeawaysEn: [
      'Teff, lentils, beans, and leafy greens paired with fresh citrus boost non-heme iron uptake.',
      'Spacing coffee or strong tea 45–60 minutes away from iron-rich meals avoids tannin inhibition.',
      'Consistent hydration supports circulation and eases luteal fluid shifts.',
    ],
    takeawaysAm: [
      'ጤፍ፣ ምስር፣ ሽምብራ እና ቆስጣ ከሎሚ ጋር ምርጥ የብረት ምንጮች ናቸው።',
      'ቡና ወይም ሻይ ከምግብ በኋላ ከ45 ደቂቃ ቆይቶ መጠጣት ብረት በሰውነት እንዲዋሃድ ይረዳል።',
      'በቂ ውሃ መጠጣት ራስ ምታትንና ድካምን ይቀንሳል።',
    ],
    quiz: [
      {
        id: 'q1',
        questionEn: 'What simple habit supports iron absorption from foods like teff, lentils, and greens?',
        questionAm: 'ከጤፍ፣ ከምስር እና ከአረንጓዴ አትክልቶች የሚገኘውን ብረት ሰውነት በደንብ እንዲጠቀም የሚረዳው ምንድን ነው?',
        optionsEn: [
          'Pairing the meal with Vitamin C (such as lemon, citrus, or tomatoes)',
          'Skipping meals altogether',
          'Drinking strong espresso immediately with every bite',
        ],
        optionsAm: [
          'ምግቡን ከቫይታሚን ሲ (እንደ ሎሚ፣ ብርቱካን ወይም ቲማቲም) ጋር መመገብ',
          'ምግብ መዝለል',
          'ከምግብ ጋር ወዲያውኑ ጠንካራ ቡና መጠጣት',
        ],
        correctIndex: 0,
        explanationEn:
          'Vitamin C converts plant-based non-heme iron into a form absorbed far more readily by the digestive tract.',
        explanationAm: 'ቫይታሚን ሲ ከዕፅዋት የሚገኘውን ብረት ሰውነት በቀላሉ እንዲመጥ ይረዳል።',
      },
    ],
  },
]

export const MILESTONE_CATALOG = [
  {
    id: 'first-reflection',
    points: 25,
    icon: '🌱',
    titleEn: 'First Reflection',
    titleAm: 'የመጀመሪያ ምልከታ',
    descriptionEn: 'Recorded your first personal check-in—simply noticing today as it arrives.',
    descriptionAm: 'የመጀመሪያውን የዕለት ምልከታሽን መዝግበሻል።',
  },
  {
    id: 'set-intention',
    points: 20,
    icon: '🧭',
    titleEn: 'Personal Intention Set',
    titleAm: 'የግል ዓላማ ተመርጧል',
    descriptionEn: 'Chose a flexible, pressure-free intention for your space.',
    descriptionAm: 'ያለ ምንም ጫና የራስሽን የእንክብካቤ አቅጣጫ መርጠሻል።',
  },
  {
    id: 'personal-reminder',
    points: 20,
    icon: '🔔',
    titleEn: 'Personal Reminder Created',
    titleAm: 'የግል ማስታወሻ ተፈጥሯል',
    descriptionEn: 'Added a custom self-care reminder in your own words—no notifications required.',
    descriptionAm: 'በራስሽ ቃላት የእንክብካቤ ማስታወሻ ፈጥረሻል።',
  },
  {
    id: 'first-guide',
    points: 25,
    icon: '📖',
    titleEn: 'Curious Mind',
    titleAm: 'ጠያቂ አእምሮ',
    descriptionEn: 'Explored a reviewed menstrual-health educational collection.',
    descriptionAm: 'ሳይንሳዊ የሰውነትና የዑደት ትምህርት አንብበሻል።',
  },
  {
    id: 'first-quiz',
    points: 30,
    icon: '✦',
    titleEn: 'Learning Milestone',
    titleAm: 'የዕውቀት ምዕራፍ',
    descriptionEn: 'Completed an educational mini-quiz at your own unhurried pace.',
    descriptionAm: 'የትምህርት ጥያቄዎችን በተሳካ ሁኔታ አጠናቀሻል።',
  },
  {
    id: 'monthly-review',
    points: 25,
    icon: '🌙',
    titleEn: 'Your First Monthly Reflection',
    titleAm: 'የመጀመሪያ የንድፍ ማጠቃለያ ምልከታ',
    descriptionEn: 'Reviewed your personal Insights summary with calm curiosity, not self-judgment.',
    descriptionAm: 'የግል የንድፍ ማጠቃለያሽን በአስተውሎት ተመልክተሻል።',
  },
  {
    id: 'three-reflections',
    points: 30,
    icon: '🌿',
    titleEn: 'Unrushed Consistency',
    titleAm: 'ያለ ጫና የቀጠለ ራስን ማዳመጥ',
    descriptionEn: 'Checked in across 3 separate days—any days at all, with zero streak pressure.',
    descriptionAm: 'በ3 የተለያዩ ቀናት ራስሽን አዳምጠሻል—ተከታታይ መሆን ሳይጠበቅብሽ።',
  },
  {
    id: 'scholar-bloom',
    points: 35,
    icon: '🦋',
    titleEn: 'Complete Learning Collection',
    titleAm: 'ሙሉ የትምህርት ስብስብ ተጠናቀቀ',
    descriptionEn: 'Completed all four reviewed body-literacy mini-quizzes.',
    descriptionAm: 'አራቱንም የትምህርት ጥያቄዎች አጠናቀሻል።',
  },
  {
    id: 'personal-note',
    points: 20,
    icon: '💌',
    titleEn: 'Note to Future Self',
    titleAm: 'ለወደፊት ራስሽ የተጻፈ ማስታወሻ',
    descriptionEn: 'Saved a private reflection note for yourself—never shared anywhere.',
    descriptionAm: 'ለራስሽ የሚሆን የፍቅርና የእንክብካቤ ማስታወሻ አስቀምጠሻል።',
  },
]

export const GARDEN_PLOT_COUNT = 6

export const FLOWER_VARIETIES = [
  { id: 'rose', nameEn: 'Rose', nameAm: 'ጽጌረዳ', accent: '#C65B7D' },
  { id: 'sunflower', nameEn: 'Sunflower', nameAm: 'የሱፍ አበባ', accent: '#D89B2B' },
  { id: 'tulip', nameEn: 'Tulip', nameAm: 'ቱሊፕ', accent: '#D9725B' },
  { id: 'daisy', nameEn: 'Daisy', nameAm: 'ዴዚ', accent: '#C99A3B' },
  { id: 'lavender', nameEn: 'Lavender', nameAm: 'ላቬንደር', accent: '#7D63A8' },
  { id: 'orchid', nameEn: 'Orchid', nameAm: 'ኦርኪድ', accent: '#B85A92' },
  { id: 'iris', nameEn: 'Iris', nameAm: 'አይሪስ', accent: '#5A62B0' },
  { id: 'strelitzia', nameEn: 'Bird of paradise', nameAm: 'የገነት ወፍ አበባ', accent: '#E0742B' },
]

export const PLANT_GROWTH_STAGES = [
  { stage: 0, key: 'seed', nameEn: 'Seed', nameAm: 'ዘር' },
  { stage: 1, key: 'sprout', nameEn: 'Sprout', nameAm: 'ቡቃያ' },
  { stage: 2, key: 'seedling', nameEn: 'Seedling', nameAm: 'ችግኝ' },
  { stage: 3, key: 'developing', nameEn: 'Developing plant', nameAm: 'በማደግ ላይ ያለ ተክል' },
  { stage: 4, key: 'bud', nameEn: 'Bud', nameAm: 'እምቡጥ' },
  { stage: 5, key: 'bloom', nameEn: 'Full bloom', nameAm: 'ሙሉ አበባ' },
]

const defaultGardenPlots = () => [
  {
    id: 'starter-rose-0',
    species: 'rose',
    growthStage: 1,
    plantedAt: '2026-01-01T00:00:00.000Z',
    lastWateredAt: null,
    wateredCount: 0,
    moistUntil: 0,
  },
  null,
  null,
  null,
  null,
  null,
]

const normalizeGardenPlots = (rawPlots) => {
  if (!Array.isArray(rawPlots)) return defaultGardenPlots()
  return Array.from({ length: GARDEN_PLOT_COUNT }, (_, idx) => {
    const item = rawPlots[idx]
    if (!item || typeof item !== 'object') return null
    const validSpecies = FLOWER_VARIETIES.some((v) => v.id === item.species) ? item.species : 'rose'
    const clampedStage = Math.max(0, Math.min(5, Math.round(Number(item.growthStage) || 0)))
    return {
      id: String(item.id || `plot-${idx}`),
      species: validSpecies,
      growthStage: clampedStage,
      plantedAt: item.plantedAt || new Date().toISOString(),
      lastWateredAt: item.lastWateredAt || null,
      wateredCount: Math.max(0, Math.round(Number(item.wateredCount) || 0)),
      moistUntil: Number(item.moistUntil) || 0,
    }
  })
}

const defaultJourneyState = () => ({
  activeIntentionId: null,
  intentionPaused: false,
  cadenceId: 'unhurried',
  journalTheme: 'rosewood',
  readGuideIds: [],
  completedQuizIds: [],
  unlockedMilestones: {},
  nourishedDates: [],
  plots: defaultGardenPlots(),
  gardenLedger: {
    spentSeeds: 0,
    spentWater: 0,
  },
  gardenAnimationsPaused: false,
  personalNotes: [],
  personalReminders: [],
  timeline: [],
  reviewedMonthlySummary: false,
})

export const readJourneyState = () => {
  try {
    const stored = window.localStorage.getItem(JOURNEY_STORAGE_KEY)
    const raw = stored ? JSON.parse(stored) : {}
    const ledger = raw.gardenLedger && typeof raw.gardenLedger === 'object' ? raw.gardenLedger : {}
    return {
      ...defaultJourneyState(),
      ...raw,
      cadenceId: FLEXIBLE_CADENCES.some((c) => c.id === raw.cadenceId) ? raw.cadenceId : 'unhurried',
      journalTheme: JOURNAL_THEMES.some((jt) => jt.id === raw.journalTheme) ? raw.journalTheme : 'rosewood',
      readGuideIds: Array.isArray(raw.readGuideIds) ? [...new Set(raw.readGuideIds)] : [],
      completedQuizIds: Array.isArray(raw.completedQuizIds) ? [...new Set(raw.completedQuizIds)] : [],
      unlockedMilestones:
        raw.unlockedMilestones && typeof raw.unlockedMilestones === 'object'
          ? raw.unlockedMilestones
          : {},
      nourishedDates: Array.isArray(raw.nourishedDates) ? [...new Set(raw.nourishedDates)] : [],
      plots: normalizeGardenPlots(raw.plots),
      gardenLedger: {
        spentSeeds: Math.max(0, Math.round(Number(ledger.spentSeeds) || 0)),
        spentWater: Math.max(0, Math.round(Number(ledger.spentWater) || 0)),
      },
      gardenAnimationsPaused: Boolean(raw.gardenAnimationsPaused),
      personalNotes: Array.isArray(raw.personalNotes) ? raw.personalNotes : [],
      personalReminders: Array.isArray(raw.personalReminders) ? raw.personalReminders : [],
      timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    }
  } catch {
    return defaultJourneyState()
  }
}

const persistJourneyStateStrict = (nextState, celebrationPayload = null) => {
  try {
    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(nextState))
  } catch (err) {
    return { ok: false, error: err || new Error('Storage failed') }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hercycle:journey-changed', {
        detail: { state: nextState, celebration: celebrationPayload },
      })
    )
  }
  return { ok: true, state: nextState }
}

const persistJourneyState = (nextState, celebrationPayload = null) => {
  persistJourneyStateStrict(nextState, celebrationPayload)
  return nextState
}

const syncSupabaseProgress = async (userId, points, milestoneId) => {
  if (!userId || !supabase) return
  try {
    await supabase.from('user_progress').upsert(
      {
        user_id: userId,
        total_coins: points,
        current_level: getGardenProgress(points).currentStage.stage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (milestoneId) {
      const def = MILESTONE_CATALOG.find((m) => m.id === milestoneId)
      if (def) {
        await supabase.from('quests').insert({
          user_id: userId,
          title: def.titleEn,
          description: def.descriptionEn,
          target: 1,
          progress: 1,
          reward: def.points,
          completed: true,
        })
      }
    }
  } catch {
    // Local storage remains the reliable source of truth even offline.
  }
}

const addTimelineEntry = (timeline, { key, labelEn, labelAm }) => {
  if (key && timeline.some((item) => item.key === key)) return timeline
  const entry = {
    id: key || `tl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: key || null,
    labelEn,
    labelAm,
    createdAt: new Date().toISOString(),
  }
  return [entry, ...timeline].slice(0, 35)
}

export const computeJourneyPoints = (state = readJourneyState()) =>
  MILESTONE_CATALOG.reduce(
    (sum, item) => (state.unlockedMilestones?.[item.id] ? sum + item.points : sum),
    0
  ) + Math.min(40, (Array.isArray(state.nourishedDates) ? state.nourishedDates.length : 0) * 8)

export const getGardenProgress = (pointsInput) => {
  const points = typeof pointsInput === 'number' ? pointsInput : computeJourneyPoints(pointsInput)
  let currentStageIndex = 0
  for (let i = 0; i < GARDEN_STAGES.length; i += 1) {
    if (points >= GARDEN_STAGES[i].minPoints) currentStageIndex = i
  }
  const currentStage = GARDEN_STAGES[currentStageIndex]
  const nextStage = GARDEN_STAGES[currentStageIndex + 1] || null
  const stageFloor = currentStage.minPoints
  const stageCeiling = nextStage ? nextStage.minPoints : currentStage.minPoints
  const percentToNext = nextStage
    ? Math.min(100, Math.max(0, Math.round(((points - stageFloor) / (stageCeiling - stageFloor)) * 100)))
    : 100
  const maxPoints = MILESTONE_CATALOG.reduce((sum, m) => sum + m.points, 0)
  const overallPercent = Math.min(100, Math.round((points / maxPoints) * 100))

  return {
    points,
    maxPoints,
    currentStage,
    nextStage,
    percentToNext,
    overallPercent,
  }
}

export const awardMilestoneOnce = (milestoneId, { userId = null, celebrate = true } = {}) => {
  const def = MILESTONE_CATALOG.find((item) => item.id === milestoneId)
  if (!def) return { unlockedNow: false, state: readJourneyState(), milestone: null }

  const state = readJourneyState()
  if (state.unlockedMilestones[milestoneId]) {
    return { unlockedNow: false, state, milestone: def }
  }

  const now = new Date().toISOString()
  const nextState = {
    ...state,
    unlockedMilestones: {
      ...state.unlockedMilestones,
      [milestoneId]: { unlockedAt: now, claimedAt: null },
    },
    timeline: addTimelineEntry(state.timeline, {
      key: `milestone-${milestoneId}`,
      labelEn: `Milestone reached: ${def.titleEn}`,
      labelAm: `አዲስ ምዕራፍ ተደረሰ፦ ${def.titleAm}`,
    }),
  }

  const points = computeJourneyPoints(nextState)
  const celebration = celebrate
    ? {
        kind: 'milestone',
        milestoneId: def.id,
        icon: def.icon,
        titleEn: def.titleEn,
        titleAm: def.titleAm,
        subtitleEn: def.descriptionEn,
        subtitleAm: def.descriptionAm,
        points: def.points,
      }
    : null

  persistJourneyState(nextState, celebration)
  syncSupabaseProgress(userId, points, milestoneId)
  return { unlockedNow: true, state: nextState, milestone: def }
}

export const claimMilestoneCelebration = (milestoneId) => {
  const def = MILESTONE_CATALOG.find((item) => item.id === milestoneId)
  const state = readJourneyState()
  const record = state.unlockedMilestones[milestoneId]
  if (!def || !record) return { claimedNow: false, state }
  if (record.claimedAt) return { claimedNow: false, state }

  const nextState = {
    ...state,
    unlockedMilestones: {
      ...state.unlockedMilestones,
      [milestoneId]: { ...record, claimedAt: new Date().toISOString() },
    },
  }

  persistJourneyState(nextState, {
    kind: 'claim',
    milestoneId: def.id,
    icon: def.icon,
    titleEn: `${def.titleEn} recognized`,
    titleAm: `${def.titleAm} በአትክልት ስፍራሽ አበበ`,
    subtitleEn: def.descriptionEn,
    subtitleAm: def.descriptionAm,
    points: def.points,
  })

  return { claimedNow: true, state: nextState }
}

export const syncCycleMilestones = (cycles = [], { userId = null, celebrate = true } = {}) => {
  const uniqueDates = new Set(
    (Array.isArray(cycles) ? cycles : []).map((item) => item?.date).filter(Boolean)
  )
  let unlocked = null
  if (uniqueDates.size >= 1) {
    const res = awardMilestoneOnce('first-reflection', { userId, celebrate })
    if (res.unlockedNow) unlocked = res.milestone
  }
  if (uniqueDates.size >= 3) {
    const res = awardMilestoneOnce('three-reflections', { userId, celebrate })
    if (res.unlockedNow) unlocked = res.milestone
  }
  return unlocked
}

export const syncMilestones = (userId = null, cycleCount = 0) => {
  const count = Number(cycleCount) || 0
  let unlocked = null
  if (count >= 1) {
    const res = awardMilestoneOnce('first-reflection', { userId, celebrate: false })
    if (res.unlockedNow) unlocked = res.milestone
  }
  if (count >= 3) {
    const res = awardMilestoneOnce('three-reflections', { userId, celebrate: false })
    if (res.unlockedNow) unlocked = res.milestone
  }
  return { state: loadJourneyState(userId), unlocked }
}

export const selectPersonalIntention = (intentionId, { userId = null, celebrate = true } = {}) => {
  const state = readJourneyState()
  const intention = PERSONAL_INTENTIONS.find((item) => item.id === intentionId) || null
  const nextState = {
    ...state,
    activeIntentionId: intention ? intention.id : null,
    intentionPaused: false,
    timeline: intention
      ? addTimelineEntry(state.timeline, {
          key: `intention-${intention.id}`,
          labelEn: `Chose intention: ${intention.titleEn}`,
          labelAm: `የግል ዓላማ ተመረጠ፦ ${intention.titleAm}`,
        })
      : state.timeline,
  }
  persistJourneyState(nextState)
  if (intention) {
    return awardMilestoneOnce('set-intention', { userId, celebrate }).state
  }
  return nextState
}

export const selectCheckInCadence = (userId = null, cadenceId = 'unhurried') => {
  const cadence =
    FLEXIBLE_CADENCES.find((item) => item.id === cadenceId) || FLEXIBLE_CADENCES[0]
  const state = readJourneyState()
  const nextState = {
    ...state,
    cadenceId: cadence.id,
    timeline: addTimelineEntry(state.timeline, {
      key: `cadence-${cadence.id}`,
      labelEn: `Preferred check-in rhythm: ${cadence.titleEn}`,
      labelAm: `የምዝገባ ፍጥነት ምርጫ፦ ${cadence.titleAm}`,
    }),
  }
  return decorateState(persistJourneyState(nextState))
}

export const selectJournalTheme = (userId = null, themeId = 'rosewood') => {
  const found = JOURNAL_THEMES.find((item) => item.id === themeId) || JOURNAL_THEMES[0]
  const state = readJourneyState()
  const nextState = {
    ...state,
    journalTheme: found.id,
  }
  return { theme: found, state: decorateState(persistJourneyState(nextState)) }
}

export const addPersonalReminder = (userId = null, reminderText = '') => {
  const trimmed = String(reminderText || '').trim().slice(0, 180)
  if (!trimmed) return null
  const before = Object.keys(readJourneyState().unlockedMilestones || {})
  const state = readJourneyState()
  const item = {
    id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: trimmed,
    createdAt: new Date().toISOString(),
  }
  const nextState = {
    ...state,
    personalReminders: [item, ...(state.personalReminders || [])].slice(0, 10),
    timeline: addTimelineEntry(state.timeline, {
      key: `reminder-${item.id}`,
      labelEn: `Created personal reminder: “${trimmed}”`,
      labelAm: `የግል ማስታወሻ ተፈጠረ፦ “${trimmed}”`,
    }),
  }
  persistJourneyState(nextState)
  const afterState = awardMilestoneOnce('personal-reminder', { userId, celebrate: false }).state
  const after = Object.keys(afterState.unlockedMilestones || {})
  const newlyUnlocked = after
    .filter((id) => !before.includes(id))
    .map((id) => MILESTONE_CATALOG.find((m) => m.id === id))
    .filter(Boolean)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:data-changed', { detail: { source: 'reminder' } }))
  }
  return { state: decorateState(afterState), newlyUnlocked }
}

export const removePersonalReminder = (reminderId) => {
  const state = readJourneyState()
  const nextState = {
    ...state,
    personalReminders: (state.personalReminders || []).filter((r) => r.id !== reminderId),
  }
  const saved = persistJourneyState(nextState)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hercycle:data-changed', { detail: { source: 'reminder' } }))
  }
  return decorateState(saved)
}

export const togglePauseIntention = () => {
  const state = readJourneyState()
  if (!state.activeIntentionId) return decorateState(state)
  const nextState = {
    ...state,
    intentionPaused: !state.intentionPaused,
  }
  return decorateState(persistJourneyState(nextState))
}

export const markGuideRead = (guideId, { userId = null, celebrate = false } = {}) => {
  const guide = LEARNING_COLLECTIONS.find((item) => item.id === guideId)
  if (!guide) return decorateState(readJourneyState())
  const state = readJourneyState()
  if (!state.readGuideIds.includes(guideId)) {
    const nextState = {
      ...state,
      readGuideIds: [...state.readGuideIds, guideId],
      timeline: addTimelineEntry(state.timeline, {
        key: `guide-${guideId}`,
        labelEn: `Explored guide: ${guide.titleEn}`,
        labelAm: `ትምህርት ተነበበ፦ ${guide.titleAm}`,
      }),
    }
    persistJourneyState(nextState)
  }
  return decorateState(awardMilestoneOnce('first-guide', { userId, celebrate }).state)
}

export const markQuizCompleted = (guideId, { userId = null, celebrate = true } = {}) => {
  const guide = LEARNING_COLLECTIONS.find((item) => item.id === guideId)
  if (!guide) return readJourneyState()
  const state = readJourneyState()
  let working = state
  if (!state.completedQuizIds.includes(guideId)) {
    working = {
      ...state,
      readGuideIds: state.readGuideIds.includes(guideId)
        ? state.readGuideIds
        : [...state.readGuideIds, guideId],
      completedQuizIds: [...state.completedQuizIds, guideId],
      timeline: addTimelineEntry(state.timeline, {
        key: `quiz-${guideId}`,
        labelEn: `Completed mini-quiz: ${guide.titleEn}`,
        labelAm: `የትምህርት ጥያቄ ተጠናቀቀ፦ ${guide.titleAm}`,
      }),
    }
    persistJourneyState(working)
  }
  awardMilestoneOnce('first-quiz', { userId, celebrate })
  if (working.completedQuizIds.length >= LEARNING_COLLECTIONS.length) {
    awardMilestoneOnce('scholar-bloom', { userId, celebrate })
  }
  return readJourneyState()
}

export const recordMonthlySummaryReview = ({ userId = null, celebrate = true } = {}) => {
  const state = readJourneyState()
  if (!state.reviewedMonthlySummary) {
    const nextState = {
      ...state,
      reviewedMonthlySummary: true,
      timeline: addTimelineEntry(state.timeline, {
        key: 'monthly-summary-review',
        labelEn: 'Reviewed personal summary in Insights',
        labelAm: 'በግንዛቤዎች (Insights) ውስጥ የግል ማጠቃለያ ታየ',
      }),
    }
    persistJourneyState(nextState)
  }
  return awardMilestoneOnce('monthly-review', { userId, celebrate }).state
}

export const savePersonalCareNote = (noteText, { userId = null, celebrate = true } = {}) => {
  const trimmed = String(noteText || '').trim().slice(0, 280)
  if (!trimmed) return readJourneyState()
  const state = readJourneyState()
  const note = {
    id: `note-${Date.now()}`,
    text: trimmed,
    createdAt: new Date().toISOString(),
  }
  const nextState = {
    ...state,
    personalNotes: [note, ...state.personalNotes].slice(0, 12),
    timeline: addTimelineEntry(state.timeline, {
      key: `note-${note.id}`,
      labelEn: 'Saved a private reflection note in Your Journey',
      labelAm: 'በጉዞሽ ውስጥ የግል ማስታወሻ ተቀመጠ',
    }),
  }
  persistJourneyState(nextState)
  return awardMilestoneOnce('personal-note', { userId, celebrate }).state
}

// Unified normalized field adapters for UI screens & tests
GARDEN_STAGES.forEach((stageObj) => {
  stageObj.enTitle = stageObj.enTitle || stageObj.nameEn
  stageObj.amTitle = stageObj.amTitle || stageObj.nameAm
  stageObj.enSubtitle = stageObj.enSubtitle || stageObj.subtitleEn
  stageObj.amSubtitle = stageObj.amSubtitle || stageObj.subtitleAm
})

MILESTONE_CATALOG.forEach((ms) => {
  ms.enTitle = ms.enTitle || ms.titleEn
  ms.amTitle = ms.amTitle || ms.titleAm
  ms.enDesc = ms.enDesc || ms.descriptionEn
  ms.amDesc = ms.amDesc || ms.descriptionAm
})

const INTENTION_ICONS = ['🌿', '📖', '🍵', '✿']
export const JOURNEY_INTENTIONS = PERSONAL_INTENTIONS.map((item, idx) => ({
  ...item,
  icon: item.icon || INTENTION_ICONS[idx % INTENTION_ICONS.length],
  enTitle: item.titleEn,
  amTitle: item.titleAm,
  enDesc: item.descriptionEn,
  amDesc: item.descriptionAm,
}))

const GUIDE_ICONS = ['🌙', '🌸', '🔥', '🍵']
export const LEARNING_GUIDES = LEARNING_COLLECTIONS.map((guide, idx) => ({
  ...guide,
  icon: guide.icon || GUIDE_ICONS[idx % GUIDE_ICONS.length],
  enTitle: guide.titleEn,
  amTitle: guide.titleAm,
  enSummary: guide.summaryEn,
  amSummary: guide.summaryAm,
  enPoints: guide.takeawaysEn,
  amPoints: guide.takeawaysAm,
  quiz: (guide.quiz || []).map((q) => ({
    ...q,
    answerIndex: q.correctIndex,
    enQ: q.questionEn,
    amQ: q.questionAm,
    enOptions: q.optionsEn,
    amOptions: q.optionsAm,
    enWhy: q.explanationEn,
    amWhy: q.explanationAm,
  })),
}))

function decorateState(state) {
  const flatUnlocked = {}
  Object.entries(state.unlockedMilestones || {}).forEach(([k, val]) => {
    flatUnlocked[k] = typeof val === 'string' ? val : val?.unlockedAt || new Date().toISOString()
  })
  return {
    ...state,
    activeIntention: state.activeIntentionId || null,
    completedQuizzes: state.completedQuizIds || [],
    unlockedMilestones: flatUnlocked,
    timeline: (state.timeline || []).map((tItem) => ({
      ...tItem,
      label: tItem.label || tItem.labelEn || '',
      at: tItem.at || tItem.createdAt || new Date().toISOString(),
    })),
  }
}

export const loadJourneyState = () => decorateState(readJourneyState())

export const computeGardenProgress = (journeyState = loadJourneyState(), cycleCount = 0) => {
  const base = getGardenProgress(journeyState)
  const bonusSeeds = Math.min(20, Math.max(0, Number(cycleCount) || 0) * 5)
  const totalPoints = base.points + bonusSeeds
  const recomputed = getGardenProgress(totalPoints)
  return {
    ...recomputed,
    stage: recomputed.currentStage.stage,
    points: totalPoints,
    progressPercent: recomputed.nextStage ? recomputed.percentToNext : 100,
    currentStage: recomputed.currentStage,
    nextStage: recomputed.nextStage,
  }
}

export const selectJourneyIntention = (userId, intentionId) => {
  const before = Object.keys(readJourneyState().unlockedMilestones || {})
  const nextRaw = selectPersonalIntention(intentionId, { userId, celebrate: false })
  const after = Object.keys(nextRaw.unlockedMilestones || {})
  const newlyUnlocked = after
    .filter((id) => !before.includes(id))
    .map((id) => MILESTONE_CATALOG.find((m) => m.id === id))
    .filter(Boolean)
  return { state: decorateState(nextRaw), newlyUnlocked }
}

export const completeLearningQuiz = (userId, guideId) => {
  const before = Object.keys(readJourneyState().unlockedMilestones || {})
  const nextRaw = markQuizCompleted(guideId, { userId, celebrate: false })
  const after = Object.keys(nextRaw.unlockedMilestones || {})
  const newlyUnlocked = after
    .filter((id) => !before.includes(id))
    .map((id) => MILESTONE_CATALOG.find((m) => m.id === id))
    .filter(Boolean)
  return { state: decorateState(nextRaw), newlyUnlocked }
}

export const addSelfCareNote = (userId, noteText) => {
  const trimmed = String(noteText || '').trim()
  if (!trimmed) return null
  const before = Object.keys(readJourneyState().unlockedMilestones || {})
  const nextRaw = savePersonalCareNote(trimmed, { userId, celebrate: false })
  const after = Object.keys(nextRaw.unlockedMilestones || {})
  const newlyUnlocked = after
    .filter((id) => !before.includes(id))
    .map((id) => MILESTONE_CATALOG.find((m) => m.id === id))
    .filter(Boolean)
  return { state: decorateState(nextRaw), newlyUnlocked }
}

export const recordJourneyActivity = (userId, kind, label = '', meta = {}) => {
  const before = Object.keys(readJourneyState().unlockedMilestones || {})
  if (kind === 'check_in') {
    const count = Math.max(1, Number(meta.cycleCount) || 1)
    awardMilestoneOnce('first-reflection', { userId, celebrate: false })
    if (count >= 3) {
      awardMilestoneOnce('three-reflections', { userId, celebrate: false })
    }
  } else if (kind === 'summary_review') {
    recordMonthlySummaryReview({ userId, celebrate: false })
  } else if (kind === 'guide_read' && meta.guideId) {
    markGuideRead(meta.guideId, { userId, celebrate: false })
  } else if (kind === 'reflection') {
    awardMilestoneOnce('personal-note', { userId, celebrate: false })
  }

  const raw = readJourneyState()
  const resolvedEn =
    typeof label === 'object' && label !== null ? label.labelEn || '' : String(label || '')
  const resolvedAm =
    typeof label === 'object' && label !== null
      ? label.labelAm || resolvedEn
      : String(label || '')
  if (resolvedEn || resolvedAm) {
    persistJourneyState({
      ...raw,
      timeline: addTimelineEntry(raw.timeline, {
        key: meta.uniqueKey || `${kind}-${Date.now()}`,
        labelEn: resolvedEn,
        labelAm: resolvedAm,
      }),
    })
  }
  const latestRaw = readJourneyState()
  const after = Object.keys(latestRaw.unlockedMilestones || {})
  const newlyUnlocked = after
    .filter((id) => !before.includes(id))
    .map((id) => MILESTONE_CATALOG.find((m) => m.id === id))
    .filter(Boolean)

  return { state: decorateState(latestRaw), newlyUnlocked }
}

export const isGardenNourishedToday = (state = readJourneyState()) => {
  const todayKey = new Date().toISOString().slice(0, 10)
  return Array.isArray(state.nourishedDates) && state.nourishedDates.includes(todayKey)
}

/**
 * Computes deterministic, idempotent seed & watering allowances from real user
 * progress (completed body-literacy quizzes, unlocked milestones, and logged check-ins)
 * minus resources already spent planting or watering. Replaying animations never
 * alters earned or spent totals.
 */
export const computeGardenResources = (state = readJourneyState(), cycleCount = 0) => {
  const milestoneCount = Object.keys(state.unlockedMilestones || {}).length
  const quizCount = Array.isArray(state.completedQuizIds)
    ? state.completedQuizIds.length
    : Array.isArray(state.completedQuizzes)
    ? state.completedQuizzes.length
    : 0
  const safeCycles = Math.max(0, Math.round(Number(cycleCount) || 0))

  const starterSeeds = 3
  const starterWater = 4
  const totalSeedsEarned = starterSeeds + milestoneCount + quizCount + Math.floor(safeCycles / 2)
  const totalWaterEarned = starterWater + milestoneCount * 2 + quizCount * 2 + safeCycles

  const spentSeeds = Math.max(0, Number(state.gardenLedger?.spentSeeds) || 0)
  const spentWater = Math.max(0, Number(state.gardenLedger?.spentWater) || 0)

  return {
    totalSeedsEarned,
    totalWaterEarned,
    spentSeeds,
    spentWater,
    availableSeeds: Math.max(0, totalSeedsEarned - spentSeeds),
    availableWater: Math.max(0, totalWaterEarned - spentWater),
  }
}

export const plantGardenSeed = (
  plotIndex,
  speciesId = 'rose',
  { userId = null, cycleCount = 0 } = {}
) => {
  const idx = Number(plotIndex)
  const current = readJourneyState()
  if (!Number.isInteger(idx) || idx < 0 || idx >= GARDEN_PLOT_COUNT) {
    return { ok: false, reason: 'invalid_plot', state: decorateState(current) }
  }
  if (current.plots[idx]) {
    return { ok: false, reason: 'plot_occupied', state: decorateState(current) }
  }

  const resources = computeGardenResources(current, cycleCount)
  if (resources.availableSeeds < 1) {
    return { ok: false, reason: 'no_seeds', state: decorateState(current) }
  }

  const variety = FLOWER_VARIETIES.find((v) => v.id === speciesId) || FLOWER_VARIETIES[0]
  const nowIso = new Date().toISOString()
  const planted = {
    id: `plant-${idx}-${Date.now()}`,
    species: variety.id,
    growthStage: 0, // Always starts at Seed stage unless watered further
    plantedAt: nowIso,
    lastWateredAt: null,
    wateredCount: 0,
    moistUntil: 0,
  }

  const nextPlots = [...current.plots]
  nextPlots[idx] = planted

  const nextRaw = {
    ...current,
    plots: nextPlots,
    gardenLedger: {
      ...current.gardenLedger,
      spentSeeds: (current.gardenLedger?.spentSeeds || 0) + 1,
    },
    timeline: addTimelineEntry(current.timeline, {
      key: `plant-${planted.id}`,
      labelEn: `Planted ${variety.nameEn} seed in Plot ${idx + 1}`,
      labelAm: `በመደብ ${idx + 1} የ${variety.nameAm} ዘር ተተከለ`,
    }),
  }

  const persisted = persistJourneyStateStrict(nextRaw)
  if (!persisted.ok) {
    return { ok: false, reason: 'save_failed', state: decorateState(current) }
  }

  syncSupabaseProgress(userId, computeJourneyPoints(nextRaw), null)
  return {
    ok: true,
    plotIndex: idx,
    plant: planted,
    state: decorateState(nextRaw),
  }
}

export const waterGardenPlant = (
  plotIndex,
  { userId = null, cycleCount = 0 } = {}
) => {
  const idx = Number(plotIndex)
  const current = readJourneyState()
  if (!Number.isInteger(idx) || idx < 0 || idx >= GARDEN_PLOT_COUNT) {
    return { ok: false, reason: 'invalid_plot', state: decorateState(current) }
  }

  const existing = current.plots[idx]
  if (!existing) {
    return { ok: false, reason: 'empty_plot', state: decorateState(current) }
  }
  if (existing.growthStage >= 5) {
    return { ok: false, reason: 'already_bloomed', state: decorateState(current) }
  }

  const resources = computeGardenResources(current, cycleCount)
  if (resources.availableWater < 1) {
    return { ok: false, reason: 'no_water', state: decorateState(current) }
  }

  const variedad = FLOWER_VARIETIES.find((v) => v.id === existing.species) || FLOWER_VARIETIES[0]
  const nextStage = Math.min(5, existing.growthStage + 1)
  const stageDef = PLANT_GROWTH_STAGES[nextStage]
  const nowIso = new Date().toISOString()

  const updatedPlant = {
    ...existing,
    growthStage: nextStage,
    lastWateredAt: nowIso,
    wateredCount: (existing.wateredCount || 0) + 1,
    moistUntil: Date.now() + 14000,
  }

  const nextPlots = [...current.plots]
  nextPlots[idx] = updatedPlant

  const todayKey = nowIso.slice(0, 10)
  const nextDates = [...new Set([...(current.nourishedDates || []), todayKey])]

  const nextRaw = {
    ...current,
    nourishedDates: nextDates,
    plots: nextPlots,
    gardenLedger: {
      ...current.gardenLedger,
      spentWater: (current.gardenLedger?.spentWater || 0) + 1,
    },
    timeline: addTimelineEntry(current.timeline, {
      key: `water-${existing.id}-stage-${nextStage}`,
      labelEn: `Watered ${variedad.nameEn} in Plot ${idx + 1} (${stageDef.nameEn})`,
      labelAm: `በመደብ ${idx + 1} ያለው ${variedad.nameAm} ተጠጣ (${stageDef.nameAm})`,
    }),
  }

  const persisted = persistJourneyStateStrict(nextRaw)
  if (!persisted.ok) {
    return { ok: false, reason: 'save_failed', state: decorateState(current) }
  }

  syncSupabaseProgress(userId, computeJourneyPoints(nextRaw), null)
  return {
    ok: true,
    plotIndex: idx,
    previousStage: existing.growthStage,
    nextStage,
    plant: updatedPlant,
    state: decorateState(nextRaw),
  }
}

export const setGardenAnimationsPaused = (paused) => {
  const current = readJourneyState()
  const nextRaw = {
    ...current,
    gardenAnimationsPaused: Boolean(paused),
  }
  const persisted = persistJourneyStateStrict(nextRaw)
  if (!persisted.ok) {
    return { ok: false, reason: 'save_failed', state: decorateState(current) }
  }
  return { ok: true, state: decorateState(nextRaw) }
}

export const nourishGardenToday = (userId = null, cycleCount = 0) => {
  const current = readJourneyState()
  // Prefer watering the first growable planted flower so the Home quick button connects to real plot growth
  const growableIdx = current.plots.findIndex((p) => p && p.growthStage < 5)
  if (growableIdx !== -1) {
    const watered = waterGardenPlant(growableIdx, { userId, cycleCount })
    if (watered.ok) {
      return {
        state: watered.state,
        newlyNourished: true,
        wateredPlotIndex: growableIdx,
        pointsAdded: 8,
      }
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const alreadyNourished =
    Array.isArray(current.nourishedDates) && current.nourishedDates.includes(todayKey)

  if (alreadyNourished) {
    return {
      state: decorateState(current),
      newlyNourished: false,
      wateredPlotIndex: growableIdx !== -1 ? growableIdx : 0,
      pointsAdded: 0,
    }
  }

  const nextDates = [...new Set([...(current.nourishedDates || []), todayKey])]
  const nextRaw = {
    ...current,
    nourishedDates: nextDates,
    timeline: addTimelineEntry(current.timeline, {
      key: `garden-nourish-${todayKey}`,
      labelEn: 'Nourished your sanctuary garden with warm water & light',
      labelAm: 'የመጠለያ አትክልትሽን በፍቅር አጠጣሽ',
    }),
  }
  const persisted = persistJourneyStateStrict(nextRaw)
  if (!persisted.ok) {
    return {
      state: decorateState(current),
      newlyNourished: false,
      saveFailed: true,
      pointsAdded: 0,
    }
  }
  syncSupabaseProgress(userId, computeJourneyPoints(nextRaw), null)
  return {
    state: decorateState(nextRaw),
    newlyNourished: true,
    wateredPlotIndex: 0,
    pointsAdded: 8,
  }
}

