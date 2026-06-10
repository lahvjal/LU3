# Parent Onboarding Flow

Parents register young men through an in-app onboarding overlay after signing in with a magic link.

## Overview

- Leaders add parents from **Registration** (`/registration`) with the parent's email.
- The leader sends a **Send Invite** email with a magic sign-in link.
- Parent opens the link, clicks **Continue to Camp** on `/auth/confirm`, then completes the **Complete Registration** overlay (profile, young men, medical release, signatures).
- Youth without their own email can sign in later using the parent's email plus a 4-digit youth passcode set during parent onboarding.

## Leader flow

1. Sign in with registration management permissions.
2. Open **Registration** in the sidebar.
3. Click **Invite Parent**, enter name and email, and save.
4. Click **Send Invite** (or **Resend**) on the parent row.
   - If invite email fails, the UI shows an error (check `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` on the server).
5. Track invite status on the registration list.

## Parent flow

1. Open the invite email and follow the sign-in link.
2. On `/auth/confirm`, click **Continue to Camp** (required — prevents email scanners from consuming the link).
3. Complete the onboarding overlay:
   - Profile photo, name, password, ward
   - Each young man: photo, DOB, shirt size, medical questions, 4-digit youth passcode
   - Terms, participant signatures, parent/guardian signature
4. Click **Complete Registration**.
5. After success, the app reloads and the overlay closes.

Parents who need to finish later can use **Remind Me Later** if they are leaders adding their own children; a banner on the dashboard prompts them to finish parent registration.

## Parent sign-in after onboarding

- **Password:** `/login` → email + password
- **Magic link:** `/login` → request a new sign-in link if needed
- **Youth passcode:** `/login` → youth login with parent email, youth name, and 4-digit passcode

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Magic links, parent password on onboarding complete |
| `RESEND_API_KEY` | Invite and sign-in emails |
| `NEXT_PUBLIC_APP_URL` | Must match Supabase redirect allowlist (`/auth/callback`, `/auth/confirm`) |

## Useful checks

```sql
-- Parents pending onboarding
select user_id, user_email, display_name, invited_at, onboarding_completed_at
from public.user_profiles
where role = 'parent'
order by invited_at desc nulls last;

-- Young men linked to a parent
select id, parent_id, first_name, last_name, date_of_birth, shirt_size_code
from public.young_men
where parent_id = '<parent_user_uuid>';
```
