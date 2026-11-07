# Chamak Admin Panel — System Documentation and Database Blueprint

Status of this document: **inspection only**. No Supabase project, table, or connection was created. Existing mock data and screens were not changed.

Labels used below:

- **Existing** — a route, screen, or rule that is in this repository today.
- **Mock** — the screen works, but the data is generated in the browser and is lost on reload, or it lives in a local shim.
- **Planned** — the screen is written as the future control surface, but it does not yet change the phone app or a real database.
- **Recommended** — not in the product. Do not treat it as a current feature.
- **NEEDS CONFIRMATION** — the code does not decide this. Do not guess it into a table.

The phone app is a separate project. This file documents the admin panel in `Chamak-Admin` only.

---

## 1. Project overview

Chamak is a dating and live-streaming product. This admin panel is a Vite 5 + React 18 single-page app (`package.json` name `chamak-admin-dashboard`). Routing is React Router 6. Styling is Tailwind. Charts are Recharts. Icons are Lucide.

The admin is meant to become the place where staff manage people, money, live rooms, support, marketing, and app rules without editing the database by hand. **Today almost every number is sample data.**

There is **one Chamak user app**. A host is a person in that same app after approval. There is no second host application in this admin panel. `/control/hosts` redirects to `/control/users` (`src/App.jsx`). Host approval is the separate menu **Host Applications**.

Audio calls are **not configured**. Control Center copy says audio calls are not offered (`src/control/schema.js`, category `calls`). Video call rate defaults to **1,200 diamonds per minute**.

### What the browser actually runs

| Layer | Where | What it is |
| --- | --- | --- |
| Login | `src/firebase/shims/auth.js` when Firebase env is missing | Any non-empty email and password signs in as `mock-admin`. Session is `sessionStorage` key `chamakz.mock.auth`. |
| Firebase SDK | `vite.config.js` | If `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` are both set, the real Firebase SDK is used. Otherwise `firebase/app`, `auth`, `firestore`, and `storage` are aliased to `src/firebase/shims/`. |
| Firestore-shaped store | `src/utils/mockData.js` → `seedCollections()`, held by `src/firebase/shims/firestore.js` | In-memory collections. Writes from pages such as Gift catalog stay until reload. |
| User directory | `src/utils/userManagementData.js` | A second user list (24 people). Edits stay in a module variable until reload. |
| Diamond economy | `src/economy/data.js` + `EconomyContext.jsx` | A third user list (`CHK1001`…). Seed `20261107`. Reload resets it. |
| Bank payouts | `src/utils/withdrawalData.js` | A fourth host/money list, used by Bank transactions. |
| Diamond sellers | `src/utils/diamondSellersData.js` + `src/utils/diamondLedger.js` | Seller commission and a ledger that mutates `ucoin` on the Firestore-shaped users. |
| Control Center | `src/control/schema.js` + `ControlContext.jsx` | In-memory drafts. Not sent to the phone. Secrets are cleared after a mock publish. |
| Admin device prefs | `src/pages/Settings.jsx` | `localStorage` key `chamakzAdminSettings`. |

These stores **do not share balances**. The same display name can have different coin totals in different menus. A future database must use **one profile row** and **one pair of wallets**.

### Stack note for Supabase

Firebase client calls exist (`src/firebase/users.js`, `tickets.js`, `chats.js`, `events.js`, `feedback.js`, `supportChat.js`, `coinResellers.js`, Gift catalog, Live monitor). They talk to the shim unless real Firebase env vars are present. **Supabase is not imported.** The later integration should replace these reads and writes. Do not keep Firebase and Supabase as two sources of truth.

---

## 2. Menu hierarchy

Source: `src/layouts/Sidebar.jsx` and `src/App.jsx`. Labels below are the sidebar labels.

1. **Dashboard** — `/dashboard`
2. **User Management** — `/users`
   - All Users, New Registrations, Active Users, Inactive Users, Online Users, Verified Users, Pending Verification, VIP Users, Hosts, Viewers, Agency Users, Blocked / Suspended, Reported Users
   - User Analytics — `/users/analytics`
   - Profile (not in the menu) — `/users/profile/:userId`
3. **Host Applications** — `/host-applications`
4. **Live rooms** — `/live-streaming`
5. **Chats** — `/chats`
6. **Gift catalog** — `/gifts`
7. **Wallet & Diamond Economy**
   - Diamond Sellers — `/diamond-sellers`
   - Diamond Marketplace — `/diamond-marketplace`
   - Finance Overview — `/economy` (exact)
   - Diamond Purchases — `/economy/purchases`
   - User Wallets — `/economy/user-wallets`
   - Host Earning Wallets — `/economy/host-wallets`
   - Gift transfers — `/economy/gifts`
   - Earnings & Revenue Share — `/economy/revenue`
   - Diamond Circulation — `/economy/circulation`
   - Financial Reports — `/economy/reports`
   - Ledger audit — `/economy/audit`
   - Demo ledger rates — `/economy/settings`
8. **Finance & payouts**
   - Bank transactions — `/transactions`
   - Host payout requests — `/economy/withdrawals`
9. **Reports & rankings**
   - Leaderboard & Rankings — `/leaderboard`
   - Geography — `/geo-analytics`
10. **Support & moderation**
    - Tickets / Support — `/tickets`
    - Complaints — `/complaints`
    - Feedback — `/feedback`
11. **Marketing**
    - Banners — `/banners`
    - Events — `/events`
12. **Super Admin Control Center**
    - Control overview — `/control`
    - Video Call Pricing — `/control/calls`
    - Withdrawal rules — `/control/withdrawals`
    - App diamond rates — `/control/diamonds`
    - Payment Gateways — `/control/payments`
    - App accounts — `/control/users`
    - Live room rules — `/control/live`
    - Notifications — `/control/notifications`
    - Safety — `/control/safety`
    - Feature Flags — `/control/features`
    - App Settings — `/control/app`
    - Roles — `/control/roles`
    - Config History — `/control/history`
13. **Team accounts** — `/chamakz-team`
14. **Admin preferences** — `/settings`
15. Login (outside the sidebar) — `/login`

`/control/hosts` is not a page. It redirects to App accounts.

---

## 3. Product rules that the database must keep

### 3.1 One app, two wallets

A person has at most:

1. **User Diamond Wallet** — diamonds bought with INR, or adjusted by an admin. Spent on gifts and (in the call preview) video calls.
2. **Host Earning Wallet** — diamonds received as gifts, valued in INR by the rate that was current **at the time of the gift**. Withdrawn as INR. This is not the same balance as the user wallet.

A host can hold both. Never add them into one number.

### 3.2 How diamonds are created and moved

Implemented in `src/economy/data.js` and `src/economy/EconomyContext.jsx`. This is the economy the Finance screens and the dashboard revenue card use.

