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
  UserPlus,
  HelpCircle,
  Share2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadBackup, parseBackup } from "@/lib/data-io";
import { isPlusActive, useZanim } from "@/lib/store";
import { parseAmountToGrosze } from "@/lib/zanim";

export const Route = createFileRoute("/konto")({ component: KontoPage });

const MENU = [
  { to: "/na-telefon" as const, label: "Na telefon", desc: "Zainstaluj jak aplikację", icon: Smartphone },
  { to: "/cennik" as const, label: "Plan Plus", desc: "Za konto — bez opłat", icon: Sparkles },
  { to: "/faq" as const, label: "Pytania (FAQ)", desc: "Jak działa Zanim", icon: HelpCircle },
  { to: "/opinie" as const, label: "Opinie", desc: "Oceń Zanim", icon: MessageSquareHeart },
  { to: "/regulamin" as const, label: "Regulamin", desc: "Zasady korzystania", icon: ScrollText },
  { to: "/prywatnosc" as const, label: "Prywatność", desc: "Dane u Ciebie", icon: Shield },
];

function KontoPage() {
  const profile = useZanim((s) => s.profile);
  const entitlements = useZanim((s) => s.entitlements);
  const darkMode = useZanim((s) => s.darkMode);
  const setDarkMode = useZanim((s) => s.setDarkMode);
  const setProfile = useZanim((s) => s.setProfile);
  const createAccount = useZanim((s) => s.createAccount);
  const deleteAccount = useZanim((s) => s.deleteAccount);
  const items = useZanim((s) => s.items);
  const onboardingDone = useZanim((s) => s.onboardingDone);
  const review = useZanim((s) => s.review);
  const fileRef = useRef<HTMLInputElement>(null);
  const plus = isPlusActive(entitlements);
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
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
  const [regName, setRegName] = useState(profile.displayName);
  const [regEmail, setRegEmail] = useState(profile.email);
  const [regError, setRegError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  function save() {
    const monthlyIncomeGrosze = income.trim() ? parseAmountToGrosze(income) : null;
    const monthlyHours = Number(hours) || 160;
    const savingsGoalGrosze = goal.trim() ? parseAmountToGrosze(goal) : null;
    setProfile({
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      monthlyIncomeGrosze,
      monthlyHours,
      savingsGoalGrosze,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function register() {
    setRegError(null);
    if (!regName.trim()) {
      setRegError("Podaj imię lub nick.");
      return;
    }
    if (!regEmail.includes("@")) {
      setRegError("Podaj poprawny e-mail.");
      return;
    }
    createAccount({ displayName: regName, email: regEmail });
    setName(regName.trim());
    setEmail(regEmail.trim().toLowerCase());
  }

  async function shareApp() {
    const url = typeof window !== "undefined" ? window.location.origin : "https://zanim.com.pl";
    const text =
      "Zanim — poczekalnia zakupów. Odczekaj 48 godzin, zanim wydasz pieniądze. " + url;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Zanim", text, url });
        setShareMsg("Dzięki za polecenie.");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg("Link skopiowany — wklej znajomym.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareMsg("Link skopiowany.");
      } catch {
        setShareMsg(url);
      }
    }
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
      const p = data.profile as {
        displayName?: string;
        email?: string;
        accountCreated?: boolean;
        monthlyIncomeGrosze?: number | null;
        monthlyHours?: number;
        savingsGoalGrosze?: number | null;
      };
      useZanim.setState({
        onboardingDone: data.onboardingDone,
        darkMode: data.darkMode,
        items: data.items,
        profile: {
          displayName: p.displayName ?? "",
          email: p.email ?? "",
          accountCreated: Boolean(p.accountCreated),
          monthlyIncomeGrosze: p.monthlyIncomeGrosze ?? null,
          monthlyHours: p.monthlyHours ?? 160,
          savingsGoalGrosze: p.savingsGoalGrosze ?? null,
        },
        entitlements: p.accountCreated
          ? { plan: "plus_month", plus: true, periodEnd: null, cancelAtPeriodEnd: false }
          : data.entitlements,
        review: data.review,
      });
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
        email: "",
        accountCreated: false,
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

      <div className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 font-medium">
          <UserPlus className="size-4" />
          {profile.accountCreated ? "Twoje konto" : "Załóż konto → Plus"}
        </div>
        {profile.accountCreated ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-muted">
              {profile.displayName}
              {profile.email ? ` · ${profile.email}` : ""}
            </p>
            <p className="text-sm text-saved">Plus aktywny (lokalnie na tym urządzeniu)</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-warn"
              onClick={() => {
                if (window.confirm("Usunąć konto i wrócić do planu darmowego?")) deleteAccount();
              }}
            >
              Usuń konto
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted">
              Imię i e-mail zostają tylko na tym telefonie. Od razu odblokujesz Plus — bez płatności.
            </p>
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fg/20"
              placeholder="Imię lub nick"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fg/20"
              type="email"
              placeholder="email@example.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            {regError ? <p className="text-xs text-warn">{regError}</p> : null}
            <Button size="sm" onClick={register}>
              Załóż konto i aktywuj Plus
            </Button>
          </div>
        )}
      </div>

      <Button variant="secondary" className="w-full" onClick={() => void shareApp()}>
        <Share2 className="size-4" />
        Poleć Zanim znajomym
      </Button>
      {shareMsg ? <p className="text-sm text-muted">{shareMsg}</p> : null}

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
            <span className="text-sm text-muted">Imię / nick</span>
            <input
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">E-mail</span>
            <input
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <span className="text-sm text-muted">Cel oszczędności (zł)</span>
            <input
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
              inputMode="decimal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <Button onClick={save}>{saved ? "Zapisano" : "Zapisz profil"}</Button>
        </div>
      ) : null}

      {tab === "dane" ? (
        <div className="space-y-3">
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
