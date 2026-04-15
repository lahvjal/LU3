-- Default registration roster entries to "not_invited_yet".
-- Requires the enum migration to run first:
-- 20260414150000_registration_status_add_not_invited_yet.sql
do $$
declare
  has_status_value boolean;
begin
  select exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'registration_status_enum'
      and e.enumlabel = 'not_invited_yet'
  )
  into has_status_value;

  if not has_status_value then
    raise exception
      'registration_status_enum is missing value "not_invited_yet". Run migration 20260414150000_registration_status_add_not_invited_yet.sql first.';
  end if;
end
$$;

alter table if exists public.registration_roster
  alter column status set default 'not_invited_yet';

-- Backfill only rows that were marked invited but have no invite record yet.
update public.registration_roster rr
set status = 'not_invited_yet'
where rr.status = 'invited'
  and not exists (
    select 1
    from public.registration_invites ri
    where ri.participant_id = rr.participant_id
  );