| Event | Diamonds created? | Effect |
| --- | --- | --- |
| Successful purchase | Yes | `diamonds = INR × diamonds per ₹1`. Default **10** diamonds per ₹1. |
| Pending or failed payment | No | `diamonds` stored as 0. |
| Refund | Reverses unused issued diamonds | If the user’s issued balance would go below zero, the refund row is flipped to `failed` and diamonds become 0. |
| Gift | **No** | Debits the sender’s user wallet. Credits the host’s earning record. Snapshots `valuationRate`, `hostSharePct`, `platformSharePct`, `grossInr`, `hostInr`, `platformInr`. |
| Admin credit / debit | Credit creates diamonds. Debit destroys them. | Whole number greater than 0. Debit cannot exceed available user-wallet diamonds. Credit is refused when `manualCreditAllowed` is false. |
| Withdrawal | No diamond movement | INR against host entitlement. Statuses: `pending`, `under_review`, `approved`, `rejected`, `processing`, `paid`. Rejected does not reduce paid or open totals the same way as open statuses. |

Default economy settings (`DEFAULT_SETTINGS`):

- `inrPerDiamondPurchase`: 10
- `inrValuePerEarnedDiamond`: 0.1
- `hostSharePct`: 50
- `platformSharePct`: 50 (must sum to 100)
- `minWithdrawal`: 100 INR
- `maxWithdrawal`: 50000 INR
- `minEligibleEarnings`: 200 INR
- `manualCreditAllowed`: true

Changing settings does **not** rewrite old gifts or payments. Each row keeps the rate it was created with.

User available diamonds:

`purchased − refunded + admin credit − admin debit − gifts sent`

Host earning diamonds are the sum of successful gifts received. They are **not** subtracted from “net issued” a second time. Circulation check:

`net issued = purchased − refunded + admin credit − admin debit`

`outstanding = user available + host earning diamonds`

`difference` must be 0. A non-zero difference is a broken ledger.

Dashboard revenue (`src/pages/Dashboard.jsx`, `src/components/dashboard/EconomyPanel.jsx`):

- Platform revenue is the platform INR share of **gifted** diamonds, not unspent user-wallet diamonds.
- Paid is withdrawals with status `paid`.
- Still to pay is host entitlement minus paid. **NEEDS CONFIRMATION:** the headline uses entitlement minus paid and does not subtract open (pending / under review / approved / processing) requests. The per-host `availableInr` in `hostEntitlement()` does subtract both open and paid. These two “left to pay” numbers are not the same formula.

Gift names inside the economy seed are Rose 50, Heart 100, Star 200, Crown 500, Rocket 1000, Diamond 2000. Those prices are **not** the Gift catalog.

### 3.3 Video call preview (not a live billing engine)

`previewCall` in `src/control/logic.js`:

- Uses video rate, free seconds, minimum billable seconds, and rounding (`Round up`, `Round down`, `Exact`).
- Rejected or unanswered: no charge.
- If charge is greater than the typed balance, the preview says the call is blocked before billing.
- Host share is `round(charge × hostShare / 100)` from **withdrawal settings**, not from economy settings. Platform is the remainder.
- The preview can pin one sample call and refuse a second charge with the same transaction id. That state is on the page only.

There is no call table, no call history page, and no deduction from the economy wallet when the preview runs.

### 3.4 Diamond sellers (a second money path)

`src/utils/diamondSellersData.js` and `src/utils/diamondLedger.js`.

- Seller commission default **5%**. Company share is the rest (**95%**). Multiple sellers may be Active.
- No QR code and no UPI collection on this screen. Payout method in the seller module is separate from host bank withdrawals.
- Ledger transaction types: `ADMIN_RECHARGE`, `SELLER_TRANSFER`, `ADMIN_ADJUSTMENT`, `REVERSAL`.
- Limits in code: 100,000 diamonds per transfer, 500,000 diamonds per seller per day.
- A transfer writes `ucoin`, `uCoins`, and `coins` on the Firestore-shaped user to the same number.
- This ledger is **not** the economy `payments` / `gifts` ledger.

**NEEDS CONFIRMATION:** Are seller recharges the same diamonds a user buys with INR, or a separate wholesale channel? If they are the same, both must post to `user_diamond_wallets` and `diamond_ledger_entries`. If they are different, they need different wallet types. Do not create two balances that the phone treats as one.

### 3.5 Two withdrawal screens

| Screen | File | Status values | What it edits |
| --- | --- | --- | --- |
| Host payout requests | `src/pages/economy/Withdrawals.jsx` | pending, under_review, approved, rejected, processing, paid | Economy seed withdrawals. INR from gift share. |
| Bank transactions | `src/pages/Transactions.jsx` + `withdrawalData.js` | Pending, Approved, Processing, Paid, Rejected, On Hold | Separate mock hosts, bank KYC, documents, UTR. Approve is blocked unless bank status is `Verified`. |

**NEEDS CONFIRMATION:** These should become one withdrawal workflow. The bank screen has the operational fields (account, IFSC, document, verification). The economy screen has the earning-wallet link. A real payout needs both.

---

## 4. Menu-by-menu record

For each menu: purpose, current data, create / update / delete, who the data belongs to, and what a real database should store. “User app” means the single Chamak app. “Host” means a host-capable account in that app.

### 4.1 Login — Existing, Mock

`src/pages/Login.jsx`, `src/components/ProtectedRoute.jsx`, `src/firebase/auth.js`.

- Purpose: let a staff member in.
- Current behavior: shim accepts any non-empty email and password. Password reset returns success and sends nothing. Remember-me stores the email in `localStorage` (`rememberedEmail`).
- Admin can create: nothing durable.
- Database later: `admin_users` (id, email, password hash **only on the server**, display name, role id, status, last login). Never store the mock “any password works” rule.
- Phone app: does not use this login.

### 4.2 Dashboard — Existing, Mock

`src/pages/Dashboard.jsx`.

Shows, from `useDashboardData` (Firestore-shaped users, tickets, complaints, live hosts) plus a **fresh** `createEconomy()` call (not the live EconomyContext, so edits on Finance pages do not change this card until both read one database):

- KPI cards and date presets (today, yesterday, 7 days, 30 days, this month, last month, 90 days, custom).
- Platform revenue, paid to hosts, still to pay (economy formulas in section 3.2).
- Action center, safety feed, host analytics, system strip, geography snapshot, activity heatmap.
- CSV export of the dashboard view.

The live-streaming block was removed from the dashboard. `src/components/dashboard/LiveOps.jsx` is unused. Live rooms remain their own page.

Admin actions: filter dates, export. No writes.

Depends on: users, tickets, complaints, live records, economy summaries.

### 4.3 User Management — Existing, Mock

`src/pages/Users.jsx`, `src/utils/userManagementData.js`.

24 directory people. Segments are filters, not separate tables:

| Segment | Rule in `matchesSegment` |
| --- | --- |
| New Registrations | Registered in the last 3 days |
| Active Users | Status Active and last active within 24 hours |
| Inactive Users | Status Inactive, or last active older than 14 days |
| Online Users | `online === true` |
| Verified / Pending | `verification` |
| VIP | `vip` |
| Hosts / Viewers / Agency | `userType`, or any `agency` string for Agency |
| Blocked / Suspended | status Blocked or Suspended |
| Reported | `reported` |

