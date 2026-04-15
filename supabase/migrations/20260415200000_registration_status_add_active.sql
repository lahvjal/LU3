-- Add "active" to registration_status_enum so onboarding completion can
-- promote roster rows from "pending" to "active".

do $$
declare
  has_registration_status_type boolean;
begin
  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'registration_status_enum'
  )
  into has_registration_status_type;

  if not has_registration_status_type then
    raise exception
      'registration_status_enum type not found. Run foundational migrations first (for example 20260412_initial_camp_schema.sql).';
  end if;

  alter type public.registration_status_enum add value if not exists 'active';
end
$$;
