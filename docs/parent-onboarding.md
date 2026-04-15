# Parent Onboarding and Child Claim Flow

This project supports youth without email by letting parents manage registration.

## Overview

- Youth can exist only as `participants` (no auth account required).
- Leaders send parent invites by email, linked to a participant.
- Parent creates/signs into account using same email.
- Parent claims invites on `/register` and can update registration details for linked children.

## Required migration

Run:

- `supabase/migrations/20260414013000_parent_guardian_claims.sql`
- `supabase/migrations/20260414024000_registration_roster_and_invites.sql`
- `supabase/migrations/20260414032000_registration_roster_contact_route.sql`

## Leader roster + invite flow

### Preferred (UI, recommended)

1. Sign in as a role with registration management permissions.
2. Open `/register`.
3. Use **Registration List & Invite Actions**:
   - Add youth to the registration list first.
   - Mark each roster row contact type:
     - **Youth has own email**, or
     - **Parent email contact**.
   - For each youth row, choose invite target:
     - **Send to parent** (claim workflow), or
     - **Send to youth** (direct youth email).
   - Enter recipient email and send invite.

### SQL alternative

```sql
insert into public.parent_invitations (
  email,
  participant_id,
  notes
)
values (
  lower('parent@example.com'),
  '<participant_uuid>',
  'Primary guardian'
);
```

`ward_id` is auto-derived from the participant.

For direct youth-email invites:

```sql
insert into public.registration_invites (
  participant_id,
  target_type,
  recipient_email,
  notes
)
values (
  '<participant_uuid>',
  'youth',
  lower('youth@example.com'),
  'Direct youth registration invite'
);
```

## Parent account flow

1. Parent goes to `/login`.
2. Uses **Create Parent Account** (or signs in if already created).
3. Goes to `/register`.
4. Clicks **Claim My Invites**.
5. Submits/updates child registration details.

## Leader review flow

- Leaders use `/register` queue to set status:
  - `pending`
  - `approved`
  - `waitlisted`
  - `declined`
- Approving a linked registration syncs key fields into `participants`:
  - `parent_guardian_name`
  - `parent_guardian_phone`
  - `medical_notes`
  - `shirt_size_code`

## Useful checks

```sql
-- Registration roster
select roster_id, participant_id, ward_name, quorum_name, status, latest_invite_email
from public.v_registration_roster
order by ward_name, last_name, first_name;
```

```sql
-- Pending invites
select id, email, participant_id, status, invited_at
from public.parent_invitations
where status = 'pending'
order by invited_at desc;
```

```sql
-- Linked parent-child relationships
select pgl.id, pg.email, p.first_name, p.last_name, pgl.relationship, pgl.status
from public.parent_guardian_links pgl
join public.parent_guardians pg on pg.id = pgl.guardian_id
join public.participants p on p.id = pgl.participant_id
order by pg.email, p.last_name, p.first_name;
```
