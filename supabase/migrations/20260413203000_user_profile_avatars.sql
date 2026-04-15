-- User profile avatars for authenticated app users.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  user_email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (avatar_url is null or avatar_url ~* '^https?://')
);

create index if not exists idx_user_profiles_email
  on public.user_profiles ((lower(user_email)));

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_select on public.user_profiles;
drop policy if exists user_profiles_insert on public.user_profiles;
drop policy if exists user_profiles_update on public.user_profiles;
drop policy if exists user_profiles_delete on public.user_profiles;

create policy user_profiles_select
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid() or public.has_any_role());

create policy user_profiles_insert
on public.user_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy user_profiles_update
on public.user_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy user_profiles_delete
on public.user_profiles
for delete
to authenticated
using (user_id = auth.uid());

drop trigger if exists trg_set_updated_at_user_profiles on public.user_profiles;
create trigger trg_set_updated_at_user_profiles
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.sync_user_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, user_email, display_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(lower(new.email), '@', 1)
    )
  )
  on conflict (user_id) do update
  set user_email = excluded.user_email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_profile on auth.users;
create trigger on_auth_user_created_user_profile
after insert on auth.users
for each row execute function public.sync_user_profile_from_auth();

insert into public.user_profiles (user_id, user_email, display_name)
select
  u.id,
  lower(u.email),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(lower(u.email), '@', 1)
  ) as display_name
from auth.users u
where u.email is not null
on conflict (user_id) do update
set user_email = excluded.user_email;
