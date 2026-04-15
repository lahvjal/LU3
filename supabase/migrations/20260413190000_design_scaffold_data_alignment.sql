-- Align DB schema/data with the updated design scaffold (design.jsx)
-- and seed scaffold data into Supabase as the source of truth.

do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'competition_status_enum'
  ) and not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'competition_status_enum'
      and e.enumlabel = 'upcoming'
  ) then
    alter type public.competition_status_enum add value 'upcoming';
  end if;
end
$$;

alter table if exists public.wards
  add column if not exists theme_color text,
  add column if not exists leader_name text,
  add column if not exists leader_email text;

alter table if exists public.competition_points
  add column if not exists awarded_by_name text;

with seed_units (name, theme_color, leader_name, leader_email) as (
  values
    ('Timberline', '#6b9e6b', 'Bro. Jensen', 'jensen@email.com'),
    ('Summit', '#6b8eb0', 'Bro. Carter', 'carter@email.com'),
    ('Trailblazers', '#d4915e', 'Bro. Thompson', 'thompson@email.com'),
    ('Ridgeline', '#9a7eb8', 'Bro. Williams', 'williams@email.com')
)
insert into public.wards (name, theme_color, leader_name, leader_email)
select name, theme_color, leader_name, leader_email
from seed_units
on conflict (name) do update
set
  theme_color = excluded.theme_color,
  leader_name = excluded.leader_name,
  leader_email = excluded.leader_email;

with seed_units (name) as (
  values
    ('Timberline'),
    ('Summit'),
    ('Trailblazers'),
    ('Ridgeline')
),
seed_quorums (quorum_type, display_name) as (
  values
    ('deacons'::public.quorum_type_enum, 'Deacons'),
    ('teachers'::public.quorum_type_enum, 'Teachers'),
    ('priests'::public.quorum_type_enum, 'Priests')
)
insert into public.quorums (ward_id, quorum_type, display_name)
select w.id, sq.quorum_type, sq.display_name
from public.wards w
join seed_units su on su.name = w.name
cross join seed_quorums sq
on conflict (ward_id, quorum_type) do nothing;

with seed_campers (unit_name, first_name, last_name) as (
  values
    ('Timberline', 'Ethan', 'M.'),
    ('Timberline', 'Noah', 'R.'),
    ('Timberline', 'Liam', 'S.'),
    ('Timberline', 'Jack', 'W.'),
    ('Timberline', 'Sam', 'T.'),
    ('Summit', 'Aiden', 'P.'),
    ('Summit', 'Owen', 'K.'),
    ('Summit', 'Caleb', 'H.'),
    ('Summit', 'Ben', 'D.'),
    ('Trailblazers', 'Mason', 'L.'),
    ('Trailblazers', 'Logan', 'B.'),
    ('Trailblazers', 'James', 'F.'),
    ('Trailblazers', 'Luke', 'R.'),
    ('Trailblazers', 'Eli', 'G.'),
    ('Trailblazers', 'Ryan', 'C.'),
    ('Ridgeline', 'Dylan', 'A.'),
    ('Ridgeline', 'Wyatt', 'N.'),
    ('Ridgeline', 'Carter', 'J.'),
    ('Ridgeline', 'Gabe', 'M.')
)
insert into public.participants (
  ward_id,
  quorum_id,
  first_name,
  last_name,
  preferred_name,
  active
)
select
  w.id,
  q.id,
  sc.first_name,
  sc.last_name,
  null,
  true
from seed_campers sc
join public.wards w
  on w.name = sc.unit_name
join public.quorums q
  on q.ward_id = w.id
 and q.quorum_type = 'deacons'
where not exists (
  select 1
  from public.participants p
  where p.ward_id = w.id
    and lower(p.first_name) = lower(sc.first_name)
    and lower(p.last_name) = lower(sc.last_name)
);

