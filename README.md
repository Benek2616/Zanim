# Zanim

Poczekalnia zakupów — odczekaj 48 godzin, zanim wydasz pieniądze.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja startuje na http://localhost:8080

## Skrypty

- `npm run dev` — tryb deweloperski
- `npm run build` — build produkcyjny
- `npm run test` — testy
- `npm run typecheck` — sprawdzenie typów

## Struktura

- `src/routes/` — strony (TanStack Router)
- `src/components/` — komponenty UI
- `src/lib/` — logika, store, auth, db
- `scripts/` — narzędzia build/test
- `server/` — middleware Nitro / PWA
- `public/` — assety statyczne
