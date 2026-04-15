-- Parent/guardian onboarding and child claim workflow.
-- Supports youth without email by using parent-managed accounts.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'parent_invitation_status_enum'
  ) then
    create type public.parent_invitation_status_enum
      as enum ('pending', 'accepted', 'revoked');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'parent_link_status_enum'
  ) then
    create type public.parent_link_status_enum
      as enum ('active', 'revoked');
  end if;
end
$$;

create table if not exists public.parent_guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  participant_id uuid not null references public.participants (id) on delete cascade,
  ward_id uuid references public.wards (id) on delete set null,
  status public.parent_invitation_status_enum not null default 'pending',
  invited_by uuid references auth.users (id) on delete set null,
  guardian_id uuid references public.parent_guardians (id) on delete set null,
  notes text,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_guardian_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.parent_guardians (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  ward_id uuid references public.wards (id) on delete set null,
  relationship text not null default 'parent',
  status public.parent_link_status_enum not null default 'active',
  created_by_invitation_id uuid references public.parent_invitations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, participant_id)
);

alter table public.parent_registrations
  add column if not exists participant_id uuid references public.participants (id) on delete set null,
  add column if not exists submitted_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists linked_guardian_id uuid references public.parent_guardians (id) on delete set null;

create unique index if not exists idx_parent_guardians_email_unique
  on public.parent_guardians ((lower(email)));

create index if not exists idx_parent_guardians_user_id
  on public.parent_guardians (user_id);

create index if not exists idx_parent_invitations_email
  on public.parent_invitations ((lower(email)));

create index if not exists idx_parent_invitations_participant
  on public.parent_invitations (participant_id);

create index if not exists idx_parent_invitations_status
  on public.parent_invitations (status);

create unique index if not exists idx_parent_invitations_pending_unique
  on public.parent_invitations ((lower(email)), participant_id)
  where status = 'pending';

create index if not exists idx_parent_guardian_links_participant
  on public.parent_guardian_links (participant_id);

create index if not exists idx_parent_guardian_links_ward
  on public.parent_guardian_links (ward_id);

create unique index if not exists idx_parent_registrations_participant_owner
  on public.parent_registrations (participant_id, submitted_by_user_id)
  where participant_id is not null and submitted_by_user_id is not null;

create index if not exists idx_parent_registrations_submitted_by
  on public.parent_registrations (submitted_by_user_id);

create index if not exists idx_parent_registrations_participant
  on public.parent_registrations (participant_id);

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.current_parent_guardian_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pg.id
  from public.parent_guardians pg
  where pg.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_parent_access_participant(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_guardian_links pgl
    join public.parent_guardians pg on pg.id = pgl.guardian_id
    where pgl.participant_id = target_participant_id
      and pgl.status = 'active'
      and pg.user_id = auth.uid()
  );
$$;