with seed_activities (title, description, category, starts_at, location) as (
  values
    ('Archery', 'Basic & intermediate archery instruction', 'Sport', '2026-06-15 09:00:00-06'::timestamptz, 'Range A'),
    ('Kayaking', 'Guided kayak tour around the lake', 'Water', '2026-06-15 14:00:00-06'::timestamptz, 'Lake'),
    ('Campfire Program', 'Opening night devotional & skits', 'Spiritual', '2026-06-15 20:00:00-06'::timestamptz, 'Fire Pit'),
    ('Mountain Biking', '6-mile loop on intermediate trails', 'Sport', '2026-06-16 09:00:00-06'::timestamptz, 'Trail Head'),
    ('Cooking Challenge', 'Unit dutch oven cook-off', 'Competition', '2026-06-16 16:00:00-06'::timestamptz, 'Pavilion'),
    ('Fishing', 'Early morning catch-and-release', 'Water', '2026-06-17 06:00:00-06'::timestamptz, 'Lake Dock'),
    ('Rappelling', '50ft rappel with certified instructors', 'Adventure', '2026-06-17 10:00:00-06'::timestamptz, 'Cliff Face'),
    ('Service Project', 'Trail maintenance & cleanup', 'Service', '2026-06-18 09:00:00-06'::timestamptz, 'Trailhead'),
    ('Ultimate Frisbee', 'Unit vs unit tournament', 'Competition', '2026-06-18 15:00:00-06'::timestamptz, 'Field B'),
    ('Closing Ceremony', 'Awards, testimonies, & farewell', 'Spiritual', '2026-06-19 10:00:00-06'::timestamptz, 'Amphitheater')
)
insert into public.activities (
  title,
  description,
  category,
  starts_at,
  location
)
select
  sa.title,
  sa.description,
  sa.category,
  sa.starts_at,
  sa.location
from seed_activities sa
where not exists (
  select 1
  from public.activities a
  where a.title = sa.title
    and a.starts_at = sa.starts_at
);

with seed_agenda (agenda_date, time_slot, title, location) as (
  values
    ('2026-06-15'::date, '7:00 AM', 'Wake Up & Personal Study', 'Campsites'),
    ('2026-06-15'::date, '7:30 AM', 'Breakfast', 'Pavilion'),
    ('2026-06-15'::date, '8:30 AM', 'Flag Ceremony', 'Flagpole'),
    ('2026-06-15'::date, '9:00 AM', 'Archery', 'Range A'),
    ('2026-06-15'::date, '12:00 PM', 'Lunch', 'Pavilion'),
    ('2026-06-15'::date, '2:00 PM', 'Kayaking', 'Lake'),
    ('2026-06-15'::date, '5:30 PM', 'Dinner', 'Pavilion'),
    ('2026-06-15'::date, '8:00 PM', 'Campfire Program', 'Fire Pit'),
    ('2026-06-16'::date, '7:00 AM', 'Wake Up', 'Campsites'),
    ('2026-06-16'::date, '7:30 AM', 'Breakfast', 'Pavilion'),
    ('2026-06-16'::date, '9:00 AM', 'Mountain Biking', 'Trail Head'),
    ('2026-06-16'::date, '12:00 PM', 'Lunch', 'Pavilion'),
    ('2026-06-16'::date, '4:00 PM', 'Cooking Challenge', 'Pavilion'),
    ('2026-06-16'::date, '8:00 PM', 'Night Games', 'Field A')
)
insert into public.daily_agenda_items (
  agenda_date,
  time_slot,
  title,
  location
)
select
  sa.agenda_date,
  sa.time_slot,
  sa.title,
  sa.location
from seed_agenda sa
where not exists (
  select 1
  from public.daily_agenda_items dai
  where dai.agenda_date = sa.agenda_date
    and dai.time_slot = sa.time_slot
    and dai.title = sa.title
);