Filters: search (id, name, username, email), country, state, city, type, status, verification, coin min/max, registration dates.

Create: none. Update: only through the profile page, in memory. Delete: none.

Displayed fields: numeric id, name, username, email, phone, gender, age, dob, country, state, city, user type, VIP, status, verification, coins, registered, last login, last active, online, reported, profile completeness, photo, email verified, location permission, interests, dating complete, source, platform, app version, agency, live now.

This `coins` figure is **not** the economy wallet.

Comes from the user app later: registration, profile, presence, device, location permission. Host flag comes from host approval, not from a second app.

### 4.4 User profile — Existing, Mock

`src/pages/UserProfile.jsx`. Tabs:

Overview, Onboarding, Wallet & coins, Live streaming, Dating & social, Gifts & transactions, Login & devices, Verification & KYC, Reports, Admin actions.

Admin actions that stick until reload (`applyUserPatch`, `addUserNote`): verify, suspend, block, restore, restrict live, restrict chat, edit name, add a note. Each writes an audit line `{ actor, action, detail, at }`.

Wallet tab is **synthetic**. `buildWallet` derives purchased, promo, received, and spent from `user.coins` with fixed ratios. It is not `userStatement()`.

Dating, gifts, logins, KYC, and reports on this page are generated from the user id (`buildLive` and related helpers in the same file). They are visual.

**NEEDS CONFIRMATION:** Profile “Wallet & coins” should be replaced by the real user wallet and, if the person is a host, the host earning wallet. Do not keep the ratio-based wallet.

### 4.5 User Analytics — Existing, Mock

`src/pages/UserAnalytics.jsx`. Charts and counts from the same 24-person directory. No writes. Later this is a query, not a table of its own, except optional daily snapshots if the product needs historical charts after users change.

### 4.6 Host Applications — Existing, Mock

`src/pages/HostApplications.jsx`, `src/utils/hostApplicationsData.js`.

Statuses: Pending, Approved, Rejected. Categories: Entertainment, Gaming, Music, Talk, Lifestyle.

Admin can approve (optional note) or reject (reason). No delete in the helpers. Approving here does **not** flip `userType` to Host in `userManagementData.js`, and does not create an economy host.

Later: `host_applications` linked to `profiles`. Approval sets `profiles.is_host` and `host_status = approved` in one transaction. The phone then unlocks host actions for that account.

### 4.7 Live rooms — Existing, Mock

`src/pages/LiveStreaming.jsx`, `src/hooks/useLiveMonitor.js`.

Reads `live_streams` and users with `isHost`, `role === Host`, or `hostStatus === approved`. The seed has one live room: Priya Singh, `viewCount` 186, `totalCoinsEarned` 2100, status `live`. The hook does not look for a playback URL. This page does not play video.

**Recommended, not built:** store `playback_url` only when a real ingest service provides an http(s) URL. Do not invent viewers or a video. Do not store stream keys in a table the admin browser can read.

Admin actions on this page are monitoring. Stop-stream from an older dashboard path is not mounted.

Depends on: host approval, gifts during a session, moderation reports.

### 4.8 Chats — Existing, Mock (and a Firestore API shape)

`src/pages/Chats.jsx`, `src/utils/chatsData.js`, `src/firebase/chats.js`.

The page used by the menu is the local directory: list threads, mark read, set status, send an admin message. Messages are in memory.

A separate Firebase helper exists for support chat. With the shim, that would hit `mockData` collections if a page called it. The menu page does not use the economy or user-directory stores.

Later tables: `conversations`, `conversation_members`, `messages`. Admin sends are `sender_role = admin`. User and host messages originate in the phone app.

### 4.9 Gift catalog — Existing, writes the shim

`src/pages/Gifts.jsx`. Collection name `gifts`.

Admin can create, edit, and delete. Fields: name, description, category, cost (diamonds), image or image URL, priority, isActive. List is ordered by priority descending. Image upload uses Firebase Storage when the real SDK is on; the shim does not provide real storage.

Seed costs: Rose 10, Heart 50, Crown 500, Rocket 200 (inactive). Economy gift prices are a different list (section 3.2).

The phone should charge `gifts.cost`. The economy seed must not be a second catalog.

**NEEDS CONFIRMATION:** one catalog. Suggested rule: Gift catalog is the only price list. A gift transfer stores `gift_id` and the cost at that moment.

### 4.10 Diamond Sellers — Existing, Mock

`src/pages/DiamondSellers.jsx`.

Admin can create a seller, edit, set Active or Inactive, set that seller’s commission percent, delete, change request status, and create or update payouts.

Seller fields include identity and WhatsApp (`+` and 10–15 digits). UPI format is validated in code (`isValidUpi`) even though the product decision was commission-only and no UPI collection UI. **NEEDS CONFIRMATION:** drop UPI from the seller record, or keep it only as a payout destination.

Request statuses: Pending, Accepted, Processing, Completed, Rejected, Cancelled. Payout statuses: Pending, Approved, Processing, Paid, Rejected.

Company/seller split is calculated in the browser (`sellerCut`). That split must move to a server function so the client cannot change 5% and 95%.

### 4.11 Diamond Marketplace — Existing, Mock

`src/pages/DiamondMarketplace.jsx`, `src/utils/diamondLedger.js`.

Admin can recharge a user, transfer from a seller, adjust, reverse, freeze a wallet, and change seller status. Idempotency keys are stored in the ledger store so the same key does not post twice in that memory session.

This mutates Firestore-shaped `users.ucoin`. It does not post an economy `payments` row.

### 4.12 Finance Overview — Existing, Mock

`src/pages/economy/FinanceOverview.jsx`.

KPIs from `summarize()` for the selected range and the previous range of the same length. Date chips: today, yesterday, 7 days, 30 days, this month, custom. Charts use `series()` on the same rows. Click-through goes to the related economy routes. No writes.

Stock figures use transactions up to the range end. Flow figures use rows inside the range. That distinction must stay in SQL (two queries), or the dashboard and this page will disagree.

### 4.13 Diamond Purchases — Existing, Mock

`src/pages/economy/Purchases.jsx`.

Lists economy `payments`: id, user, INR, diamonds, rate snapshot, gateway, method, status, time. Detail drawer. Statuses: success, failed, pending, refunded. Admin does not create a real charge here. Refunds exist only as seeded rows.

Later, the phone starts the purchase. A **server** verifies the gateway webhook, then inserts the payment and credits the user wallet. The admin lists and, if policy allows, requests a refund. The browser must not mark a payment successful.

### 4.14 User Wallets — Existing, Mock

`src/pages/economy/Wallets.jsx` (`UserWallets`).

One row per economy user from `userStatement`: purchased, refunded, admin credit, admin debit, gifted, available. Admin can freeze or unfreeze (`walletStatus`) with a reason, and credit or debit when allowed. Both actions append an audit row. Completed payment and gift rows are not edited.

