-- Payments: Stripe + Telegram Stars
create table if not exists public.payments (
  id            text primary key default 'pay-' || uuid_generate_v4()::text,
  listing_id    text references public.listings(id) on delete cascade not null,
  user_id       text references public.profiles(id) on delete cascade not null,
  provider      text not null check (provider in ('stripe', 'stars')),
  plan          text not null check (plan in ('basic', 'premium', 'boost')),
  currency      text not null check (currency in ('EUR', 'RON', 'XTR')),
  amount        integer not null, -- cents for EUR/RON, stars for XTR
  status        text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id      text,
  stripe_payment_intent  text,
  telegram_charge_id     text,
  created_at    timestamp with time zone default timezone('utc', now()) not null,
  paid_at       timestamp with time zone
);

alter table public.payments enable row level security;

-- Users can read their own payments
create policy "own payments read" on public.payments
  for select using (auth.uid()::text = user_id);

-- Service role bypasses RLS (used by edge functions for inserts/updates)
