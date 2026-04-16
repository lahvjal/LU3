-- Read model: any signed-in user may SELECT all camp data in public tables.
-- Authorization for actions and navigation stays in the Next.js app (leader-only
-- routes, server actions, etc.). Writes remain governed by existing policies.
--
-- Implementation: one permissive SELECT policy per RLS-enabled table. Existing
-- permissive SELECT policies are OR'd with this, so rows become visible to
-- role authenticated.

do $$
declare
  r record;
  pol_name text;
  pol_exists boolean;
begin
  for r in
    select c.relname as tbl
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
  loop
    pol_name := 'open_select_authenticated_' || r.tbl;
    if length(pol_name) > 63 then
      pol_name := left(pol_name, 63);
    end if;

    select exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = r.tbl
        and p.policyname = pol_name
    ) into pol_exists;

    if not pol_exists then
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        pol_name,
        r.tbl
      );
    end if;
  end loop;
end;
$$;
