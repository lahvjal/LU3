-- Store ward leader contact as phone instead of email
alter table public.wards
  rename column leader_email to leader_phone;

notify pgrst, 'reload schema';
