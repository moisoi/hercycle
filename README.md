# HerCycle - Premium Period Tracking Web App


A premium, full-featured period tracking web application designed for women aged 20-28, with a focus on modern aesthetics, comprehensive cycle tracking, intimacy features, and gamification.

## Overview

HerCycle combines elegant design with practical functionality, offering a premium experience with soft gradients, rounded shapes, organic motion, and phase-aware UI that evolves throughout the menstrual cycle.

## Features

### Design & Aesthetics
- **Modern, soft, and expressive** UI with rounded shapes, fluid gradients, and organic motion

A premium, full-featured period tracking web app designed for women aged 20-28, focusing on modern aesthetics, comprehensive cycle tracking, intimacy features, and gamification.

## 🌟 Live Demo

**Development**: http://localhost:3000  
**Deployed**: https://your-vercel-url.vercel.app (after deployment)

## 📖 Overview

HerCycle combines elegant design with practical functionality, offering a premium experience with soft gradients, rounded shapes, organic motion, and phase-aware UI that evolves throughout the menstrual cycle.

## ✨ Features

### Design & Aesthetics
- **Modern, soft, and expressive** UI with rounded shapes and fluid gradients

- **Color palette**:
  - Core: Cream (#F5F0E9), soft beige (#E8E4DC), muted pinks/peaches, deep berry (#6B2D5D)
  - Phase-specific accents:
    - Menstrual: Dusty rose (#C15B70) + warm gray
    - Follicular: Fresh mint (#A8D5B8) + coral
    - Ovulatory: Golden peach (#FF8C42) + soft amber
    - Luteal: Lavender (#B37DFF) + indigo
- **Motion language**: Smooth elastic animations, micro-interactions, phase transitions

### Core Tracking

- **Cycle phase tracking** with 4 phases (menstrual, follicular, ovulatory, luteal)
- **Mood tracking** with visual slider
- **Libido/desire tracker** with one-tap daily log and tags (romantic, spontaneous, sensual, curious)
- **Intimacy level** tracking with consent signals

### Intimacy & Relationship Features
- **Libido curve** showing desire patterns overlaid on cycle phases
- **Cycle-synced intimacy tips** by phase:
- Cycle phase tracking with 4 phases (menstrual, follicular, ovulatory, luteal)
- Mood tracking with visual slider
- Libido/desire tracker with one-tap daily log and tags (romantic, spontaneous, sensual, curious)
- Intimacy level tracking

### Intimacy & Relationship Features
- Libido curve showing desire patterns overlaid on cycle phases
- Cycle-synced intimacy tips by phase:

  - Menstrual: Period sex comfort tips, external touch focus
  - Follicular: Energy rising, try new things
  - Ovulatory: Confidence peak, initiate dates
  - Luteal: Emotional closeness, cuddles and massage

- **"Intimacy Menu"** generator with rotating cards users can collect and mark as tried

- "Intimacy Menu" generator with rotating cards users can collect and mark as tried

- **Partner mode** (opt-in, privacy-first):
  - Shared intimacy dashboard with current phase and openness indicator
  - "Traffic light" consent system (green/yellow/red)
  - No detailed logs shared unless explicitly opted in

- **Period sex support** with practical tips and checklists
- **Solo pleasure** resources: guided body-scans, journaling prompts

### Gamification
- **Cycle Quests**: Weekly mini-missions with progress bars
  - "Log your mood 4 days this week → unlock PMS pattern card"
  - "Try one new self-care activity this luteal phase → earn Self-Care Sorcerer badge"
- **Points & Levels**: Earn "Cycle Coins" for logging, reading insights, completing quests
  - Spend on: mascot outfits, app themes, sticker packs, premium educational series

- Period sex practical support and checklists
- Solo pleasure resources: guided body-scans, journaling prompts

### Gamification
- **Cycle Quests**: Weekly mini-missions with progress bars
  - "Log your mood 4 days this week → unlock PMS pattern card."
  - "Try one new self-care activity this luteal phase → earn Self-Care Sorcerer badge."
- **Points & Levels**: Earn "Cycle Coins" for logging, reading insights, completing quests
  - Spend coins: mascot outfits, app themes, sticker packs, premium educational series

- **Progress visuals**:
  - Monthly "energy map" heatmap (contribution-style)
  - "Your cycle story" swipeable carousel recap
- **Level milestones**: "Cycle Veteran" animation after 3+ cycles (mascot with crown/graduation cap)

### Mascot/Companion
- Abstract spirit/glow creature that changes texture/color by phase
- Reacts in real-time to mood/libido inputs (eyes widen, cheeks flush, yawns)
- Celebrates streaks and achievements
- "Level up" animations with sparkles

### Animation Moments

- **Onboarding**: Mascot introduction with witty copy
- **Daily check-in**: Mascot reacts real-time to mood/libido; level-up sparkle on completion
- **Ovulation day**: Subtle glow around app frame; mascot confident pose "Main character energy today"
- **Streach & achievements**: Badges animate 3D, spin, settle into trophy shelf

### UX Patterns
- Social-media-like feel: Stories-style education cards, swipeable insight carousels
- Onboarding quiz sets tone (playful vs. serious)
- Adaptive home screen: Surface intimacy tips if libido logged frequently
- Mental health integration: Mood tied to intimacy insights
- Privacy & control: One-tap "Hide intimacy section" / incognito mode
- Clear privacy dashboard: What's stored, shared, deleted

### Privacy & Safety
- All intimacy features optional and privately locked
- Biometric/Face ID protection
- One-tap "Hide intimacy section"
- Anonymous, aggregated insights only
- Opt-in community challenges (no personal data exposed)

## Technical Stack

- **React** with React Router for navigation
- **Material-UI** (MUI) for component library
- **Framer Motion** for animations and micro-interactions
- **Chart.js** via react-chartjs-2 for data visualization
- **React Icons** for icon set
- **i18next** for internationalization ready
- Custom design system with color palette, typography, and transitions

## Available Screens

1. **Onboarding** - 4-step setup (phase selection, tone choice, mascot introduction)
2. **Home** - Main dashboard with phase banner, daily check-in, energy map
3. **Cycle Log** - Track mood, libido, intimacy per cycle day
4. **Insights** - Cycle data visualization and key insights
5. **Settings** - Appearance, font size, notifications, privacy controls

## Getting Started

The app is running at `http://localhost:3000`. 

### Development
- `npm start` - Development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Project Structure

```
src/
  components/      - Reusable UI components (Dashboard, IntimacyMenu)
  screens/         - Full-screen pages (Onboarding, Home, CycleLog, Insights, Settings)
  styles/          - Design system (colors.js, typography.js, index.css)
  index.js         - Entry point with i18next setup
```

## Key Design Decisions

- **Phase-aware UI**: Background gradients, icon styles, and mascot appearance change based on current cycle phase
- **Elastic animations**: Slight bounce, squash-and-stretch for natural feel
- **Gradual progression**: Animations tie directly to visible progress (coins, levels, streaks)
- **Consent-forward**: All intimacy features opt-in with clear privacy controls
- **Non-judgmental language**: Inclusive, pleasure-focused, communication-oriented terminology

- **Onboarding**: Mascot introduction with witty copy ("Hey, I'm [Name]. I'll be your cycle hype friend.")
- **Daily check-in**: Mascot reacts real-time to mood/libido; level-up sparkle on completion
- **Ovulation day**: Subtle glow around app frame for a few seconds; mascot confident pose "Main character energy today."
- **Streaks & achievements**: Badges animate 3D, spin, settle into "trophy shelf" tab.
- After 3+ cycles, unlock "Cycle Veteran" animation (mascot wearing tiny crown or graduation cap).

### UX Patterns
- **Social-media-like feel**: Stories-style education: short, vertical cards with bold text and illustrations.
- **Personalization**: Onboarding quiz that sets tone (more playful vs. more serious).
- **Adaptive home screen**: If they log libido often, surface intimacy tips more prominently; if not, keep it subtle.
- **Mental health integration**: Mood tied to intimacy: "On days you feel more anxious, do you also feel less interested in sex?"
- **Privacy & control**: One-tap "Hide intimacy section" or "Incognito mode" for the whole app.
- **Clear, simple privacy dashboard**: What's stored, what's shared, what's deleted.

### Privacy & Safety
- All intimacy features optional and privately locked (biometric/Face ID)
- One-tap "Hide intimacy section" / incognito mode
- Anonymous, aggregated insights only: "72% of users your age feel more social around ovulation."
- Opt-in community challenges: "7-day mindfulness challenge" with a shared progress bar (no personal data exposed)

### Technical Stack
- **Frontend**: React 18 with React Router, Material UI (MUI), Framer Motion for animations, Chart.js for data visualization, React Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage, and Realtime) via the Supabase JavaScript client
- **Animations**: Framer Motion with custom elastic ease curve (cubic-bezier(0.25, 0.46, 0.45, 0.94))
- **Internationalization**: i18next ready
- **Deployment**: Vercel or another static hosting provider

## 🚀 Quick Start

Node.js 24.x is required.

### Development
```bash
npm install
cp .env.example .env.local  # add your Supabase project values
npm start          # Start development server (port 3000)
npm run build      # Build for production
npm test           # Run tests
```

**Supabase setup:**
1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Enable the authentication provider(s) you plan to use.
3. Configure Storage buckets and review Row Level Security policies before launch.
4. Copy `.env.example` to `.env.local` and add the project URL and public anon/publishable key.

The Create React App client reads these build-time variables (the anon/publishable key is public; never put a service-role key in the browser):
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-supabase-publishable-or-anon-key
```

### Deployment
```bash
npm run build      # Build production files
vercel deploy      # Deploy to Vercel
# Or: npm start      # Development mode
```

## 📊 Screen Overview

| Screen | Key Features |
|--------|------------|
| **Home** | Dashboard with phase banner, daily check-in, energy map, mascot companion |
| **Onboarding** | 4-step setup: phase selection → tone choice → mascot introduction |
| **CycleLog** | Track mood, libido, intimacy per cycle day |
| **Insights** | Cycle data visualization and key insights |
| **Intimacy** | Consent system, intimacy menu, partner mode |
| **Settings** | Theme, font size, notifications, privacy controls |

## 🛠 Technology Stack

**Frontend**:
- React 18 + React Router v6
- Material UI (MUI) components
- Framer Motion for all animations (elastic ease: cubic-bezier(0.25, 0.46, 0.45, 0.94))
- Chart.js via react-chartjs-2 for data visualization
- React Icons (500+ icons)
- i18next for internationalization ready

**Backend**:
- Supabase (PostgreSQL database, Auth, Storage, and Realtime)
- Supabase Auth manages user sessions; the app talks to Supabase directly
- Row Level Security (RLS) policies scope user data; no Express/JSON/JWT backend is used

**DevOps**:
- Vercel recommended for deployment
- Environment variables for Supabase credentials
- GitHub repository for version control

## 📊 Data Model (Supabase)

The app uses Supabase with the following tables (run schema.sql in Supabase SQL Editor):

- **user_settings**: onboarding status, theme preference, font size, tone preference
- **cycles**: cycle tracking (mood, libido, phase, period, date)
- **intimacy_logs**: intimacy data (strictly RLS-protected, user-scoped only)
- **quests**: gamification quests (progress, rewards, completion status)
- **user_progress**: coins, levels, streak tracking

**Row Level Security**: All tables have RLS policies ensuring users can only access their own data. No cross-user data leakage is possible.

## 📱 Screens Overview

### 1. Home (Dashboard)
- Phase-aware banner with gradient background matching current cycle phase
- Daily check-in with mood and libido sliders
- Energy map visualization
- Mascot companion with real-time reactions
- Quest progress and coin display

### 2. Onboarding
- 4-step progressive flow:
  1. Select cycle phase (menstrual/follicular/ovulatory/luteal)
  2. Choose app tone (playful/serious/balanced)
  3. Meet the mascot companion
  4. Complete onboarding (signed-in users save preferences to Supabase)

### 3. Cycle Log
- Phase selection wheel
- Mood slider (1-10)
- Libido slider (1-10)
- Intimacy level selection (0-5 traffic light)
- Save with coin reward and quest progress check

### 4. Insights
- Phase-specific insight cards with animations
- Mood/libido/energy trend charts (Canvas-based)
- Key insights about cycle patterns
- Recommendations based on current phase

### 5. Intimacy Center
- Traffic light consent system (green/yellow/red)
- Phase-specific intimacy tips with illustrated suggestions
- Partner mode toggle (opt-in, shares phase/openness only)
- Intimacy Menu generator with collectible cards
- Preferred terms storage and retrieval

### 6. Settings
- Theme mode (light/dark/system)
- Font size adjustment (small/medium/large)
- Notification toggles
- Privacy controls (hide intimacy section, incognito mode)
- About section with version info

## 🎨 Premium Aesthetic Direction

**Color Psychology**:
- **Cream/Soft Beige**: Warm, comforting background that reduces eye strain
- **Muted Pinks/Peaches**: Gentle, nurturing, associated with care and compassion
- **Deep Berry**: Strong, grounding, represents strength and resilience
- **Phase Accents**:
  - Menstrual: Dusty rose → connects to blood, allows conversation about periods
  - Follicular: Fresh mint → growth, renewal, renewal of energy
  - Ovulatory: Golden peach → confidence, warmth, peak energy
  - Luteal: Lavender → calm, reflection, preparation for next cycle

**Motion Language**:
- **Elastic easing** (cubic-bezier(0.25, 0.46, 0.45, 0.94)): Natural, bouncy feeling
- **Micro-interactions**: Buttons "breathe," icons gently pulse on hover
- **Phase transitions**: Background gradients morph smoothly between phases
- **Squash-and-stretch**: Mascot reactions feel lively but not cartoonish

**Typography**:
- **Primary**: `'Inter', 'SF Pro Rounded', 'Helvetica Neue', sans-serif`
- **Scalable scale**: xs(0.75rem) → xx(3rem)
- **Line height**: tight(1.2) for captions, normal(1.5) for body, relaxed(1.6) for longform
- **Weights**: 300(light) → 700(bold), with emphasis on 500(medium) and 600(semibold)

## 📊 Privacy & Safety

**User Data Control**:
- All intimacy features optional and privately locked (biometric/Face ID)
- One-tap "Hide intimacy section" / incognito mode for whole app
- Clear, simple privacy dashboard: what's stored, what's shared, what's deleted
- Users can export their data or request deletion (GDPR compliance)
- No data shared with third parties without explicit consent

**Safety Features**:
- "Clear all data" button in settings
- Session timeout after prolonged inactivity
- No tracking across websites or apps
- Age verification not implemented (app designed for 20-28 demographic)

## 📱 Responsive Design

**Breakpoints**:
- **Mobile** (320-375px): Stacked layout, bottom navigation, touch-friendly hit areas (44px minimum)
- **Tablet** (768-1024px): Two-column layouts where appropriate, larger tap targets
- **Desktop** (1024+): Full feature display, sidebar for navigation where beneficial

**Touch Gestures**:
- Swipe between insight cards
- Pinch to zoom on images (optional)
- Long-press for menu actions
- Drag to dismiss modals/overlays

## 📦 Export/Import Data

**Users can**:
- Export their cycle data as JSON or CSV
- Import previously exported data
- Delete all their data permanently
- Transfer data to another account

**Data fields exportable**:
- All cycle logs (date, phase, mood, libido, intimacy level, period status)
- Intimacy logs (with consent)
- Quest progress and completion status
- Coin/level/streak history
- User preferences and settings

## 📦 Third-Party Integrations (Optional)

**Consider adding** (not in v1.0):
- Firebase Analytics (with user consent)
- Google Calendar integration for period tracking
- Apple HealthKit integration (iOS)
- Fitbit/Apple Watch integration
- Spotify integration for cycle-themed playlists
- Twitter/X (period-positive accounts)
- Discord community server

## 🐛 Known Issues & Roadmap

**v1.0 Focus**:
- Core cycle tracking ✅
- Phase-aware UI ✅
- Intimacy consent system ✅
- Gamification (coins/levels/quests) ✅
- Basic privacy controls ✅

**v1.1 Roadmap**:
- Apple HealthKit integration
- Apple Watch app
- Advanced analytics dashboard
- Team/partner features (enhanced)
- Multi-language support (i18n)
- Dark mode fully optimized
- Audio feedback options
- Community features (anonymous sharing)

**v2.0 Roadmap**:
- AI-powered cycle predictions
- Integration with fertility tracking
- Advanced AI chatbot for questions
- API for third-party integrations
- White-label solution for health clinics

## 🤝 Contributing

**Development Setup**:
1. Fork the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start development server
4. Make changes, follow code style
5. Run `npm run build` to test build
6. Submit pull request

**Code Style**:
- Use TypeScript where possible (planned for v2)
- Follow existing component patterns
- Add JSDoc comments for complex functions
- Ensure accessibility (a11y) standards
- Test on mobile devices

**Issues**:
- Report bugs via GitHub Issues
- Suggest features via Discussions
- Security issues: email privado@example.com

## 📜 License

This project is licensed under the MIT License. See the LICENSE file in the root directory for details.

**Copyright (c) 2024 HerCycle. All rights reserved.**

## 📧 Contact

- **Email**: support@hercycle.com
- **GitHub**: github.com/moisoi/hercycle
- **Twitter**: @HerCycleApp
- **Discord**: discord.gg/hercycle-community (planned)

---

*HerCycle is designed with ❤️ for the 20-28 age group, focusing on premium aesthetics, privacy, and practical cycle tracking.*

---

**Last Updated**: {{date}}  
**Version**: 1.0.0  
**Supabase Project**: aakttvtzjwdtkvgttqga
