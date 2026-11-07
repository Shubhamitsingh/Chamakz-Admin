-- Admin pages for features that exist in the user app but were not in the admin panel.
-- Additive only. No sample people, calls, chats, warnings, or KYC photos.

alter table public.profiles
  add column if not exists user_level integer not null default 0 check (user_level >= 0 and user_level <= 50),
  add column if not exists host_level integer not null default 0 check (host_level >= 0 and host_level <= 50);

create table if not exists public.user_warnings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  user_label text not null,
  reason text not null,
  warning_count integer not null default 1 check (warning_count >= 0),
  status text not null default 'active' check (status in ('active', 'removed')),
  hold_account boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.level_rules (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('user', 'host')),
  level integer not null check (level >= 0 and level <= 50),
  diamonds_required bigint not null check (diamonds_required >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audience, level)
);

create table if not exists public.referral_settings (
  id boolean primary key default true check (id),
  reward_diamonds integer not null default 50 check (reward_diamonds >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null,
  inviter_label text not null,
  invitee_label text not null,
  reward_diamonds integer not null check (reward_diamonds >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.private_calls (
  id uuid primary key default gen_random_uuid(),
  caller_label text not null,
  host_label text not null,
  minutes numeric(10,2) not null check (minutes >= 0),
  diamonds_charged integer not null check (diamonds_charged >= 0),
  started_at timestamptz not null default now(),
  status text not null default 'completed' check (status in ('completed', 'missed', 'cancelled', 'ongoing')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_label text not null,
  following_label text not null,
  created_at timestamptz not null default now(),
  unique (follower_label, following_label)
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_label text not null,
  blocked_label text not null,
  created_at timestamptz not null default now(),
  unique (blocker_label, blocked_label)
);

create table if not exists public.private_chats (
  id uuid primary key default gen_random_uuid(),
  participant_a text not null,
  participant_b text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.private_chats (id) on delete cascade,
  sender_label text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.kyc_reviews (
  id uuid primary key default gen_random_uuid(),
  applicant_label text not null,
  legal_name text not null,
  selfie_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.host_rules (
  id boolean primary key default true check (id),
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_inr numeric(12,2) not null check (price_inr >= 0),
  original_price_inr numeric(12,2) check (original_price_inr is null or original_price_inr >= 0),
  diamonds integer not null check (diamonds >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_content_pages (
  slug text primary key check (slug in ('help_faq', 'about', 'privacy', 'terms')),
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_popup (
  id boolean primary key default true check (id),
  link text not null default '',
  body text not null default '',
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.nearby_settings (
  id boolean primary key default true check (id),
  is_enabled boolean not null default true,
  countries text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.user_notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_label text not null unique,
  comments boolean not null default true,
  new_followers boolean not null default true,
  likes boolean not null default true,
  followed_host_live boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_warnings_user_idx on public.user_warnings (user_label);
create index if not exists private_calls_started_idx on public.private_calls (started_at desc);
create index if not exists private_chat_messages_chat_idx on public.private_chat_messages (chat_id, created_at);

insert into public.level_rules (audience, level, diamonds_required)
select audience, level, diamonds
from (
  select unnest(array['user', 'host']) as audience
) audiences
cross join (
  values
    (0, 0::bigint),
    (1, 10000),
    (2, 30000),
    (3, 100000),
    (4, 300000),
    (5, 1000000),
    (6, 3000000),
    (7, 10000000),
    (8, 30000000),
    (9, 100000000),
    (10, 300000000),
    (20, 1000000000),
    (30, 3000000000),
    (40, 10000000000),
    (50, 30000000000)
) as steps(level, diamonds)
on conflict (audience, level) do nothing;

insert into public.referral_settings (id, reward_diamonds)
values (true, 50)
on conflict (id) do nothing;

insert into public.host_rules (id, body)
values (true, '')
on conflict (id) do nothing;

insert into public.coin_packs (name, price_inr, original_price_inr, diamonds, is_active)
values
  ('8,000 diamonds', 599.00, 899.00, 8000, true),
  ('13,000 diamonds', 999.00, 1499.00, 13000, true),
  ('28,000 diamonds', 1999.00, 2499.00, 28000, true),
  ('50,000 diamonds', 2999.00, 3748.75, 50000, true)
on conflict (name) do nothing;

insert into public.app_content_pages (slug, title, body)
values
  ('help_faq', 'Help FAQ', ''),
  ('about', 'About', ''),
  ('privacy', 'Privacy', ''),
  ('terms', 'Terms', '')
on conflict (slug) do nothing;

insert into public.telegram_popup (id, link, body, is_enabled)
values (
  true,
  'https://t.me/+kwidFzpWJ-k4ZTdl',
  E'Stay updated and enjoy exclusive benefits by joining our official Telegram channel:\nSpecial user rewards\nPriority access to events\nLucky draws & bonus activities',
  true
)
on conflict (id) do nothing;

insert into public.nearby_settings (id, is_enabled, countries)
values (true, true, '{}')
on conflict (id) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_warnings', 'level_rules', 'referral_settings', 'referrals', 'private_calls',
    'user_follows', 'user_blocks', 'private_chats', 'private_chat_messages', 'kyc_reviews',
    'host_rules', 'coin_packs', 'app_content_pages', 'telegram_popup', 'nearby_settings',
    'user_notification_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_all', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (private.is_admin()) with check (private.is_admin())',
      table_name || '_admin_all',
      table_name
    );
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end $$;

-- The user app can read published settings before it has an admin login.
-- Private user records stay admin-only.
grant select on public.level_rules, public.host_rules, public.coin_packs, public.app_content_pages, public.telegram_popup, public.nearby_settings, public.referral_settings to anon;

drop policy if exists level_rules_public_read on public.level_rules;
create policy level_rules_public_read on public.level_rules for select to anon using (true);
drop policy if exists host_rules_public_read on public.host_rules;
create policy host_rules_public_read on public.host_rules for select to anon using (true);
drop policy if exists coin_packs_public_read on public.coin_packs;
create policy coin_packs_public_read on public.coin_packs for select to anon using (true);
drop policy if exists app_content_pages_public_read on public.app_content_pages;
create policy app_content_pages_public_read on public.app_content_pages for select to anon using (true);
drop policy if exists telegram_popup_public_read on public.telegram_popup;
create policy telegram_popup_public_read on public.telegram_popup for select to anon using (true);
drop policy if exists nearby_settings_public_read on public.nearby_settings;
create policy nearby_settings_public_read on public.nearby_settings for select to anon using (true);
drop policy if exists referral_settings_public_read on public.referral_settings;
create policy referral_settings_public_read on public.referral_settings for select to anon using (true);
