-- Zanim — powiadomienia push (Web Push / VAPID)
-- Uruchom w Supabase → SQL Editor (albo `supabase db push`). Bezpieczne do ponownego uruchomienia.
--
-- Model: aplikacja nie ma logowania (konto = imię + e-mail lokalnie), więc identyfikujemy
-- URZĄDZENIE: losowe device_id + sekret urządzenia (w bazie tylko jego hash SHA-256).
-- Wszystkie tabele mają włączone RLS i BRAK polityk → klucz anon/publiczny nie ma do nich
-- dostępu. Czyta i pisze wyłącznie serwer (/api/push/*, /api/cron/*) kluczem service_role.

create extension if not exists pgcrypto;

-- 1) Subskrypcje push (jedno urządzenie = jedna subskrypcja)
create table if not exists public.push_subscriptions (
  device_id text primary key check (char_length(device_id) between 16 and 64),
  secret_hash text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  timezone text not null default 'Europe/Warsaw',
  first_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  -- zagregowane statystyki z urządzenia (tylko gdy włączone „Motywacyjne”):
  -- liczba rzeczy w poczekalni, odpuszczone kwoty tydzień/miesiąc itp. Bez nazw produktów.
  stats jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_last_active_idx on public.push_subscriptions (last_active_at);
alter table public.push_subscriptions enable row level security;

-- 2) Preferencje powiadomień (3 kategorie + cisza nocna)
create table if not exists public.notification_prefs (
  device_id text primary key references public.push_subscriptions (device_id) on delete cascade,
  automatic boolean not null default true,
  motivational boolean not null default true,
  marketing boolean not null default false,          -- RODO: domyślnie WYŁĄCZONE (opt-in)
  marketing_consent_at timestamptz,                   -- kiedy wyrażono zgodę marketingową
  quiet_start smallint not null default 21 check (quiet_start between 0 and 23),
  quiet_end smallint not null default 9 check (quiet_end between 0 and 23),
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;

-- 3) Minimalne dane produktów do przypomnień „minęło 48 h” (tylko gdy włączone „Automatyczne”)
--    Tytuł i moment „gotowe”. Bez kwot, notatek, kategorii.
create table if not exists public.push_items (
  device_id text not null references public.push_subscriptions (device_id) on delete cascade,
  item_id text not null check (char_length(item_id) <= 64),
  title text not null check (char_length(title) <= 120),
  ready_at timestamptz not null,
  notified_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (device_id, item_id)
);
create index if not exists push_items_due_idx on public.push_items (ready_at) where notified_at is null;
alter table public.push_items enable row level security;

-- 4) Dziennik wysłanych powiadomień (limity, brak duplikatów, statystyki)
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.push_subscriptions (device_id) on delete cascade,
  category text not null check (category in ('automatic', 'motivational', 'marketing')),
  kind text not null,          -- np. ready, readyMany, comeback-7, weekly, campaign:<id>
  message_key text not null,   -- wariant treści, np. active#2 (żeby nie powtarzać)
  title text,
  body text,
  url text,
  status text not null default 'sent' check (status in ('sent', 'failed', 'gone')),
  sent_at timestamptz not null default now()
);
create index if not exists notification_log_device_sent_idx on public.notification_log (device_id, sent_at desc);
create index if not exists notification_log_kind_idx on public.notification_log (kind);
alter table public.notification_log enable row level security;

-- Sprzątanie: dziennik starszy niż 180 dni można usuwać (np. ręcznie lub pg_cron):
-- delete from public.notification_log where sent_at < now() - interval '180 days';

-- RLS — uwagi:
-- * Nie dodajemy polityk dla ról anon/authenticated. Dzięki temu nikt z przeglądarki
--   (kluczem VITE_SUPABASE_ANON_KEY) nie odczyta subskrypcji ani dziennika.
-- * Serwer używa SUPABASE_SERVICE_ROLE_KEY, który omija RLS — trzymaj go tylko w Vercel (Server).
-- * Usunięcie wiersza z push_subscriptions kasuje kaskadowo prefs, items i log urządzenia
--   (to realizuje „usuń moje dane powiadomień” z ekranu Powiadomienia).