### 4.15 Host Earning Wallets — Existing, Mock

Same file (`HostWallets`).

Shows gift diamonds received, gross INR, host INR, platform INR, pending withdrawal INR, paid INR, available INR. A host who is also a user still has a separate user-wallet number in the statement. Admin freeze uses the same `walletStatus` field on the user row. **NEEDS CONFIRMATION:** freezing the user wallet and freezing the host earning wallet should be two flags. The control schema already has `freezeUserOnRisk` and `freezeHostOnRisk`, but the economy store has one `walletStatus`.

### 4.16 Gift transfers — Existing, Mock

`src/pages/economy/GiftsPage.jsx`.

Lists seeded gifts. No admin create. A real gift is created by the phone, in one database transaction:

1. Lock sender user wallet.
2. Reject if inactive, frozen, or balance &lt; cost.
3. Insert `gift_transfers` with rate and share snapshots.
4. Debit user wallet.
5. Credit host earning totals (diamonds and INR snapshots).
6. Do not mint new diamonds.

### 4.17 Earnings & Revenue Share — Existing, Mock

`src/pages/economy/Revenue.jsx`.

Sums `hostInr` and `platformInr` from gifts. Read only. Share changes belong on settings and apply only to gifts created after publish.

### 4.18 Diamond Circulation — Existing, Mock

`src/pages/economy/Circulation.jsx`.

Shows the reconciliation in section 3.2 and warns when `difference !== 0`. Read only. This check should be a scheduled database function, not only a React page.

### 4.19 Financial Reports — Existing, Mock

`src/pages/economy/Reports.jsx`. Nine reports, all from the same economy object:

1. INR purchase report
2. Diamond issuance report
3. User wallet balance report
4. Gift transaction report
5. Host earning report
6. Host withdrawal report
7. Platform revenue report
8. Refund and reversal report
9. Diamond circulation report

Search, filters, pagination, CSV of the filtered rows. No separate report tables required. CSV export can stay in the admin as a query result.

### 4.20 Ledger audit — Existing, Mock

`src/pages/economy/Audit.jsx`.

Append-only log of credits, debits, withdrawal status changes, freezes, and setting changes. The UI does not delete or silently edit these rows. Corrections are new adjustment rows.

### 4.21 Demo ledger rates — Existing, Mock

`src/pages/economy/EconomySettings.jsx`.

Edits `DEFAULT_SETTINGS` in memory. Host share + platform share must equal 100. Minimum withdrawal cannot exceed maximum. Does not push to Control Center and does not change old gifts.

### 4.22 Bank transactions — Existing, Mock

`src/pages/Transactions.jsx`, `src/utils/withdrawalData.js`.

Bank transfer only. Statuses in section 3.5. Bank verification statuses: Not Submitted, Pending Verification, Verified, Rejected, Update Requested.

Admin can move payout status, and update host bank verification. Approval is refused unless the bank is Verified (`canApproveWithdrawal`). Account numbers are masked in the list (`maskAccount`). Full reveal is an admin action on the page.

Documents are sample names and URLs, not uploaded files.

**Security:** account number, IFSC, and document files must be readable only by a server role. The admin UI receives a masked value plus a short-lived reveal.

This module’s hosts and amounts are not the economy hosts.

### 4.23 Host payout requests — Existing, Mock

`src/pages/economy/Withdrawals.jsx`.

Admin sets status, rejection reason, and UTR when paid. Does not check a bank record. Does not move diamonds. Does not call a payout API.

### 4.24 Leaderboard & Rankings — Existing, Mock

`src/pages/Leaderboard.jsx`, `src/hooks/useLeaderboardData.js`.

Reads user coin and activity fields and ranks them in the browser. No admin create. Do not store a fake rank as source of truth. Store the events (gifts, live minutes, calls) and compute ranks, or store a snapshot table written by a job.

### 4.25 Geography — Existing, Mock

`src/pages/GeoAnalytics.jsx`, `src/utils/geoAnalyticsData.js`, `src/data/indiaStateShapes.js`.

State shapes are static geometry (fine to keep in the app). User counts by state are mock. Later, aggregate from `profiles.country/state` or from an explicit location event. The admin must not collect location just by opening this page. The app-accounts switch `locationPrompt` only describes whether the phone may ask.

### 4.26 Tickets / Support — Existing, Mock

`src/pages/TicketsV2.jsx`, `src/utils/ticketsData.js`.

Statuses: Open, In Progress, Waiting on User, Resolved, Closed. Priorities: Urgent, High, Medium, Low. Assignees: Unassigned, Admin User, Priya Ops, Rahul Mod (sample names).

Admin can change status, priority, assignee, and add a public reply or an internal note. Timeline is in memory.

Firebase `src/firebase/tickets.js` is a second access path, not what this page uses.

Origin: user or host opens a ticket in the app. Admin works it here.

### 4.27 Complaints — Existing, Mock

`src/pages/Complaints.jsx`, `src/utils/complaintsData.js`.

Statuses: Pending, Investigating, Escalated, Resolved, Dismissed. Priorities include Critical. Admin updates status and notes. Safety settings in Control Center do not read this list. Reports do not auto-ban (the safety form says unverified reports do not permanently ban).

### 4.28 Feedback — Existing, Mock

`src/pages/Feedback.jsx`, `src/utils/feedbackData.js`.

Statuses: New, Reviewed, Actioned, Archived. Types: Praise, Suggestion, Issue, Question. Ratings 1–5. Admin adds notes and changes status. Insights (average, sentiment) are computed in the browser from the loaded rows.

The Firestore `feedback` collection in `mockData` is a smaller, different sample. The menu page uses `feedbackData.js`.

### 4.29 Banners — Existing, writes the shim when that page uses Firestore

`src/pages/Banners.jsx`. Seed rows in `mockData.banners`: title, description, image, isActive, priority, actionType, actionTarget, startDate, endDate, views, clicks.

Admin create, update, deactivate, delete (same pattern as other Firestore pages). The phone should read only active banners whose dates include now.

Views and clicks must be incremented by the app, not typed by the admin, once tracking exists. Seed numbers are sample.

### 4.30 Events — Existing, Mock

`src/pages/Events.jsx`, `src/utils/eventsData.js`.

Kinds: Announcement, Live event, Coin campaign, Host boost. Statuses: Draft, Scheduled, Live, Ended. Audiences: All users, Hosts, Viewers. Priorities: High, Medium, Low.

Admin can create, update, and delete. “Coin campaign” does not change wallets. **NEEDS CONFIRMATION:** whether a campaign may credit diamonds. If yes, it must be a ledger entry with an expiry, not a text field.

`mockData.events` is another unused-shaped sample.

### 4.31 Control overview — Existing, Planned, Mock

`src/pages/control/ControlPages.jsx` (`ControlHome`).

Shows category cards, setting counts, video rate, and enabled feature count. Role switch “Acting as” is a dropdown in the page state. It is not authentication. The sidebar is not filtered by role.

