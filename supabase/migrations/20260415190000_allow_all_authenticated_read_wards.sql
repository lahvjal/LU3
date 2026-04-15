-- Wards and quorums are reference data needed during onboarding.
-- New users arriving via magic link have no user_roles rows yet,
-- so the previous can_view_ward() policy blocked them from seeing
-- any wards or quorums. Open SELECT to all authenticated users.

drop policy if exists wards_select on public.wards;
create policy wards_select
on public.wards
for select
to authenticated
using (true);

drop policy if exists quorums_select on public.quorums;
create policy quorums_select
on public.quorums
for select
to authenticated
using (true);
