-- Add explicit contact-route marker for registration roster rows.
-- This supports leader workflow: mark youth email vs parent email routing.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'registration_contact_route_enum'
  ) then
    create type public.registration_contact_route_enum
      as enum ('parent_email', 'youth_email');
  end if;
end
$$;

alter table if exists public.registration_roster
  add column if not exists contact_route public.registration_contact_route_enum;

alter table if exists public.registration_roster
  alter column contact_route set default 'parent_email';

update public.registration_roster
set contact_route = 'parent_email'
where contact_route is null;

alter table if exists public.registration_roster
  alter column contact_route set not null;

create index if not exists idx_registration_roster_contact_route
  on public.registration_roster (contact_route);

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
  li.sent_at as latest_invite_sent_at,
  rr.contact_route,
  coalesce(pi_latest.email, pr_latest.parent_email) as preferred_parent_email
from public.registration_roster rr
join public.participants p on p.id = rr.participant_id
join public.wards w on w.id = rr.ward_id
join public.quorums q on q.id = p.quorum_id
left join lateral (
  select
    lower(pi.email) as email
  from public.parent_invitations pi
  where pi.participant_id = rr.participant_id
  order by pi.invited_at desc, pi.created_at desc
  limit 1
) pi_latest on true
left join lateral (
  select
    lower(pr.parent_email) as parent_email
  from public.parent_registrations pr
  where pr.participant_id = rr.participant_id
    and coalesce(trim(pr.parent_email), '') <> ''
  order by pr.created_at desc
  limit 1
) pr_latest on true
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
