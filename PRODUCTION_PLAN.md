# HerCycle Production Backend Plan

## Current State
- **Frontend**: React + MUI + Framer Motion at http://localhost:3000
- **Backend**: Node.js + Express with JSON file storage (`server/db.json`)
- **Auth**: JWT-based, bcrypt password hashing
- **Data**: In-memory + JSON file persistence
- **Status**: Working full-stack app ready for production migration

## 🎯 Goal: Production-Ready Backend

HerCycle needs a backend that handles:
1. **User authentication** with privacy controls
2. **Cycle data tracking** (mood, libido, intimacy, phases)
3. **Gamification** (coins, levels, quests, progress)
4. **Intimacy data** (sensitive, needs strong privacy)
5. **Real-time updates** (cycle tracking, mascot reactions)
6. **Data persistence** across user sessions
7. **Scalability** for production launch

---

## 📊 Backend Option Comparison

### 1. **Supabase** ⭐ **RECOMMENDED**

**Best for**: Full-stack app, PostgreSQL, built-in Auth, real-time, generous free tier

#### Pros:
- **PostgreSQL database** - Robust, industry-standard, SQL queries
- **Built-in Auth** - Email/password, Google, GitHub, magic links
- **Real-time subscriptions** - Cycle tracking updates in real-time
- **Storage** - For avatars, avatars outfits, sticker packs
- **Edge Functions** - Custom logic (quest completion, coin awards)
- **TypeScript** - First-class support, auto-generated types
- **Generous free tier** - 500MB database, 1GB storage, 10K auth users/month
- **Open source** - Can self-host if needed
- **REST + GraphQL + Realtime** - Multiple API approaches

#### Cons:
- Requires SQL learning (but Supabase JS SDK abstracts most of it)
- Real-time requires database changes

#### HerCycle Implementation:
```javascript
// Supabase setup would replace:
// - db.json file storage
// - JWT auth (Supabase handles this)
// - REST endpoints (auto-generated)

// Users table: id, email, encrypted_password, onboarding_completed, phase, coins, level, streak, created_at
// Cycles table: id, user_id, phase, mood, libido, intimacy_level, period, date, created_at
// Intimacy_logs table: id, user_id, libido, intimacy_level, traffic_light, preferred_terms, date
// Quests table: id, title, description, target, reward, completed, user_id
// Profiles table: id, user_id, theme_preference, font_size, tone, mascot_outfit, updated_at
```

#### Migration Complexity: **Medium**
- Replace `db.json` with Supabase queries
- Update auth flow (Supabase Auth vs custom JWT)
- Convert JSON schemas to PostgreSQL tables
- Keep same API endpoints or use Supabase JS client

#### Cost: **Free tier sufficient for launch**, then $25/month for Pro

---

### 2. **Firebase** (Firestore + Auth)

#### Pros:
- **NoSQL Firestore** - Flexible schema, great for iterative development
- **Auth ecosystem** - Excellent UI libraries, battle-tested
- **Real-time listeners** - Perfect for cycle tracking updates
- **Offline sync** - Users can track cycles offline, data syncs when online
- **Hosting** - Free, integrated with React
- **Functions** - Cloud Functions for backend logic

#### Cons:
- **NoSQL learning curve** - Different query patterns
- **Cost can escalate** - Free tier limited, pay-as-you-go
- **Vendor lock-in** - Harder to migrate away later
- **Data structure planning** required upfront

#### HerCycle Implementation:
- Firestore collections: `users`, `cycles`, `intimacyLogs`, `quests`
- Auth with email/password
- Real-time listeners for cycle updates
- Firebase Storage for assets

#### Migration Complexity: **Medium-High**
- Redesign data model for NoSQL
- Update all API calls to Firebase SDK
- Migration tools available but require planning

#### Cost: **Free tier**, then pay-as-you-go (can be expensive at scale)

---

### 3. **Appwrite** 🆕 **ALTERNATIVE WORTH CONSIDERING**

#### Pros:
- **Self-hostable or cloud** - More control than Firebase
- **Full feature set** - Auth, DB, Storage, Functions, Real-time
- **Multiple SDKs** - JavaScript, Dart, Kotlin, Swift, Flutter
- **SQLite + PostgreSQL support** - Flexible database options
- ** GDPR compliant** - Good for privacy-focused app
- **More affordable** than Firebase at scale
- **Open source** core, cloud version available

#### Cons:
- **Smaller ecosystem** than Firebase/Supabase
- **Fewer tutorials** for specific use cases
- **Less mature** real-time features

#### HerCycle Implementation:
- Appwrite Server + Auth + Database
- Similar API structure to Supabase
- Good documentation

