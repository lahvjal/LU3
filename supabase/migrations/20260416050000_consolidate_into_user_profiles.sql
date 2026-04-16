-- Consolidate leaders + parents into user_profiles.
-- After this migration:
--   • user_profiles is the single table for all auth users
--   • young_men.parent_id references user_profiles(user_id)
--   • leaders and parents tables are dropped
--
-- The role column uses text instead of app_role_enum because
-- ALTER TYPE … ADD VALUE cannot run inside a transaction, and
-- Supabase wraps every migration file in one.

-- ---------------------------------------------------------------------------
-- 1) Add new columns to user_profiles
--    role is text (not enum) to avoid transaction limitations.
-- ---------------------------------------------------------------------------

alter table public.user_profiles
  add column if not exists role text,
  add column if not exists calling_id uuid references public.leader_callings(id) on delete set null,
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists invited_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists signature_name text;

-- ---------------------------------------------------------------------------
-- 2) Migrate leader data into user_profiles
-- ---------------------------------------------------------------------------

update public.user_profiles up
set
  role       = l.role::text,
  calling_id = l.calling_id,
  ward_id    = coalesce(up.ward_id, l.ward_id),
  invited_by = l.invited_by,
  invited_at = l.invited_at
from public.leaders l
where l.user_id = up.user_id
  and l.user_id is not null;

-- ---------------------------------------------------------------------------
-- 3) Migrate parent data into user_profiles
--    Only parents that already have an auth user (user_id is set).
--    Parents without a user_id are pre-invite records that will be
--    handled by the invite flow going forward.
-- ---------------------------------------------------------------------------

update public.user_profiles up
set
  role              = coalesce(up.role, 'parent'),
  ward_id           = coalesce(up.ward_id, p.ward_id),
  invited_by        = coalesce(up.invited_by, p.invited_by),
  invited_at        = coalesce(up.invited_at, p.invited_at),
  terms_accepted_at = coalesce(up.terms_accepted_at, p.terms_accepted_at),
  signature_name    = coalesce(up.signature_name, p.signature_name),
  display_name      = coalesce(
    nullif(up.display_name, ''),
    nullif(trim(p.first_name || ' ' || p.last_name), ''),
    up.display_name
  )
from public.parents p
where p.user_id = up.user_id
  and p.user_id is not null
  and up.role is null;

-- ---------------------------------------------------------------------------
-- 4) Re-point young_men.parent_id from parents(id) → user_profiles(user_id)
--    Drop existing RLS policies first since they reference the old parent_id.
-- ---------------------------------------------------------------------------

drop policy if exists young_men_select on public.young_men;
drop policy if exists young_men_insert on public.young_men;
drop policy if exists young_men_update on public.young_men;
drop policy if exists young_men_delete on public.young_men;

alter table public.young_men
  add column if not exists parent_user_id uuid;

update public.young_men ym
set parent_user_id = p.user_id
from public.parents p
where ym.parent_id = p.id
  and p.user_id is not null;

-- Drop orphaned young_men whose parent has no auth account
delete from public.young_men where parent_user_id is null;

alter table public.young_men
  drop constraint if exists young_men_parent_id_fkey;

alter table public.young_men drop column parent_id;
alter table public.young_men rename column parent_user_id to parent_id;

alter table public.young_men
  alter column parent_id set not null,
  add constraint young_men_parent_id_fkey
    foreign key (parent_id) references public.user_profiles(user_id) on delete cascade;

create index if not exists idx_young_men_parent_id_new on public.young_men (parent_id);
drop index if exists public.idx_young_men_parent_id;
alter index if exists public.idx_young_men_parent_id_new rename to idx_young_men_parent_id;

-- ---------------------------------------------------------------------------
-- 5) Drop youth-only columns from user_profiles
-- ---------------------------------------------------------------------------

drop trigger if exists trg_validate_user_profile_scope on public.user_profiles;
drop function if exists public.validate_user_profile_scope();

alter table public.user_profiles
  drop column if exists quorum_id,
  drop column if exists age,
  drop column if exists medical_notes,
  drop column if exists shirt_size_code;

