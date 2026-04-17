-- Structured medical + permission fields aligned with Church Permission and Medical Release form.
-- Replaces legacy allergies + medical_notes free-text columns.

alter table public.user_profiles
  add column if not exists parent_signature_date date;

-- New columns (additive first; backfill then drop legacy)
alter table public.young_men add column if not exists date_of_birth date;

alter table public.young_men add column if not exists special_diet_required boolean not null default false;
alter table public.young_men add column if not exists special_diet_explanation text;

alter table public.young_men add column if not exists has_allergies boolean not null default false;
alter table public.young_men add column if not exists allergies_detail text;

alter table public.young_men add column if not exists medications text;

alter table public.young_men add column if not exists self_administer_medication boolean;

alter table public.young_men add column if not exists chronic_illness boolean not null default false;
alter table public.young_men add column if not exists chronic_illness_explanation text;

alter table public.young_men add column if not exists surgery_serious_illness_past_year boolean not null default false;
alter table public.young_men add column if not exists surgery_serious_illness_explanation text;

alter table public.young_men add column if not exists activity_limits_restrictions text;

alter table public.young_men add column if not exists other_accommodations text;

alter table public.young_men add column if not exists participant_signature_name text;
alter table public.young_men add column if not exists participant_signature_date date;
alter table public.young_men add column if not exists participant_signed_at timestamptz;

-- Backfill from legacy text columns (before drop)
update public.young_men
set
  has_allergies = coalesce(trim(allergies), '') <> '',
  allergies_detail = case when coalesce(trim(allergies), '') <> '' then allergies else null end,
  other_accommodations = case
    when coalesce(trim(medical_notes), '') = '' then null
    else 'Previous medical notes (migrated): ' || trim(medical_notes)
  end;

update public.young_men
set self_administer_medication = true
where self_administer_medication is null;

alter table public.young_men
  alter column self_administer_medication set not null;

-- Approximate DOB from stored age when missing (camp reference June 15, 2026)
update public.young_men
set date_of_birth = (date '2026-06-15' - ((age::text || ' years')::interval))::date
where date_of_birth is null;

alter table public.young_men drop column if exists allergies;
alter table public.young_men drop column if exists medical_notes;

comment on column public.young_men.date_of_birth is 'Participant date of birth; age column kept for reporting and derived on insert from DOB.';
comment on column public.young_men.participant_signed_at is 'Server timestamp when parent onboarding recorded this participant signature.';
