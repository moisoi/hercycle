-- ============================================================
-- HerCycle Supabase Database Schema
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. EXTEND AUTH USERS TABLE
-- Add custom fields to the auth.users table via a migration or profile table
-- We'll use a public.user_settings table that references auth.users

-- ============================================================
-- 2. USER SETTINGS TABLE
-- Stores onboarding status, preferences, etc.
-- ============================================================
create table if not exists public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users on delete cascade,
  onboarding_completed boolean default false,
  theme_preference text default 'light', -- light, dark, system
  font_size text default 'medium', -- small, medium, large
  tone_preference text default 'balanced', -- playful, serious, balanced
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on user_settings
alter table public.user_settings enable row level security;

-- Create RLS policies for user_settings
create policy "Users can read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Service role can all operations"
  on public.user_settings for all
  with check (true);

-- ============================================================
-- 3. CYCLES TABLE (Cycle Tracking)
-- ============================================================
create table if not exists public.cycles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  phase text not null, -- menstrual, follicular, ovulatory, luteal
  mood integer, -- 1-10
  libido integer, -- 1-10
  intimacy_level integer, -- 0-5 (traffic light level)
  period boolean default false,
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date) -- One cycle log per day per user
);

-- Enable RLS on cycles
alter table public.cycles enable row level security;

-- Create RLS policies for cycles
create policy "Users can read own cycles"
  on public.cycles for select
  using (auth.uid() = user_id);

create policy "Users can insert own cycles"
  on public.cycles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cycles"
  on public.cycles for update
  using (auth.uid() = user_id);

create policy "Service role can all operations"
  on public.cycles for all
  with check (true);

-- Create index for performance
create index idx_cycles_user_id on public.cycles (user_id);
create index idx_cycles_date on public.cycles (date);

-- ============================================================
-- 4. INTIMACY LOGS TABLE (SENSITIVE - Strict RLS)
-- ============================================================
create table if not exists public.intimacy_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  libido integer, -- 1-10
  intimacy_level integer, -- 0-5 (green/yellow/red traffic light)
  traffic_light text, -- 'green', 'yellow', 'red'
  preferred_terms text[], -- array of preferred intimacy terms
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date) -- One intimacy log per day per user
);

-- Enable RLS on intimacy_logs (STRICT)
alter table public.intimacy_logs enable row level security;

-- Create VERY STRICT RLS policies for intimacy data
-- Users can ONLY read their own intimacy logs
create policy "Users can read own intimacy logs"
  on public.intimacy_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own intimacy logs"
  on public.intimacy_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own intimacy logs"
  on public.intimacy_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own intimacy logs"
  on public.intimacy_logs for delete
  using (auth.uid() = user_id);

create policy "Service role can all operations"
  on public.intimacy_logs for all
  with check (true);

-- Create index for performance
create index idx_intimacy_user_id on public.intimacy_logs (user_id);
create index idx_intimacy_date on public.intimacy_logs (date);

-- ============================================================
-- 5. QUESTS TABLE (Gamification)
-- ============================================================
create table if not exists public.quests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null, -- e.g., 'Log mood 4 days this week'
  description text,
  target integer not null, -- e.g., 4 days
  reward integer default 50, -- coins earned
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS on quests
alter table public.quests enable row level security;

-- Create RLS policies for quests
create policy "Users can read own quests"
  on public.quests for select
  using (auth.uid() = user_id);

create policy "Users can update own quests"
  on public.quests for update
  using (auth.uid() = user_id);

create policy "Service role can all operations"
  on public.quests for all
  with check (true);

-- Create index for performance
create index idx_quests_user_id on public.quests (user_id);

-- ============================================================
-- 6. USER PROGRESS TABLE (Coins, Levels, Streaks)
-- ============================================================
create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users on delete cascade,
  total_cycles integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_coins integer default 0,
  current_level integer default 1,
  updated_at timestamptz default now()
);

-- Enable RLS on user_progress
alter table public.user_progress enable row level security;

-- Create RLS policies for user_progress
create policy "Users can read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

create policy "Service role can all operations"
  on public.user_progress for all
  with check (true);

-- ============================================================
-- 7. INDEXES & PERFORMANCE OPTIMIZATION
-- ============================================================

-- Grant permissions to public role (for development)
-- In production, you may want to restrict this
grant all on public.user_settings to public;
grant all on public.cycles to public;
grant all on public.intimacy_logs to public;
grant all on public.quests to public;
grant all on public.user_progress to public;

-- ============================================================
-- 8. HELPER FUNCTIONS (Optional)
-- ============================================================

-- Function to get user's current progress
create or replace function public.get_user_progress(p_user_id uuid)
returns jsonb
language plpgsql
as $$
begin
  return (select jsonb_build_object(
    'total_cycles', coalesce((select count(*) from public.cycles where user_id = p_user_id), 0),
    'current_streak', coalesce((select current_streak from public.user_progress where user_id = p_user_id), 0),
    'longest_streak', coalesce((select longest_streak from public.user_progress where user_id = p_user_id), 0),
    'total_coins', coalesce((select total_coins from public.user_progress where user_id = p_user_id), 0),
    'current_level', coalesce((select current_level from public.user_progress where user_id = p_user_id), 1)
  )::jsonb);
end
$$;

-- Function to insert a new cycle log
create or replace function public.insert_cycle_log(
  p_user_id uuid,
  p_phase text,
  p_mood integer,
  p_libido integer,
  p_intimacy_level integer,
  p_period boolean,
  p_date date
)
returns jsonb
language plpgsql
as $$
declare
  v_result jsonb;
begin
  insert into public.cycles (user_id, phase, mood, libido, intimacy_level, period, date)
  values (p_user_id, p_phase, p_mood, p_libido, p_intimacy_level, p_period, p_date)
  returning * into v_result;

  -- Update user progress
  update public.user_progress
  set total_cycles = total_cycles + 1,
      current_streak = case when (select current_streak from public.user_progress where user_id = p_user_id) > 0 then (select current_streak from public.user_progress where user_id = p_user_id) + 1 else 1 end,
      updated_at = now()
  where user_id = p_user_id;

  return v_result;
end
$$;

-- ============================================================
-- INSTRUCTIONS
-- ============================================================
--
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste the entire schema.sql content
-- 3. Run the SQL
-- 4. Go to Supabase Dashboard → Settings → API
-- 5. Note your project URL and anon public key (already provided)
-- 6. Go to Authentication → Settings → Enable Email auth
-- 7. Go to Storage → Create buckets: avatars, stickers, themes
-- 8. Go to Authentication → RLS Policies → Enable row level security
--
-- After running the schema, your Supabase backend is ready!
-- Use the supabase.js file created in src/lib/supabase.js
-- to integrate with your React frontend.