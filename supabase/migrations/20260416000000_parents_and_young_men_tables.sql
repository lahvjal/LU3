-- Replace registration_roster / registration_invites with parent-focused tables.

-- ---------------------------------------------------------------------------
-- 1) Drop old registration views and tables
-- ---------------------------------------------------------------------------

drop view if exists public.v_registration_roster cascade;

drop table if exists public.registration_invites cascade;
drop table if exists public.registration_roster cascade;
drop table if exists public.parent_registrations cascade;
drop table if exists public.parent_guardian_links cascade;
drop table if exists public.parent_invitations cascade;
drop table if exists public.parent_guardians cascade;

-- ---------------------------------------------------------------------------
-- 2) Create parents table
-- ---------------------------------------------------------------------------

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  ward_id uuid references public.wards (id) on delete set null,
  registration_status text not null default 'not_invited_yet'
    check (registration_status in ('not_invited_yet', 'pending', 'active')),
  invite_status text not null default 'not_sent'
    check (invite_status in ('not_sent', 'sent', 'accepted')),
  terms_accepted_at timestamptz,
  signature_name text,
  onboarding_completed_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_parents_email on public.parents ((lower(email)));
create index idx_parents_user_id on public.parents (user_id);
create index idx_parents_ward_id on public.parents (ward_id);
create index idx_parents_registration_status on public.parents (registration_status);

-- ---------------------------------------------------------------------------
-- 3) Create young_men table
-- ---------------------------------------------------------------------------

create table if not exists public.young_men (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  age integer not null check (age >= 8 and age <= 18),
  photo_url text,
  shirt_size_code text references public.shirt_sizes (code) on delete set null,
  allergies text,
  medical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_young_men_parent_id on public.young_men (parent_id);

-- ---------------------------------------------------------------------------
-- 4) Updated-at triggers
-- ---------------------------------------------------------------------------

create trigger trg_set_updated_at_parents
before update on public.parents
for each row execute function public.set_updated_at();

create trigger trg_set_updated_at_young_men
before update on public.young_men
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5) RLS
-- ---------------------------------------------------------------------------

alter table public.parents enable row level security;
alter table public.young_men enable row level security;

-- Leaders can see all parents (stake-wide) or parents in their ward
create policy parents_select
on public.parents for select to authenticated
using (
  public.is_stake_admin()
  or public.can_view_ward(ward_id)
  or user_id = auth.uid()
);

-- Leaders with registration permissions can insert parents
create policy parents_insert
on public.parents for insert to authenticated
with check (
  public.is_stake_admin()
  or public.can_manage_registration_ward(ward_id)
);

create policy parents_update
on public.parents for update to authenticated
using (
  public.is_stake_admin()
  or public.can_manage_registration_ward(ward_id)
  or user_id = auth.uid()
)
with check (
  public.is_stake_admin()
  or public.can_manage_registration_ward(ward_id)
  or user_id = auth.uid()
);

create policy parents_delete
on public.parents for delete to authenticated
using (
  public.is_stake_admin()
);

-- Young men: same visibility as their parent
create policy young_men_select
on public.young_men for select to authenticated
using (
  exists (
    select 1 from public.parents p
    where p.id = parent_id
    and (
      public.is_stake_admin()
      or public.can_view_ward(p.ward_id)
      or p.user_id = auth.uid()
    )
  )
);

create policy young_men_insert
on public.young_men for insert to authenticated
with check (
  exists (
    select 1 from public.parents p
    where p.id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(p.ward_id)
      or p.user_id = auth.uid()
    )
  )
);

create policy young_men_update
on public.young_men for update to authenticated
using (
  exists (
    select 1 from public.parents p
    where p.id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(p.ward_id)
      or p.user_id = auth.uid()
    )
  )
)
with check (
  exists (
    select 1 from public.parents p
    where p.id = parent_id
    and (
      public.is_stake_admin()
      or public.can_manage_registration_ward(p.ward_id)
      or p.user_id = auth.uid()
    )
  )
);

create policy young_men_delete
on public.young_men for delete to authenticated
using (
  exists (
    select 1 from public.parents p
    where p.id = parent_id
    and (
      public.is_stake_admin()
      or p.user_id = auth.uid()
    )
  )
);

-- ---------------------------------------------------------------------------
-- 6) Update detect_user_invite_type to handle parent invite type from parents table
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
        select 1 from public.leader_invitations li
        where (li.user_id = auth.uid() or lower(li.email) = lower((select email from auth.users where id = auth.uid())))
          and li.status in ('pending', 'active')
      ) then 'leader'
      when exists (
        select 1 from public.parents p
        where lower(p.email) = lower((select email from auth.users where id = auth.uid()))
          and p.invite_status in ('sent', 'accepted')
      ) then 'parent'
      else null
    end;
$$;
