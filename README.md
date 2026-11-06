# Zanim

Poczekalnia zakupów — odczekaj, zanim wydasz pieniądze.

Sklepy krzyczą „kup teraz”. Zanim jest pauzą: wrzucasz rzecz, odczekujesz, i dopiero wtedy decydujesz — z chłodną głową.

## Co robi Zanim

1. **Wrzucasz chęć** — słuchawki, kurtka, weekend. Kwota, kategoria, tyle.
2. **Odczekujesz** — domyślnie 48 godzin. Plus pozwala ustawić od doby do miesiąca.
3. **Werdykt** — kupujesz albo odpuszczasz. Widzisz, ile godzin twojej pracy to było i ile zostało w kieszeni.

## Plan Plus (9 zł / mies. lub 79 zł / rok)

Oprócz braku limitu i własnego czasu oddechu, Plus daje spokojną analizę przed decyzją:

- **Analiza zakupu** — produkt, cena, powód
- **Ocena potrzeby** — pomaga odróżnić prawdziwą potrzebę od chwilowej zachcianki
- **Alternatywy** — tańsze rozwiązania, gdy mają sens
- **Personalizacja** — poznaje Twój sposób podejmowania decyzji
- **Podsumowania miesięczne** — ile wydałeś, ile zaoszczędziłeś, z czego zrezygnowałeś

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
