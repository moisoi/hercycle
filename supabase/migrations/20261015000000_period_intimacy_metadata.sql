-- Align an existing HerCycle Supabase project with the current frontend.
-- Safe to apply more than once. For a brand-new project, run schema.sql instead.

-- New profile and check-in fields used by onboarding, settings, and dashboards.
alter table public.user_settings
  add column if not exists phase_selected text not null default 'menstrual',
  add column if not exists hide_intimacy boolean not null default false;

alter table public.cycles
  add column if not exists energy integer,
  add column if not exists period_start_date date,
  add column if not exists period_duration_days smallint;

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

alter table public.intimacy_logs
  add column if not exists desire_vibe text not null default 'tender';

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

-- Keep all personal tables owner-scoped. In particular, do not leave old
-- permissive service-role policies or grants to anon/public on the tables.
alter table public.user_settings enable row level security;
alter table public.cycles enable row level security;
alter table public.intimacy_logs enable row level security;
alter table public.quests enable row level security;
alter table public.user_progress enable row level security;

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

revoke all on public.user_settings, public.cycles, public.intimacy_logs, public.quests, public.user_progress
  from public, anon, authenticated;
grant select, insert, update, delete on public.user_settings, public.cycles, public.intimacy_logs, public.quests, public.user_progress
  to authenticated;

create index if not exists idx_cycles_user_id on public.cycles (user_id);
create index if not exists idx_cycles_date on public.cycles (date);
create index if not exists idx_intimacy_user_id on public.intimacy_logs (user_id);
create index if not exists idx_intimacy_date on public.intimacy_logs (date);
create index if not exists idx_quests_user_id on public.quests (user_id);

-- Update the older RPC signature so period metadata is accepted consistently.
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
  insert into public.cycles as cycle (
    user_id, phase, mood, libido, intimacy_level, period, date,
    period_start_date, period_duration_days
  )
  values (
    p_user_id, p_phase, p_mood, p_libido, p_intimacy_level, p_period, p_date,
    p_period_start_date, p_period_duration_days
  )
  returning to_jsonb(cycle) into v_result;

  update public.user_progress
  set total_cycles = total_cycles + 1,
      current_streak = case when current_streak > 0 then current_streak + 1 else 1 end,
      updated_at = now()
  where user_id = p_user_id;

  return v_result;
end
$$;
