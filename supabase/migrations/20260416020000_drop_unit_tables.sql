-- Drop camp unit tables (units functionality removed, competitions now use wards)

drop policy if exists camp_unit_members_select on public.camp_unit_members;
drop policy if exists camp_unit_members_insert on public.camp_unit_members;
drop policy if exists camp_unit_members_update on public.camp_unit_members;
drop policy if exists camp_unit_members_delete on public.camp_unit_members;

drop policy if exists camp_units_select on public.camp_units;
drop policy if exists camp_units_insert on public.camp_units;
drop policy if exists camp_units_update on public.camp_units;
drop policy if exists camp_units_delete on public.camp_units;

drop table if exists public.camp_unit_members cascade;
drop table if exists public.camp_units cascade;

-- Clean up competition_points.unit_id column (no longer needed)
alter table public.competition_points
  drop column if exists unit_id;

notify pgrst, 'reload schema';
