-- Track pending transfer acknowledgment by the new parent.
-- Non-null means the young man was recently moved to this account and the
-- new parent has not yet acknowledged responsibility by setting a new passcode.
-- Cleared to null when the parent calls acknowledgeYoungManTransferAction.
alter table public.young_men
  add column transferred_at timestamptz;