create or replace function public.is_parent_registration_owner(
  target_parent_email text,
  target_submitted_by_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (target_submitted_by_user_id is not null and target_submitted_by_user_id = auth.uid())
    or (
      coalesce(public.current_user_email(), '') <> ''
      and lower(coalesce(target_parent_email, '')) = public.current_user_email()
    );
$$;

create or replace function public.claim_parent_invitations_for_current_user()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_guardian_id uuid;
  v_claimed_count int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to claim parent invitations';
  end if;

  v_email := public.current_user_email();
  if v_email is null or v_email = '' then
    return 0;
  end if;

  insert into public.parent_guardians (user_id, email)
  values (v_user_id, v_email)
  on conflict (user_id) do update
  set
    email = excluded.email,
    updated_at = now()
  returning id into v_guardian_id;

  if v_guardian_id is null then
    select pg.id
    into v_guardian_id
    from public.parent_guardians pg
    where pg.user_id = v_user_id
    limit 1;
  end if;

  if v_guardian_id is null then
    raise exception 'Unable to initialize guardian profile for current user';
  end if;

  insert into public.parent_guardian_links (
    guardian_id,
    participant_id,
    ward_id,
    created_by_invitation_id,
    status
  )
  select
    v_guardian_id,
    pi.participant_id,
    p.ward_id,
    pi.id,
    'active'::public.parent_link_status_enum
  from public.parent_invitations pi
  join public.participants p on p.id = pi.participant_id
  where lower(pi.email) = v_email
    and pi.status = 'pending'
  on conflict (guardian_id, participant_id) do update
  set
    status = 'active'::public.parent_link_status_enum,
    ward_id = excluded.ward_id,
    updated_at = now();

  update public.parent_invitations pi
  set
    status = 'accepted'::public.parent_invitation_status_enum,
    guardian_id = v_guardian_id,
    accepted_at = coalesce(pi.accepted_at, now()),
    updated_at = now()
  where lower(pi.email) = v_email
    and pi.status = 'pending';

  get diagnostics v_claimed_count = row_count;
  return v_claimed_count;
end;
$$;

create or replace function public.sync_parent_invitation_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_ward uuid;
begin
  new.email := lower(trim(new.email));

  select p.ward_id
  into v_participant_ward
  from public.participants p
  where p.id = new.participant_id;

  if v_participant_ward is null then
    raise exception 'participant_id % does not exist', new.participant_id;
  end if;

  new.ward_id := v_participant_ward;

  if new.status = 'accepted' and new.accepted_at is null then
    new.accepted_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.sync_parent_guardian_link_scope()
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

  new.ward_id := v_participant_ward;
  return new;
end;
$$;

create or replace function public.sync_parent_registration_scope()
returns trigger
language plpgsql
as $$
declare
  v_participant_ward uuid;
  v_participant_first_name text;
  v_participant_last_name text;
  v_guardian_id uuid;
begin
  if new.parent_email is not null then
    new.parent_email := lower(trim(new.parent_email));
  end if;

  if new.participant_id is not null then
    select p.ward_id, p.first_name, p.last_name
    into v_participant_ward, v_participant_first_name, v_participant_last_name
    from public.participants p
    where p.id = new.participant_id;

    if v_participant_ward is null then
      raise exception 'participant_id % does not exist', new.participant_id;
    end if;

    new.ward_id := v_participant_ward;

    if coalesce(trim(new.child_first_name), '') = '' then
      new.child_first_name := v_participant_first_name;
    end if;
    if coalesce(trim(new.child_last_name), '') = '' then
      new.child_last_name := v_participant_last_name;
    end if;
  end if;

  if auth.uid() is not null then
    if new.submitted_by_user_id is null then
      new.submitted_by_user_id := auth.uid();
    end if;

    if coalesce(new.parent_email, '') = '' then
      new.parent_email := public.current_user_email();
    end if;

    if new.linked_guardian_id is null then
      select pg.id
      into v_guardian_id
      from public.parent_guardians pg
      where pg.user_id = auth.uid()
      limit 1;

      if v_guardian_id is not null then
        new.linked_guardian_id := v_guardian_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_parent_registration_update_scope()
returns trigger
language plpgsql
as $$
declare
  v_is_manager boolean;
begin
  v_is_manager := public.can_manage_parent_registration(coalesce(old.ward_id, new.ward_id));

  if v_is_manager then
    return new;
  end if;

  if not public.is_parent_registration_owner(old.parent_email, old.submitted_by_user_id) then
    raise exception 'You can only update your own parent registration records';
  end if;

  if old.status in ('approved', 'declined') then
    raise exception 'This registration is finalized and cannot be edited';
  end if;

  if lower(coalesce(new.parent_email, '')) <> public.current_user_email() then
    raise exception 'Parent email must match the signed-in account email';
  end if;

  -- Parents cannot self-approve or overwrite leader review metadata.
  new.status := old.status;
  new.review_notes := old.review_notes;
  new.reviewed_by := old.reviewed_by;
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_parent_guardians on public.parent_guardians;
create trigger trg_set_updated_at_parent_guardians
before update on public.parent_guardians
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_parent_invitations on public.parent_invitations;
create trigger trg_set_updated_at_parent_invitations
before update on public.parent_invitations
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_parent_guardian_links on public.parent_guardian_links;
create trigger trg_set_updated_at_parent_guardian_links
before update on public.parent_guardian_links
for each row execute function public.set_updated_at();

drop trigger if exists trg_sync_parent_invitation_scope on public.parent_invitations;
create trigger trg_sync_parent_invitation_scope
before insert or update on public.parent_invitations
for each row execute function public.sync_parent_invitation_scope();

drop trigger if exists trg_sync_parent_guardian_link_scope on public.parent_guardian_links;
create trigger trg_sync_parent_guardian_link_scope
before insert or update on public.parent_guardian_links
for each row execute function public.sync_parent_guardian_link_scope();

drop trigger if exists trg_sync_parent_registration_scope on public.parent_registrations;
create trigger trg_sync_parent_registration_scope
before insert or update on public.parent_registrations
for each row execute function public.sync_parent_registration_scope();

drop trigger if exists trg_enforce_parent_registration_update_scope on public.parent_registrations;
create trigger trg_enforce_parent_registration_update_scope
before update on public.parent_registrations
for each row execute function public.enforce_parent_registration_update_scope();

alter table public.parent_guardians enable row level security;
alter table public.parent_invitations enable row level security;
alter table public.parent_guardian_links enable row level security;

drop policy if exists parent_guardians_select on public.parent_guardians;
drop policy if exists parent_guardians_insert on public.parent_guardians;
drop policy if exists parent_guardians_update on public.parent_guardians;
drop policy if exists parent_guardians_delete on public.parent_guardians;

create policy parent_guardians_select
on public.parent_guardians
for select
to authenticated
using (user_id = auth.uid() or public.is_stake_admin());

create policy parent_guardians_insert
on public.parent_guardians
for insert
to authenticated
with check (user_id = auth.uid() or public.is_stake_admin());

create policy parent_guardians_update
on public.parent_guardians
for update
to authenticated
using (user_id = auth.uid() or public.is_stake_admin())
with check (user_id = auth.uid() or public.is_stake_admin());

create policy parent_guardians_delete
on public.parent_guardians
for delete
to authenticated
using (public.is_stake_admin());

drop policy if exists parent_invitations_select on public.parent_invitations;
drop policy if exists parent_invitations_insert on public.parent_invitations;
drop policy if exists parent_invitations_update on public.parent_invitations;
drop policy if exists parent_invitations_delete on public.parent_invitations;

create policy parent_invitations_select
on public.parent_invitations
for select
to authenticated
using (
  public.can_manage_parent_registration(ward_id)
  or lower(email) = public.current_user_email()
);

create policy parent_invitations_insert
on public.parent_invitations
for insert
to authenticated
with check (public.can_manage_parent_registration(ward_id));

create policy parent_invitations_update
on public.parent_invitations
for update
to authenticated
using (public.can_manage_parent_registration(ward_id))
with check (public.can_manage_parent_registration(ward_id));

create policy parent_invitations_delete
on public.parent_invitations
for delete
to authenticated
using (public.can_manage_parent_registration(ward_id));

drop policy if exists parent_guardian_links_select on public.parent_guardian_links;
drop policy if exists parent_guardian_links_insert on public.parent_guardian_links;
drop policy if exists parent_guardian_links_update on public.parent_guardian_links;
drop policy if exists parent_guardian_links_delete on public.parent_guardian_links;

create policy parent_guardian_links_select
on public.parent_guardian_links
for select
to authenticated
using (
  public.can_parent_access_participant(participant_id)
  or public.can_manage_parent_registration(ward_id)
);

create policy parent_guardian_links_insert
on public.parent_guardian_links
for insert
to authenticated
with check (public.can_manage_parent_registration(ward_id));

create policy parent_guardian_links_update
on public.parent_guardian_links
for update
to authenticated
using (public.can_manage_parent_registration(ward_id))
with check (public.can_manage_parent_registration(ward_id));

create policy parent_guardian_links_delete
on public.parent_guardian_links
for delete
to authenticated
using (public.can_manage_parent_registration(ward_id));

drop policy if exists parent_registrations_select on public.parent_registrations;
drop policy if exists parent_registrations_insert_anon on public.parent_registrations;
drop policy if exists parent_registrations_insert_authenticated on public.parent_registrations;
drop policy if exists parent_registrations_update on public.parent_registrations;
drop policy if exists parent_registrations_delete on public.parent_registrations;

create policy parent_registrations_select
on public.parent_registrations
for select
to authenticated
using (
  public.can_manage_parent_registration(ward_id)
  or public.is_parent_registration_owner(parent_email, submitted_by_user_id)
  or (
    participant_id is not null
    and public.can_parent_access_participant(participant_id)
  )
);

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
using (
  public.can_manage_parent_registration(ward_id)
  or public.is_parent_registration_owner(parent_email, submitted_by_user_id)
  or (
    participant_id is not null
    and public.can_parent_access_participant(participant_id)
  )
)
with check (
  public.can_manage_parent_registration(ward_id)
  or public.is_parent_registration_owner(parent_email, submitted_by_user_id)
  or (
    participant_id is not null
    and public.can_parent_access_participant(participant_id)
  )
);

create policy parent_registrations_delete
on public.parent_registrations
for delete
to authenticated
using (public.can_manage_content());

drop policy if exists participants_select on public.participants;
create policy participants_select
on public.participants
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(id)
  or public.can_parent_access_participant(id)
);

