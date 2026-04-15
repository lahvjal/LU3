-- Returns the invite type for the currently authenticated user by checking
-- their email against the three invite tables. Used during onboarding to
-- tailor the experience per role.
--
-- Returns: 'leader', 'parent', 'youth', or null if no invite found.

create or replace function public.detect_user_invite_type()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return null;
  end if;

  v_email := lower(coalesce(
    (select email from auth.users where id = v_user_id),
    ''
  ));

  if v_email = '' then
    return null;
  end if;

  -- Leader invitations: match by email or user_id
  if exists (
    select 1
    from public.leader_invitations li
    where (lower(li.email) = v_email or li.user_id = v_user_id)
      and li.status in ('pending', 'active')
  ) then
    return 'leader';
  end if;

  -- Youth registration invites: match by recipient email with target_type = 'youth'
  if exists (
    select 1
    from public.registration_invites ri
    where lower(ri.recipient_email) = v_email
      and ri.target_type = 'youth'
      and ri.status = 'sent'
  ) then
    return 'youth';
  end if;

  -- Parent invitations: match by email
  if exists (
    select 1
    from public.parent_invitations pi
    where lower(pi.email) = v_email
      and pi.status = 'pending'
  ) then
    return 'parent';
  end if;

  -- Also check registration_invites sent to a parent email
  if exists (
    select 1
    from public.registration_invites ri
    where lower(ri.recipient_email) = v_email
      and ri.target_type = 'parent'
      and ri.status = 'sent'
  ) then
    return 'parent';
  end if;

  return null;
end;
$$;
