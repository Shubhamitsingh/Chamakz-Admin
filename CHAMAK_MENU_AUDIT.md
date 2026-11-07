# Chamak admin menu audit

Date: 8 November 2026. Every sidebar item was checked against the other menus. A menu stays when it stores a different record. A menu was removed only when a second page could save the same business number or the same payout.

User Management filters (All Users, New, Active, and the rest) are one user list with different filters. They are not separate databases.

## Removed

| Removed menu | Why | The one page that stays |
| --- | --- | --- |
| Demo ledger rates | It edited diamonds per rupee, host share, and withdrawal limits again. Its minimum withdrawal was 100. Control uses 500. Two saved numbers would not match. | App diamond rates, and Withdrawal rules |
| Host payout requests | It was a second payout list, with its own statuses, beside Bank transactions. | Bank transactions |

Old links to those two pages now open the page that stays.

## Every menu that remains

| Menu | What it does | Same as another menu? |
| --- | --- | --- |
| Dashboard | Totals from the records below. It does not keep its own copy of users or money. | No |
| User Management and its filters | One account list: name, status, host or viewer. | No. Filters are the same list. |
| User Analytics | Charts of that same user list. | No |
| Follows | Who follows whom. One follow can be removed. | No. This is not the user list and not Complaints. |
| Host Applications | Host approval queue. | No. KYC review is the selfie check. |
| Live rooms | Live sessions: start, end, viewers. | No. Private call log is a video call, not a live room. |
| Private call log | One finished video call: caller, host, minutes, diamonds charged. | No. Video Call Pricing is only the rate. |
| Chats | Support inbox. | No. Private chats are user-to-user messages. |
| Gift catalog | Gift names and diamond prices. | No. Gift transfers are gifts that were sent. |
| Diamond Sellers | Seller accounts and their commission. | No |
| Diamond Marketplace | Seller recharge and transfer ledger. | No. This is not a user wallet purchase. |
| Finance Overview | Sums of purchases, wallets, gifts, and payouts. | No. It does not store a second balance. |
| Diamond Purchases | Money already paid, and whether it succeeded. | No. Coin packs are the recharge menu, not a past payment. |
| User Wallets | Diamonds a user can spend. | No. Host Earning Wallets are the host's earned diamonds. |
| Host Earning Wallets | Diamonds a host earned. | No |
| Gift transfers | A gift moving diamonds from a user to a host. | No |
| Earnings & Revenue Share | Host share and platform share of recorded earnings. | No. It does not set the rate. Withdrawal rules sets the share. |
| Diamond Circulation | Check that issued diamonds still match the two wallets. | No |
| Financial Reports | Export of the economy rows already on screen. | No |
| Ledger audit | History of ledger lines. | No |
| Bank transactions | The only host payout list: bank check, approve, pay. | No. The second payout list was removed. |
| Leaderboard & Rankings | Ranking rows. | No |
| Geography | Map of where users are. | No. Nearby only turns the Nearby screen on and limits countries. |
| Nearby | Nearby on or off, and which countries show. | No |
| Tickets / Support | Support tickets. | No |
| Complaints | A report filed against a user. | No. Blocks is a block between two users. |
| Feedback | Feedback messages. | No |
| Banners | Home banners. | No. Telegram popup is the channel popup. |
| Events | Campaign events. | No |
| Control overview | The list of control settings. | No |
| Video Call Pricing | The only video rate. The current number is 1,200 diamonds per minute. | No |
| Withdrawal rules | The only withdrawal limits, INR per earned diamond, and host/platform share. | No. Demo ledger rates was removed. |
| App diamond rates | The only diamonds-per-rupee and gift valuation. | No |
| Payment Gateways | Provider settings. The secret key is not shown in the browser. | No |
| App accounts | Switches for registration, host approval, and live eligibility. | No. This is not the user list. |
| Live room rules | Rules for opening a live room. | No. Live rooms are the sessions. |
| Notifications | How the app sends notifications. | No |
| User notification switches | One user's four switches: comments, new followers, likes, followed host is live. | No |
| Safety | Moderation rules. | No. Warnings are the warning rows on a profile. |
| Feature Flags | On/off for app features, including the referral switch. | No. Referrals is the invite list, not the switch. |
| App Settings | App name and support contact. | No. Admin preferences is only this browser. |
| Roles | Which staff role may edit which control page. | No |
| Config History | Earlier control publishes. | No |
| Warnings | A warning on one user: reason, count, date. The app shows up to 5. | No |
| Levels | Diamond requirement for each level, and the level saved on a profile. | No |
| Referrals | Invite code, who invited whom, and the diamond reward. | No |
| Blocks | Who blocked whom. Unblock removes that block. | No |
| Private chats | Private messages. A hidden message stays hidden. | No |
| KYC review | Selfie check: pending, approved, or rejected. | No |
| Host performance | One host's stream count, hours, peak viewers, and earnings, counted from live rooms and the host wallet. | No. It does not store a second earnings balance. |
| Coin packs | Recharge pack name, rupee price, diamonds, on or off. | No |
| Telegram popup | Channel link, text, and on or off. | No |
| Team accounts | Team broadcast messages. | No. This is not a staff directory. |
| Admin preferences | Dark mode and other choices saved on this computer only. | No |

## Not removed, because they are not the same record

Gift catalog and Gift transfers. User Wallets and Host Earning Wallets. Diamond Purchases and Coin packs. Chats and Private chats. Complaints and Blocks. Geography and Nearby. Notifications and User notification switches. Host Applications and KYC review. Live rooms and Private call log. Video Call Pricing and Private call log.

Host rules, FAQ, About, Privacy, and Terms are not in the admin menu. Those texts stay in the user app.
