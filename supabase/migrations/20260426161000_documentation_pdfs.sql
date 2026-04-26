-- Support documentation entries that are either in-app text or uploaded PDFs.

alter table public.documentation_pages
  alter column content drop not null;

alter table public.documentation_pages
  add column if not exists pdf_url text,
  add column if not exists pdf_filename text,
  add column if not exists pdf_storage_path text;

alter table public.documentation_pages
  drop constraint if exists documentation_pages_content_or_pdf_check;

alter table public.documentation_pages
  add constraint documentation_pages_content_or_pdf_check
  check (
    (
      nullif(btrim(coalesce(content, '')), '') is not null
      and nullif(btrim(coalesce(pdf_url, '')), '') is null
      and nullif(btrim(coalesce(pdf_storage_path, '')), '') is null
    )
    or (
      nullif(btrim(coalesce(content, '')), '') is null
      and nullif(btrim(coalesce(pdf_url, '')), '') is not null
      and nullif(btrim(coalesce(pdf_storage_path, '')), '') is not null
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentation-pdfs',
  'documentation-pdfs',
  true,
  15728640,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documentation_pdfs_public_read on storage.objects;
drop policy if exists documentation_pdfs_content_manager_insert on storage.objects;
drop policy if exists documentation_pdfs_content_manager_update on storage.objects;
drop policy if exists documentation_pdfs_content_manager_delete on storage.objects;

create policy documentation_pdfs_public_read
on storage.objects
for select
to public
using (bucket_id = 'documentation-pdfs');

create policy documentation_pdfs_content_manager_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documentation-pdfs'
  and public.can_manage_content()
);

create policy documentation_pdfs_content_manager_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documentation-pdfs'
  and public.can_manage_content()
)
with check (
  bucket_id = 'documentation-pdfs'
  and public.can_manage_content()
);

create policy documentation_pdfs_content_manager_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documentation-pdfs'
  and public.can_manage_content()
);
