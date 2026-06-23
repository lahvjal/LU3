-- Restore shirt size on user_profiles for adult leaders (young men keep shirt_size_code on young_men).

alter table public.user_profiles
  add column if not exists shirt_size_code text references public.shirt_sizes (code) on delete set null;

create index if not exists idx_user_profiles_shirt_size
  on public.user_profiles (shirt_size_code);
