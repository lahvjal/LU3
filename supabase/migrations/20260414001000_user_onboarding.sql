-- One-time onboarding state for newly created users.

alter table public.user_profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Existing users should not be blocked by the new onboarding requirement.
update public.user_profiles
set onboarding_completed_at = coalesce(onboarding_completed_at, now());
