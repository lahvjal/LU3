-- 1) Leader callings are reference/lookup data needed by any authenticated
--    user (e.g. during onboarding or when viewing the invite form).
--    The previous policy required has_any_role(), which depends on
--    user_roles rows that may not exist yet.

drop policy if exists leader_callings_select on public.leader_callings;
create policy leader_callings_select
on public.leader_callings
for select
to authenticated
using (true);

-- 2) Restore user_roles rows from active leader_invitations.
--    The user_roles table lost its rows (likely during schema refactoring)
--    but leader_invitations still tracks who holds which role.
--    Re-populate so that RLS helper functions (has_any_role, is_stake_admin,
--    is_stake_leader, etc.) work correctly again.

insert into public.user_roles (user_id, role, ward_id, participant_id)
select
  li.user_id,
  li.role::public.app_role_enum,
  li.ward_id,
  null
from public.leader_invitations li
where li.user_id is not null
  and li.status = 'active'
  and li.role in (
    'stake_leader',
    'stake_camp_director',
    'camp_committee',
    'ward_leader',
    'young_men_captain'
  )
on conflict do nothing;
