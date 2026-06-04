-- Photo gallery: youth uploads require leader approval.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'photo_status_enum') then
    create type public.photo_status_enum as enum ('approved', 'pending', 'rejected');
  end if;
end;
$$;

alter table public.photos
  add column if not exists status public.photo_status_enum not null default 'approved',
  add column if not exists storage_path text,
  add column if not exists young_man_id uuid references public.young_men (id) on delete set null,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_photos_status on public.photos (status);
create index if not exists idx_photos_uploaded_by on public.photos (uploaded_by);

create or replace function public.can_moderate_photos()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'stake_leader',
        'stake_camp_director',
        'camp_committee',
        'ward_leader'
      )
  );
$$;

create or replace function public.is_youth_photo_submitter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('young_man', 'young_men_captain')
  );
$$;

drop policy if exists photos_insert on public.photos;
drop policy if exists photos_update on public.photos;
drop policy if exists photos_delete on public.photos;

create policy photos_insert
on public.photos
for insert
to authenticated
with check (
  (
    public.can_moderate_photos()
    and status = 'approved'
    and uploaded_by = auth.uid()
  )
  or (
    status = 'pending'
    and uploaded_by = auth.uid()
    and public.is_youth_photo_submitter()
  )
);

create policy photos_update
on public.photos
for update
to authenticated
using (
  public.can_moderate_photos()
  or (uploaded_by = auth.uid() and status = 'pending')
)
with check (
  public.can_moderate_photos()
  or (uploaded_by = auth.uid() and status = 'pending')
);

create policy photos_delete
on public.photos
for delete
to authenticated
using (
  public.can_moderate_photos()
  or (uploaded_by = auth.uid() and status = 'pending')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'camp-photos',
  'camp-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

drop policy if exists camp_photos_public_read on storage.objects;
drop policy if exists camp_photos_insert_own_folder on storage.objects;
drop policy if exists camp_photos_update_own_folder on storage.objects;
drop policy if exists camp_photos_delete_own_folder on storage.objects;

create policy camp_photos_public_read
on storage.objects
for select
to public
using (bucket_id = 'camp-photos');

create policy camp_photos_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'camp-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy camp_photos_update_own_folder
on storage.objects
for update
to authenticated
using (
  bucket_id = 'camp-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'camp-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy camp_photos_delete_own_folder
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'camp-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
