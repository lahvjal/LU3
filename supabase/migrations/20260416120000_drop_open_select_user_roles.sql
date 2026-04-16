-- The blanket open SELECT migration (20260416110000) added USING (true) on
-- user_roles, which ORs with the scoped policy and exposes every row to every
-- signed-in user. Navigation uses roles from this table without always
-- filtering client-side, so parents incorrectly inherited global roles.
-- Drop only this table's open policy; other tables keep open read if desired.

drop policy if exists open_select_authenticated_user_roles on public.user_roles;
