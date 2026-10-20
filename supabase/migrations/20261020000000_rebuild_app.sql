-- HerCycle web app rebuild. Safe to apply more than once.
-- Adds the columns and the journey table the rebuilt app reads and writes.

alter table public.user_settings
  add column if not exists last_period_start date,
  add column if not exists cycle_length smallint not null default 28,
  add column if not exists period_length smallint not null default 5,
  add column if not exists language_preference text not null default 'en',
  add column if not exists gamification_enabled boolean not null default true,
  add column if not exists show_rewards boolean not null default true,
  add column if not exists celebrate boolean not null default true,
  add column if not exists notifications_enabled boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_settings_cycle_length_range') then
    alter table public.user_settings add constraint user_settings_cycle_length_range check (cycle_length between 21 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_settings_period_length_range') then
    alter table public.user_settings add constraint user_settings_period_length_range check (period_length between 2 and 10);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_settings_language_allowed') then
    alter table public.user_settings add constraint user_settings_language_allowed check (language_preference in ('en', 'am'));
  end if;
end
$$;

-- Intimacy: feeling, openness, and comfort are separate from the older traffic-light fields.
alter table public.intimacy_logs
  add column if not exists feeling text not null default 'warm',
  add column if not exists openness text not null default 'maybe',
  add column if not exists comfort smallint not null default 5;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'intimacy_logs_feeling_allowed') then
    alter table public.intimacy_logs add constraint intimacy_logs_feeling_allowed check (feeling in ('warm', 'playful', 'quiet'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'intimacy_logs_openness_allowed') then
    alter table public.intimacy_logs add constraint intimacy_logs_openness_allowed check (openness in ('open', 'maybe', 'pause'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'intimacy_logs_comfort_range') then
    alter table public.intimacy_logs add constraint intimacy_logs_comfort_range check (comfort between 0 and 10);
  end if;
end
$$;

-- Journey: one row per milestone per user. The unique key enforces "awarded once".
create table if not exists public.journey_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  milestone_key text not null,
  awarded_at timestamptz not null default now(),
  constraint journey_milestones_user_key_unique unique (user_id, milestone_key)
);

alter table public.journey_milestones enable row level security;

drop policy if exists "Users can read own milestones" on public.journey_milestones;
drop policy if exists "Users can insert own milestones" on public.journey_milestones;
drop policy if exists "Users can delete own milestones" on public.journey_milestones;

create policy "Users can read own milestones"
  on public.journey_milestones for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own milestones"
  on public.journey_milestones for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own milestones"
  on public.journey_milestones for delete to authenticated
  using (auth.uid() = user_id);
