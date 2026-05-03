-- Allow leader users to defer parent-registration follow-up and be reminded later.

alter table public.user_profiles
  add column if not exists parent_onboarding_snoozed_at timestamptz;
