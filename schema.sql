-- ============================================
-- SQL Schema - Brasov Ukrainian TMA (v3)
-- ============================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_role as enum ('user', 'admin');
create type listing_status as enum ('pending', 'approved', 'rejected');
create type currency_type as enum ('RON', 'EUR', 'UAH');

-- 3. TABLES

-- PROFILES
-- NOTE: status column added (was missing in v1 schema)
create table public.profiles (
    id text primary key, -- tg-XXXXX
    telegram_id bigint unique not null,
    username text,
    first_name text not null,
    role user_role default 'user'::user_role,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CATEGORIES
create table public.categories (
    id text primary key default 'cat-' || uuid_generate_v4()::text,
    slug text unique not null,
    name_uk text not null,
    name_ro text not null,
    name_en text not null,
    icon text not null
);

-- LISTINGS
create table public.listings (
    id text primary key default 'lst-' || uuid_generate_v4()::text,
    user_id text references public.profiles(id) on delete cascade not null,
    category_id text references public.categories(id) on delete set null not null,
    title text not null,
    description text not null,
    price numeric,
    currency currency_type,
    photos text[] default '{}'::text[] not null,
    telegram_username text not null,
    status listing_status default 'pending'::listing_status not null,
    -- NEW: reason shown to specialist when listing is rejected
    rejection_reason text,
    rating_avg numeric default 0.0 not null,

    -- Geolocation
    latitude double precision,
    longitude double precision,
    address_text text,

    -- Carpooling / Transportation
    departure_date date,
    departure_time time,
    origin text,
    destination text,

    -- Legacy flag (kept for compatibility)
    is_featured boolean default false not null,

    -- MVP specialist fields
    languages text[] default '{"RU"}'::text[] not null,
    districts text[] default '{}'::text[] not null,
    services text[] default '{}'::text[] not null,
    phone text,
    is_verified boolean default false not null,
    promotion_level text default 'free' check (promotion_level in ('free', 'basic', 'premium')) not null,
    promotion_until timestamp with time zone,

    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BLACKLIST
create table public.blacklist (
    id text primary key default 'bl-' || uuid_generate_v4()::text,
    telegram_id bigint unique not null,
    reason_uk text not null,
    reason_ro text not null,
    reason_en text not null,
    proof_url text,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REVIEWS
create table public.reviews (
    id text primary key default 'rev-' || uuid_generate_v4()::text,
    listing_id text references public.listings(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    rating integer check (rating >= 1 and rating <= 5) not null,
    comment text,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')) not null,
    owner_reply text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (listing_id, user_id)
);

-- REVIEW COMPLAINTS
create table public.review_complaints (
    id text primary key default 'rc-' || uuid_generate_v4()::text,
    review_id text references public.reviews(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    reason text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (review_id, user_id)
);

-- CHAT MESSAGES
create table public.chat_messages (
    id text primary key default 'msg-' || uuid_generate_v4()::text,
    room_id text not null default 'community',
    user_id text references public.profiles(id) on delete cascade not null,
    body text not null default '',
    attachment_url text,
    attachment_type text check (attachment_type in ('image', 'file')),
    attachment_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS
-- NEW: was missing from schema entirely
create table public.notifications (
    id text primary key default 'ntf-' || uuid_generate_v4()::text,
    user_id text references public.profiles(id) on delete cascade not null,
    type text check (type in (
        'profile_approved',
        'profile_rejected',
        'listing_approved',
        'listing_rejected',
        'chat_message',
        'review_received'
    )) not null,
    title_uk text not null,
    title_ro text not null,
    title_en text not null,
    body_uk text not null,
    body_ro text not null,
    body_en text not null,
    link text,
    read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANALYTICS EVENTS
-- NEW: was missing from schema entirely
create table public.analytics_events (
    id text primary key default 'ae-' || uuid_generate_v4()::text,
    listing_id text references public.listings(id) on delete cascade not null,
    event_type text check (event_type in ('view', 'click_contact')) not null,
    -- Optional: Telegram user_id for deduplication (can be null for anonymous)
    user_id text references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INDEXES
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_category_id on public.listings(category_id);
create index if not exists idx_listings_promotion on public.listings(promotion_level, rating_avg desc);
create index if not exists idx_reviews_listing_id on public.reviews(listing_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_notifications_user_id on public.notifications(user_id, read);
create index if not exists idx_analytics_listing_id on public.analytics_events(listing_id);
create index if not exists idx_chat_messages_room on public.chat_messages(room_id, created_at asc);

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_complaints enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.analytics_events enable row level security;

-- Profiles: anyone can read, users can update own profile
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (auth.uid()::text = id);

-- Listings: approved listings visible to all; owner and admin can manage
create policy "listings_select_approved" on public.listings for select using (status = 'approved');
create policy "listings_select_own" on public.listings for select using (auth.uid()::text = user_id);
create policy "listings_insert" on public.listings for insert with check (auth.uid()::text = user_id);
create policy "listings_update_own" on public.listings for update using (auth.uid()::text = user_id);

-- Reviews: approved reviews visible to all; owner can read own pending
create policy "reviews_select_approved" on public.reviews for select using (status = 'approved');
create policy "reviews_select_own" on public.reviews for select using (auth.uid()::text = user_id);
create policy "reviews_insert" on public.reviews for insert with check (auth.uid()::text = user_id);

-- Notifications: users see only own notifications
create policy "notifications_select_own" on public.notifications for select using (auth.uid()::text = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid()::text = user_id);

-- Analytics: anyone can insert events; only admins read
create policy "analytics_insert" on public.analytics_events for insert with check (true);

-- Chat messages: approved users only
create policy "chat_select" on public.chat_messages for select using (true);
create policy "chat_insert" on public.chat_messages for insert with check (auth.uid()::text = user_id);

-- 6. SEED: default categories
insert into public.categories (id, slug, name_uk, name_ro, name_en, icon) values
('cat-accounting',   'accounting',   'Бухгалтерія та юристи',   'Contabilitate și avocați', 'Accounting & Legal',   '⚖️'),
('cat-medicine',     'medicine',     'Медицина',                  'Medicină',                  'Medicine',              '🏥'),
('cat-education',    'education',    'Освіта та репетитори',      'Educație și tutori',        'Education & Tutors',    '📚'),
('cat-beauty',       'beauty',       'Краса та здоров''я',        'Frumusețe și sănătate',     'Beauty & Health',       '💄'),
('cat-home',         'home',         'Будинок та ремонт',         'Casă și reparații',         'Home & Repair',         '🔧'),
('cat-auto',         'auto',         'Авто',                      'Auto',                      'Auto',                  '🚗'),
('cat-children',     'children',     'Діти та няні',              'Copii și bone',             'Children & Nannies',    '👶'),
('cat-documents',    'documents',    'Переїзд та документи',      'Mutare și documente',       'Relocation & Documents','📄'),
('cat-freelance',    'freelance',    'Фріланс та IT',             'Freelance și IT',           'Freelance & IT',        '💻'),
('cat-transport',    'transport',    'Карпулінг / Транспорт',     'Carpooling / Transport',    'Carpooling / Transport','🚌'),
('cat-other',        'other',        'Інше',                      'Altele',                    'Other',                 '🗂️')
on conflict (id) do nothing;
