-- Rename leader_invitations → leaders, drop participants + related tables,
-- update camp_unit_members to reference young_men.

-- ---------------------------------------------------------------------------
-- 1) Drop views/policies that reference participants
-- ---------------------------------------------------------------------------

drop view if exists public.v_ward_young_men_status cascade;
drop view if exists public.v_missing_shirt_sizes cascade;
drop view if exists public.v_shirt_order_counts cascade;

-- ---------------------------------------------------------------------------
-- 2) Drop tables that depend on participants
-- ---------------------------------------------------------------------------

drop table if exists public.attendance_logs cascade;
drop table if exists public.registrations cascade;

-- ---------------------------------------------------------------------------
-- 3) Update camp_unit_members to reference young_men instead of participants
-- ---------------------------------------------------------------------------

alter table public.camp_unit_members
  drop constraint if exists camp_unit_members_participant_id_fkey;

-- Drop the unique constraint first (the index depends on it)
alter table public.camp_unit_members
  drop constraint if exists camp_unit_members_unit_id_participant_id_key;
drop index if exists public.camp_unit_members_unit_id_participant_id_key;

alter table public.camp_unit_members
  rename column participant_id to young_man_id;

alter table public.camp_unit_members
  add constraint camp_unit_members_young_man_id_fkey
  foreign key (young_man_id) references public.young_men (id) on delete cascade;

create unique index if not exists idx_camp_unit_members_unit_young_man
  on public.camp_unit_members (unit_id, young_man_id);

-- ---------------------------------------------------------------------------
-- 4) Clean up user_roles participant_id FK to participants
-- ---------------------------------------------------------------------------

alter table public.user_roles
  drop constraint if exists user_roles_participant_id_fkey;

-- Remove the young_man check constraint and triggers that reference participants
alter table public.user_roles
  drop constraint if exists user_roles_check;

drop trigger if exists trg_sync_user_role_scope on public.user_roles;

-- Recreate check constraint without young_man participant validation
alter table public.user_roles
add constraint user_roles_check
check (
  (
    role in ('stake_leader', 'stake_camp_director', 'camp_committee')
    and ward_id is null
  )
  or (
    role in ('ward_leader', 'young_men_captain')
    and ward_id is not null
  )
  or (
    role = 'young_man'
  )
) not valid;

-- Simplified trigger: no longer needs to look up participants table
create or replace function public.sync_user_role_scope()
returns trigger
language plpgsql
as $$
begin
  if new.role in ('stake_leader', 'stake_camp_director', 'camp_committee') then
    if new.ward_id is not null then
      raise exception 'global role must not set ward_id';
    end if;
    new.participant_id := null;
    return new;
  end if;

  if new.role in ('ward_leader', 'young_men_captain') then
    if new.ward_id is null then
      raise exception 'ward-level role requires ward_id';
    end if;
    if not exists (select 1 from public.wards w where w.id = new.ward_id) then
      raise exception 'ward_id % does not exist', new.ward_id;
    end if;
    new.participant_id := null;
    return new;
  end if;

  if new.role = 'young_man' then
    return new;
  end if;

  raise exception 'Unsupported role: %', new.role;
end;
$$;

create trigger trg_sync_user_role_scope
before insert or update on public.user_roles
for each row execute function public.sync_user_role_scope();

-- ---------------------------------------------------------------------------
-- 5) Drop participants and related triggers/policies
-- ---------------------------------------------------------------------------

drop trigger if exists trg_validate_participant_scope on public.participants;
drop trigger if exists trg_set_updated_at_participants on public.participants;

drop policy if exists participants_select on public.participants;
drop policy if exists participants_insert on public.participants;
drop policy if exists participants_update on public.participants;
drop policy if exists participants_delete on public.participants;

drop table if exists public.participants cascade;

-- Drop the validate_participant_scope function (no longer needed)
drop function if exists public.validate_participant_scope();

-- Drop registration-related functions that referenced participants
drop function if exists public.sync_registration_scope();
drop function if exists public.sync_attendance_scope();
drop function if exists public.ensure_shirt_size_before_confirm();
drop function if exists public.touch_registration_status();
drop function if exists public.can_record_attendance(uuid);
drop function if exists public.is_young_man_self(uuid);

-- Drop camp_events (no longer needed without registrations)
drop policy if exists camp_events_select on public.camp_events;
drop policy if exists camp_events_insert on public.camp_events;
drop policy if exists camp_events_update on public.camp_events;
drop policy if exists camp_events_delete on public.camp_events;
drop table if exists public.camp_events cascade;

-- ---------------------------------------------------------------------------
-- 6) Rename leader_invitations → leaders
-- ---------------------------------------------------------------------------

alter table public.leader_invitations rename to leaders;

-- Rename indexes
alter index if exists idx_leader_invitations_email rename to idx_leaders_email;
alter index if exists idx_leader_invitations_status rename to idx_leaders_status;

-- Rename trigger
drop trigger if exists trg_set_updated_at_leader_invitations on public.leaders;
create trigger trg_set_updated_at_leaders
before update on public.leaders
for each row execute function public.set_updated_at();

-- Recreate RLS policies with new table name
drop policy if exists leader_invitations_select on public.leaders;
drop policy if exists leader_invitations_insert on public.leaders;
drop policy if exists leader_invitations_update on public.leaders;
drop policy if exists leader_invitations_delete on public.leaders;

create policy leaders_select
on public.leaders for select to authenticated
using (public.has_any_role() or user_id = auth.uid());

create policy leaders_insert
on public.leaders for insert to authenticated
with check (public.is_stake_admin());

create policy leaders_update
on public.leaders for update to authenticated
using (public.is_stake_admin())
with check (public.is_stake_admin());

create policy leaders_delete
on public.leaders for delete to authenticated
using (public.is_stake_admin());

-- ---------------------------------------------------------------------------
-- 7) Update detect_user_invite_type to use new table name
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
        select 1 from public.leaders l
        where (l.user_id = auth.uid() or lower(l.email) = lower((select email from auth.users where id = auth.uid())))
          and l.status in ('pending', 'active')
      ) then 'leader'
      when exists (
        select 1 from public.parents p
        where lower(p.email) = lower((select email from auth.users where id = auth.uid()))
          and p.invite_status in ('sent', 'accepted')
      ) then 'parent'
      else null
    end;
$$;

-- ---------------------------------------------------------------------------
-- 8) Reload PostgREST schema cache after table rename
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