Publish requires a reason, `canEdit`, and `validateCategory`. A published payment secret is replaced with a “set” flag and the value is dropped (`stripSecrets`). Secrets are not written to `localStorage`.

Version starts at 1. Rollback stores the previous snapshot as a **new** version. History is not deleted.

Nothing here is read by economy math, the gift catalog, or the phone.

### 4.32 Video Call Pricing — Planned configuration, Mock

Fields in section 6. Preview only. No call rows.

### 4.33 Withdrawal rules — Planned configuration, Mock

Separate numbers from Demo ledger rates. See the mismatch table in section 6.

### 4.34 App diamond rates — Planned configuration, Mock

Purchase rate, gift valuation, gift min/max, manual credit, adjustment cap, user debit cap, freeze flags, refund policy text, daily gift limit. Not enforced by the economy pages except where those pages have their own copy of a rule.

### 4.35 Payment Gateways — Planned form, Mock

Provider, environment, merchant id, public key, secret, webhook secret, currency INR, methods, min and max payment, enabled. The form cannot charge a card. Production keys must never sit in the admin database in clear text, and never in the phone app. Store a vault reference. Webhooks hit the server only.

### 4.36 App accounts — Planned configuration, Mock

One page for the Chamak app. User registration, login methods (default “Phone OTP”), OTP, email verification, profile and photo required, min age 18, max age 80, location prompt, push prompt, suspension policy, deletion policy, daily minute limit, minimum version, force update, maintenance message.

Host block on the same page: host registration, approval required, identity verification, KYC, host profile, live eligibility, video eligibility, host may set own price (default off), withdrawal eligibility, minimum weekly live hours, host suspension.

These switches do not change Host Applications or the user directory.

### 4.37 Live room rules — Planned configuration, Mock

Enabled, max minutes (180), max viewers (5000), gifts on, min/max gift, gifts create earning records, recording default **Off** (or “Host consent required”), moderation, reports, block/mute, who can join.

Recording must stay off until a published policy and consent exist. Do not add a recorder in the admin.

### 4.38 Notifications — Planned templates, Mock

Channel toggles and four template strings (payment, gift, withdrawal, call). The page sends nothing.

### 4.39 Safety — Planned policy, Mock

User reports, host reports, block, reports-before-review (3), messages per hour (60), chat and call limits after review, suspension choices, escalation, admin review required. Not wired to Complaints.

### 4.40 Feature Flags — Planned, Mock

videoCalls, liveStreaming, gifts, recharge, withdrawals, chat, follow, notifications, verification, referral (off), offers (off), rollout percent, effective time. No audio flag. A real flag must be checked on the server. Hiding a button is not enough.

### 4.41 App Settings — Planned, Mock

App name Chamak, support email and phone, terms, privacy, guidelines URLs, maintenance, versions, force update, country India, currency INR, timezone Asia/Kolkata, language English.

This is not Admin preferences. Admin preferences are the staff member’s own browser settings.

### 4.42 Roles — Existing display, Mock

`src/control/schema.js` `ROLE_ACCESS`:

| Role | Can publish |
| --- | --- |
| Super Admin | All control categories |
| Finance Admin | Withdrawal rules, App diamond rates |
| Operations Admin | App accounts, Live room rules, Notifications, Feature flags, App settings |
| Support Admin | None |
| Moderator | Safety |

Everyone can view. This does not protect routes. A real system needs server checks and Row Level Security. The acting-as control must not be how permission is granted.

### 4.43 Config History — Existing, Mock

Compare a version, export CSV, restore with a reason. In memory only.

### 4.44 Team accounts — Existing, Mock

`src/pages/ChamakzTeam.jsx`, `src/utils/teamBroadcastsData.js`.

Name is “Team accounts” in the sidebar. The data helpers are broadcasts: title, body, audience (All users, Hosts, Viewers), priority, Draft or Published, optional image. Admin can create and delete. Publishing does not notify anyone.

**NEEDS CONFIRMATION:** is this page staff user management, or in-app announcements? The current code is announcements. Staff users do not exist as rows. If both are needed, split them. Do not overload one table.

### 4.45 Admin preferences — Existing, local only

`src/pages/Settings.jsx`.

App display name, logo, support email, admin display name and email, avatar, dark mode, notification toggles, password fields. Saved in `localStorage`. Password change does not call a real auth update in a durable way (shim `updatePassword` is empty).

Do not treat this as app-wide configuration. App-wide configuration is Control Center → App Settings.

---

## 5. Suggested Supabase tables

Types are PostgreSQL types. `uuid` primary keys unless noted. Every business table should have `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()`. Money in INR is `numeric(14,2)`. Diamond counts are `integer` (the admin rejects fractional diamonds on adjustments). Percents are `numeric(5,2)`.

Do not create these yet.

### 5.1 Identity

**profiles** — one row per phone-app account.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | PK. Also the auth user id if Supabase Auth is used for the phone. |
| numeric_id | text | Unique. Current samples look like `1001234`. |
| username | text | Unique, case-insensitive. |
| display_name | text | |
| email | text | Nullable. |
| phone | text | Unique when present. |
| gender | text | |
| dob | date | |
| country, state, city | text | |
| user_type | text | Viewer, Host, Agency. Host should be derived from `is_host` once confirmed. |
| is_host | boolean | |
| host_status | text | none, pending, approved, rejected, suspended. |
| vip | boolean | |
| status | text | active, inactive, suspended, blocked. |
| verification | text | none, pending, verified, rejected. |
| agency_name | text | Nullable. |
| profile_complete | integer | 0–100, or compute it. |
| has_photo | boolean | |
| email_verified | boolean | |
| location_granted | boolean | |
| interests | text[] | |
| dating_complete | boolean | |
| signup_source | text | |
| platform | text | android, ios, web. |
| app_version | text | |
| last_login_at, last_active_at | timestamptz | |
| online | boolean | Presence. Prefer a short-lived presence table if this is updated often. |
| reported | boolean | Denormalized flag. Source of truth is reports. |
| restrictions | jsonb | `{ live, chat, calls }` until split into columns. |
| created_at, updated_at | timestamptz | |

Indexes: unique `numeric_id`, unique `username`, unique `phone`, `(status)`, `(is_host, host_status)`, `(country, state)`.

**host_applications**

| Column | Type |
| --- | --- |
| id | uuid PK |
| profile_id | uuid FK → profiles |
| category | text |
| pitch | text |
| experience | text |
| status | text | pending, approved, rejected |
| review_note | text |
| reviewed_by | uuid FK → admin_users |
| reviewed_at | timestamptz |

**admin_users** and **admin_roles**

Staff are not `profiles`. Columns: email, name, role_id, status, last_login_at. **admin_role_grants** lists which control categories a role may publish. Seed from `ROLE_ACCESS`.

**admin_audit_logs**

id, admin_id, action, entity_table, entity_id, previous_value jsonb, new_value jsonb, reason, created_at. No update, no delete, for application roles.

**profile_notes** — id, profile_id, admin_id, body, created_at.

