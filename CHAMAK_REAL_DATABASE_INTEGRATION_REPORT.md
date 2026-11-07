# Chamak real database integration report

Date: 7 November 2026. Project: `senmhtoihjfpvcwdybve` (`https://senmhtoihjfpvcwdybve.supabase.co`).

The admin panel was not connected to Supabase before this work. The public schema was empty. This pass created the tables and started replacing mock reads. It is not a finished integration. Pages are not marked complete unless noted as tested.

## Tables inspected before this change

The public schema had no application tables. Auth had 0 users. Storage had 0 buckets. No existing application table was dropped or overwritten.

## Tables created

All of these have Row Level Security enabled. An active row in `admin_users` is required to read or write them. The publishable key is the only key in the admin app. The service-role key is not in the frontend.

| Table | What it is for | Client writes |
| --- | --- | --- |
| admin_roles | Staff roles. Five roles were inserted. | Read for an admin |
| admin_role_grants | Super Admin category keys | Read for an admin |
| admin_users | Which auth user is an admin | No row exists yet |
| profiles | One person in the Chamak app | Allowed for an admin. No rows |
| profile_notes | Admin notes | Allowed for an admin |
| host_applications | Host approval queue | Allowed for an admin |
| user_diamond_wallets | User diamond balance | Allowed for an admin. Balance must not be typed as profit |
| host_earning_wallets | Host earning balance, separate from the user wallet | Allowed for an admin |
| diamond_ledger_entries | Append-only diamond movements | Read only from the browser |
| gifts | Gift catalog | Allowed for an admin. The catalog page now reads this table |
| gift_transfers | Gifts that moved diamonds. They do not mint diamonds | Read only from the browser |
| payment_orders | INR purchases | Read only from the browser. A successful payment is not something the admin page can mark by itself |
| payout_methods | Bank verification | Allowed for an admin |
| withdrawals | Host payout requests | Allowed for an admin |
| diamond_sellers, seller_orders, seller_payouts | Diamond seller records | Allowed for an admin |
| live_sessions | Live rooms | Allowed for an admin |
| tickets, ticket_messages | Support tickets | Allowed for an admin |
| complaints | Reports | Allowed for an admin |
| feedback | Feedback | Allowed for an admin |
| conversations, messages | Chats | Allowed for an admin |
| banners, events, announcements | Marketing and team broadcasts | Allowed for an admin |
| app_config_documents | Published settings. Video, withdrawal, and diamond defaults were inserted from the existing control screen | Allowed for an admin |
| app_config_revisions | Setting history | Allowed for an admin |
| admin_audit_logs | Sensitive action log | Insert and read only |

No audio-call table was created. There is no call-history page in the admin, so no call table was created. No fake users, gifts, payments, or live rooms were inserted.

## Migration

The SQL is in `supabase/migrations/20261107180000_chamak_admin_schema.sql`. The tables were created on the remote database from that SQL. A placeholder migration named `chamak_admin_schema` was also recorded by the migration tool before the full SQL ran. The tables themselves are the ones listed above.

## What the admin now does

- `@supabase/supabase-js` is installed.
- `src/lib/supabase.js` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`. That file is gitignored.
- Login calls Supabase Auth. A password that is not a real Supabase user is rejected. After a successful password, the account must also be an active `admin_users` row. There is no such user yet, so nobody can open the data.
- User Management, Host Applications, tickets, complaints, feedback, chats, withdrawals, events, sellers, team broadcasts, the gift catalog list, the dashboard user metrics, and the economy totals read the live store. That store is filled from Supabase after login. Until then, and when the tables are empty, those lists are empty. They no longer use the sample people as the list source.
- Economy math still uses the existing formulas. With no payments or gifts, the totals are zero. Unspent diamonds are not treated as revenue because there are no gifted rows.

## What is not finished

These still are not a tested read-and-write path:

- Creating or editing a user, host application, ticket, complaint, gift, banner, event, seller, or withdrawal still runs the old local functions. A success message from those buttons is not a database save.
- Banners, live rooms, leaderboard, geography, and the diamond marketplace still read the old Firebase-shaped mock store.
- Control Center publish still updates the page state. It does not yet write `app_config_documents`.
- Wallet adjustments from the economy screens do not insert ledger rows.
- The old sample arrays are still in the utility files. The switched list functions do not return them. They should be deleted after each write path is tested.
- The dev server must be restarted so it loads `.env.local`.

## Security

- RLS is on for every new public table.
- Anonymous access to those tables was revoked.
- Ledger, gift transfers, and payment orders cannot be updated from the browser.
- Advisor warning: `public.set_updated_at` originally had a mutable search path. It was recreated with `search_path = public`.
- There is no admin user, so the policies have not been exercised from the website.

## How to sign in and check

1. Restart `npm run dev`.
2. In the Supabase dashboard, Authentication, create one user.
3. Copy that user's id.
4. In the SQL editor, insert an `admin_users` row with that id, the Super Admin `role_id`, the same email, and status `active`.
5. Sign in on the admin login page with that email and password.
6. Open User Management. It should say there are no users, and Table Editor should show the same empty `profiles` table.
7. Refresh the page. It should still be empty. That is the correct result. Do not add sample people to make it look full.

## Unresolved rules

These were not guessed into extra tables:

- Whether seller diamonds use the same user wallet as purchased diamonds.
- Whether Control Center is the only rate editor.
- Whether the bank page and the economy payout page are one withdrawal flow.
- Whether a coin-campaign event may credit diamonds.
- Audio calls stay out of the schema.
