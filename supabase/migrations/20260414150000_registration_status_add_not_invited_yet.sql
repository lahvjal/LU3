-- Add "not_invited_yet" to registration status enum for roster workflows.
do $$
declare
  has_enum_type boolean;
begin
  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'registration_status_enum'
  )
  into has_enum_type;

  if not has_enum_type then
    raise exception
      'registration_status_enum type not found. Run foundational migrations first (for example 20260412_initial_camp_schema.sql).';
  end if;

  begin
    alter type public.registration_status_enum add value if not exists 'not_invited_yet';
  exception
    when duplicate_object then
      null;
  end;
end
$$;
