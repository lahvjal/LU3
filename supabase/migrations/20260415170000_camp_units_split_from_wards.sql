-- Split camp units from geographic wards.
-- Units are temporary camp teams and can mix youth from multiple wards.

create table if not exists public.camp_units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  leader_name text,
  leader_email text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.camp_unit_members (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.camp_units (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (unit_id, participant_id)
);

drop trigger if exists trg_set_updated_at_camp_units on public.camp_units;
create trigger trg_set_updated_at_camp_units
before update on public.camp_units
for each row execute function public.set_updated_at();

create index if not exists idx_camp_unit_members_unit on public.camp_unit_members (unit_id);
create index if not exists idx_camp_unit_members_participant on public.camp_unit_members (participant_id);

alter table if exists public.competition_points
  add column if not exists unit_id uuid references public.camp_units (id) on delete set null;

alter table if exists public.competition_points
  alter column ward_id drop not null;

create index if not exists idx_competition_points_unit on public.competition_points (unit_id);

insert into public.camp_units (name, color, leader_name, leader_email)
select
  w.name,
  w.theme_color,
  w.leader_name,
  w.leader_email
from public.wards w
where not exists (
  select 1
  from public.camp_units cu
  where lower(cu.name) = lower(w.name)
)
on conflict (name) do nothing;

insert into public.camp_unit_members (unit_id, participant_id)
select
  cu.id,
  p.id
from public.participants p
join public.wards w
  on w.id = p.ward_id
join public.camp_units cu
  on lower(cu.name) = lower(w.name)
on conflict (unit_id, participant_id) do nothing;

update public.competition_points cp
set unit_id = cu.id
from public.wards w
join public.camp_units cu
  on lower(cu.name) = lower(w.name)
where cp.unit_id is null
  and cp.ward_id = w.id;

create or replace function public.can_manage_units()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_stake_admin()
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'ward_leader'
    );
$$;

alter table public.camp_units enable row level security;
alter table public.camp_unit_members enable row level security;

drop policy if exists camp_units_select on public.camp_units;
drop policy if exists camp_units_insert on public.camp_units;
drop policy if exists camp_units_update on public.camp_units;
drop policy if exists camp_units_delete on public.camp_units;

create policy camp_units_select
on public.camp_units
for select
to authenticated
using (public.has_any_role());

create policy camp_units_insert
on public.camp_units
for insert
to authenticated
with check (public.can_manage_units());

create policy camp_units_update
on public.camp_units
for update
to authenticated
using (public.can_manage_units())
with check (public.can_manage_units());

create policy camp_units_delete
on public.camp_units
for delete
to authenticated
using (public.can_manage_units());

drop policy if exists camp_unit_members_select on public.camp_unit_members;
drop policy if exists camp_unit_members_insert on public.camp_unit_members;
drop policy if exists camp_unit_members_update on public.camp_unit_members;
drop policy if exists camp_unit_members_delete on public.camp_unit_members;

create policy camp_unit_members_select
on public.camp_unit_members
for select
to authenticated
using (public.has_any_role());

create policy camp_unit_members_insert
on public.camp_unit_members
for insert
to authenticated
with check (public.can_manage_units());

create policy camp_unit_members_update
on public.camp_unit_members
for update
to authenticated
using (public.can_manage_units())
with check (public.can_manage_units());

create policy camp_unit_members_delete
on public.camp_unit_members
for delete
to authenticated
using (public.can_manage_units());