drop policy if exists registrations_select on public.registrations;
create policy registrations_select
on public.registrations
for select
to authenticated
using (
  public.can_view_ward(ward_id)
  or public.is_young_man_self(participant_id)
  or public.can_parent_access_participant(participant_id)
);

create or replace view public.v_parent_linked_children
with (security_invoker = true) as
select
  p.id as participant_id,
  p.ward_id,
  w.name as ward_name,
  p.quorum_id,
  q.display_name as quorum_name,
  q.quorum_type,
  p.first_name,
  p.last_name,
  p.preferred_name,
  p.shirt_size_code as participant_shirt_size_code,
  pgl.relationship,
  pgl.status as link_status,
  pr.id as registration_id,
  pr.status as registration_status,
  pr.child_age as registration_child_age,
  pr.parent_phone as registration_parent_phone,
  pr.medical_notes as registration_medical_notes,
  pr.shirt_size_code as registration_shirt_size_code,
  pr.updated_at as registration_updated_at
from public.parent_guardian_links pgl
join public.parent_guardians pg on pg.id = pgl.guardian_id
join public.participants p on p.id = pgl.participant_id
join public.wards w on w.id = p.ward_id
join public.quorums q on q.id = p.quorum_id
left join lateral (
  select
    pr_inner.id,
    pr_inner.status,
    pr_inner.child_age,
    pr_inner.parent_phone,
    pr_inner.medical_notes,
    pr_inner.shirt_size_code,
    pr_inner.updated_at
  from public.parent_registrations pr_inner
  where pr_inner.participant_id = p.id
    and (
      pr_inner.submitted_by_user_id = auth.uid()
      or lower(pr_inner.parent_email) = public.current_user_email()
    )
  order by pr_inner.updated_at desc, pr_inner.created_at desc
  limit 1
) pr on true
where pg.user_id = auth.uid()
  and pgl.status = 'active';
