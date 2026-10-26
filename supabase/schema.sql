-- Uruchom w Supabase → SQL Editor (można odpalić cały plik ponownie — IF NOT EXISTS)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  plan text not null default 'free',
  plus boolean not null default false,
  period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Own profile read" on public.profiles;
create policy "Own profile read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Own profile update" on public.profiles;
create policy "Own profile update"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  plus boolean not null default true,
  created_at timestamptz not null default now(),
  user_agent text,
  constraint signups_email_key unique (email)
);

create index if not exists signups_created_at_idx on public.signups (created_at desc);
alter table public.signups enable row level security;

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text not null default '/',
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);
create index if not exists visits_visitor_id_idx on public.visits (visitor_id);
create index if not exists visits_path_idx on public.visits (path);
alter table public.visits enable row level security;

-- Bany (visitor_id lub email)
create table if not exists public.bans (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('visitor', 'email')),
  value text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint bans_kind_value_key unique (kind, value)
);

create index if not exists bans_value_idx on public.bans (value);
alter table public.bans enable row level security;
