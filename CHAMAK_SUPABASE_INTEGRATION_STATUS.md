# Chamak Supabase integration status

Date: 7 Nov 2026. This file records what was inspected and what is actually connected. A screen is not marked integrated until it reads and writes this database and survives a refresh.

## Project

| Item | Result |
| --- | --- |
| Admin app | Vite 5, React 18, React Router 6, Tailwind, Recharts, Lucide. JavaScript, not TypeScript. |
| Supabase client in the repo | None. No `@supabase/supabase-js` dependency. No `VITE_SUPABASE` variable. |
| `supabase/migrations` | Does not exist yet. |
| Remote API URL | `https://senmhtoihjfpvcwdybve.supabase.co` |
| MCP project | `senmhtoihjfpvcwdybve` in Cursor `mcp.json` |
| Edge functions | None. |
| Development branches | None. |
| Database access | Connected after sign-in. |
| Existing public tables | None. |
| Applied migrations | None. |
| Objects to preserve | No application tables yet. Supabase system schemas (`auth`, `storage`, and the rest) stay untouched. |

No table was created. No mock page was switched to Supabase. The admin still runs on in-browser mock data.

## What the admin actually stores today

These stores do not share balances. They must not become separate Supabase copies of the same person or the same diamond.

| Store | Used by | Fate |
| --- | --- | --- |
| `src/utils/userManagementData.js` | Users, profile, analytics | Becomes `profiles` |
| `src/utils/mockData.js` via the Firebase shim | Marketplace, gift catalog, some Firebase-shaped pages | Same `profiles`, `gifts`, `banners`, `live_sessions` |
| `src/economy/data.js` | Finance pages and the dashboard revenue card | Ledger, payments, gift transfers, withdrawals |
| `src/utils/withdrawalData.js` | Bank transactions | Same `withdrawals` plus `payout_methods` |
| `src/utils/diamondLedger.js` | Diamond Marketplace | Same diamond ledger, not a second wallet |
| `src/control/` | Control Center | `app_config_documents` |
| `src/utils/ticketsData.js`, `complaintsData.js`, `feedbackData.js`, `chatsData.js`, `eventsData.js`, `teamBroadcastsData.js`, `hostApplicationsData.js`, `diamondSellersData.js` | Those menus | Their own tables, after profiles exist |

Firebase is still aliased to shims unless `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` are set (`vite.config.js`). Supabase should replace those reads. Do not keep both as sources of truth.

## Module status

| Module | Database | Admin wired | Tested |
| --- | --- | --- | --- |
| Dashboard | No | No | No |
| User Management and profile | No | No | No |
| Host Applications | No | No | No |
| Live rooms | No | No | No |
| Chats | No | No | No |
| Gift catalog | No | No | No |
| Diamond Sellers and Marketplace | No | No | No |
| Wallet and Diamond Economy | No | No | No |
| Bank transactions and host payouts | No | No | No |
| Leaderboard and Geography | No | No | No |
| Tickets, Complaints, Feedback | No | No | No |
| Banners and Events | No | No | No |
| Control Center | No | No | No |
| Team accounts | No | No | No |
| Admin preferences | Browser `localStorage` only | No | No |

## Connection

The first lookup used a different Supabase project and that database rejected the `postgres` password. Cursor is now signed in to `senmhtoihjfpvcwdybve`. That public schema is empty, so the first migration will be additive and will not drop existing application data.

## Integration order after access is restored

1. Read the live schema. Stop if it conflicts with the proposal.
2. Add `supabase/migrations` and apply only additive SQL.
3. Staff auth and `admin_users` / roles. The browser gets the publishable key only. No service-role key in Vite.
4. `profiles` and the two wallets. Point User Management at them. Refresh test.
5. Published app config. Point Control Center at it. Old gift and payment rows keep their own rate snapshots.
6. Gift catalog, then purchases and the ledger.
7. Gift transfers.
8. Host applications.
9. One withdrawal table that includes bank verification.
10. Sellers posting into the same ledger.
11. Live sessions.
12. Support, marketing, and announcements.
13. Dashboard and reports as queries on those tables.

Video call history is not a page today. Do not add a call-billing table until the phone actually places calls. Audio call pricing is not in the admin.

## Still needs a product decision

These are copied from the blueprint. They are not guessed into extra tables.

1. Seller diamonds and purchased diamonds: one user wallet, or two products?
2. Is Control Center the only editor for rates?
3. One withdrawal pipeline for the bank page and the economy payout page?
4. Dashboard “still to pay”: host share minus paid, or minus open requests as well?
5. Can a coin-campaign event credit diamonds?
6. Is Team accounts a staff list, a broadcast tool, or both? The code is broadcasts.
7. Should seller UPI be stored?
8. Do audio calls stay removed?
9. Are user-wallet and host-earning freezes separate flags?
10. Which public id does the phone use?
11. Can a gift be sent outside a live room?
12. Which staff role may approve a withdrawal?
