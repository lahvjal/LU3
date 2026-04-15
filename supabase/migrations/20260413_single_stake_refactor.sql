-- LU Young Men Camp Tracker - Single stake refactor (LU3)
-- This migration removes multi-stake structure and keeps ward/quorum scoping.

-- ---------------------------------------------------------------------------
-- 1) Normalize role data before constraints/functions are recreated
-- ---------------------------------------------------------------------------

update public.user_roles
set role = 'stake_leader'
where role::text = 'stake_admin';

update public.user_roles
set role = 'young_men_captain'
where role::text in ('quorum_adviser', 'checkin_staff', 'viewer');

-- ---------------------------------------------------------------------------
-- 2) Drop dependent views, policies, triggers, and helper functions
-- ---------------------------------------------------------------------------

drop view if exists public.v_ward_young_men_status;
drop view if exists public.v_missing_shirt_sizes;
drop view if exists public.v_shirt_order_counts;

drop policy if exists wards_select on public.wards;
drop policy if exists quorums_select on public.quorums;
drop policy if exists shirt_sizes_select on public.shirt_sizes;
drop policy if exists camp_events_select on public.camp_events;
drop policy if exists camp_events_insert on public.camp_events;
drop policy if exists camp_events_update on public.camp_events;
drop policy if exists camp_events_delete on public.camp_events;
drop policy if exists participants_select on public.participants;
drop policy if exists participants_insert on public.participants;
drop policy if exists participants_update on public.participants;
drop policy if exists participants_delete on public.participants;
drop policy if exists registrations_select on public.registrations;
drop policy if exists registrations_insert on public.registrations;
drop policy if exists registrations_update on public.registrations;
drop policy if exists registrations_delete on public.registrations;
drop policy if exists attendance_logs_select on public.attendance_logs;
drop policy if exists attendance_logs_insert on public.attendance_logs;
drop policy if exists attendance_logs_update on public.attendance_logs;
drop policy if exists attendance_logs_delete on public.attendance_logs;
drop policy if exists user_roles_select on public.user_roles;
drop policy if exists user_roles_insert on public.user_roles;
drop policy if exists user_roles_update on public.user_roles;
drop policy if exists user_roles_delete on public.user_roles;

do $$
begin
  -- Legacy initial schema created stakes_select; guard for environments where
  -- that policy still exists before dropping stake helper functions.
  if to_regclass('public.stakes') is not null then
    execute 'drop policy if exists stakes_select on public.stakes';
  end if;
end
$$;

drop trigger if exists trg_sync_user_role_scope on public.user_roles;
drop trigger if exists trg_validate_participant_scope on public.participants;
drop trigger if exists trg_sync_registration_scope on public.registrations;
drop trigger if exists trg_sync_attendance_scope on public.attendance_logs;
drop trigger if exists trg_ensure_shirt_size_before_confirm on public.registrations;
drop trigger if exists trg_touch_registration_status on public.registrations;

drop function if exists public.sync_user_role_scope();
drop function if exists public.validate_participant_scope();
drop function if exists public.sync_registration_scope();
drop function if exists public.sync_attendance_scope();
drop function if exists public.ensure_shirt_size_before_confirm();
drop function if exists public.touch_registration_status();
drop function if exists public.is_stake_member(uuid) cascade;
drop function if exists public.is_stake_admin(uuid) cascade;
drop function if exists public.is_stake_admin();
drop function if exists public.is_stake_leader(uuid) cascade;
drop function if exists public.is_stake_leader();
drop function if exists public.can_view_ward(uuid);
drop function if exists public.can_manage_ward(uuid);
drop function if exists public.can_manage_registration_ward(uuid);
drop function if exists public.can_record_attendance(uuid);
drop function if exists public.is_young_man_self(uuid);
drop function if exists public.has_any_role();

-- ---------------------------------------------------------------------------
-- 3) Remove stake-level structure and columns
-- ---------------------------------------------------------------------------

alter table if exists public.user_roles
  drop constraint if exists user_roles_user_id_stake_id_ward_id_role_key;
alter table if exists public.user_roles
  drop constraint if exists user_roles_user_id_ward_id_role_key;
alter table if exists public.user_roles
  drop constraint if exists user_roles_check;

alter table if exists public.wards
  drop constraint if exists wards_stake_id_name_key;

drop index if exists public.idx_wards_stake_id;
drop index if exists public.idx_user_roles_lookup;

