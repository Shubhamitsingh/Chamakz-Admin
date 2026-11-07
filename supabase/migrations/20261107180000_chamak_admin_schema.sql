-- Chamak admin schema. Additive. No sample users, payments, gifts, or live rooms.

create schema if not exists private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role_id uuid not null references public.admin_roles (id),
  display_name text not null,
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = (select auth.uid())
      and status = 'active'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table public.admin_role_grants (
  role_id uuid not null references public.admin_roles (id) on delete cascade,
  category_key text not null,
  primary key (role_id, category_key)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  numeric_id text not null unique,
  username text not null,
  display_name text not null,
  email text,
  phone text,
  gender text,
  dob date,
  country text,
  state text,
  city text,
  is_host boolean not null default false,
  host_status text not null default 'none' check (host_status in ('none', 'pending', 'approved', 'rejected', 'suspended')),
  vip boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'blocked')),
  verification text not null default 'none' check (verification in ('none', 'pending', 'verified', 'rejected')),
  agency_name text,
  has_photo boolean not null default false,
  email_verified boolean not null default false,
  location_granted boolean not null default false,
  interests text[] not null default '{}',
  dating_complete boolean not null default false,
  signup_source text,
  platform text,
  app_version text,
  online boolean not null default false,
  reported boolean not null default false,
  restrict_live boolean not null default false,
  restrict_chat boolean not null default false,
  last_login_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));
create unique index profiles_phone_idx on public.profiles (phone) where phone is not null;
create index profiles_status_idx on public.profiles (status);
create index profiles_host_idx on public.profiles (is_host, host_status);

create table public.profile_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.admin_users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.host_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  applicant_name text not null,
  email text,
  phone text,
  numeric_id text,
  category text,
  pitch text,
  experience text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reject_reason text,
  reviewed_by uuid references public.admin_users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index host_applications_status_idx on public.host_applications (status);