**profile_devices** — id, profile_id, platform, app_version, last_seen_at, ip_hash. Do not store raw IP if it is not required.

**kyc_documents** — id, profile_id, kind, storage_path, status, reviewed_by, reviewed_at. Files in private storage.

### 5.2 Wallets and ledger

**user_diamond_wallets**

| Column | Type |
| --- | --- |
| profile_id | uuid PK, FK → profiles |
| available | integer | Must match the ledger. Do not let the client set this. |
| status | text | active, frozen |
| updated_at | timestamptz |

**host_earning_wallets**

| Column | Type |
| --- | --- |
| profile_id | uuid PK, FK → profiles |
| diamonds_received | integer | Sum of gifts. Not spendable as user diamonds. |
| host_inr_accrued | numeric(14,2) | Sum of snapshotted host INR. |
| status | text | active, frozen |
| updated_at | timestamptz |

**diamond_ledger_entries** — append only. One table for every diamond movement so circulation can be rebuilt.

| Column | Type |
| --- | --- |
| id | uuid PK |
| profile_id | uuid FK |
| wallet_kind | text | user or host_earning |
| entry_type | text | purchase_credit, refund_debit, admin_credit, admin_debit, gift_debit, gift_credit, seller_transfer_credit, seller_transfer_debit, reversal |
| diamonds | integer | Signed. |
| inr_amount | numeric(14,2) | Nullable. |
| rate_snapshot | numeric(12,4) | Nullable. |
| reference_table | text | |
| reference_id | uuid | |
| idempotency_key | text | Unique. |
| admin_id | uuid | Nullable. |
| reason | text | |
| created_at | timestamptz | |

Index: `(profile_id, created_at)`, unique `idempotency_key`, `(entry_type, created_at)`.

Balance updates and ledger inserts happen in **one database function**. The admin browser calls the function. It does not update `available` directly.

### 5.3 Catalog, gifts, purchases, calls, live

**gifts** — the catalog. id, name, description, category, cost_diamonds, image_path, priority, is_active, created_at, updated_at.

**gift_transfers** — id, gift_id, sender_id, host_id, live_session_id nullable, diamonds, valuation_rate, host_share_pct, platform_share_pct, gross_inr, host_inr, platform_inr, status, created_at. Unique constraint so one client request cannot insert twice (`idempotency_key`).

**payment_orders** — id, profile_id, inr, diamonds_issued, rate_snapshot, gateway, method, status (pending, success, failed, refunded), gateway_payment_id, created_at, paid_at. Written by the webhook handler.

**payment_gateway_config** — id, provider, environment, merchant_id, public_key, secret_vault_id, webhook_vault_id, currency, methods, min_inr, max_inr, enabled. No raw secret column.

**video_call_sessions** — not collected today. Add when calls are real: id, caller_id, host_id, rate_snapshot, started_at, ended_at, billed_seconds, diamonds_charged, host_diamonds, platform_diamonds, outcome, client_tx_id unique.

**live_sessions** — id, host_id, title, status (live, ended), started_at, ended_at, peak_viewers, playback_url nullable. Viewers come from the live service, not from the admin typing a number.

### 5.4 Withdrawals and sellers

**payout_methods** — id, profile_id, holder_name, account_last4, account_vault_id, ifsc, bank_name, branch, account_type, verification_status, document_path, submitted_at, reviewed_by.

**withdrawals** — one table for both current screens.

| Column | Type |
| --- | --- |
| id | uuid |
| profile_id | uuid | The host. |
| amount_inr | numeric(14,2) |
| status | text | Map economy and bank statuses only after confirmation. Suggested set: pending, under_review, on_hold, approved, rejected, processing, paid. |
| payout_method_id | uuid |
| utr | text |
| rejection_reason | text |
| requested_at, reviewed_at, paid_at | timestamptz |
| reviewed_by | uuid |

Rule to enforce in the function: sum of non-rejected withdrawals cannot exceed host INR accrued. Approve only when bank verification is Verified, if that rule is kept.

**diamond_sellers** — id, name, whatsapp, status, commission_pct default 5, created_at, updated_at.

**seller_orders** and **seller_payouts** — match the request and payout statuses already on the sellers page. Each completed transfer also writes `diamond_ledger_entries`.

### 5.5 Support, marketing, config

**tickets**, **ticket_messages** (`internal boolean`), **complaints**, **feedback** — columns match the status lists in section 4. Each has `profile_id`.

**banners** — title, body, image_path, is_active, priority, action_type, action_target, starts_at, ends_at. **banner_stats_daily** if views and clicks must be real.

**events** — kind, status, audience, priority, starts_at, ends_at, body.

**announcements** — if Team accounts stays a broadcast tool: title, body, audience, priority, status, image_path, published_at.

**app_config_documents** — one current JSON document per category id (`calls`, `withdrawals`, `diamonds`, `payments`, `users`, `live`, `notifications`, `safety`, `features`, `app`), plus `version`, `published_by`, `reason`.

**app_config_revisions** — version, category, before jsonb, after jsonb, reason, admin_id, created_at. Rollback inserts a new revision.

The economy settings page should **read the same rows** as Control Center after integration. Until the product picks one editor, keep both screens but point them at one `diamonds` and one `withdrawals` document.

### 5.6 Relationships (short)

- profiles 1—1 user_diamond_wallets
- profiles 1—1 host_earning_wallets (row created when they become a host, or always created empty)
- profiles 1—many host_applications, gift_transfers (as sender or host), payment_orders, withdrawals, tickets, devices, ledger entries
- gifts 1—many gift_transfers
- live_sessions 1—many gift_transfers
- withdrawals many—1 payout_methods
- diamond_sellers 1—many seller_orders
- admin_users 1—many audit logs and reviews

---

## 6. Admin-controlled settings

How a setting should move after Supabase exists:

1. Admin edits a draft in Control Center.
2. Publish runs on the server: permission, validation, secret stripping, revision insert.
3. Phone app reads the **published** document (or a small public view) at launch and when a version changes.
4. Money events copy the numbers they need onto the event row. Later edits do not rewrite history.

