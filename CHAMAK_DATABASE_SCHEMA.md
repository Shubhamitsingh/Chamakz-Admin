# Proposed Chamak database schema

Status: **proposal only**. Not applied. On 7 Nov 2026 the project `senmhtoihjfpvcwdybve` (`https://senmhtoihjfpvcwdybve.supabase.co`) had no public tables and no migrations.

The admin is JavaScript. TypeScript database types are not generated until a schema exists and the connection works.

Rules already in the admin code:

- One Chamak app. A host is a profile with host status, not a second app.
- User diamond wallet and host earning wallet are never added together.
- A successful purchase mints diamonds: `INR × diamonds per ₹1` (default 10).
- A gift does not mint diamonds. It debits the sender and credits the host, and stores the rate and share from that moment.
- Host share and platform share must add to 100. Default 50/50. Gift valuation default ₹0.1 per diamond.
- Refunds reverse unused issued diamonds only. A refund that would go below zero is not applied.
- Withdrawals move INR entitlement, not user-wallet diamonds.
- Audio call settings are not part of the product.
- Seller commission in the current seller screen is 5% seller / 95% company. Whether that credits the same user wallet is still undecided.
- Completed financial rows are not edited. Corrections are new ledger rows.

Every business table gets `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()` unless it is append-only. Append-only tables have `created_at` only.

## Identity

### profiles

One row per phone-app account.

| Column | Type | Rules |
| --- | --- | --- |
| id | uuid | Primary key. |
| numeric_id | text | Unique. |
| username | citext or text | Unique, case-insensitive. |
| display_name | text | |
| email | text | Nullable. |
| phone | text | Unique when present. |
| gender | text | |
| dob | date | |
| country, state, city | text | |
| is_host | boolean | Default false. |
| host_status | text | none, pending, approved, rejected, suspended. |
| vip | boolean | |
| status | text | active, inactive, suspended, blocked. |
| verification | text | none, pending, verified, rejected. |
| agency_name | text | Nullable. |
| has_photo | boolean | |
| email_verified | boolean | |
| location_granted | boolean | |
| interests | text[] | |
| dating_complete | boolean | |
| signup_source | text | |
| platform | text | |
| app_version | text | |
| last_login_at, last_active_at | timestamptz | |
| reported | boolean | Denormalized. Reports are the source. |
| created_at, updated_at | timestamptz | |

Indexes: unique `numeric_id`, unique lower(`username`), unique `phone`, `(status)`, `(is_host, host_status)`.

### host_applications

| Column | Type |
| --- | --- |
| id | uuid primary key |
| profile_id | uuid → profiles |
| category | text |
| pitch | text |
| experience | text |
| status | text: pending, approved, rejected |
| review_note | text |
| reviewed_by | uuid → admin_users, nullable |
| reviewed_at | timestamptz |

Approval updates `profiles.is_host` and `profiles.host_status` in the same transaction.

### admin_users, admin_roles, admin_role_grants

Staff are not `profiles`.

- `admin_roles`: id, name. Seed: Super Admin, Finance Admin, Operations Admin, Support Admin, Moderator.
- `admin_users`: id, email unique, display_name, role_id, status, last_login_at.
- `admin_role_grants`: role_id, category_key. Matches the Control Center matrix in `src/control/schema.js`.

The password lives in Supabase Auth, not in a column.

### profile_notes, profile_devices, kyc_documents

Notes: id, profile_id, admin_id, body, created_at.

Devices: id, profile_id, platform, app_version, last_seen_at.

KYC: id, profile_id, kind, storage_path, status, reviewed_by, reviewed_at. Files stay in private storage.

## Money

### user_diamond_wallets

`profile_id` primary key → profiles. `available integer not null default 0`. `status text` active or frozen. The client cannot set `available`.

### host_earning_wallets

`profile_id` primary key → profiles. `diamonds_received integer`. `host_inr_accrued numeric(14,2)`. `status text` active or frozen. Created when the profile becomes a host, or as an empty row. Not spendable as user diamonds.

### diamond_ledger_entries

Append-only. Rebuilds both balances.

| Column | Type |
| --- | --- |
| id | uuid primary key |
| profile_id | uuid → profiles |
| wallet_kind | text: user, host_earning |
| entry_type | text: purchase_credit, refund_debit, admin_credit, admin_debit, gift_debit, gift_credit, seller_transfer_credit, seller_transfer_debit, reversal |
| diamonds | integer | Signed. |
| inr_amount | numeric(14,2) | Nullable. |
| rate_snapshot | numeric(12,4) | Nullable. |
| reference_table | text | |
| reference_id | uuid | |
| idempotency_key | text | Unique. |
| admin_id | uuid | Nullable. |
| reason | text | |
| created_at | timestamptz | |

Index `(profile_id, created_at)`.