create table public.user_diamond_wallets (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  status text not null default 'active' check (status in ('active', 'frozen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.host_earning_wallets (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  diamonds_received integer not null default 0 check (diamonds_received >= 0),
  host_inr_accrued numeric(14,2) not null default 0 check (host_inr_accrued >= 0),
  status text not null default 'active' check (status in ('active', 'frozen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diamond_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  wallet_kind text not null check (wallet_kind in ('user', 'host_earning')),
  entry_type text not null check (entry_type in (
    'purchase_credit', 'refund_debit', 'admin_credit', 'admin_debit',
    'gift_debit', 'gift_credit', 'seller_transfer_credit', 'seller_transfer_debit', 'reversal'
  )),
  diamonds integer not null,
  inr_amount numeric(14,2),
  rate_snapshot numeric(12,4),
  reference_table text,
  reference_id uuid,
  idempotency_key text not null unique,
  admin_id uuid references public.admin_users (id),
  reason text,
  created_at timestamptz not null default now()
);

create index ledger_profile_idx on public.diamond_ledger_entries (profile_id, created_at desc);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  cost_diamonds integer not null check (cost_diamonds > 0),
  image_path text,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gift_transfers (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts (id),
  sender_id uuid not null references public.profiles (id),
  host_id uuid not null references public.profiles (id),
  live_session_id uuid,
  diamonds integer not null check (diamonds > 0),
  valuation_rate numeric(12,4) not null,
  host_share_pct numeric(5,2) not null,
  platform_share_pct numeric(5,2) not null,
  gross_inr numeric(14,2) not null,
  host_inr numeric(14,2) not null,
  platform_inr numeric(14,2) not null,
  status text not null default 'success' check (status in ('success', 'reversed')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  check (host_share_pct + platform_share_pct = 100)
);

create index gift_transfers_created_idx on public.gift_transfers (created_at desc);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  inr numeric(14,2) not null check (inr > 0),
  diamonds_issued integer not null default 0 check (diamonds_issued >= 0),
  rate_snapshot numeric(12,4) not null,
  gateway text,
  method text,
  status text not null check (status in ('pending', 'success', 'failed', 'refunded')),
  gateway_payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payment_orders_created_idx on public.payment_orders (created_at desc);

create table public.payout_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  holder_name text,
  account_last4 text,
  ifsc text,
  bank_name text,
  branch text,
  account_type text,
  verification_status text not null default 'not_submitted' check (verification_status in ('not_submitted', 'pending', 'verified', 'rejected', 'update_requested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id),
  amount_inr numeric(14,2) not null check (amount_inr > 0),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'on_hold', 'approved', 'rejected', 'processing', 'paid')),
  payout_method_id uuid references public.payout_methods (id),
  utr text,
  rejection_reason text,
  idempotency_key text not null unique,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz,
  reviewed_by uuid references public.admin_users (id)
);

create index withdrawals_status_idx on public.withdrawals (status);

create table public.diamond_sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  commission_pct numeric(5,2) not null default 5 check (commission_pct >= 0 and commission_pct <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.diamond_sellers (id),
  profile_id uuid references public.profiles (id),
  diamonds integer not null check (diamonds > 0),
  amount_inr numeric(14,2) not null default 0,
  status text not null check (status in ('pending', 'accepted', 'processing', 'completed', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.diamond_sellers (id),
  amount_inr numeric(14,2) not null check (amount_inr >= 0),
  status text not null check (status in ('pending', 'approved', 'processing', 'paid', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id),
  title text,
  status text not null check (status in ('live', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  peak_viewers integer,
  playback_url text,
  created_at timestamptz not null default now()
);

create index live_sessions_status_idx on public.live_sessions (status);

alter table public.gift_transfers
  add constraint gift_transfers_live_session_fk
  foreign key (live_session_id) references public.live_sessions (id);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  subject text not null,
  category text,
  priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
  assignee_id uuid references public.admin_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  admin_id uuid references public.admin_users (id),
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id),
  reported_id uuid references public.profiles (id),
  category text,
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'pending' check (status in ('pending', 'investigating', 'escalated', 'resolved', 'dismissed')),
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  subject text,
  body text,
  kind text,
  rating integer check (rating between 1 and 5),
  status text not null default 'new' check (status in ('new', 'reviewed', 'actioned', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  subject text,
  status text not null default 'open' check (status in ('open', 'closed')),
  unread_by_admin integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'host', 'admin')),
  admin_id uuid references public.admin_users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_path text,
  is_active boolean not null default true,
  priority integer not null default 0,
  action_type text,
  action_target text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  kind text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'ended')),
  audience text,
  priority text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience text,
  priority text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_path text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_config_documents (
  category_key text primary key,
  document jsonb not null,
  version integer not null default 1,
  published_by uuid references public.admin_users (id),
  reason text,
  updated_at timestamptz not null default now()
);

create table public.app_config_revisions (
  id uuid primary key default gen_random_uuid(),
  category_key text not null references public.app_config_documents (category_key),
  version integer not null,
  before_document jsonb,
  after_document jsonb not null,
  reason text not null,
  admin_id uuid references public.admin_users (id),
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users (id),
  action text not null,
  entity_table text,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

insert into public.admin_roles (name) values
  ('Super Admin'),
  ('Finance Admin'),
  ('Operations Admin'),
  ('Support Admin'),
  ('Moderator');

insert into public.admin_role_grants (role_id, category_key)
select id, key
from public.admin_roles
cross join lateral (
  select unnest(array['calls','withdrawals','diamonds','payments','users','live','notifications','safety','features','app','roles']) as key
) keys
where name = 'Super Admin';

insert into public.app_config_documents (category_key, document, reason) values
  ('calls', '{"videoEnabled":true,"videoRate":1200,"videoMinSeconds":10,"videoInterval":60,"videoFreeSeconds":0,"videoGraceSeconds":5,"hostOverride":false,"userOverride":false,"rounding":"Round up"}'::jsonb, 'Initial published video settings'),
  ('withdrawals', '{"diamondInr":0.1,"minWithdrawal":500,"maxWithdrawal":50000,"minEligible":500,"maxDaily":20000,"maxMonthly":100000,"hostShare":50,"platformShare":50,"approvalRequired":true}'::jsonb, 'Initial published withdrawal settings'),
  ('diamonds', '{"diamondsPerInr":10,"giftValuation":0.1,"minGift":50,"maxGift":10000,"manualCredit":true}'::jsonb, 'Initial published diamond settings');

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_roles','admin_users','admin_role_grants','profiles','profile_notes','host_applications',
    'user_diamond_wallets','host_earning_wallets','gifts','payout_methods','withdrawals',
    'diamond_sellers','seller_orders','seller_payouts','live_sessions','tickets','ticket_messages',
    'complaints','feedback','conversations','messages','banners','events','announcements',
    'app_config_documents','app_config_revisions'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_all', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (private.is_admin()) with check (private.is_admin())',
      table_name || '_admin_all',
      table_name
    );
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end $$;

alter table public.diamond_ledger_entries enable row level security;
alter table public.gift_transfers enable row level security;
alter table public.payment_orders enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy diamond_ledger_entries_admin_read on public.diamond_ledger_entries
  for select to authenticated using (private.is_admin());
create policy gift_transfers_admin_read on public.gift_transfers
  for select to authenticated using (private.is_admin());
create policy payment_orders_admin_read on public.payment_orders
  for select to authenticated using (private.is_admin());
create policy admin_audit_logs_admin_read on public.admin_audit_logs
  for select to authenticated using (private.is_admin());
create policy admin_audit_logs_admin_insert on public.admin_audit_logs
  for insert to authenticated with check (private.is_admin());

revoke all on table public.diamond_ledger_entries from anon, authenticated;
revoke all on table public.gift_transfers from anon, authenticated;
revoke all on table public.payment_orders from anon, authenticated;
revoke all on table public.admin_audit_logs from anon, authenticated;
grant select on table public.diamond_ledger_entries to authenticated;
grant select on table public.gift_transfers to authenticated;
grant select on table public.payment_orders to authenticated;
grant select, insert on table public.admin_audit_logs to authenticated;
