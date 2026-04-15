# Supabase -> Google Sheets Sync

This app should keep Supabase as the source of truth and push reporting data to Google Sheets.

## Recommended architecture

- Store all participant, registration, and shirt-size data in Supabase.
- Use one-way sync (`Supabase -> Google Sheets`) for early phases.
- Generate shirt-order data from `v_shirt_order_counts` and follow-up lists from `v_missing_shirt_sizes`.

## Option A (recommended): pull from Supabase on schedule

Use Google Apps Script to fetch from Supabase REST and overwrite report tabs.

Pros:
- Simple to reason about
- Easy retries
- No webhook endpoint to secure

Cons:
- Not real-time (typically every 5-15 minutes)

### Apps Script high-level steps

1. Create a Google Sheet with tabs:
   - `Shirt Order Counts`
   - `Missing Shirt Sizes`
2. Open `Extensions -> Apps Script`.
3. Add a script that:
   - Calls Supabase REST endpoints for each view.
   - Clears and rewrites each tab.
4. Store keys using Apps Script project properties.
5. Create a time-based trigger (for example every 15 minutes).

## Option B: Supabase webhook -> Apps Script doPost

Use database webhooks on `participants` and `registrations` to post changes to a Google Apps Script web app URL.

Pros:
- Near real-time updates

Cons:
- More moving parts
- Must verify webhook signature/token

## Security checklist

- Never put `service_role` keys in frontend code.
- Prefer `anon` key for read-only view fetches with RLS.
- If a backend job needs elevated access, store service key server-side only.
- Add a shared secret (`SUPABASE_WEBHOOK_SECRET`) for webhook validation.

## Suggested sync payload shape (for shirt totals)

```json
{
  "camp_event_id": "uuid",
  "camp_name": "2026 Young Men Camp",
  "ward_name": "Maple Ward",
  "shirt_size_code": "AM",
  "shirt_size_label": "Adult Medium",
  "total": 12
}
```

## Suggested sheet columns

### Shirt Order Counts

- `camp_name`
- `ward_name`
- `shirt_size_code`
- `shirt_size_label`
- `total`
- `last_synced_at`

### Missing Shirt Sizes

- `camp_name`
- `ward_name`
- `participant_id`
- `first_name`
- `last_name`
- `quorum_type`
- `status`
- `last_synced_at`
