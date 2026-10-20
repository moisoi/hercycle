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
  phase_selected text not null default 'menstrual', -- menstrual, follicular, ovulatory, luteal
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable row-level security and keep each user's profile private.
alter table public.user_settings enable row level security;
alter table public.user_settings add column if not exists phase_selected text not null default 'menstrual';
alter table public.user_settings add column if not exists hide_intimacy boolean not null default false;

drop policy if exists "Users can read own settings" on public.user_settings;
drop policy if exists "Users can insert own settings" on public.user_settings;
drop policy if exists "Users can update own settings" on public.user_settings;
drop policy if exists "Service role can all operations" on public.user_settings;
create policy "Users can read own settings"
  on public.user_settings for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own settings"
  on public.user_settings for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own settings"
  on public.user_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. CYCLES TABLE (Cycle Tracking)
-- ============================================================
create table if not exists public.cycles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  phase text not null, -- menstrual, follicular, ovulatory, luteal
  mood integer, -- 1-10
  energy integer, -- 1-10
  libido integer, -- optional, 1-10
  intimacy_level integer, -- 0-5 (traffic light level)
  period boolean default false,
  period_start_date date,
  period_duration_days smallint,
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date), -- One cycle log per day per user
  constraint cycles_period_duration_days_range
    check (period_duration_days is null or period_duration_days between 1 and 10)
);

-- Enable RLS and restrict cycle data to the signed-in owner.
alter table public.cycles enable row level security;
alter table public.cycles add column if not exists energy integer;
alter table public.cycles add column if not exists period_start_date date;
alter table public.cycles add column if not exists period_duration_days smallint;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cycles'::regclass
      and conname = 'cycles_period_duration_days_range'
  ) then
    alter table public.cycles
      add constraint cycles_period_duration_days_range
      check (period_duration_days is null or period_duration_days between 1 and 10);
  end if;
end
$$;

drop policy if exists "Users can read own cycles" on public.cycles;
drop policy if exists "Users can insert own cycles" on public.cycles;
drop policy if exists "Users can update own cycles" on public.cycles;
drop policy if exists "Users can delete own cycles" on public.cycles;
drop policy if exists "Service role can all operations" on public.cycles;
create policy "Users can read own cycles"
  on public.cycles for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own cycles"
  on public.cycles for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own cycles"
  on public.cycles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own cycles"
  on public.cycles for delete to authenticated
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists idx_cycles_user_id on public.cycles (user_id);
create index if not exists idx_cycles_date on public.cycles (date);

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
  desire_vibe text not null default 'tender',
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date), -- One intimacy log per day per user
  constraint intimacy_logs_desire_vibe_allowed
    check (desire_vibe in ('tender', 'playful', 'naughty'))
);

-- Intimacy information is especially sensitive: authenticated users can
-- access only rows whose user_id matches their Supabase Auth identity.
alter table public.intimacy_logs enable row level security;
alter table public.intimacy_logs add column if not exists desire_vibe text not null default 'tender';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.intimacy_logs'::regclass
      and conname = 'intimacy_logs_desire_vibe_allowed'
  ) then
    alter table public.intimacy_logs
      add constraint intimacy_logs_desire_vibe_allowed
      check (desire_vibe in ('tender', 'playful', 'naughty'));
  end if;
end
$$;

drop policy if exists "Users can read own intimacy logs" on public.intimacy_logs;
drop policy if exists "Users can insert own intimacy logs" on public.intimacy_logs;
drop policy if exists "Users can update own intimacy logs" on public.intimacy_logs;
drop policy if exists "Users can delete own intimacy logs" on public.intimacy_logs;
drop policy if exists "Service role can all operations" on public.intimacy_logs;
create policy "Users can read own intimacy logs"
  on public.intimacy_logs for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own intimacy logs"
  on public.intimacy_logs for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own intimacy logs"
  on public.intimacy_logs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own intimacy logs"
  on public.intimacy_logs for delete to authenticated
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists idx_intimacy_user_id on public.intimacy_logs (user_id);
create index if not exists idx_intimacy_date on public.intimacy_logs (date);

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

-- Enable RLS; quest rows are owned by one authenticated user.
alter table public.quests enable row level security;

drop policy if exists "Users can read own quests" on public.quests;
drop policy if exists "Users can insert own quests" on public.quests;
drop policy if exists "Users can update own quests" on public.quests;
drop policy if exists "Users can delete own quests" on public.quests;
drop policy if exists "Service role can all operations" on public.quests;
create policy "Users can read own quests"
  on public.quests for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own quests"
  on public.quests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own quests"
  on public.quests for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own quests"
  on public.quests for delete to authenticated
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists idx_quests_user_id on public.quests (user_id);

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

-- Enable RLS and protect progress records by owner.
alter table public.user_progress enable row level security;

drop policy if exists "Users can read own progress" on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;
drop policy if exists "Users can delete own progress" on public.user_progress;
drop policy if exists "Service role can all operations" on public.user_progress;
create policy "Users can read own progress"
  on public.user_progress for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert own progress"
  on public.user_progress for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update own progress"
  on public.user_progress for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own progress"
  on public.user_progress for delete to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 7. INDEXES & PERFORMANCE OPTIMIZATION
-- ============================================================

-- Only authenticated users receive table privileges; RLS above restricts
-- each statement to the current user's rows.
revoke all on public.user_settings, public.cycles, public.intimacy_logs, public.quests, public.user_progress
  from public, anon, authenticated;
grant select, insert, update, delete on public.user_settings, public.cycles, public.intimacy_logs, public.quests, public.user_progress
  to authenticated;

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
-- Remove the previous signature so period details are accepted consistently.
drop function if exists public.insert_cycle_log(uuid, text, integer, integer, integer, boolean, date);
create or replace function public.insert_cycle_log(
  p_user_id uuid,
  p_phase text,
  p_mood integer,
  p_libido integer,
  p_intimacy_level integer,
  p_period boolean,
  p_date date,
  p_period_start_date date default null,
  p_period_duration_days smallint default null
)
returns jsonb
language plpgsql
as $$
declare
  v_result jsonb;
begin
  insert into public.cycles as cycle (user_id, phase, mood, libido, intimacy_level, period, date, period_start_date, period_duration_days)
  values (p_user_id, p_phase, p_mood, p_libido, p_intimacy_level, p_period, p_date, p_period_start_date, p_period_duration_days)
  returning to_jsonb(cycle) into v_result;

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
-- 5. Set the project URL and anon/publishable key in your deployment environment (see .env.example)
-- 6. Go to Authentication → Settings → Enable Email auth
-- 7. Go to Storage → Create buckets: avatars, stickers, themes
-- 8. Review the authenticated-user RLS policies above before launch
--
-- After running the schema, your Supabase backend is ready!
-- Use the supabase.js file created in src/lib/supabase.js
-- to connect the React frontend. Never expose the Supabase service-role key in the browser.