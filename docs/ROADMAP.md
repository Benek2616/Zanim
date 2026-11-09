# Roadmap Zanim — największe braki

## 1. Pełne płatności (Stripe)

**Stan:** Cennik pokazuje 9,99 zł / mies. i 79,99 zł / rok. UI i plany są gotowe.

**Do zrobienia:**
- Podłączyć Stripe (klucze w Vercel Environment Variables)
- Endpoint `/api/create-checkout` → sesja Stripe
- Webhook `/api/stripe-webhook` → aktualizacja `entitlements`
- W `konto.tsx` przyciski „Wykup Plus” zamiast darmowego konta

## 2. Synchronizacja między urządzeniami

**Stan:** Dane są lokalne (Zustand persist + localStorage).

**Do zrobienia:**
- Supabase Auth (email magic link lub Google)
- Tabela `items`, `profiles`, `entitlements`
- Sync przy starcie i po zmianach (lub realtime)
- Konflikt resolution (last-write-wins lub timestamp)

## 3. Dojrzalsze AI + social proof

**Stan (zrobione w tej iteracji):**
- Analiza uwzględnia historię kategorii
- Lepsze pytania i insighty
- Przygotowane miejsce na opinie

**Następne:**
- Prawdziwy model (np. przez Vercel AI SDK + OpenAI/Anthropic)
- Zbieranie opinii w chmurze + wyświetlanie na stronie
- Social proof na landingu (liczba oszczędzonych zł, średnia ocena)

## Priorytet

1. Stripe (monetyzacja)
2. Supabase Auth + sync
3. Real AI + opinie w chmurze
