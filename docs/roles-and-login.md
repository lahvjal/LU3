# Roles and Login Setup

This project supports single-stake access (LU3) using Supabase Auth + `public.user_roles`.

## Roles in this app

- `stake_leader` (global scope)
- `stake_camp_director` (global scope)
- `camp_committee` (global scope)
- `ward_leader` (ward scope)
- `young_men_captain` (ward scope)
- `young_man` (participant scope)

## Access defaults

- Global roles can see all wards.
- Ward roles can see only their ward.
- `young_man` can only see his own participant and registration records.
- Role assignment is restricted to `stake_leader`.

## Login flow

1. Create users in Supabase Auth (email/password, magic link, or invite).
2. Insert role rows in `public.user_roles` for each authenticated user.
3. The RLS policies automatically restrict data visibility per role scope.

## Example role assignment SQL

Use these examples after you have real IDs.

```sql
-- Global role (admin)
insert into public.user_roles (user_id, role)
values ('<auth_user_uuid>', 'stake_leader');

-- Ward leader role
insert into public.user_roles (user_id, ward_id, role)
values ('<auth_user_uuid>', '<ward_uuid>', 'ward_leader');

-- Young Men captain role
insert into public.user_roles (user_id, ward_id, role)
values ('<auth_user_uuid>', '<ward_uuid>', 'young_men_captain');

-- Young man self-service role (participant scoped)
insert into public.user_roles (user_id, participant_id, role)
values ('<auth_user_uuid>', '<participant_uuid>', 'young_man');
```

There is no `stake_id` in single-stake mode.

## Ward roster query for leaders

Leaders can read:

```sql
select *
from public.v_ward_young_men_status
order by ward_name, quorum_type, last_name, first_name;
```

This view returns each young man with latest camp registration status.
