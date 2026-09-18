import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { notificationPermission, requestNotifications } from "@/lib/notify";
import { isPlusActive, useZanim } from "@/lib/store";
import { PLANS } from "@/lib/zanim";

export const Route = createFileRoute("/konto")({ component: Konto });

function Konto() {
  const profile = useZanim((s) => s.profile);
  const entitlements = useZanim((s) => s.entitlements);
  const setProfile = useZanim((s) => s.setProfile);
  const cancelPlus = useZanim((s) => s.cancelPlus);
  const resumePlus = useZanim((s) => s.resumePlus);
  const plus = isPlusActive(entitlements);

  const [name, setName] = useState(profile.displayName);
  const [income, setIncome] = useState(
    profile.monthlyIncomeGrosze ? String(profile.monthlyIncomeGrosze / 100) : "",
  );
  const [hours, setHours] = useState(profile.monthlyHours);
  const [saved, setSaved] = useState<string | null>(null);
  const [perm, setPerm] = useState(() =>
    typeof window === "undefined" ? "default" : notificationPermission(),
  );

  useEffect(() => {
    setName(profile.displayName);
    setIncome(profile.monthlyIncomeGrosze ? String(profile.monthlyIncomeGrosze / 100) : "");
    setHours(profile.monthlyHours);
  }, [profile]);

  const plan = PLANS[entitlements.plan];
  const periodEnd = entitlements.periodEnd
    ? new Date(entitlements.periodEnd).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  function saveRate(e: FormEvent) {
    e.preventDefault();
    const n = Number(income.replace(",", "."));
    setProfile({
      displayName: name.trim(),
      monthlyIncomeGrosze: Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null,
      monthlyHours: Math.min(400, Math.max(1, hours || 160)),
    });
    setSaved("Zapisane.");
  }

  return (
    <div className="rise-in grid gap-10 pb-10">
      <section>
        <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Konto</p>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">
          {profile.displayName.trim() || "Twoje konto"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Dane zostają na tym telefonie. Bez serwera, bez konta w chmurze.
        </p>
      </section>

      <section className="rounded-xl bg-surface p-5 ring-1 ring-line">
        <h2 className="font-serif text-xl font-medium">Subskrypcja</h2>
        <p className="mt-2 text-sm text-muted">
          Teraz: <span className="font-medium text-fg">{plan.name}</span>
          {periodEnd && plus ? ` · aktywna do ${periodEnd}` : ""}
        </p>
        {entitlements.cancelAtPeriodEnd && plus ? (
          <p className="mt-2 text-sm text-warn">Anulowana — działa do końca okresu.</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!plus ? (
            <Link to="/cennik">
              <Button>Wykup Plus — 9 zł</Button>
            </Link>
          ) : null}
          {plus && !entitlements.cancelAtPeriodEnd ? (
            <Button
              variant="ghost"
              onClick={() => {
                cancelPlus();
                setSaved("Plus wyłączy się z końcem opłaconego okresu.");
              }}
            >
              Zrezygnuj z Plus
            </Button>
          ) : null}
          {plus && entitlements.cancelAtPeriodEnd ? (
            <Button
              variant="secondary"
              onClick={() => {
                resumePlus();
                setSaved("Przedłużanie włączone z powrotem.");
              }}
            >
              Cofnij rezygnację
            </Button>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium">Jak się do ciebie zwracać</h2>
        <label className="mt-4 grid gap-1.5">
          <span className="text-xs font-medium text-muted">Imię (opcjonalnie)</span>
          <input
            className="h-11 rounded-md bg-surface px-3 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="np. Ania"
          />
        </label>
      </section>

      <section>
        <h2 className="font-serif text-xl font-medium">Stawka twojej pracy</h2>
        <p className="mt-1 text-sm text-muted">
          Żeby pokazać, ile godzin życia kosztuje dana rzecz. Nikomu tego nie pokazujemy.
        </p>
        <form onSubmit={saveRate} className="mt-4 grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">Netto miesięcznie (zł)</span>
            <input
              className="h-11 rounded-md bg-surface px-3 font-mono text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              inputMode="decimal"
              placeholder="np. 6200"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">Godzin w miesiącu</span>
            <input
              className="h-11 rounded-md bg-surface px-3 font-mono text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value) || 0)}
              type="number"
              min={1}
              max={400}
            />
          </label>
          <div>
            <Button type="submit" variant="secondary">
              Zapisz
            </Button>
            {saved ? <p className="mt-2 text-sm text-muted">{saved}</p> : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-surface p-5 ring-1 ring-line">
        <h2 className="font-serif text-xl font-medium">Powiadomienia</h2>
        <p className="mt-2 text-sm text-muted">
          Jak czas minie, Zanim pokaże komunikat — i dymka systemowego, jeśli włączysz
          powiadomienia.
        </p>
        <div className="mt-4">
          {perm === "granted" ? (
            <p className="text-sm text-saved">Powiadomienia włączone.</p>
          ) : perm === "denied" ? (
            <p className="text-sm text-warn">
              Przeglądarka zablokowała powiadomienia. Odblokuj je w ustawieniach strony.
            </p>
          ) : perm === "unsupported" ? (
            <p className="text-sm text-muted">Ta przeglądarka nie obsługuje powiadomień.</p>
          ) : (
            <Button
              variant="secondary"
              onClick={() => void requestNotifications().then(() => setPerm(notificationPermission()))}
            >
              Włącz powiadomienia
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-2 text-sm">
        <Link to="/na-telefon" className="rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
          Na telefon i sklepy
        </Link>
        <Link to="/opinie" className="rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
          Opinie
        </Link>
        <Link to="/prywatnosc" className="rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
          Polityka prywatności
        </Link>
        <Link to="/regulamin" className="rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
          Regulamin
        </Link>
      </section>
    </div>
  );
}