| Setting | Existing control | Current default | Enforced today by |
| --- | --- | --- | --- |
| Video diamonds / minute | `/control/calls` `videoRate` | 1200 | Preview only |
| Video min seconds, interval, free seconds, grace, rounding | same | 10, 60, 0, 5, Round up | Preview only |
| Rejected / unanswered | same | No charge | Preview only |
| Insufficient balance | same | Block before start | Preview only |
| Duplicate billing | same | On | Preview page state only |
| Audio call price | **Not in the app** | — | Removed. Do not add unless product asks. |
| Diamonds per ₹1 | `/control/diamonds` and `/economy/settings` | 10 and 10 | Only the economy seed uses its own copy |
| INR per gifted diamond | both | 0.1 and 0.1 | Economy seed snapshot |
| Host / platform share | both | 50/50 | Economy seed. Call preview uses the control withdrawal share. |
| Min / max withdrawal | both | Economy 100 / 50000. Control 500 / 50000. | Each screen uses its own copy |
| Min eligible earnings | both | Economy 200. Control 500. | Not the same |
| Daily / monthly withdrawal caps | Control only | 20000 / 100000 | Not enforced |
| Processing fee, cycle, payout method | Control only | 0%, Weekly, Bank transfer | Not enforced |
| Manual credit | Both toggles | true | Economy `adjust()` checks its own flag only |
| Max admin adjustment | Control only | 5000 | Not enforced by `adjust()` |
| Gift min / max / daily cap | Control and live rules | 50 / 10000 / 50000 | Not enforced on catalog or transfers |
| Gift catalog price | `/gifts` | Rose 10, etc. | Stored on the gift document only |
| Seller commission | Diamond Sellers | 5% | Browser math |
| Payment min / max | Control payments | 100 / 50000 | Form only |
| Registration, OTP, age, host eligibility | App accounts | See schema | Form only |
| Feature flags | `/control/features` | Referral and offers off | Not read by pages |
| Maintenance and versions | App settings and also App accounts | Two maintenance messages | Neither gates the admin or the phone |
| Staff notification toggles | Admin preferences | localStorage | This browser only |

**NEEDS CONFIRMATION:** which screen is the editor after go-live: Control Center, or Demo ledger rates? The blueprint assumes Control Center is the published source and Demo ledger rates is removed or becomes a read-only view. Do not keep two writable copies.

---

## 7. Data flow

### 7.1 Purchase

1. User, in the phone app, starts a purchase (only if feature `recharge` is on and the amount is inside min/max).
2. Server creates `payment_orders` as pending. It does not credit diamonds yet.
3. Gateway webhook hits the server. Signature check uses the secret that is not in the admin browser.
4. On success, one transaction writes the order as success and a `purchase_credit` ledger row, then sets `user_diamond_wallets.available`.
5. Admin Purchases and User Wallets read those rows.
6. Refund: server checks unused diamonds, writes `refund_debit`, updates the order. If diamonds were already gifted, the current rule refuses a full reversal (status becomes failed in the seed). Keep that rule unless product changes it.

### 7.2 Gift

1. User sends a catalog gift to a host, usually inside a live session.
2. Server checks catalog active, cost within min/max and daily cap, sender balance, host earning wallet not frozen, live rules if a session is required.
3. One transaction: gift row with snapshots, user debit, host earning credit. No new diamonds.
4. Admin Gift transfers, Host Earning Wallets, Earnings, Circulation, and dashboard revenue read those rows.

### 7.3 Video call

Not implemented beyond a preview. When built:

1. Phone asks the server to start a call. Server reads published video settings.
2. If the user cannot cover the first billable unit, the call does not start.
3. On hang-up, server computes billable minutes and writes `video_call_sessions` plus ledger rows.
4. Rejected and unanswered write a session with zero charge.
5. Admin does not type the charge. A future calls page would list sessions. That page does not exist.

### 7.4 Host approval

1. User submits `host_applications` in the phone app.
2. Admin approves or rejects on Host Applications.
3. Server sets `profiles.is_host` and `host_status`.
4. Host features (live, video, withdrawal) still depend on the published App accounts switches and feature flags.

### 7.5 Withdrawal

1. Host requests an amount in the phone app.
2. Server checks eligibility, KYC, min/max, daily and monthly caps, and remaining host INR.
3. Row is pending. Admin reviews it on the payout screen, after bank verification.
4. Paid status stores UTR. It does not delete diamonds from the user wallet.
5. Rejected returns the reserved amount to “available to withdraw”.

### 7.6 Seller transfer

1. Admin or an approved seller flow (only admin exists now) submits a transfer with an idempotency key.
2. Server checks seller Active, per-transfer cap, daily cap, and commission.
3. Ledger credits the user’s diamond wallet. Seller and company amounts are recorded on the seller order. **NEEDS CONFIRMATION** whether this mints diamonds or moves them from a company pool.

### 7.7 Support, safety, marketing

Users and hosts create tickets, feedback, and reports. Admins change status and reply. Banners and events are admin-created and read by the phone. Notifications are not sent by the current admin.

### 7.8 What must be server-side

- Payment verify, refund, and diamond credit
- Gift debit / host credit
- Call billing
- Withdrawal reserve and payout status that touches money
- Seller transfer and reversal
- Config publish and secret storage
- Feature-flag checks
- Bank account reveal
- Any freeze, ban, or role change

The admin may keep search, filters, CSV, and charts in the browser **after** it receives the rows.

---

## 8. Mock-to-database map

| Current source | Used by | Future table | Notes |
| --- | --- | --- | --- |
| `userManagementData.js` DIRECTORY | Users, profile, analytics | `profiles` | Drop the in-memory patch object. |
| `buildWallet` and other `build*` helpers | Profile tabs | Real ledger, sessions, devices, kyc, reports | Delete the ratio math when wiring the profile. |
| `mockData.js` `users` | Marketplace, live, some firebase pages | Same `profiles` | One row, not a second user. |
| `hosts_application` | Only if a page queries Firestore | `host_applications` | Menu page uses `hostApplicationsData.js` instead. Merge. |
| `hostApplicationsData.js` | Host Applications | `host_applications` | |
| `live_streams` | Live rooms | `live_sessions` | |
| `gifts` collection | Gift catalog | `gifts` | |
| Economy `createEconomy()` | Finance pages, dashboard revenue | ledger + payments + gifts + withdrawals | Stop calling `createEconomy()` on the dashboard. |
| `EconomyContext` settings | Demo ledger rates | `app_config_documents` category diamonds + withdrawals | |
| `ControlContext` | Control Center | `app_config_documents` + revisions | |
| `withdrawalData.js` | Bank transactions | `withdrawals` + `payout_methods` | Merge with economy withdrawals. |
| `diamondSellersData.js` | Diamond Sellers | `diamond_sellers`, orders, payouts | |
| `diamondLedger.js` | Marketplace | `diamond_ledger_entries` | Same ledger as purchases and gifts. |
| `ticketsData.js` | Tickets | `tickets`, `ticket_messages` | Ignore duplicate `src/firebase/tickets.js` shape or map it once. |
| `complaintsData.js` | Complaints | `complaints` | |
| `feedbackData.js` | Feedback | `feedback` | |
| `chatsData.js` | Chats | conversations, messages | |
| `eventsData.js` | Events | `events` | |
| `teamBroadcastsData.js` | Team accounts | `announcements` | |
| Banners page / `mockData.banners` | Banners | `banners` | |
| `geoAnalyticsData.js` | Geography | Aggregate of profiles | Keep map shapes in the repo. |
| `useLeaderboardData` | Leaderboard | Query or snapshot job | |
| `useDashboardData` | Dashboard KPIs | Queries | |
| `chamakzAdminSettings` | Admin preferences | Optional `admin_preferences` per admin | Not app config. |
| `indiaStateShapes.js` | Map | Stay in the client | Not a database table. |

