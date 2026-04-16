-- Per-ward meal schedules with menu text (breakfast / lunch / dinner by date)

create table if not exists public.ward_meals (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards (id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  time_label text not null,
  menu text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ward_id, meal_date, meal_type)
);

create index if not exists idx_ward_meals_meal_date on public.ward_meals (meal_date);

drop trigger if exists trg_set_updated_at_ward_meals on public.ward_meals;
create trigger trg_set_updated_at_ward_meals
before update on public.ward_meals
for each row execute function public.set_updated_at();

alter table public.ward_meals enable row level security;

create policy ward_meals_select
on public.ward_meals
for select
to authenticated
using (true);

create policy ward_meals_insert
on public.ward_meals
for insert
to authenticated
with check (public.can_manage_content());

create policy ward_meals_update
on public.ward_meals
for update
to authenticated
using (public.can_manage_content())
with check (public.can_manage_content());

create policy ward_meals_delete
on public.ward_meals
for delete
to authenticated
using (public.can_manage_content());

notify pgrst, 'reload schema';