#### Migration Complexity: **Medium**
- Similar to Supabase but different SDK
- Good documentation makes it easier

#### Cost: **Cloud plans**, or self-host on existing infrastructure

---

### 4. **AWS Amplify**

#### Pros:
- **Enterprise-grade** - Amazon's backend services
- **Full AWS ecosystem** - S3, Cognito, DynamoDB, Lambda
- **Auth with Cognito** - Enterprise-grade security
- **GraphQL API** - Flexible queries
- **Good TypeScript support**

#### Cons:
- **Complexity** - Too many services, overwhelming for small app
- **Cost** - Can become expensive
- **Steeper learning curve**

#### HerCycle Implementation:
- Overkill for this app scale
- Would use Cognito + AppSync + DynamoDB

#### Migration Complexity: **High**
- Too many services to set up

#### Cost: **Pay-per-use**, free tier limited

---

### 5. **Keep Current JSON Approach** (with improvements)

#### Pros:
- **Zero migration** - Keep what works
- **Full control** - No third-party dependencies
- **No learning curve** - Same code structure
- **Low cost** - Free (just server costs)

#### Cons:
- **No real-time** - Polling required for updates
- **Scalability limits** - File-based, not ideal for many users
- **Concurrency issues** - Multiple users writing same file
- **No built-in auth** - Reinventing the wheel
- **Not "production-ready"** perception

#### HerCycle Implementation:
- Enhance current `server/index.js`
- Add file locking for concurrent writes
- Improve error handling
- Add rate limiting

#### Migration Complexity: **None**
- Keep existing code

#### Cost: **Free** (current setup)

---

## 🏆 Recommendation: **Supabase**

### Why Supabase for HerCycle:

1. **PostgreSQL** - Relational data makes sense for:
   - User profiles with relational data (cycles, quests, intimacy logs)
   - Queries like "get user's last 7 cycle logs"
   - Complex quest progress tracking

2. **Built-in Auth** - Replaces custom JWT system:
   - Email/password authentication
   - Password recovery
   - Session management
   - More secure than custom implementation

3. **Real-time** - Perfect for:
   - Cycle tracking updates appearing instantly
   - Mascot reacting to real-time data
   - Quest progress updates across devices

4. **Storage** - For:
   - Mascot outfit images
   - Sticker pack assets
   - App theme assets
   - User avatars

5. **Type Safety** - Auto-generated TypeScript types:
   - Catch errors at compile time
   - Better developer experience
   - Clear API contracts

6. **Free Tier** - Launch without costs:
   - 500MB database
   - 1GB storage  
   - 10K auth users/month
   - Real-time included

7. **Open Source** - Not locked in:
   - Can self-host if needed
   - Standard PostgreSQL means easy migration
   - Vendor-neutral data

### Supabase Migration Path:

#### Phase 1: Setup (Week 1)
- Create Supabase project
- Set up database schemas (users, cycles, intimacy_logs, quests)
- Configure Auth (email/password)
- Set up Storage buckets

#### Phase 2: Frontend Integration (Week 2-3)
- Install `@supabase/supabase-js`
- Replace API calls with Supabase client
- Update auth flow
- Add real-time subscriptions

#### Phase 3: Data Migration (Week 3-4)
- Export current `db.json` data
- Import to Supabase tables
- Update any existing user data
- Test thoroughly

#### Phase 4: Polish & Launch (Week 4-5)
- Remove JSON file storage from server
- Update deployment config
- Set up domain/custom HTTPS
- Monitor and optimize

---

## 🔄 Migration Strategy

### Option A: **Full Migration** (Recommended)
- Move entire backend to Supabase
- Update all frontend API calls
- Keep existing data model mapping
- Benefits: Full feature set, real-time, scalable

#### Option B: **Hybrid Approach**
- Keep current JSON backend for non-critical data
- Use Supabase for Auth + primary data
- Gradual migration over time
- Benefits: Lower risk, incremental changes

#### Option C: **Stay JSON, Enhance**
- Improve current server setup
- Add file locking, better error handling
- Add basic auth improvements
- Benefits: Zero migration, lowest immediate cost
- Drawbacks: Not truly production-ready, limited scalability

---

## 📋 Supabase Database Schema for HerCycle

