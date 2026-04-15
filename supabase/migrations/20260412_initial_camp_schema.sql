-- LU Young Men Camp Tracker - Initial schema
-- Created: 2026-04-12

create extension if not exists pgcrypto;

do $$
begin
  -- Create or upgrade app_role_enum in a transaction-safe way.
  -- We avoid ALTER TYPE ... ADD VALUE because this migration is often run
  -- in a single transaction and that can trigger "unsafe use of new value".
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'app_role_enum'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'app_role_enum'
        and e.enumlabel = 'stake_leader'
    ) then
      if not exists (
        select 1
        from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public'
          and t.typname = 'app_role_enum_v2'
      ) then
        create type public.app_role_enum_v2 as enum (
          'stake_leader',
          'stake_camp_director',
          'ward_leader',
          'camp_committee',
          'young_men_captain',
          'young_man'
        );
      end if;

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'user_roles'
          and column_name = 'role'
      ) then
        alter table public.user_roles drop constraint if exists user_roles_check;

        alter table public.user_roles
        alter column role type public.app_role_enum_v2
        using (
          case role::text
            when 'stake_admin' then 'stake_leader'
            when 'quorum_adviser' then 'young_men_captain'
            when 'checkin_staff' then 'young_men_captain'
            when 'viewer' then 'young_men_captain'
            else role::text
          end::public.app_role_enum_v2
        );
      end if;

      drop type public.app_role_enum cascade;
      alter type public.app_role_enum_v2 rename to app_role_enum;
    end if;
  else
    if exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'app_role_enum_v2'
    ) then
      alter type public.app_role_enum_v2 rename to app_role_enum;
    else
      create type public.app_role_enum as enum (
        'stake_leader',
        'stake_camp_director',
        'ward_leader',
        'camp_committee',
        'young_men_captain',
        'young_man'
      );
    end if;
  end if;

  if not exists (select 1 from pg_type where typname = 'quorum_type_enum') then
    create type public.quorum_type_enum as enum (
      'deacons',
      'teachers',
      'priests'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_status_enum') then
    create type public.registration_status_enum as enum (
      'not_invited_yet',
      'invited',
      'pending',
      'confirmed',
      'declined',
      'waitlist',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'attendance_event_type_enum') then
    create type public.attendance_event_type_enum as enum (
      'check_in',
      'check_out',
      'present',
      'absent'
    );
  end if;
end
$$;

create table if not exists public.stakes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  stake_id uuid not null references public.stakes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (stake_id, name)
);

create table if not exists public.quorums (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards (id) on delete cascade,
  quorum_type public.quorum_type_enum not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (ward_id, quorum_type)
);

create table if not exists public.shirt_sizes (
  code text primary key,
  label text not null unique,
  sort_order int not null unique
);

create table if not exists public.camp_events (
  id uuid primary key default gen_random_uuid(),
  stake_id uuid not null references public.stakes (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  registration_deadline date,
  shirt_order_deadline date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  stake_id uuid not null references public.stakes (id) on delete restrict,
  ward_id uuid not null references public.wards (id) on delete restrict,
  quorum_id uuid not null references public.quorums (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  birth_date date,
  phone text,
  email text,
  parent_guardian_name text,
  parent_guardian_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text,
  medical_notes text,
  dietary_restrictions text,
  consent_form_received boolean not null default false,
  shirt_size_code text references public.shirt_sizes (code),
  shirt_size_updated_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  camp_event_id uuid not null references public.camp_events (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  stake_id uuid not null references public.stakes (id) on delete restrict,
  ward_id uuid not null references public.wards (id) on delete restrict,
  status public.registration_status_enum not null default 'invited',
  status_updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  needs_follow_up boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (camp_event_id, participant_id)
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  camp_event_id uuid not null references public.camp_events (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  stake_id uuid not null references public.stakes (id) on delete restrict,
  ward_id uuid not null references public.wards (id) on delete restrict,
  event_type public.attendance_event_type_enum not null,
  checkpoint text not null,
  notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id) on delete set null
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stake_id uuid not null references public.stakes (id) on delete cascade,
  ward_id uuid references public.wards (id) on delete cascade,
  participant_id uuid references public.participants (id) on delete cascade,
  role public.app_role_enum not null,
  created_at timestamptz not null default now(),
  unique (user_id, stake_id, ward_id, role),
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
  )
);

-- Upgrade safety for existing installs that previously created user_roles
-- without participant_id and with older role semantics.
alter table if exists public.user_roles
  add column if not exists participant_id uuid;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'participant_id'
  ) then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_roles'::regclass
        and conname = 'user_roles_participant_id_fkey'
    ) then
      alter table public.user_roles
      add constraint user_roles_participant_id_fkey
      foreign key (participant_id)
      references public.participants (id)
      on delete cascade;
    end if;
  end if;
