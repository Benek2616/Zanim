import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Smartphone,
  MessageSquareHeart,
  ScrollText,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadBackup, parseBackup } from "@/lib/data-io";
import { isPlusActive, useZanim } from "@/lib/store";
import { parseAmountToGrosze } from "@/lib/zanim";

export const Route = createFileRoute("/konto")({ component: KontoPage });

const MENU = [
  {
    to: "/na-telefon" as const,
    label: "Na telefon",
    desc: "Zainstaluj jak aplikację",
    icon: Smartphone,
  },
  {
    to: "/cennik" as const,
    label: "Plan Plus",
    desc: "Bez limitu i własny czas",
    icon: Sparkles,
  },
  {
    to: "/opinie" as const,
    label: "Opinie",
    desc: "Oceń Zanim",
    icon: MessageSquareHeart,
  },
  {
    to: "/regulamin" as const,
    label: "Regulamin",
    desc: "Zasady korzystania",
    icon: ScrollText,
  },
  {
    to: "/prywatnosc" as const,
    label: "Prywatność",
    desc: "Dane tylko u Ciebie",
    icon: Shield,
  },
];

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
  const [goal, setGoal] = useState(
    profile.savingsGoalGrosze != null ? String(profile.savingsGoalGrosze / 100) : "",
  );
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"profil" | "menu" | "dane">("menu");

  function save() {
    const monthlyIncomeGrosze = income.trim() ? parseAmountToGrosze(income) : null;
    const monthlyHours = Number(hours) || 160;
    const savingsGoalGrosze = goal.trim() ? parseAmountToGrosze(goal) : null;
    setProfile({
      displayName: name.trim(),
      monthlyIncomeGrosze,
      monthlyHours,
      savingsGoalGrosze,
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
        profile: {
          displayName: data.profile.displayName,
          monthlyIncomeGrosze: data.profile.monthlyIncomeGrosze,
          monthlyHours: data.profile.monthlyHours,
          savingsGoalGrosze:
            (data.profile as { savingsGoalGrosze?: number | null }).savingsGoalGrosze ?? null,
        },
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
      const g = (data.profile as { savingsGoalGrosze?: number | null }).savingsGoalGrosze;
      setGoal(g != null ? String(g / 100) : "");
      setMsg("Przywrócono dane z kopii.");
    } catch {
      setMsg("Nie udało się wczytać pliku.");
    }
  }

  function clearAll() {
    if (!window.confirm("Na pewno usunąć wszystkie dane Zanim z tego urządzenia?")) return;
    useZanim.setState({
      items: [],
      profile: {
        displayName: "",
        monthlyIncomeGrosze: null,
        monthlyHours: 160,
        savingsGoalGrosze: null,
      },
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
    setGoal("");
    setMsg("Dane wyczyszczone.");
  }

  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Konto</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Więcej</h1>
        <p className="mt-2 text-sm text-muted">
          Plan: <strong className="text-fg">{plus ? "Plus" : "Darmowy"}</strong>
          {profile.displayName ? ` · ${profile.displayName}` : ""}
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-elevated/70 p-1">
        {(
          [
            { id: "menu", label: "Menu" },
            { id: "profil", label: "Profil" },
            { id: "dane", label: "Dane" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-surface text-fg shadow-card" : "text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "menu" ? (
        <div className="space-y-3">
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

          <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
            {MENU.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className={i > 0 ? "border-t border-line/70" : ""}>
                  <Link
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3.5 transition active:bg-elevated/50"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-elevated text-fg">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-sm text-muted">{item.desc}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {tab === "profil" ? (
        <div className="space-y-4">
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
          <label className="block">
            <span className="text-sm text-muted">Cel oszczędności (zł) — opcjonalnie</span>
            <input
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
              inputMode="decimal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="np. 2000"
            />
          </label>
          <Button onClick={save}>{saved ? "Zapisano" : "Zapisz profil"}</Button>
        </div>
      ) : null}

      {tab === "dane" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Wszystko jest lokalnie na tym urządzeniu. Możesz zrobić kopię albo wyczyścić dane.
          </p>
          <Button variant="secondary" className="w-full" onClick={exportData}>
            <Download className="size-4" />
            Eksportuj kopię (JSON)
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
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
          <Button variant="ghost" className="w-full text-warn" onClick={clearAll}>
            <Trash2 className="size-4" />
            Usuń wszystkie dane
          </Button>
          {msg ? <p className="text-sm text-muted">{msg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
