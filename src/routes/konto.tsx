import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isPlusActive, useZanim } from "@/lib/store";
import { parseAmountToGrosze } from "@/lib/zanim";

export const Route = createFileRoute("/konto")({ component: KontoPage });

function KontoPage() {
  const profile = useZanim((s) => s.profile);
  const entitlements = useZanim((s) => s.entitlements);
  const setProfile = useZanim((s) => s.setProfile);
  const plus = isPlusActive(entitlements);
  const [name, setName] = useState(profile.displayName);
  const [income, setIncome] = useState(
    profile.monthlyIncomeGrosze != null ? String(profile.monthlyIncomeGrosze / 100) : "",
  );
  const [hours, setHours] = useState(String(profile.monthlyHours));
  const [saved, setSaved] = useState(false);

  function save() {
    const monthlyIncomeGrosze = income.trim() ? parseAmountToGrosze(income) : null;
    const monthlyHours = Number(hours) || 160;
    setProfile({
      displayName: name.trim(),
      monthlyIncomeGrosze,
      monthlyHours,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Konto</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej</h1>
        <p className="mt-2 text-sm text-muted">
          Plan: <strong>{plus ? "Plus" : "Darmowy"}</strong>
        </p>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Jak masz na imię?</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Miesięczny dochód netto (zł) — do przelicznika godzin</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="decimal"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Godzin pracy miesięcznie</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="numeric"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </label>

      <Button onClick={save}>{saved ? "Zapisano" : "Zapisz"}</Button>

      <nav className="space-y-2 border-t border-line pt-4 text-sm">
        <Link className="block text-fg" to="/na-telefon">
          Na telefon →
        </Link>
        <Link className="block text-fg" to="/opinie">
          Opinie →
        </Link>
        <Link className="block text-fg" to="/regulamin">
          Regulamin →
        </Link>
        <Link className="block text-fg" to="/prywatnosc">
          Prywatność →
        </Link>
      </nav>
    </div>
  );
}
