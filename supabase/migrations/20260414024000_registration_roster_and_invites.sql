-- Leader-managed registration list and invite actions.
-- Supports invite targets for either youth email or parent email.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'registration_invite_target_enum'
  ) then
    create type public.registration_invite_target_enum
      as enum ('youth', 'parent');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'registration_invite_status_enum'
  ) then
    create type public.registration_invite_status_enum
      as enum ('sent', 'accepted', 'revoked');
  end if;
end
$$;

create table if not exists public.registration_roster (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants (id) on delete cascade,
  ward_id uuid not null references public.wards (id) on delete restrict,
  status public.registration_status_enum not null default 'not_invited_yet',
  notes text,
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registration_invites (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid references public.registration_roster (id) on delete set null,
  participant_id uuid not null references public.participants (id) on delete cascade,
  ward_id uuid not null references public.wards (id) on delete restrict,
  target_type public.registration_invite_target_enum not null,
  recipient_email text not null,
  recipient_name text,
  status public.registration_invite_status_enum not null default 'sent',
  sent_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz not null default now(),
  accepted_at timestamptz,
  parent_invitation_id uuid references public.parent_invitations (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registration_roster_ward
  on public.registration_roster (ward_id);

create index if not exists idx_registration_roster_status
  on public.registration_roster (status);

create index if not exists idx_registration_invites_participant
  on public.registration_invites (participant_id);

create index if not exists idx_registration_invites_ward
  on public.registration_invites (ward_id);

create index if not exists idx_registration_invites_status
  on public.registration_invites (status);

create index if not exists idx_registration_invites_sent_at
  on public.registration_invites (sent_at desc);

create index if not exists idx_registration_invites_email
  on public.registration_invites ((lower(recipient_email)));

create unique index if not exists idx_registration_invites_active_unique
  on public.registration_invites (participant_id, target_type, (lower(recipient_email)))
  where status = 'sent';

create or replace function public.sync_registration_roster_scope()
returns trigger
language plpgsql
as $$
declare
  v_ward_id uuid;
begin
  select p.ward_id
  into v_ward_id
  from public.participants p
  where p.id = new.participant_id;

  if v_ward_id is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  new.ward_id := v_ward_id;
  return new;
end;
$$;

create or replace function public.sync_registration_invite_scope()
returns trigger
language plpgsql
as $$
declare
  v_ward_id uuid;
  v_roster_id uuid;
begin
  new.recipient_email := lower(trim(new.recipient_email));

  select p.ward_id
  into v_ward_id
  from public.participants p
  where p.id = new.participant_id;

  if v_ward_id is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  new.ward_id := v_ward_id;

  if new.roster_id is null then
    select rr.id
    into v_roster_id
    from public.registration_roster rr
    where rr.participant_id = new.participant_id
    limit 1;

    new.roster_id := v_roster_id;
  end if;

  if new.status = 'accepted' and new.accepted_at is null then
    new.accepted_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_registration_roster on public.registration_roster;
create trigger trg_set_updated_at_registration_roster
before update on public.registration_roster
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_registration_invites on public.registration_invites;
create trigger trg_set_updated_at_registration_invites
before update on public.registration_invites
for each row execute function public.set_updated_at();

drop trigger if exists trg_sync_registration_roster_scope on public.registration_roster;
create trigger trg_sync_registration_roster_scope
before insert or update on public.registration_roster
for each row execute function public.sync_registration_roster_scope();

drop trigger if exists trg_sync_registration_invite_scope on public.registration_invites;
create trigger trg_sync_registration_invite_scope
before insert or update on public.registration_invites
for each row execute function public.sync_registration_invite_scope();

alter table public.registration_roster enable row level security;
alter table public.registration_invites enable row level security;

drop policy if exists registration_roster_select on public.registration_roster;
drop policy if exists registration_roster_insert on public.registration_roster;
drop policy if exists registration_roster_update on public.registration_roster;
drop policy if exists registration_roster_delete on public.registration_roster;

create policy registration_roster_select
on public.registration_roster
for select
to authenticated
using (public.can_view_ward(ward_id));

create policy registration_roster_insert
on public.registration_roster
for insert
to authenticated
with check (public.can_manage_registration_ward(ward_id));

create policy registration_roster_update
on public.registration_roster
for update
to authenticated
using (public.can_manage_registration_ward(ward_id))
with check (public.can_manage_registration_ward(ward_id));

create policy registration_roster_delete
on public.registration_roster
for delete
to authenticated
using (public.can_manage_registration_ward(ward_id));

drop policy if exists registration_invites_select on public.registration_invites;
drop policy if exists registration_invites_insert on public.registration_invites;
drop policy if exists registration_invites_update on public.registration_invites;
drop policy if exists registration_invites_delete on public.registration_invites;

create policy registration_invites_select
on public.registration_invites
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or lower(recipient_email) = public.current_user_email()
);

create policy registration_invites_insert
on public.registration_invites
for insert
to authenticated
with check (public.can_manage_registration_ward(ward_id));

create policy registration_invites_update
on public.registration_invites
for update
to authenticated
using (public.can_manage_registration_ward(ward_id))
with check (public.can_manage_registration_ward(ward_id));

create policy registration_invites_delete
on public.registration_invites
for delete
to authenticated
using (public.can_manage_registration_ward(ward_id));

create or replace view public.v_registration_roster
with (security_invoker = true) as
select
  rr.id as roster_id,
  rr.participant_id,
  rr.ward_id,
  rr.status,
  rr.notes,
  rr.created_at,
  rr.updated_at,
  p.first_name,
  p.last_name,
  p.preferred_name,
  p.email as youth_email,
  p.parent_guardian_name,
  p.parent_guardian_phone,
  p.active as participant_active,
  w.name as ward_name,
  q.display_name as quorum_name,
  li.target_type as latest_invite_target,
  li.recipient_email as latest_invite_email,
  li.status as latest_invite_status,
  li.sent_at as latest_invite_sent_at
from public.registration_roster rr
join public.participants p on p.id = rr.participant_id
join public.wards w on w.id = rr.ward_id
join public.quorums q on q.id = p.quorum_id
left join lateral (
  select
    ri.target_type,
    ri.recipient_email,
    ri.status,
    ri.sent_at
  from public.registration_invites ri
  where ri.participant_id = rr.participant_id
  order by ri.sent_at desc, ri.created_at desc
  limit 1
) li on true;