```sql
-- Users table (extends Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  theme_preference text default 'light', -- 'light', 'dark', 'system'
  font_size text default 'medium', -- 'small', 'medium', 'large'
  tone_preference text default 'balanced', -- 'playful', 'serious', 'balanced'
  onboarding_completed boolean default false,
  cycle_veteran boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cycle tracking
create table public.cycles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade,
  phase text not null, -- 'menstrual', 'follicular', 'ovulatory', 'luteal'
  mood integer, -- 1-10
  libido integer, -- 1-10
  intimacy_level integer, -- 0-5
  period boolean default false,
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date) -- One cycle log per day per user
);

-- Intimacy logs (sensitive, can have RLS)
create table public.intimacy_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade,
  libido integer,
  intimacy_level integer, -- 0-5 traffic light level
  traffic_light text, -- 'green', 'yellow', 'red'
  preferred_terms text[], -- array of terms
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Quests/gamification
create table public.quests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade,
  title text not null,
  description text,
  target integer not null,
  reward integer default 50,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- User progress tracking
create table public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade,
  total_cycles integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_coins integer default 0,
  current_level integer default 1,
  updated_at timestamptz default now()
);
```

---

## 🛡 Privacy & Security Considerations for HerCycle

### Intimate Data Protection:
1. **Row Level Security (RLS)** - Supabase RLS policies:
   - Users can only access their own data
   - Intimacy logs strictly user-scoped
   - No cross-user data leakage

2. **Auth Context** - Every request includes user ID:
   - Automatic data filtering by user
   - No need to manually check IDs in every query

3. **Privacy Controls** (app-side):
   - "Hide intimacy section" toggle
   - Incognito mode option
   - Data export/deletion requests
   - Opt-in consent for features

4. **Data Encryption**:
   - Supabase stores encrypted passwords (bcrypt)
   - HTTPS everywhere
   - Consider sensitivity tags on data fields

---

## 💰 Cost Estimate for Production Launch

| Service | Free Tier | Production Estimate |
|---------|-----------|---------------------|
| **Supabase** | 500MB DB, 1GB storage, 10K auth/month | $25/month Pro plan |
| **Hosting** | Included (Vercel/Netlify free) | $0-20/month |
| **Domain** | Custom domain optional | $12/year |
| **Total Monthly** | **$0** (launch free) | **~$35/month** |

---

## 🚀 Recommended Action Plan

### Week 1: Supabase Setup
```bash
1. Create Supabase account at supabase.com
2. New project: "hercycle-prod"
3. Run database schema SQL
4. Configure Auth (email settings)
5. Set up Storage buckets (avatars, stickers)
6. Set up RLS policies
```

### Week 2: Frontend Updates
```bash
1. Install: npm install @supabase/supabase-js
2. Create supabaseClient.js
3. Replace auth flow (login/register)
4. Replace cycle logging API calls
5. Add real-time subscriptions
6. Update quest completion logic
```

### Week 3: Data Migration
```bash
1. Export current db.json data
2. Write migration script
3. Import to Supabase tables
4. Test all user flows
5. Verify data integrity
6. Update user onboarding status
```

### Week 4: Polish & Launch
```bash
1. Remove JSON file storage from server
2. Update deployment (Vercel/Netlify)
3. Set custom domain
4. Test privacy features
5. Monitor analytics
6. Prepare launch marketing
```

---

## 📦 Quick Start Commands

### Initialize Supabase CLI:
```bash
npm install -g supabase
supabase init
supabase start  # Start local Supabase emulator
```

### Add to HerCycle Frontend:
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Sample Usage in Components:
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@test.com',
  password: 'password123',
  options: {
    data: {
      username: 'username',
      theme_preference: 'light',
    },
  },
})

// Insert cycle log
const { data, error } = await supabase
  .from('cycles')
  .insert({ 
    user_id: user.id, 
    phase: 'follicular', 
    mood: 7, 
    libido: 8,
    date: new Date().toISOString().split('T')[0] 
  })
  .select()

// Real-time cycle updates
const cycles = supabase
  .from('cycles')
  .on('*', (payload) => {
    // Update UI when new cycle logged
    console.log('Cycle updated:', payload)
  })
  .eq('user_id', user.id)
  .subscribe()
```

---

## � concluding Thoughts

**Supabase is the best choice for HerCycle** because:

✅ **Perfect fit** for the data model (users + cycles + quests + intimacy)  
✅ **Real-time** enhances the user experience (instant updates)  
✅ **Auth** is battle-tested and replaces custom JWT system  
✅ **Free tier** allows launch without costs  
✅ **Open source** means not vendor-locked  
✅ **PostgreSQL** scales as user base grows  
✅ **TypeScript** improves developer experience  
✅ **Storage** handles assets naturally  
✅ **RLS** provides built-in privacy for intimate data  

**Alternative**: If Supabase doesn't feel right, **Appwrite** is an excellent alternative with similar features and self-hosting options.

**Do NOT recommend**: Staying with JSON file storage for production - it won't scale, lacks real-time, and isn't production-ready for a serious app.

The migration effort is worth it for a production launch, and Supabase's documentation and community make it the smoothest path.