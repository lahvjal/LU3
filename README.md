# LU Young Men Camp Tracker

This project tracks camp participants for one stake (LU3), organized by ward and quorum, using Supabase as the backend.
It includes registration, attendance, and shirt-size workflows so leaders can place shirt orders early.

## What is included

- `supabase/migrations/20260412_initial_camp_schema.sql`
  - Core data model for:
    - wards -> quorums
    - participants
    - camp events
    - registrations and attendance logs
    - shirt size tracking and summary views
  - Row Level Security (RLS) policies by role and ward scope.
  - Legacy multi-stake compatible bootstrap (migrated by next file).
- `supabase/migrations/20260413_single_stake_refactor.sql`
  - Removes `stakes` and all `stake_id` dependencies.
  - Applies single-stake (LU3) role and policy model.
  - Login-ready role model for:
    - `stake_leader`
    - `stake_camp_director`
    - `ward_leader`
    - `camp_committee`
    - `young_men_captain`
    - `young_man`
- `supabase/migrations/20260414013000_parent_guardian_claims.sql`
  - Parent invite/claim workflow for youth without email.
  - Parent-linked registration update model.
- `supabase/migrations/20260414024000_registration_roster_and_invites.sql`
  - Leader-managed registration list (`registration_roster`).
  - Invite actions for either youth email or parent email (`registration_invites`).
  - Roster-first workflow where leaders add names, then send invites as needed.
- `supabase/migrations/20260414032000_registration_roster_contact_route.sql`
  - Adds per-youth contact routing marker (`parent_email` or `youth_email`).
  - Enhances roster view with preferred parent email for quick invite actions.
- `docs/google-sheets-sync.md`
  - Recommended Supabase + Google Sheets sync design.
- `docs/roles-and-login.md`
  - Role-based login setup and assignment examples.
- `docs/parent-onboarding.md`
  - Parent invite SQL + account claim workflow.

## Quick start

1. Run all SQL files in `supabase/migrations` in filename order.
2. Create a local env file from `.env.example`.
3. Add your project values to `.env.local` (never commit secrets).
4. Create initial records:
   - each `ward`
   - each `quorum` per ward (`deacons`, `teachers`, `priests`)
   - `user_roles` for each account
5. Add participants and start collecting shirt sizes immediately.

## Parent workflow

- Leaders add youth to a registration list on `/register`.
- Leaders can mark each roster row as either:
  - `Youth has own email`, or
  - `Parent email contact`.
- Leaders can send invites to either:
  - the youth (if they have their own email), or
  - the parent/guardian email.
- Parent-targeted invites create claimable records for `/register`.
- Parents create account and claim invites on `/register`.
- Parents can submit/update registration details for linked youth.
- Youth accounts are optional; no youth email is required.

## Web app (Next.js)

The app UI lives in `web`.

1. Copy `web/.env.example` to `web/.env.local`.
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run:
   - `cd web`
   - `npm install`
   - `npm run dev`
4. Open `http://localhost:3000` and sign in with a Supabase Auth user that has a `user_roles` row.

## Ward roster and status view

- Leaders can query `v_ward_young_men_status` to see each young man in their ward with latest camp registration status.
- `young_man` accounts only see their own rows through RLS.

## Shirt-order workflow

- `participants.shirt_size_code` stores the latest size.
- `participants.shirt_size_updated_at` tracks when it changed.
- Registrations cannot move to `confirmed` unless shirt size is present.
- Use views:
  - `v_shirt_order_counts` for size totals
  - `v_missing_shirt_sizes` for follow-up list

## Role permissions (default)

- `stake_leader`: full app-wide setup and role assignment.
- `stake_camp_director`: app-wide camp management.
- `camp_committee`: app-wide registration and attendance support.
- `ward_leader`: ward roster and ward-level management.
- `young_men_captain`: ward roster visibility and camp status support.
- `young_man`: self-service access to own record and status.

## Security notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Never expose service role in browser code.
- Rotate keys if they were ever shared in chat, screenshots, or commits.