### gifts

Catalog. id, name, description, category, cost_diamonds integer, image_path, priority, is_active. This is the only gift price list. The economy seed prices are not a second catalog.

### gift_transfers

id, gift_id → gifts, sender_id → profiles, host_id → profiles, live_session_id nullable, diamonds, valuation_rate, host_share_pct, platform_share_pct, gross_inr, host_inr, platform_inr, status, idempotency_key unique, created_at.

### payment_orders

id, profile_id, inr numeric(14,2), diamonds_issued integer, rate_snapshot, gateway, method, status (pending, success, failed, refunded), gateway_payment_id unique when present, created_at, paid_at. Written by a server webhook, not by the browser.

### payment_gateway_config

id, provider, environment, merchant_id, public_key, secret_vault_id, webhook_vault_id, currency, methods, min_inr, max_inr, enabled. No raw secret column.

### payout_methods

id, profile_id, holder_name, account_last4, account_vault_id, ifsc, bank_name, branch, account_type, verification_status (not_submitted, pending, verified, rejected, update_requested), document_path, submitted_at, reviewed_by.

### withdrawals

One table for Bank transactions and Host payout requests.

id, profile_id, amount_inr numeric(14,2), status (pending, under_review, on_hold, approved, rejected, processing, paid), payout_method_id, utr, rejection_reason, idempotency_key unique, requested_at, reviewed_at, paid_at, reviewed_by.

Non-rejected amounts for a host cannot exceed `host_inr_accrued`. Approval requires a verified payout method, matching the current bank screen.

### diamond_sellers, seller_orders, seller_payouts

Sellers: id, name, whatsapp, status (active, inactive), commission_pct numeric default 5.

Orders and payouts keep the statuses already on the sellers page. A completed transfer also inserts ledger rows. UPI is omitted until the product confirms it.

## Operations

### live_sessions

id, host_id → profiles, title, status (live, ended), started_at, ended_at, peak_viewers, playback_url nullable. No stream key column readable by the admin browser. Do not invent viewer counts.

### video_call_sessions

Not created yet. The admin only has a billing preview. Add this table when the phone places video calls: caller_id, host_id, rate_snapshot, started_at, ended_at, billed_seconds, diamonds_charged, host_diamonds, platform_diamonds, outcome, client_tx_id unique.

### tickets, ticket_messages, complaints, feedback, conversations, messages

Match the status lists already in the page helpers (`ticketsData.js`, `complaintsData.js`, `feedbackData.js`, `chatsData.js`). Each has `profile_id`. Ticket messages have `internal boolean`.

### banners, events, announcements

Banners: title, body, image_path, is_active, priority, action_type, action_target, starts_at, ends_at.

Events: kind, status, audience, priority, starts_at, ends_at, body. A “Coin campaign” does not credit diamonds unless that decision changes.

Announcements: the current Team accounts screen. title, body, audience, priority, status, image_path, published_at.

### app_config_documents and app_config_revisions

One current JSON document per Control Center category: calls, withdrawals, diamonds, payments, users, live, notifications, safety, features, app. Columns: category_key primary key, document jsonb, version integer, published_by, reason, updated_at.

Revisions: id, version, category_key, before jsonb, after jsonb, reason, admin_id, created_at. Rollback inserts a new revision. Secrets are not stored in the JSON document.

Demo ledger rates and Control Center must read these same two documents (`diamonds` and `withdrawals`) so the two screens stop diverging. Current defaults disagree (withdrawal minimum 100 in the economy seed and 500 in Control Center). The published document is the one the server uses for new events. Old events keep their snapshots.

### admin_audit_logs

id, admin_id, action, entity_table, entity_id, previous_value jsonb, new_value jsonb, reason, created_at. Insert-only for application roles.

## Row Level Security (to apply with the tables, not before the schema is confirmed)

- Phone users read their own profile, their own wallet balances, and their own transfers.
- Phone users read the published config, active gifts, and active banners.
- Phone users cannot update wallet balances or insert ledger rows.
- Staff read operational tables through a staff role check on `admin_users`.
- Only database functions insert ledger rows, payment success, gift transfers, and withdrawal status changes that move money.
- `admin_audit_logs` is insert-only.
- Payout account numbers and KYC files are not readable with the publishable key.

## Validation that belongs in the database function

- Gift cost comes from `gifts.cost_diamonds` at insert time.
- Sender user wallet is active and has enough diamonds.
- Host earning wallet is not frozen.
- Purchase credit happens only after the gateway webhook is verified.
- Idempotency keys reject a second gift, payment, or payout with the same key.
- Host share + platform share = 100 on publish.
- Minimum withdrawal ≤ maximum. Daily cap ≤ monthly cap.
- Admin credit is rejected when the published flag is off.
- Admin debit cannot exceed the user wallet.
