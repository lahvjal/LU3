-- Parents and young men (no user_roles row) could not read other user_profiles,
-- so ward roster "Leaders" was empty. Allow SELECT on leadership rows for the
-- viewer's ward plus stake-wide leaders (ward_id is null).

create or replace function public.leader_profile_visible_to_current_ward_member(
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.user_profiles leader
    where leader.user_id = target_user_id
      and leader.role is not null
      and leader.role not in ('parent', 'young_man')
      and exists (
        select 1
        from public.user_profiles viewer
        where viewer.user_id = auth.uid()
          and viewer.role in ('parent', 'young_man')
          and viewer.ward_id is not null
          and (
            leader.ward_id is null
            or leader.ward_id = viewer.ward_id
          )
      )
  );
$$;

drop policy if exists user_profiles_select on public.user_profiles;

create policy user_profiles_select
on public.user_profiles for select to authenticated
using (
  user_id = auth.uid()
  or public.has_any_role()
  or public.leader_profile_visible_to_current_ward_member(user_id)
);
