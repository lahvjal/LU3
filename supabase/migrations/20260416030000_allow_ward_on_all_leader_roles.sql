-- Allow any leadership role to optionally have a ward_id.
-- Previously, stake-level roles required ward_id IS NULL.

-- 1) Fix the leaders (formerly leader_invitations) table check constraint
--    The auto-generated name for inline CHECK is usually leader_invitations_check1
alter table public.leaders
  drop constraint if exists leader_invitations_check,
  drop constraint if exists leader_invitations_check1,
  drop constraint if exists leaders_check,
  drop constraint if exists leaders_check1,
  drop constraint if exists leaders_role_ward_check;

alter table public.leaders
  add constraint leaders_role_check check (role <> 'young_man');

-- 2) Fix user_roles check constraint
alter table public.user_roles
  drop constraint if exists user_roles_check;

alter table public.user_roles
  add constraint user_roles_check check (
    role in ('stake_leader', 'stake_camp_director', 'camp_committee', 'ward_leader', 'young_men_captain', 'young_man')
  ) not valid;

-- 3) Fix the sync_user_role_scope trigger to allow ward_id on all roles
drop trigger if exists trg_sync_user_role_scope on public.user_roles;

create or replace function public.sync_user_role_scope()
returns trigger
language plpgsql
as $$
begin
  if new.role in ('stake_leader', 'stake_camp_director', 'camp_committee') then
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

  raise exception 'unrecognised role: %', new.role;
end;
$$;

create trigger trg_sync_user_role_scope
before insert or update on public.user_roles
for each row execute function public.sync_user_role_scope();

notify pgrst, 'reload schema';
