# HerCycle - Premium Period Tracking Web App

A premium, full-featured period tracking web application designed for women aged 20-28, with a focus on modern aesthetics, comprehensive cycle tracking, intimacy features, and gamification.

## Overview

HerCycle combines elegant design with practical functionality, offering a premium experience with soft gradients, rounded shapes, organic motion, and phase-aware UI that evolves throughout the menstrual cycle.

## Features

### Design & Aesthetics
- **Modern, soft, and expressive** UI with rounded shapes, fluid gradients, and organic motion
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
  - Menstrual: Period sex comfort tips, external touch focus
  - Follicular: Energy rising, try new things
  - Ovulatory: Confidence peak, initiate dates
  - Luteal: Emotional closeness, cuddles and massage
- **"Intimacy Menu"** generator with rotating cards users can collect and mark as tried
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