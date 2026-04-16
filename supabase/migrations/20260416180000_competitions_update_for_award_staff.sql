-- Let competition-point staff (contacts / stake) update competitions, e.g. mark completed,
-- in addition to content managers. Aligns with can_award_competition_points().

drop policy if exists competitions_update on public.competitions;

create policy competitions_update
on public.competitions
for update
to authenticated
using (
  public.can_manage_content()
  or public.can_award_competition_points()
)
with check (
  public.can_manage_content()
  or public.can_award_competition_points()
);

notify pgrst, 'reload schema';