with seed_messages (message_date, title, scripture, message) as (
  values
    ('2026-06-15'::date, 'Courage', 'Joshua 1:9', 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.'),
    ('2026-06-16'::date, 'Service', 'Mosiah 2:17', 'When ye are in the service of your fellow beings ye are only in the service of your God.'),
    ('2026-06-17'::date, 'Faith', 'Matthew 17:20', 'If ye have faith as a grain of mustard seed... nothing shall be impossible unto you.'),
    ('2026-06-18'::date, 'Brotherhood', 'Proverbs 17:17', 'A friend loveth at all times, and a brother is born for adversity.'),
    ('2026-06-19'::date, 'Perseverance', 'Hebrews 12:1', 'Let us run with patience the race that is set before us.')
)
insert into public.daily_messages (
  message_date,
  title,
  scripture,
  message
)
select
  sm.message_date,
  sm.title,
  sm.scripture,
  sm.message
from seed_messages sm
on conflict (message_date) do update
set
  title = excluded.title,
  scripture = excluded.scripture,
  message = excluded.message;

with seed_competitions (name, rules, competition_date, status) as (
  values
    ('Cooking Challenge', 'Best dutch oven dish wins. Judged on taste, presentation, creativity.', '2026-06-16'::date, 'completed'::public.competition_status_enum),
    ('Ultimate Frisbee', 'Round-robin tournament. 15 points to win.', '2026-06-18'::date, 'active'::public.competition_status_enum),
    ('Camp Clean-Up', 'Daily inspection. Points for cleanliness & organization.', '2026-06-16'::date, 'active'::public.competition_status_enum),
    -- Keep seed row at planned to avoid using a newly-added enum value
    -- in the same migration transaction (Postgres 55P04 behavior).
    ('Archery Tournament', '3 rounds, 5 arrows each. Top 3 per unit score.', '2026-06-19'::date, 'planned'::public.competition_status_enum)
)
insert into public.competitions (
  name,
  rules,
  competition_date,
  status
)
select
  sc.name,
  sc.rules,
  sc.competition_date,
  sc.status
from seed_competitions sc
where not exists (
  select 1
  from public.competitions c
  where c.name = sc.name
);

with seed_points (
  competition_name,
  unit_name,
  points,
  reason,
  awarded_by_name,
  awarded_at
) as (
  values
    ('Cooking Challenge', 'Timberline', 50, '1st place — incredible dutch oven peach cobbler', 'Bro. Harris', '2026-06-16 16:55:00-06'::timestamptz),
    ('Cooking Challenge', 'Summit', 35, '3rd place — solid chili recipe', 'Bro. Harris', '2026-06-16 16:56:00-06'::timestamptz),
    ('Cooking Challenge', 'Trailblazers', 45, '2nd place — creative foil dinners', 'Bro. Harris', '2026-06-16 16:57:00-06'::timestamptz),
    ('Cooking Challenge', 'Ridgeline', 40, 'Good effort, great teamwork', 'Bro. Harris', '2026-06-16 16:58:00-06'::timestamptz),
    ('Ultimate Frisbee', 'Timberline', 30, 'Won vs Ridgeline 15-12', 'Pres. Anderson', '2026-06-17 15:45:00-06'::timestamptz),
    ('Ultimate Frisbee', 'Summit', 45, 'Won both round-robin games', 'Pres. Anderson', '2026-06-17 16:30:00-06'::timestamptz),
    ('Ultimate Frisbee', 'Trailblazers', 25, 'Lost both but great sportsmanship', 'Pres. Anderson', '2026-06-17 16:31:00-06'::timestamptz),
    ('Ultimate Frisbee', 'Ridgeline', 35, 'Split games 1-1', 'Pres. Anderson', '2026-06-17 16:32:00-06'::timestamptz),
    ('Camp Clean-Up', 'Timberline', 40, 'Morning inspection — very clean', 'Bro. Palmer', '2026-06-16 08:30:00-06'::timestamptz),
    ('Camp Clean-Up', 'Summit', 30, 'Some gear left out', 'Bro. Palmer', '2026-06-16 08:32:00-06'::timestamptz),
    ('Camp Clean-Up', 'Trailblazers', 50, 'Cleanest campsite all week!', 'Bro. Palmer', '2026-06-16 08:34:00-06'::timestamptz),
    ('Camp Clean-Up', 'Ridgeline', 35, 'Good but trash not fully collected', 'Bro. Palmer', '2026-06-16 08:36:00-06'::timestamptz),
    ('Camp Clean-Up', 'Trailblazers', -5, 'Deduction — left campfire unattended', 'Bro. Harris', '2026-06-16 21:15:00-06'::timestamptz)
)
insert into public.competition_points (
  competition_id,
  ward_id,
  points,
  reason,
  awarded_by_name,
  awarded_at
)
select
  c.id,
  w.id,
  sp.points,
  sp.reason,
  sp.awarded_by_name,
  sp.awarded_at
from seed_points sp
join public.competitions c
  on c.name = sp.competition_name
join public.wards w
  on w.name = sp.unit_name
where not exists (
  select 1
  from public.competition_points cp
  where cp.competition_id = c.id
    and cp.ward_id = w.id
    and cp.points = sp.points
    and coalesce(cp.reason, '') = coalesce(sp.reason, '')
    and coalesce(cp.awarded_by_name, '') = coalesce(sp.awarded_by_name, '')
    and cp.awarded_at = sp.awarded_at
);

with seed_registrations (
  parent_name,
  parent_email,
  parent_phone,
  child_first_name,
  child_last_name,
  child_age,
  shirt_size_preference,
  preferred_unit_name,
  medical_notes,
  status
) as (
  values
    ('Sarah M.', 'sarah.m@email.com', '(801) 555-1234', 'Ethan', 'M.', 14, 'M', 'Timberline', 'None', 'approved'::public.parent_registration_status_enum),
    ('Mark K.', 'mark.k@email.com', '(801) 555-2345', 'Owen', 'K.', 13, 'S', 'Summit', 'Peanut allergy', 'approved'::public.parent_registration_status_enum),
    ('Lisa B.', 'lisa.b@email.com', '(801) 555-3456', 'Tyler', 'B.', 12, 'M', null, 'None', 'pending'::public.parent_registration_status_enum),
    ('Dan P.', 'dan.p@email.com', '(801) 555-4567', 'Josh', 'P.', 15, 'L', null, 'Asthma — carries inhaler', 'waitlisted'::public.parent_registration_status_enum)
)
insert into public.parent_registrations (
  parent_name,
  parent_email,
  parent_phone,
  child_first_name,
  child_last_name,
  child_age,
  preferred_unit_name,
  ward_id,
  shirt_size_preference,
  shirt_size_code,
  medical_notes,
  status
)
select
  sr.parent_name,
  sr.parent_email,
  sr.parent_phone,
  sr.child_first_name,
  sr.child_last_name,
  sr.child_age,
  sr.preferred_unit_name,
  w.id,
  sr.shirt_size_preference,
  case upper(coalesce(sr.shirt_size_preference, ''))
    when 'YS' then 'YS'
    when 'YM' then 'YM'
    when 'YL' then 'YL'
    when 'S' then 'AS'
    when 'M' then 'AM'
    when 'L' then 'AL'
    when 'XL' then 'AXL'
    when '2XL' then 'A2XL'
    when '3XL' then 'A3XL'
    else null
  end,
  sr.medical_notes,
  sr.status
from seed_registrations sr
left join public.wards w
  on w.name = sr.preferred_unit_name
where not exists (
  select 1
  from public.parent_registrations pr
  where lower(pr.parent_email) = lower(sr.parent_email)
    and lower(pr.child_first_name) = lower(sr.child_first_name)
    and lower(pr.child_last_name) = lower(sr.child_last_name)
);

with seed_contacts (
  full_name,
  role_title,
  phone,
  email,
  is_emergency,
  notes
) as (
  values
    ('Pres. Anderson', 'Stake YM President', '(801) 555-0101', 'anderson@email.com', false, null),
    ('Bro. Harris', 'Camp Director', '(801) 555-0102', 'harris@email.com', false, null),
    ('Bishop Clark', 'Medical Lead', '(801) 555-0103', 'clark@email.com', false, null),
    ('Emergency Services', '911', '911', null, true, null),
    ('Poison Control', 'National', '(800) 222-1222', null, true, null),
    ('Nearest Hospital', 'Mountain View Hospital', '(801) 555-0200', null, true, null)
)
insert into public.contacts (
  full_name,
  role_title,
  phone,
  email,
  is_emergency,
  notes
)
select
  sc.full_name,
  sc.role_title,
  sc.phone,
  sc.email,
  sc.is_emergency,
  sc.notes
from seed_contacts sc
where not exists (
  select 1
  from public.contacts c
  where c.full_name = sc.full_name
    and coalesce(c.phone, '') = coalesce(sc.phone, '')
    and c.is_emergency = sc.is_emergency
);

insert into public.stake_leaders (
  full_name,
  calling,
  email,
  display_order
)
values
  ('Pres. Anderson', 'Stake YM President', 'anderson@email.com', 10),
  ('Bro. Harris', 'Camp Director', 'harris@email.com', 20),
  ('Bro. Palmer', '1st Counselor', 'palmer@email.com', 30),
  ('Bro. Mitchell', '2nd Counselor', 'mitchell@email.com', 40),
  ('Bro. Stevens', 'Secretary', 'stevens@email.com', 50)
on conflict (email) do update
set
  full_name = excluded.full_name,
  calling = excluded.calling,
  display_order = excluded.display_order;

with latest_rules as (
  select id
  from public.camp_rules_documents
  order by updated_at desc
  limit 1
)
update public.camp_rules_documents
set
  title = 'Camp Rules',
  content = E'1. Follow all safety instructions from leaders at all times.\n2. No electronics or phones during activities (phones allowed in cabins only).\n3. Buddy system — never go anywhere alone.\n4. Lights out at 10:30 PM. Quiet hours until 6:30 AM.\n5. Respect nature. Leave no trace. Pack it in, pack it out.\n6. Be kind. No bullying, hazing, or exclusion of any kind.\n7. Wear closed-toe shoes during all outdoor activities.\n8. Stay within camp boundaries unless accompanied by an adult leader.\n9. Report any injury, illness, or concern to a leader immediately.\n10. Have the best week of your summer!'
where id in (select id from latest_rules);

insert into public.camp_rules_documents (title, content)
select
  'Camp Rules',
  E'1. Follow all safety instructions from leaders at all times.\n2. No electronics or phones during activities (phones allowed in cabins only).\n3. Buddy system — never go anywhere alone.\n4. Lights out at 10:30 PM. Quiet hours until 6:30 AM.\n5. Respect nature. Leave no trace. Pack it in, pack it out.\n6. Be kind. No bullying, hazing, or exclusion of any kind.\n7. Wear closed-toe shoes during all outdoor activities.\n8. Stay within camp boundaries unless accompanied by an adult leader.\n9. Report any injury, illness, or concern to a leader immediately.\n10. Have the best week of your summer!'
where not exists (
  select 1
  from public.camp_rules_documents
);

with seed_docs (title, content) as (
  values
    (
      'Permissions System',
      E'Stake Leader: Full edit — create units, delete anything, manage all data.\nUnit Leader: Can add campers to their unit, edit within scope.\nStaff: Can award competition points.\nCamper: View only — no create/edit/delete.'
    ),
    (
      'Point System',
      E'Any leader can award or deduct points (±100 max per entry). Each award tracks who, when, and why. Deductions are flagged for transparency. View full history by expanding any competition.'
    )
)
insert into public.documentation_pages (title, content)
select
  sd.title,
  sd.content
from seed_docs sd
where not exists (
  select 1
  from public.documentation_pages dp
  where dp.title = sd.title
);
