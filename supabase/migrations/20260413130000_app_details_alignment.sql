-- LU Young Men Camp Tracker - App details alignment
-- Adds entities, permissions, and policies required by app-details.md.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'competition_status_enum') then
    create type public.competition_status_enum as enum (
      'planned',
      'active',
      'completed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'parent_registration_status_enum') then
    create type public.parent_registration_status_enum as enum (
      'pending',
      'approved',
      'waitlisted',
      'declined'
    );
  end if;
end
$$;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'general',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.daily_agenda_items (
  id uuid primary key default gen_random_uuid(),
  agenda_date date not null,
  time_slot text not null,
  title text not null,
  details text,
  location text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_messages (
  id uuid primary key default gen_random_uuid(),
  message_date date not null unique,
  title text,
  scripture text,
  message text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rules text,
  competition_date date,
  status public.competition_status_enum not null default 'planned',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competition_points (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  ward_id uuid not null references public.wards (id) on delete cascade,
  points int not null check (points <> 0),
  reason text,
  awarded_by uuid references auth.users (id) on delete set null,
  awarded_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  captured_on date,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  phone text,
  email text,
  is_emergency boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.camp_rules_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Camp Rules',
  content text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_registrations (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  child_first_name text not null,
  child_last_name text not null,
  child_age int not null check (child_age between 8 and 18),
  preferred_unit_name text,
  ward_id uuid references public.wards (id) on delete set null,
  shirt_size_preference text,
  shirt_size_code text references public.shirt_sizes (code),
  medical_notes text,
  status public.parent_registration_status_enum not null default 'pending',
  review_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stake_leaders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  calling text not null,
  email text not null unique,
  phone text,
  display_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentation_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activities_starts_at on public.activities (starts_at);
create index if not exists idx_activities_category on public.activities (category);
create index if not exists idx_daily_agenda_items_date on public.daily_agenda_items (agenda_date);
create index if not exists idx_daily_messages_date on public.daily_messages (message_date);
create index if not exists idx_competition_points_competition on public.competition_points (competition_id);
create index if not exists idx_competition_points_ward on public.competition_points (ward_id);
create index if not exists idx_photos_created_at on public.photos (created_at desc);
create index if not exists idx_contacts_email on public.contacts ((lower(email)));
create index if not exists idx_parent_registrations_status on public.parent_registrations (status);
create index if not exists idx_parent_registrations_ward on public.parent_registrations (ward_id);
create index if not exists idx_stake_leaders_order on public.stake_leaders (display_order, full_name);
create index if not exists idx_documentation_pages_title on public.documentation_pages (title);

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.can_manage_content()
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
      and ur.role in ('stake_leader', 'stake_camp_director', 'camp_committee')
  );
$$;

create or replace function public.is_competition_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contacts c
    where not c.is_emergency
      and c.email is not null
      and lower(c.email) = public.current_user_email()
  );
$$;

create or replace function public.can_award_competition_points()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_stake_admin() or public.is_competition_staff();
$$;

create or replace function public.can_manage_parent_registration(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_ward_id is null then public.can_manage_content()
    else public.can_manage_registration_ward(target_ward_id)
  end;
$$;

drop trigger if exists trg_set_updated_at_activities on public.activities;
create trigger trg_set_updated_at_activities
before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_daily_agenda_items on public.daily_agenda_items;
create trigger trg_set_updated_at_daily_agenda_items
before update on public.daily_agenda_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_daily_messages on public.daily_messages;
create trigger trg_set_updated_at_daily_messages
before update on public.daily_messages
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_competitions on public.competitions;
create trigger trg_set_updated_at_competitions
before update on public.competitions
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_contacts on public.contacts;
create trigger trg_set_updated_at_contacts
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_camp_rules_documents on public.camp_rules_documents;
create trigger trg_set_updated_at_camp_rules_documents
before update on public.camp_rules_documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_parent_registrations on public.parent_registrations;
create trigger trg_set_updated_at_parent_registrations
before update on public.parent_registrations
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_stake_leaders on public.stake_leaders;
create trigger trg_set_updated_at_stake_leaders
before update on public.stake_leaders
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_documentation_pages on public.documentation_pages;
create trigger trg_set_updated_at_documentation_pages
before update on public.documentation_pages
for each row execute function public.set_updated_at();

alter table public.activities enable row level security;
alter table public.daily_agenda_items enable row level security;
alter table public.daily_messages enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_points enable row level security;
alter table public.photos enable row level security;
alter table public.contacts enable row level security;
alter table public.camp_rules_documents enable row level security;
alter table public.parent_registrations enable row level security;
alter table public.stake_leaders enable row level security;
alter table public.documentation_pages enable row level security;

drop policy if exists wards_insert on public.wards;
drop policy if exists wards_update on public.wards;
drop policy if exists wards_delete on public.wards;
drop policy if exists quorums_insert on public.quorums;
drop policy if exists quorums_update on public.quorums;
drop policy if exists quorums_delete on public.quorums;

create policy wards_insert
on public.wards
for insert
to authenticated
with check (public.is_stake_admin());

create policy wards_update
on public.wards
for update
to authenticated
using (public.is_stake_admin())
with check (public.is_stake_admin());

create policy wards_delete
on public.wards
for delete
to authenticated
using (public.is_stake_admin());

create policy quorums_insert
on public.quorums
for insert
to authenticated
with check (public.can_manage_ward(ward_id));

create policy quorums_update
on public.quorums
for update
to authenticated
using (public.can_manage_ward(ward_id))
with check (public.can_manage_ward(ward_id));

create policy quorums_delete
on public.quorums
for delete
to authenticated
using (public.can_manage_ward(ward_id));

drop policy if exists activities_select on public.activities;
drop policy if exists activities_insert on public.activities;
drop policy if exists activities_update on public.activities;
drop policy if exists activities_delete on public.activities;

create policy activities_select
on public.activities
for select
to authenticated
using (public.has_any_role());

create policy activities_insert
on public.activities
for insert
to authenticated
with check (public.can_manage_content());

create policy activities_update
on public.activities
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy activities_delete
on public.activities
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists daily_agenda_select on public.daily_agenda_items;
drop policy if exists daily_agenda_insert on public.daily_agenda_items;
drop policy if exists daily_agenda_update on public.daily_agenda_items;
drop policy if exists daily_agenda_delete on public.daily_agenda_items;

create policy daily_agenda_select
on public.daily_agenda_items
for select
to authenticated
using (public.has_any_role());

create policy daily_agenda_insert
on public.daily_agenda_items
for insert
to authenticated
with check (public.can_manage_content());

create policy daily_agenda_update
on public.daily_agenda_items
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy daily_agenda_delete
on public.daily_agenda_items
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists daily_messages_select on public.daily_messages;
drop policy if exists daily_messages_insert on public.daily_messages;
drop policy if exists daily_messages_update on public.daily_messages;
drop policy if exists daily_messages_delete on public.daily_messages;

create policy daily_messages_select
on public.daily_messages
for select
to authenticated
using (public.has_any_role());

create policy daily_messages_insert
on public.daily_messages
for insert
to authenticated
with check (public.can_manage_content());

create policy daily_messages_update
on public.daily_messages
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy daily_messages_delete
on public.daily_messages
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists competitions_select on public.competitions;
drop policy if exists competitions_insert on public.competitions;
drop policy if exists competitions_update on public.competitions;
drop policy if exists competitions_delete on public.competitions;

create policy competitions_select
on public.competitions
for select
to authenticated
using (public.has_any_role());

create policy competitions_insert
on public.competitions
for insert
to authenticated
with check (public.can_manage_content());

create policy competitions_update
on public.competitions
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy competitions_delete
on public.competitions
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists competition_points_select on public.competition_points;
drop policy if exists competition_points_insert on public.competition_points;
drop policy if exists competition_points_update on public.competition_points;
drop policy if exists competition_points_delete on public.competition_points;

create policy competition_points_select
on public.competition_points
for select
to authenticated
using (public.has_any_role());

create policy competition_points_insert
on public.competition_points
for insert
to authenticated
with check (public.can_award_competition_points());

create policy competition_points_update
on public.competition_points
for update
to authenticated
using (public.can_award_competition_points())
with check (public.can_award_competition_points());

create policy competition_points_delete
on public.competition_points
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists photos_select on public.photos;
drop policy if exists photos_insert on public.photos;
drop policy if exists photos_update on public.photos;
drop policy if exists photos_delete on public.photos;

create policy photos_select
on public.photos
for select
to authenticated
using (public.has_any_role());

create policy photos_insert
on public.photos
for insert
to authenticated
with check (public.can_manage_content());

create policy photos_update
on public.photos
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy photos_delete
on public.photos
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists contacts_select on public.contacts;
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;

create policy contacts_select
on public.contacts
for select
to authenticated
using (public.has_any_role());

create policy contacts_insert
on public.contacts
for insert
to authenticated
with check (public.can_manage_content());

create policy contacts_update
on public.contacts
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy contacts_delete
on public.contacts
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists camp_rules_select on public.camp_rules_documents;
drop policy if exists camp_rules_insert on public.camp_rules_documents;
drop policy if exists camp_rules_update on public.camp_rules_documents;
drop policy if exists camp_rules_delete on public.camp_rules_documents;

create policy camp_rules_select
on public.camp_rules_documents
for select
to authenticated
using (public.has_any_role());

create policy camp_rules_insert
on public.camp_rules_documents
for insert
to authenticated
with check (public.can_manage_content());

create policy camp_rules_update
on public.camp_rules_documents
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy camp_rules_delete
on public.camp_rules_documents
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists parent_registrations_select on public.parent_registrations;
drop policy if exists parent_registrations_insert_anon on public.parent_registrations;
drop policy if exists parent_registrations_insert_authenticated on public.parent_registrations;
drop policy if exists parent_registrations_update on public.parent_registrations;
drop policy if exists parent_registrations_delete on public.parent_registrations;

create policy parent_registrations_select
on public.parent_registrations
for select
to authenticated
using (public.can_manage_parent_registration(ward_id));

create policy parent_registrations_insert_anon
on public.parent_registrations
for insert
to anon
with check (true);

create policy parent_registrations_insert_authenticated
on public.parent_registrations
for insert
to authenticated
with check (true);

create policy parent_registrations_update
on public.parent_registrations
for update
to authenticated
using (public.can_manage_parent_registration(ward_id))
with check (public.can_manage_parent_registration(ward_id));

create policy parent_registrations_delete
on public.parent_registrations
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists stake_leaders_select on public.stake_leaders;
drop policy if exists stake_leaders_insert on public.stake_leaders;
drop policy if exists stake_leaders_update on public.stake_leaders;
drop policy if exists stake_leaders_delete on public.stake_leaders;

create policy stake_leaders_select
on public.stake_leaders
for select
to authenticated
using (public.has_any_role());

create policy stake_leaders_insert
on public.stake_leaders
for insert
to authenticated
with check (public.can_manage_content());

create policy stake_leaders_update
on public.stake_leaders
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy stake_leaders_delete
on public.stake_leaders
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists documentation_pages_select on public.documentation_pages;
drop policy if exists documentation_pages_insert on public.documentation_pages;
drop policy if exists documentation_pages_update on public.documentation_pages;
drop policy if exists documentation_pages_delete on public.documentation_pages;

create policy documentation_pages_select
on public.documentation_pages
for select
to authenticated
using (public.has_any_role());

create policy documentation_pages_insert
on public.documentation_pages
for insert
to authenticated
with check (public.can_manage_content());

create policy documentation_pages_update
on public.documentation_pages
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy documentation_pages_delete
on public.documentation_pages
for delete
to authenticated
using (public.can_manage_content());

insert into public.camp_rules_documents (title, content)
select
  'Camp Rules',
  'Use this page to maintain the official camp rules. Keep guidance clear, concise, and safety-focused.'
where not exists (
  select 1
  from public.camp_rules_documents
);
