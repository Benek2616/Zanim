# Modele monetyzacji

## Obecny stan

- **Darmowy**: 0 zł — 5 rzeczy, 48 h, podstawowy werdykt.
- **Plus**: **9,99 zł / miesiąc** lub **79,99 zł / rok**.
- Analiza AI, brak limitu, własny czas, raporty — w Plusie.

Płatności Stripe nie są jeszcze podłączone. UI i plany są gotowe.

## Co trzeba zrobić, żeby Plus naprawdę monetyzował

1. Stripe — produkty + price ID (już w `.env.example`).
2. Endpoint checkout + webhook.
3. W `konto.tsx` przyciski „Wykup Plus” zamiast darmowego konta.
4. Regulamin płatności i dane sprzedawcy.

## Synchronizacja

Dane są lokalne. Do sync między urządzeniami:

- Supabase Auth + tabele `items` / `profiles` / `entitlements`.
- Sync przy starcie i po zmianach.

Szczegóły w `docs/ROADMAP.md`.
