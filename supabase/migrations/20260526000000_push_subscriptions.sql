-- Push subscriptions for Web Push notifications
create table if not exists public.push_subscriptions (
  id          text primary key default 'sub-' || uuid_generate_v4()::text,
  user_id     text references public.profiles(id) on delete cascade not null,
  subscription jsonb not null,  -- PushSubscription JSON {endpoint, keys: {auth, p256dh}}
  created_at  timestamp with time zone default timezone('utc', now()) not null,
  unique (user_id, (subscription->>'endpoint'))
);

-- RLS: users can only manage their own subscriptions
alter table public.push_subscriptions enable row level security;

create policy "own subscriptions" on public.push_subscriptions
  for all using (auth.uid()::text = user_id);

-- Service role bypasses RLS (used by edge functions)