Firestore shim collections returned by `seedCollections`: `users`, `hosts_application`, `support_chats` (messages nested), `complaints`, `banners`, `gifts`, `feedback`, `announcements`, `events`, `team_messages`, `live_streams`, `transactions`, `settings`. Several of these are **not** what the matching menu reads. When integrating, pick the menu’s data file as the field list, not every shim collection.

---

## 9. Permissions and security

Existing gaps:

- Mock login accepts any password. That must not ship.
- Control Center role is a dropdown. Any signed-in admin can open every route.
- Economy and seller mutations run in the browser. A user of the admin bundle can change balances locally. There is no server check.
- Payment secrets are cleared in memory after publish, which is correct for the demo, and insufficient for production. Use a secrets manager.
- Bank documents and full account numbers must not be world-readable.
- Gift and banner image uploads must be scanned and size-limited when storage is real.
- Idempotency exists only inside `diamondLedger.js` for one memory store.
- Audit rows can be lost on refresh. They need to be append-only in the database.
- Do not put service-role keys in Vite env vars. The browser should use the anon key and call RPCs. Staff auth should be separate from phone-user auth.

Recommended RLS sketch (not implemented):

- Phone users read their own profile, wallet balances, and their own transfers.
- Phone users read published config, active gifts, active banners.
- Phone users cannot update wallet balances.
- Admin role can read operational tables.
- Only specific RPCs insert ledger rows.
- `admin_audit_logs` insert-only.

---

## 10. Missing pieces and duplicates

### Duplicates (do not add a third copy)

1. Three user lists: directory, Firestore seed, economy seed.
2. Two gift price lists: catalog vs economy `GIFTS`.
3. Two withdrawal products: bank page vs economy page.
4. Two rate editors: Demo ledger rates vs Control Center.
5. Two maintenance messages: App accounts and App Settings.
6. Profile wallet math vs economy `userStatement`.
7. Seller ledger vs economy ledger.
8. Firestore helpers (`src/firebase/*.js`) vs `src/utils/*Data.js` for tickets, feedback, events, and chats.
9. `mockData.transactions` is a tiny sample and is not the Transactions page.

### Incomplete or visual only

- Video call billing, call history, host or user price overrides.
- Feature flags, safety thresholds, notification templates, and app version gates.
- Recording, viewer caps, and “gifts create earnings” as live enforcement.
- Host application approval does not grant host powers in the other mock stores.
- Events of kind “Coin campaign” do not credit diamonds.
- Team broadcasts are not delivered.
- Leaderboard and geography are derived displays.
- Dashboard economy card uses a new seed, so it will not match an edited Finance session.
- “Still to pay” on the dashboard is not the same formula as host `availableInr`.
- User profile tabs for dating, devices, KYC, and reports are generated.
- Live page does not play a stream.
- No breadcrumbs. Not required for the database.

### Recommended before Supabase tables are created

1. Choose the canonical editor for rates (section 6).
2. Choose whether seller diamonds are the same wallet as purchased diamonds.
3. Merge withdrawal statuses into one list.
4. Point Gift transfers at Gift catalog ids.
5. Define call billing only when the phone actually places video calls.
6. Keep audio out unless a new decision says otherwise.
7. Add server RPCs for every balance change. Then connect the screens. Do not start by swapping each `useState` for a table while the formulas still disagree.

---

## 11. Module dependency order

When a real database is connected, do it in this order so later screens have a parent row:

1. `admin_users`, roles, audit.
2. `profiles` (one person).
3. `user_diamond_wallets` and `host_earning_wallets`.
4. `app_config_documents` (published rates).
5. `gifts` catalog.
6. `payment_orders` and ledger (purchases).
7. `gift_transfers` (needs catalog, both wallets, config snapshot).
8. `host_applications` and host status on profiles.
9. `payout_methods` and `withdrawals`.
10. `diamond_sellers` posting into the same ledger.
11. Live sessions, then attach `live_session_id` on gifts.
12. Video call sessions, when the product has calls.
13. Tickets, complaints, feedback, chats.
14. Banners, events, announcements.
15. Dashboard, analytics, leaderboard, and geography as queries on the tables above.

Control Center can be stored early, but it has no effect until phone and ledger functions read it.

---

## 12. Integration roadmap (later phase, not this task)

1. Confirm the open rules in section 13.
2. Create the Supabase project and tables from section 5. Enable RLS before inserting real users.
3. Seed only reference data (roles, gift catalog, published config). Do not import the three conflicting mock user lists as if they were real customers.
4. Replace shim reads one menu at a time, starting with profiles and the gift catalog.
5. Move ledger writes to RPCs. Keep the circulation check as a test: difference must be 0.
6. Point the dashboard at the same queries as Finance Overview.
7. Remove or hide Demo ledger rates if Control Center is the source of truth.
8. Connect the phone app to the published config and the RPCs. Until that happens, the admin cannot change the phone by editing these screens.
9. Leave Firebase aliases in place until every page that imports `firebase/*` has a Supabase path. Then remove the dual stack.

This repository is not production-ready for real money, real KYC documents, or real gateway secrets.

---

## 13. NEEDS CONFIRMATION

1. Seller diamonds and purchased diamonds: one user wallet, or two products?
2. After go-live, is Control Center the only place to edit rates, with Demo ledger rates retired?
3. One withdrawal pipeline: bank verification plus economy entitlement?
4. Dashboard “still to pay”: host share minus paid only, or minus paid and still-open requests?
5. May a “Coin campaign” event credit diamonds?
6. Is Team accounts a staff directory, a broadcast tool, or both?
7. Should seller UPI be stored at all?
8. Audio calls stay removed?
9. Are host and user wallet freezes independent?
10. Profile numeric ids (`1001234`) and economy ids (`CHK1001`): which id does the phone use?
11. Does a gift have to happen inside a live session, or can it also happen in chat or on a profile?
12. Who may approve a withdrawal: Finance Admin only, or Super Admin as well? The control matrix does not grant Support or Moderator any finance publish rights, but the bank page has no role check.

---

## 14. File index for the next developer

| Area | Path |
| --- | --- |
| Routes | `src/App.jsx` |
| Menu | `src/layouts/Sidebar.jsx` |
| User directory | `src/utils/userManagementData.js`, `src/pages/Users.jsx`, `src/pages/UserProfile.jsx` |
| Firestore-shaped seed | `src/utils/mockData.js`, `src/firebase/shims/firestore.js` |
| Economy math | `src/economy/data.js`, `src/economy/EconomyContext.jsx`, `src/pages/economy/` |
| Dashboard revenue | `src/pages/Dashboard.jsx`, `src/components/dashboard/EconomyPanel.jsx` |
| Control Center | `src/control/schema.js`, `src/control/logic.js`, `src/control/ControlContext.jsx`, `src/pages/control/ControlPages.jsx` |
| Sellers and marketplace | `src/utils/diamondSellersData.js`, `src/utils/diamondLedger.js` |
| Bank payouts | `src/utils/withdrawalData.js`, `src/pages/Transactions.jsx` |
| Firebase gate | `vite.config.js`, `src/firebase/config.js` |