end
$$;

-- Best-effort role migration from older role names.
update public.user_roles
set role = 'stake_leader'
where role::text = 'stake_admin';

update public.user_roles
set role = 'young_men_captain'
where role::text in ('quorum_adviser', 'checkin_staff', 'viewer');

alter table public.user_roles drop constraint if exists user_roles_check;
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

create index if not exists idx_wards_stake_id on public.wards (stake_id);
create index if not exists idx_quorums_ward_id on public.quorums (ward_id);
create index if not exists idx_participants_ward_id on public.participants (ward_id);
create index if not exists idx_participants_quorum_id on public.participants (quorum_id);
create index if not exists idx_participants_shirt_size on public.participants (shirt_size_code);
create index if not exists idx_registrations_event on public.registrations (camp_event_id);
create index if not exists idx_registrations_ward_status on public.registrations (ward_id, status);
create index if not exists idx_attendance_event on public.attendance_logs (camp_event_id);
create index if not exists idx_attendance_ward on public.attendance_logs (ward_id);
create index if not exists idx_user_roles_lookup on public.user_roles (user_id, stake_id, ward_id, role);
create index if not exists idx_user_roles_user_role on public.user_roles (user_id, role);
create index if not exists idx_user_roles_participant on public.user_roles (participant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.sync_user_role_scope()
returns trigger
language plpgsql
as $$
declare
  v_ward_stake uuid;
  v_participant_stake uuid;
  v_participant_ward uuid;
begin
  if new.role in ('stake_leader', 'stake_camp_director', 'camp_committee') then
    if new.stake_id is null then
      raise exception 'stake-level role requires stake_id';
    end if;
    if new.ward_id is not null then
      raise exception 'stake-level role must not set ward_id';
    end if;
    if new.participant_id is not null then
      raise exception 'stake-level role must not set participant_id';
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

    select w.stake_id into v_ward_stake
    from public.wards w
    where w.id = new.ward_id;

    if v_ward_stake is null then
      raise exception 'ward_id % does not exist', new.ward_id;
    end if;

    new.stake_id := v_ward_stake;
    return new;
  end if;

  if new.role = 'young_man' then
    if new.participant_id is null then
      raise exception 'young_man role requires participant_id';
    end if;

    select p.stake_id, p.ward_id
    into v_participant_stake, v_participant_ward
    from public.participants p
    where p.id = new.participant_id;

    if v_participant_stake is null or v_participant_ward is null then
      raise exception 'participant_id % does not exist', new.participant_id;
    end if;

    new.stake_id := v_participant_stake;
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
  v_ward_stake uuid;
  v_quorum_ward uuid;
begin
  select w.stake_id into v_ward_stake
  from public.wards w
  where w.id = new.ward_id;

  if v_ward_stake is null then
    raise exception 'ward_id % does not exist', new.ward_id;
  end if;

  if new.stake_id <> v_ward_stake then
    raise exception 'participant stake_id must match ward stake_id';
  end if;

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
  v_participant_stake uuid;
  v_participant_ward uuid;
  v_camp_stake uuid;
begin
  select p.stake_id, p.ward_id
  into v_participant_stake, v_participant_ward
  from public.participants p
  where p.id = new.participant_id;

  if v_participant_stake is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  select c.stake_id
  into v_camp_stake
  from public.camp_events c
  where c.id = new.camp_event_id;

  if v_camp_stake is null then
    raise exception 'camp_event_id % does not exist', new.camp_event_id;
  end if;

  if v_participant_stake <> v_camp_stake then
    raise exception 'participant and camp event must belong to same stake';
  end if;

  new.stake_id := v_participant_stake;
  new.ward_id := v_participant_ward;
  return new;
end;
$$;

create or replace function public.sync_attendance_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_stake uuid;
  v_participant_ward uuid;
  v_camp_stake uuid;
begin
  select p.stake_id, p.ward_id
  into v_participant_stake, v_participant_ward
  from public.participants p
  where p.id = new.participant_id;

  if v_participant_stake is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  select c.stake_id
  into v_camp_stake
  from public.camp_events c
  where c.id = new.camp_event_id;

  if v_camp_stake is null then
    raise exception 'camp_event_id % does not exist', new.camp_event_id;
  end if;

  if v_participant_stake <> v_camp_stake then
    raise exception 'participant and camp event must belong to same stake';
  end if;

  new.stake_id := v_participant_stake;
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

create or replace function public.is_stake_member(target_stake_id uuid)
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
      and ur.stake_id = target_stake_id
  );