alter table if exists public.wards drop column if exists stake_id cascade;
alter table if exists public.camp_events drop column if exists stake_id cascade;
alter table if exists public.participants drop column if exists stake_id cascade;
alter table if exists public.registrations drop column if exists stake_id cascade;
alter table if exists public.attendance_logs drop column if exists stake_id cascade;
alter table if exists public.user_roles drop column if exists stake_id cascade;

drop table if exists public.stakes cascade;

-- ---------------------------------------------------------------------------
-- 4) Recreate constraints and indexes for single-stake model
-- ---------------------------------------------------------------------------

create unique index if not exists idx_wards_name_unique on public.wards (name);

create index if not exists idx_user_roles_lookup on public.user_roles (user_id, ward_id, role);
create index if not exists idx_user_roles_user_role on public.user_roles (user_id, role);
create index if not exists idx_user_roles_participant on public.user_roles (participant_id);

create unique index if not exists idx_user_roles_unique_global
  on public.user_roles (user_id, role)
  where ward_id is null and participant_id is null;

create unique index if not exists idx_user_roles_unique_ward
  on public.user_roles (user_id, role, ward_id)
  where ward_id is not null and participant_id is null;

create unique index if not exists idx_user_roles_unique_young_man
  on public.user_roles (user_id, role, participant_id)
  where role = 'young_man' and participant_id is not null;

alter table public.user_roles
add constraint user_roles_check
check (
  (
    role in ('stake_leader', 'stake_camp_director', 'camp_committee')
    and ward_id is null
    and participant_id is null
  )
  or (
    role in ('ward_leader', 'young_men_captain')
    and ward_id is not null
    and participant_id is null
  )
  or (
    role = 'young_man'
    and ward_id is not null
    and participant_id is not null
  )
) not valid;

-- ---------------------------------------------------------------------------
-- 5) Recreate trigger functions for single-stake scope
-- ---------------------------------------------------------------------------

create or replace function public.sync_user_role_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_ward uuid;
begin
  if new.role in ('stake_leader', 'stake_camp_director', 'camp_committee') then
    if new.ward_id is not null then
      raise exception 'global role must not set ward_id';
    end if;
    if new.participant_id is not null then
      raise exception 'global role must not set participant_id';
    end if;
    return new;
  end if;

  if new.role in ('ward_leader', 'young_men_captain') then
    if new.ward_id is null then
      raise exception 'ward-level role requires ward_id';
    end if;
    if new.participant_id is not null then
      raise exception 'ward-level role must not set participant_id';
    end if;

    if not exists (select 1 from public.wards w where w.id = new.ward_id) then
      raise exception 'ward_id % does not exist', new.ward_id;
    end if;

    return new;
  end if;

  if new.role = 'young_man' then
    if new.participant_id is null then
      raise exception 'young_man role requires participant_id';
    end if;

    select p.ward_id
    into v_participant_ward
    from public.participants p
    where p.id = new.participant_id;

    if v_participant_ward is null then
      raise exception 'participant_id % does not exist', new.participant_id;
    end if;

    new.ward_id := v_participant_ward;
    return new;
  end if;

  raise exception 'Unsupported role: %', new.role;
end;
$$;

create or replace function public.validate_participant_scope()
returns trigger
language plpgsql
as $$
declare
  v_quorum_ward uuid;
begin
  select q.ward_id into v_quorum_ward
  from public.quorums q
  where q.id = new.quorum_id;

  if v_quorum_ward is null then
    raise exception 'quorum_id % does not exist', new.quorum_id;
  end if;

  if new.ward_id <> v_quorum_ward then
    raise exception 'participant ward_id must match quorum ward_id';
  end if;

  if tg_op = 'INSERT' then
    if new.shirt_size_code is not null and new.shirt_size_updated_at is null then
      new.shirt_size_updated_at := now();
    end if;
  elsif tg_op = 'UPDATE' then
    if new.shirt_size_code is distinct from old.shirt_size_code then
      new.shirt_size_updated_at := now();
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_registration_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_ward uuid;
begin
  select p.ward_id
  into v_participant_ward
  from public.participants p
  where p.id = new.participant_id;

  if v_participant_ward is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  if not exists (select 1 from public.camp_events c where c.id = new.camp_event_id) then
    raise exception 'camp_event_id % does not exist', new.camp_event_id;
  end if;

  new.ward_id := v_participant_ward;
  return new;
