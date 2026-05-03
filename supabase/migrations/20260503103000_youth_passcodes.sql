-- Add per-youth passcode fields for youth-mode sign-in.

alter table public.young_men
  add column if not exists youth_passcode_hash text,
  add column if not exists youth_passcode_updated_at timestamptz;