$$;

create or replace function public.is_stake_admin(target_stake_id uuid)
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
      and ur.stake_id = target_stake_id
      and ur.role in ('stake_leader', 'stake_camp_director')
  );
$$;

create or replace function public.is_stake_leader(target_stake_id uuid)
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
      and ur.stake_id = target_stake_id
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
    join public.wards w on w.id = target_ward_id
    where ur.user_id = auth.uid()
      and (
        (
          ur.role in ('stake_leader', 'stake_camp_director', 'camp_committee')
          and ur.stake_id = w.stake_id
        )
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
    join public.wards w on w.id = target_ward_id
    where ur.user_id = auth.uid()
      and (
        (ur.role in ('stake_leader', 'stake_camp_director') and ur.stake_id = w.stake_id)
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
    join public.wards w on w.id = target_ward_id
    where ur.user_id = auth.uid()
      and (
        (
          ur.role in ('stake_leader', 'stake_camp_director', 'camp_committee')
          and ur.stake_id = w.stake_id
        )
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

drop trigger if exists trg_set_updated_at_camp_events on public.camp_events;
create trigger trg_set_updated_at_camp_events
before update on public.camp_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_participants on public.participants;
create trigger trg_set_updated_at_participants
before update on public.participants
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_registrations on public.registrations;
create trigger trg_set_updated_at_registrations
before update on public.registrations
for each row execute function public.set_updated_at();

drop trigger if exists trg_sync_user_role_scope on public.user_roles;
create trigger trg_sync_user_role_scope
before insert or update on public.user_roles
for each row execute function public.sync_user_role_scope();

drop trigger if exists trg_validate_participant_scope on public.participants;
create trigger trg_validate_participant_scope
before insert or update on public.participants
for each row execute function public.validate_participant_scope();

drop trigger if exists trg_sync_registration_scope on public.registrations;
create trigger trg_sync_registration_scope
before insert or update on public.registrations
for each row execute function public.sync_registration_scope();

drop trigger if exists trg_sync_attendance_scope on public.attendance_logs;
create trigger trg_sync_attendance_scope
before insert or update on public.attendance_logs
for each row execute function public.sync_attendance_scope();

drop trigger if exists trg_ensure_shirt_size_before_confirm on public.registrations;
create trigger trg_ensure_shirt_size_before_confirm
before insert or update on public.registrations
for each row execute function public.ensure_shirt_size_before_confirm();

drop trigger if exists trg_touch_registration_status on public.registrations;
create trigger trg_touch_registration_status
before insert or update on public.registrations
for each row execute function public.touch_registration_status();

insert into public.shirt_sizes (code, label, sort_order)
values
  ('YS', 'Youth Small', 1),
  ('YM', 'Youth Medium', 2),
  ('YL', 'Youth Large', 3),
  ('AS', 'Adult Small', 4),
  ('AM', 'Adult Medium', 5),
  ('AL', 'Adult Large', 6),
  ('AXL', 'Adult XL', 7),
  ('A2XL', 'Adult 2XL', 8),
  ('A3XL', 'Adult 3XL', 9)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

alter table public.stakes enable row level security;
alter table public.wards enable row level security;
alter table public.quorums enable row level security;
alter table public.shirt_sizes enable row level security;
alter table public.camp_events enable row level security;
alter table public.participants enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists stakes_select on public.stakes;
create policy stakes_select
on public.stakes
for select
to authenticated
using (public.is_stake_member(id));

drop policy if exists wards_select on public.wards;
create policy wards_select
on public.wards
for select
to authenticated
using (public.is_stake_member(stake_id));

drop policy if exists quorums_select on public.quorums;
create policy quorums_select
on public.quorums
for select
to authenticated
using (public.can_view_ward(ward_id));

drop policy if exists shirt_sizes_select on public.shirt_sizes;
create policy shirt_sizes_select
on public.shirt_sizes
for select
to authenticated
using (true);

drop policy if exists camp_events_select on public.camp_events;
create policy camp_events_select
on public.camp_events
for select
to authenticated
using (public.is_stake_member(stake_id));

drop policy if exists camp_events_insert on public.camp_events;
create policy camp_events_insert
on public.camp_events
for insert
to authenticated
with check (public.is_stake_admin(stake_id));

drop policy if exists camp_events_update on public.camp_events;
create policy camp_events_update
on public.camp_events
for update
to authenticated
using (public.is_stake_admin(stake_id))
with check (public.is_stake_admin(stake_id));

drop policy if exists camp_events_delete on public.camp_events;
create policy camp_events_delete
on public.camp_events
for delete
to authenticated
using (public.is_stake_admin(stake_id));

drop policy if exists participants_select on public.participants;
create policy participants_select
on public.participants
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(id)
);

drop policy if exists participants_insert on public.participants;
create policy participants_insert
on public.participants
for insert
to authenticated
with check (public.can_manage_ward(ward_id));

drop policy if exists participants_update on public.participants;
create policy participants_update
on public.participants
for update
to authenticated
using (public.can_manage_ward(ward_id))
with check (public.can_manage_ward(ward_id));

drop policy if exists participants_delete on public.participants;
create policy participants_delete
on public.participants
for delete
to authenticated
using (public.can_manage_ward(ward_id));

drop policy if exists registrations_select on public.registrations;
create policy registrations_select
on public.registrations
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(participant_id)
);

drop policy if exists registrations_insert on public.registrations;
create policy registrations_insert
on public.registrations
for insert
to authenticated
with check (public.can_manage_registration_ward(ward_id));

drop policy if exists registrations_update on public.registrations;
create policy registrations_update
on public.registrations
for update
to authenticated
using (public.can_manage_registration_ward(ward_id))
with check (public.can_manage_registration_ward(ward_id));

drop policy if exists registrations_delete on public.registrations;
create policy registrations_delete
on public.registrations
for delete
to authenticated
using (public.can_manage_registration_ward(ward_id));

drop policy if exists attendance_logs_select on public.attendance_logs;
create policy attendance_logs_select
on public.attendance_logs
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(participant_id)
);

drop policy if exists attendance_logs_insert on public.attendance_logs;
create policy attendance_logs_insert
on public.attendance_logs
for insert
to authenticated
with check (public.can_record_attendance(ward_id));

drop policy if exists attendance_logs_update on public.attendance_logs;
create policy attendance_logs_update
on public.attendance_logs
for update
to authenticated
using (public.can_record_attendance(ward_id))
with check (public.can_record_attendance(ward_id));

drop policy if exists attendance_logs_delete on public.attendance_logs;
create policy attendance_logs_delete
on public.attendance_logs
for delete
to authenticated
using (public.can_manage_ward(ward_id));

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_stake_leader(stake_id)
);

drop policy if exists user_roles_insert on public.user_roles;
create policy user_roles_insert
on public.user_roles
for insert
to authenticated
with check (public.is_stake_leader(stake_id));

drop policy if exists user_roles_update on public.user_roles;
create policy user_roles_update
on public.user_roles
for update
to authenticated
using (public.is_stake_leader(stake_id))
with check (public.is_stake_leader(stake_id));

drop policy if exists user_roles_delete on public.user_roles;
create policy user_roles_delete
on public.user_roles
for delete
to authenticated
using (public.is_stake_leader(stake_id));

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
  p.stake_id,
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