end;
$$;

create or replace function public.sync_attendance_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_ward uuid;
begin
  select p.ward_id
  into v_participant_ward
  from public.participants p
  where p.id = new.participant_id;

  if v_participant_ward is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  if not exists (select 1 from public.camp_events c where c.id = new.camp_event_id) then
    raise exception 'camp_event_id % does not exist', new.camp_event_id;
  end if;

  new.ward_id := v_participant_ward;
  return new;
end;
$$;

create or replace function public.ensure_shirt_size_before_confirm()
returns trigger
language plpgsql
as $$
declare
  v_shirt_size text;
begin
  if new.status = 'confirmed' then
    select p.shirt_size_code
    into v_shirt_size
    from public.participants p
    where p.id = new.participant_id;

    if v_shirt_size is null then
      raise exception 'Cannot confirm registration until shirt size is collected';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.touch_registration_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.status_updated_at := coalesce(new.status_updated_at, now());
    if new.status = 'confirmed' and new.confirmed_at is null then
      new.confirmed_at := now();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    new.status_updated_at := now();
    if new.status = 'confirmed' then
      new.confirmed_at := now();
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.has_any_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
  );
$$;

create or replace function public.is_stake_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('stake_leader', 'stake_camp_director')
  );
$$;

create or replace function public.is_stake_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'stake_leader'
  );
$$;

create or replace function public.can_view_ward(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and (
        ur.role in ('stake_leader', 'stake_camp_director', 'camp_committee')
        or (
          ur.role in ('ward_leader', 'young_men_captain')
          and ur.ward_id = target_ward_id
        )
      )
  );
$$;

create or replace function public.can_manage_ward(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and (
        ur.role in ('stake_leader', 'stake_camp_director')
        or (ur.role = 'ward_leader' and ur.ward_id = target_ward_id)
      )
  );
$$;

create or replace function public.can_manage_registration_ward(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and (
        ur.role in ('stake_leader', 'stake_camp_director', 'camp_committee')
        or (
          ur.role in ('ward_leader', 'young_men_captain')
          and ur.ward_id = target_ward_id
        )
      )
  );
$$;

create or replace function public.can_record_attendance(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_registration_ward(target_ward_id);
$$;

create or replace function public.is_young_man_self(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'young_man'
      and ur.participant_id = target_participant_id
  );
$$;

-- ---------------------------------------------------------------------------
-- 6) Recreate triggers
-- ---------------------------------------------------------------------------

create trigger trg_sync_user_role_scope
before insert or update on public.user_roles
for each row execute function public.sync_user_role_scope();

create trigger trg_validate_participant_scope
before insert or update on public.participants
for each row execute function public.validate_participant_scope();

create trigger trg_sync_registration_scope
before insert or update on public.registrations
for each row execute function public.sync_registration_scope();

create trigger trg_sync_attendance_scope
before insert or update on public.attendance_logs
for each row execute function public.sync_attendance_scope();

create trigger trg_ensure_shirt_size_before_confirm
before insert or update on public.registrations
for each row execute function public.ensure_shirt_size_before_confirm();

create trigger trg_touch_registration_status
before insert or update on public.registrations
for each row execute function public.touch_registration_status();

-- ---------------------------------------------------------------------------
-- 7) Recreate RLS policies
-- ---------------------------------------------------------------------------

alter table public.wards enable row level security;
alter table public.quorums enable row level security;
alter table public.shirt_sizes enable row level security;
alter table public.camp_events enable row level security;
alter table public.participants enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.user_roles enable row level security;

create policy wards_select
on public.wards
for select
to authenticated
using (public.can_view_ward(id));

create policy quorums_select
on public.quorums
for select
to authenticated
using (public.can_view_ward(ward_id));

create policy shirt_sizes_select
on public.shirt_sizes
for select
to authenticated
using (true);

create policy camp_events_select
on public.camp_events
for select
to authenticated
using (public.has_any_role());

create policy camp_events_insert
on public.camp_events
for insert
to authenticated
with check (public.is_stake_admin());

create policy camp_events_update
on public.camp_events
for update
to authenticated
using (public.is_stake_admin())
with check (public.is_stake_admin());

create policy camp_events_delete
on public.camp_events
for delete
to authenticated
using (public.is_stake_admin());

