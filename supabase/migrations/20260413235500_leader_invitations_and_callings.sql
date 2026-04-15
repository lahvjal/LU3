-- Invitation-backed leadership roster and calling catalog.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'leader_invitation_status_enum'
  ) then
    create type public.leader_invitation_status_enum
      as enum ('pending', 'active', 'revoked');
  end if;
end
$$;

create table if not exists public.leader_callings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.leader_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  role public.app_role_enum not null,
  ward_id uuid references public.wards (id) on delete set null,
  calling_id uuid not null references public.leader_callings (id) on delete restrict,
  status public.leader_invitation_status_enum not null default 'pending',
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'young_man'),
  check (
    (role in ('ward_leader', 'young_men_captain') and ward_id is not null)
    or (role in ('stake_leader', 'stake_camp_director', 'camp_committee') and ward_id is null)
  )
);

create index if not exists idx_leader_invitations_email
  on public.leader_invitations ((lower(email)));

create index if not exists idx_leader_invitations_status
  on public.leader_invitations (status);

alter table public.leader_callings enable row level security;
alter table public.leader_invitations enable row level security;

drop policy if exists leader_callings_select on public.leader_callings;
drop policy if exists leader_callings_insert on public.leader_callings;
drop policy if exists leader_callings_update on public.leader_callings;
drop policy if exists leader_callings_delete on public.leader_callings;

create policy leader_callings_select
on public.leader_callings
for select
to authenticated
using (public.has_any_role());

create policy leader_callings_insert
on public.leader_callings
for insert
to authenticated
with check (public.is_stake_admin());

create policy leader_callings_update
on public.leader_callings
for update
to authenticated
using (public.is_stake_admin())
with check (public.is_stake_admin());

create policy leader_callings_delete
on public.leader_callings
for delete
to authenticated
using (public.is_stake_admin());

drop policy if exists leader_invitations_select on public.leader_invitations;
drop policy if exists leader_invitations_insert on public.leader_invitations;
drop policy if exists leader_invitations_update on public.leader_invitations;
drop policy if exists leader_invitations_delete on public.leader_invitations;

create policy leader_invitations_select
on public.leader_invitations
for select
to authenticated
using (public.has_any_role() or user_id = auth.uid());

create policy leader_invitations_insert
on public.leader_invitations
for insert
to authenticated
with check (public.is_stake_admin());

create policy leader_invitations_update
on public.leader_invitations
for update
to authenticated
using (public.is_stake_admin())
with check (public.is_stake_admin());

create policy leader_invitations_delete
on public.leader_invitations
for delete
to authenticated
using (public.is_stake_admin());

drop trigger if exists trg_set_updated_at_leader_invitations on public.leader_invitations;
create trigger trg_set_updated_at_leader_invitations
before update on public.leader_invitations
for each row execute function public.set_updated_at();

insert into public.leader_callings (name)
values
  ('Stake Leader'),
  ('Stake Camp Director'),
  ('Camp Committee Member'),
  ('Ward Leader'),
  ('Young Men Captain')
on conflict (name) do nothing;

insert into public.leader_callings (name)
select distinct trim(sl.calling)
from public.stake_leaders sl
where sl.calling is not null
  and trim(sl.calling) <> ''
on conflict (name) do nothing;

with role_defaults as (
  select
    ur.user_id,
    ur.role,
    ur.ward_id,
    lower(au.email) as email,
    case ur.role
      when 'stake_leader' then 'Stake Leader'
      when 'stake_camp_director' then 'Stake Camp Director'
      when 'camp_committee' then 'Camp Committee Member'
      when 'ward_leader' then 'Ward Leader'
      when 'young_men_captain' then 'Young Men Captain'
      else null
    end as calling_name
  from public.user_roles ur
  join auth.users au on au.id = ur.user_id
  where ur.role in (
    'stake_leader',
    'stake_camp_director',
    'camp_committee',
    'ward_leader',
    'young_men_captain'
  )
    and au.email is not null
),
resolved as (
  select
    rd.user_id,
    rd.role,
    rd.ward_id,
    rd.email,
    lc.id as calling_id
  from role_defaults rd
  join public.leader_callings lc
    on lower(lc.name) = lower(rd.calling_name)
)
insert into public.leader_invitations (
  email,
  user_id,
  role,
  ward_id,
  calling_id,
  status,
  accepted_at,
  invited_at
)
select
  r.email,
  r.user_id,
  r.role,
  r.ward_id,
  r.calling_id,
  'active'::public.leader_invitation_status_enum,
  now(),
  now()
from resolved r
where not exists (
  select 1
  from public.leader_invitations li
  where li.user_id = r.user_id
    and li.role = r.role
    and li.ward_id is not distinct from r.ward_id
);
