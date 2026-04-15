-- Extend user profiles with editable camp profile details.

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

alter table public.user_profiles
  add column if not exists phone text,
  add column if not exists ward_id uuid references public.wards (id) on delete set null,
  add column if not exists quorum_id uuid references public.quorums (id) on delete set null,
  add column if not exists medical_notes text,
  add column if not exists shirt_size_code text references public.shirt_sizes (code) on delete set null,
  add column if not exists age int;

alter table public.user_profiles
  drop constraint if exists user_profiles_age_check;

alter table public.user_profiles
  add constraint user_profiles_age_check
  check (age is null or age between 8 and 99);

create index if not exists idx_user_profiles_ward_id
  on public.user_profiles (ward_id);

create index if not exists idx_user_profiles_quorum_id
  on public.user_profiles (quorum_id);

create or replace function public.validate_user_profile_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quorum_ward uuid;
begin
  if new.quorum_id is null then
    return new;
  end if;

  select q.ward_id
  into v_quorum_ward
  from public.quorums q
  where q.id = new.quorum_id;

  if v_quorum_ward is null then
    raise exception 'quorum_id % does not exist', new.quorum_id;
  end if;

  if new.ward_id is null then
    new.ward_id := v_quorum_ward;
    return new;
  end if;

  if new.ward_id <> v_quorum_ward then
    raise exception 'user profile ward_id must match quorum ward_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_user_profile_scope on public.user_profiles;
create trigger trg_validate_user_profile_scope
before insert or update on public.user_profiles
for each row execute function public.validate_user_profile_scope();