create policy participants_select
on public.participants
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(id)
);

create policy participants_insert
on public.participants
for insert
to authenticated
with check (public.can_manage_ward(ward_id));

create policy participants_update
on public.participants
for update
to authenticated
using (public.can_manage_ward(ward_id))
with check (public.can_manage_ward(ward_id));

create policy participants_delete
on public.participants
for delete
to authenticated
using (public.can_manage_ward(ward_id));

create policy registrations_select
on public.registrations
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(participant_id)
);

create policy registrations_insert
on public.registrations
for insert
to authenticated
with check (public.can_manage_registration_ward(ward_id));

create policy registrations_update
on public.registrations
for update
to authenticated
using (public.can_manage_registration_ward(ward_id))
with check (public.can_manage_registration_ward(ward_id));

create policy registrations_delete
on public.registrations
for delete
to authenticated
using (public.can_manage_registration_ward(ward_id));

create policy attendance_logs_select
on public.attendance_logs
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(participant_id)
);

create policy attendance_logs_insert
on public.attendance_logs
for insert
to authenticated
with check (public.can_record_attendance(ward_id));

create policy attendance_logs_update
on public.attendance_logs
for update
to authenticated
using (public.can_record_attendance(ward_id))
with check (public.can_record_attendance(ward_id));

create policy attendance_logs_delete
on public.attendance_logs
for delete
to authenticated
using (public.can_manage_ward(ward_id));

create policy user_roles_select
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_stake_leader()
);

create policy user_roles_insert
on public.user_roles
for insert
to authenticated
with check (public.is_stake_leader());

create policy user_roles_update
on public.user_roles
for update
to authenticated
using (public.is_stake_leader())
with check (public.is_stake_leader());

create policy user_roles_delete
on public.user_roles
for delete
to authenticated
using (public.is_stake_leader());

-- ---------------------------------------------------------------------------
-- 8) Recreate reporting views (no stake columns)
-- ---------------------------------------------------------------------------

create or replace view public.v_shirt_order_counts
with (security_invoker = true) as
select
  r.camp_event_id,
  c.name as camp_name,
  r.ward_id,
  w.name as ward_name,
  p.shirt_size_code,
  ss.label as shirt_size_label,
  ss.sort_order,
  count(*)::int as total
from public.registrations r
join public.camp_events c on c.id = r.camp_event_id
join public.wards w on w.id = r.ward_id
join public.participants p on p.id = r.participant_id
join public.shirt_sizes ss on ss.code = p.shirt_size_code
where r.status = 'confirmed'
group by
  r.camp_event_id,
  c.name,
  r.ward_id,
  w.name,
  p.shirt_size_code,
  ss.label,
  ss.sort_order;

create or replace view public.v_missing_shirt_sizes
with (security_invoker = true) as
select
  r.camp_event_id,
  c.name as camp_name,
  r.ward_id,
  w.name as ward_name,
  p.id as participant_id,
  p.first_name,
  p.last_name,
  q.quorum_type,
  r.status
from public.registrations r
join public.camp_events c on c.id = r.camp_event_id
join public.wards w on w.id = r.ward_id
join public.participants p on p.id = r.participant_id
join public.quorums q on q.id = p.quorum_id
where r.status in ('invited', 'pending', 'waitlist')
  and p.shirt_size_code is null;

create or replace view public.v_ward_young_men_status
with (security_invoker = true) as
select
  p.id as participant_id,
  p.ward_id,
  w.name as ward_name,
  p.quorum_id,
  q.quorum_type,
  q.display_name as quorum_name,
  p.first_name,
  p.last_name,
  p.preferred_name,
  p.active as participant_active,
  p.shirt_size_code,
  p.shirt_size_updated_at,
  lr.camp_event_id,
  c.name as camp_name,
  lr.status as registration_status,
  lr.status_updated_at,
  lr.confirmed_at
from public.participants p
join public.wards w on w.id = p.ward_id
join public.quorums q on q.id = p.quorum_id
left join lateral (
  select
    r.camp_event_id,
    r.status,
    r.status_updated_at,
    r.confirmed_at
  from public.registrations r
  join public.camp_events c2 on c2.id = r.camp_event_id
  where r.participant_id = p.id
  order by c2.is_active desc, c2.starts_on desc, r.created_at desc
  limit 1
) lr on true
left join public.camp_events c on c.id = lr.camp_event_id;