drop index if exists public.idx_user_profiles_quorum_id;

-- ---------------------------------------------------------------------------
-- 6) Add check constraints on role
-- ---------------------------------------------------------------------------

alter table public.user_profiles
  add constraint user_profiles_role_check
    check (role is null or role in (
      'stake_leader',
      'stake_camp_director',
      'ward_leader',
      'camp_committee',
      'young_men_captain',
      'parent'
    ));

-- ---------------------------------------------------------------------------
-- 7) Add useful indexes on user_profiles
-- ---------------------------------------------------------------------------

create index if not exists idx_user_profiles_role on public.user_profiles (role);
create index if not exists idx_user_profiles_invited_at on public.user_profiles (invited_at);

-- ---------------------------------------------------------------------------
-- 8) Update RLS policies on user_profiles
-- ---------------------------------------------------------------------------

drop policy if exists user_profiles_select on public.user_profiles;
drop policy if exists user_profiles_insert on public.user_profiles;
drop policy if exists user_profiles_update on public.user_profiles;
drop policy if exists user_profiles_delete on public.user_profiles;

create policy user_profiles_select
on public.user_profiles for select to authenticated
using (
  user_id = auth.uid()
  or public.has_any_role()
);

create policy user_profiles_insert
on public.user_profiles for insert to authenticated
with check (
  user_id = auth.uid()
);

create policy user_profiles_update
on public.user_profiles for update to authenticated
using (
  user_id = auth.uid()
  or public.is_stake_admin()
  or public.can_manage_registration_ward(ward_id)
)
with check (
  user_id = auth.uid()
  or public.is_stake_admin()
  or public.can_manage_registration_ward(ward_id)
);

create policy user_profiles_delete
on public.user_profiles for delete to authenticated
using (
  user_id = auth.uid()
  or public.is_stake_admin()
);

-- ---------------------------------------------------------------------------
-- 9) Re-create RLS policies on young_men (parent_id now → user_profiles)
--    (Old policies were dropped in step 4 before the column swap.)
-- ---------------------------------------------------------------------------

create policy young_men_select
on public.young_men for select to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = parent_id
    and (
      public.is_stake_admin()
      or public.can_view_ward(up.ward_id)
      or up.user_id = auth.uid()
    )
  )
);

create policy young_men_insert
on public.young_men for insert to authenticated
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(up.ward_id)
      or up.user_id = auth.uid()
    )
  )
);

create policy young_men_update
on public.young_men for update to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(up.ward_id)
      or up.user_id = auth.uid()
    )
  )
)
with check (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(up.ward_id)
      or up.user_id = auth.uid()
    )
  )
);

create policy young_men_delete
on public.young_men for delete to authenticated
using (
  exists (
    select 1 from public.user_profiles up
    where up.user_id = parent_id
    and (
      public.is_stake_admin()
      or up.user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- 10) Update detect_user_invite_type()
-- ---------------------------------------------------------------------------

create or replace function public.detect_user_invite_type()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when exists (
        select 1 from public.user_profiles up
        where up.user_id = auth.uid()
          and up.role is not null
          and up.role not in ('parent', 'young_man')
          and up.onboarding_completed_at is null
      ) then 'leader'
      when exists (
        select 1 from public.user_profiles up
        where up.user_id = auth.uid()
          and up.role = 'parent'
          and up.onboarding_completed_at is null
      ) then 'parent'
      else null
    end;
$$;

-- ---------------------------------------------------------------------------
-- 11) Drop leaders table (cascades triggers, indexes, policies)
-- ---------------------------------------------------------------------------

drop table if exists public.leaders cascade;

-- ---------------------------------------------------------------------------
-- 12) Drop parents table (cascades triggers, indexes, policies)
-- ---------------------------------------------------------------------------

drop table if exists public.parents cascade;

-- ---------------------------------------------------------------------------
-- 13) Drop leader_invitation_status_enum
-- ---------------------------------------------------------------------------

drop type if exists public.leader_invitation_status_enum;
