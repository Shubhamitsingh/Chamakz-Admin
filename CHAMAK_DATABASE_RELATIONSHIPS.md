# Proposed Chamak relationships

Status: **proposal only**. Not created in Supabase. Project `senmhtoihjfpvcwdybve` had an empty public schema when this was checked.

```text
admin_roles 1──* admin_users
admin_roles 1──* admin_role_grants
admin_users 1──* admin_audit_logs
admin_users 1──* app_config_revisions

profiles 1──1 user_diamond_wallets
profiles 1──1 host_earning_wallets
profiles 1──* host_applications
profiles 1──* profile_notes
profiles 1──* profile_devices
profiles 1──* kyc_documents
profiles 1──* diamond_ledger_entries
profiles 1──* payment_orders
profiles 1──* payout_methods
profiles 1──* withdrawals
profiles 1──* live_sessions
profiles 1──* tickets
profiles 1──* complaints
profiles 1──* feedback

gifts 1──* gift_transfers
profiles 1──* gift_transfers   (as sender_id)
profiles 1──* gift_transfers   (as host_id)
live_sessions 1──* gift_transfers

payout_methods 1──* withdrawals

diamond_sellers 1──* seller_orders
diamond_sellers 1──* seller_payouts
seller_orders *──1 diamond_ledger_entries   (by reference_id, not a second balance)

payment_orders 1──* diamond_ledger_entries  (reference)
gift_transfers 1──* diamond_ledger_entries  (one debit, one host credit)

app_config_documents 1──* app_config_revisions
```

There is no `hosts` table and no `host_app` table. Host facts sit on `profiles` plus `host_applications` and `host_earning_wallets`.

There is no second gift price table. Catalog rows are `gifts`. Movements are `gift_transfers`.

There is no second user-wallet table for sellers. Seller transfers, purchases, admin adjustments, and gifts all post to `diamond_ledger_entries` and update `user_diamond_wallets` or `host_earning_wallets` in the same function. This stays one wallet only if seller diamonds are confirmed to be the same product as purchased diamonds.

`video_call_sessions` is omitted until calls exist in the product. When added, it points at `profiles` twice (caller and host) and at two ledger entries.

Geography and the leaderboard are queries or a later snapshot job. They are not parent tables.
