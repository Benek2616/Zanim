import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Sun, Download, Upload, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadBackup, parseBackup } from "@/lib/data-io";
import { isPlusActive, useZanim } from "@/lib/store";
import { parseAmountToGrosze } from "@/lib/zanim";

export const Route = createFileRoute("/konto")({ component: KontoPage });

function KontoPage() {
  const profile = useZanim((s) => s.profile);
  const entitlements = useZanim((s) => s.entitlements);
  const darkMode = useZanim((s) => s.darkMode);
  const setDarkMode = useZanim((s) => s.setDarkMode);
  const setProfile = useZanim((s) => s.setProfile);
  const items = useZanim((s) => s.items);
  const onboardingDone = useZanim((s) => s.onboardingDone);
  const review = useZanim((s) => s.review);
  const fileRef = useRef<HTMLInputElement>(null);
  const plus = isPlusActive(entitlements);
  const [name, setName] = useState(profile.displayName);
  const [income, setIncome] = useState(
    profile.monthlyIncomeGrosze != null ? String(profile.monthlyIncomeGrosze / 100) : "",
  );
  const [hours, setHours] = useState(String(profile.monthlyHours));
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  function exportData() {
    downloadBackup({
      version: 1,
      exportedAt: new Date().toISOString(),
      onboardingDone,
      darkMode,
      items,
      profile,
      entitlements,
      review,
    });
    setMsg("Kopia zapisana na urządzeniu.");
  }

  async function onImport(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseBackup(text);
      useZanim.setState({
        onboardingDone: data.onboardingDone,
        darkMode: data.darkMode,
        items: data.items,
        profile: data.profile,
        entitlements: data.entitlements,
        review: data.review,
      });
      setName(data.profile.displayName);
      setIncome(
        data.profile.monthlyIncomeGrosze != null
          ? String(data.profile.monthlyIncomeGrosze / 100)
          : "",
      );
      setHours(String(data.profile.monthlyHours));
      setMsg("Przywrócono dane z kopii.");
    } catch {
      setMsg("Nie udało się wczytać pliku.");
    }
  }

  function clearAll() {
    if (!window.confirm("Na pewno usunąć wszystkie dane Zanim z tego urządzenia?")) return;
    useZanim.setState({
      items: [],
      profile: { displayName: "", monthlyIncomeGrosze: null, monthlyHours: 160 },
      entitlements: {
        plan: "free",
        plus: false,
        periodEnd: null,
        cancelAtPeriodEnd: false,
      },
      review: null,
      onboardingDone: true,
    });
    setName("");
    setIncome("");
    setHours("160");
    setMsg("Dane wyczyszczone.");
  }

  return (
    <div className="rise-in space-y-6 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Konto</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej</h1>
        <p className="mt-2 text-sm text-muted">
          Plan: <strong className="text-fg">{plus ? "Plus" : "Darmowy"}</strong>
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-surface px-4 py-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-elevated text-fg">
            {darkMode ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </div>
          <div>
            <p className="font-medium">Tryb ciemny</p>
            <p className="text-sm text-muted">{darkMode ? "Włączony" : "Wyłączony"}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          aria-label="Przełącz tryb ciemny"
          className="theme-switch"
          data-on={darkMode ? "true" : "false"}
          onClick={() => setDarkMode(!darkMode)}
        >
          <span className="theme-switch-knob" />
        </button>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Jak masz na imię?</span>
        <input
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Miesięczny dochód netto (zł)</span>
        <input
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="decimal"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Godzin pracy miesięcznie</span>
        <input
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
          inputMode="numeric"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </label>

      <Button onClick={save}>{saved ? "Zapisano" : "Zapisz profil"}</Button>

      <section className="space-y-3 border-t border-line pt-5">
        <h2 className="font-serif text-lg font-medium">Dane na telefonie</h2>
        <p className="text-sm text-muted">
          Wszystko jest lokalnie. Możesz zrobić kopię albo wyczyścić urządzenie.
        </p>
        <div className="grid gap-2">
          <Button variant="secondary" onClick={exportData}>
            <Download className="size-4" />
            Eksportuj kopię (JSON)
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Przywróć z pliku
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void onImport(e.target.files?.[0] ?? null)}
          />
          <Button variant="ghost" className="text-warn" onClick={clearAll}>
            <Trash2 className="size-4" />
            Usuń wszystkie dane
          </Button>
        </div>
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}
      </section>

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
