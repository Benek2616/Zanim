# Minimalna ścieżka: sprzedaż planu Plus

## 1. Supabase (konta + baza)
1. Załóż projekt na https://supabase.com
2. Project Settings → API → skopiuj `URL` i `anon key` oraz `service_role` (secret)
3. SQL Editor → wklej i uruchom plik `supabase/schema.sql`
4. Authentication → Providers → Email włączony (Magic link lub hasło)

## 2. Stripe (płatności)
1. Załóż konto https://dashboard.stripe.com (najpierw tryb **Test**)
2. Developers → API keys → Secret key + Publishable key
3. Product catalogue → dodaj produkt **Zanim Plus**:
   - Cena cykliczna 9 zł / miesiąc → skopiuj `price_...`
   - Cena cykliczna 79 zł / rok → skopiuj `price_...`
4. Developers → Webhooks → Add endpoint:
   - URL: `https://TWOJA_DOMENA/api/stripe/webhook`
   - Zdarzenia: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Skopiuj **Signing secret** (`whsec_...`)

## 3. Vercel – zmienne środowiskowe
Ustaw wszystkie z `.env.example` (Production + Preview).

Redeploy po zapisaniu env.

## 4. Test
1. Wejdź w apkę → **Więcej → Menu** → zaloguj się mailem
2. **Plus** → Wybieram (miesiąc/rok) → Stripe Checkout (karta testowa `4242 4242 4242 4242`)
3. Po powrocie plan Plus powinien być aktywny
4. Anulowanie: Customer Portal albo w Stripe Dashboard

## 5. Produkcja
- Stripe: przełącz na **Live keys** i live Price ID
- Uzupełnij dane sprzedawcy w regulaminie
- Weryfikacja firmy w Stripe (wypłaty)
