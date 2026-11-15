import { createFileRoute, Link } from "@tanstack/react-router";
import { BellOff, BellRing, Megaphone, Moon, Sparkles, Timer } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  disablePush,
  enablePush,
  isPushSupported,
  pushStatus,
  savePrefs,
  showTestNotification,
  usePush,
  type PushStatus,
} from "@/lib/push/client";
import type { Prefs } from "@/lib/push/engine";

export const Route = createFileRoute("/powiadomienia")({ component: PowiadomieniaPage });

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function PowiadomieniaPage() {
  const prefs = usePush((s) => s.prefs);
  const enabled = usePush((s) => s.enabled);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, setTick] = useState(0);
  // Strona renderuje się tylko w przeglądarce (AppShell czeka na hydratację), więc można czytać stan zgody wprost.
  const status: PushStatus = typeof window === "undefined" ? "off" : pushStatus();
  void enabled; // przerenderowanie po zmianie
  const refresh = () => setTick((t) => t + 1);

  async function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    const ok = await savePrefs(next);
    setMsg(ok ? "Zapisano." : "Zapisano na telefonie — zsynchronizujemy, gdy wróci internet.");
  }

  async function turnOn() {
    setBusy(true);
    const r = await enablePush();
    setBusy(false);
    refresh();
    setMsg(
      r === "on"
        ? "Powiadomienia włączone."
        : r === "unconfigured"
          ? "Włączone na tym urządzeniu. Przypomnienia z serwera ruszą po wdrożeniu aktualizacji."
          : r === "denied"
            ? "Zablokowane w ustawieniach systemu — odblokuj je dla Zanim i wróć tutaj."
            : r === "unsupported"
              ? "Ta przeglądarka nie obsługuje powiadomień push."
              : "Nie udało się włączyć powiadomień.",
    );
  }

  async function turnOff() {
    setBusy(true);
    await disablePush();
    setBusy(false);
    refresh();
    setMsg("Powiadomienia wyłączone, dane powiadomień usunięte z serwera.");
  }

  const on = status === "on";

  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Ustawienia</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Powiadomienia</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Rzadko i na temat. Nigdy w nocy, maksymalnie jedno przypomnienie motywacyjne dziennie. Ty decydujesz, co dostajesz.
        </p>
      </div>

      <div className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card" data-testid="push-status">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-elevated text-fg">
            {on ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{on ? "Włączone na tym urządzeniu" : status === "denied" ? "Zablokowane w systemie" : status === "unsupported" ? "Niedostępne" : "Wyłączone"}</p>
            <p className="text-sm text-muted">
              {status === "denied"
                ? "Ustawienia telefonu → Aplikacje → Zanim → Powiadomienia."
                : status === "unsupported"
                  ? "Zainstaluj Zanim jako aplikację lub użyj Chrome."
                  : on
                    ? "Możesz wyłączyć w każdej chwili."
                    : "Włącz, a damy znać, gdy minie czas oddechu."}
            </p>
          </div>
        </div>
        {isPushSupported() && status !== "denied" ? (
          <div className="mt-3 flex gap-2">
            {on ? (
              <>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => void showTestNotification()}>
                  Wyślij test
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-warn" disabled={busy} onClick={() => void turnOff()}>
                  Wyłącz wszystkie
                </Button>
              </>
            ) : (
              <Button size="sm" className="w-full" disabled={busy} onClick={() => void turnOn()} data-testid="push-enable">
                Włącz powiadomienia
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Co chcesz dostawać</p>
        <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
          <ToggleRow
            id="automatic"
            icon={<Timer className="size-5" />}
            title="Automatyczne"
            desc="O Twoich rzeczach: „minęło 48 godzin — kupujesz czy odpuszczasz?”. Prosto do konkretnej rzeczy."
            checked={prefs.automatic}
            onChange={(v) => void update({ automatic: v })}
          />
          <ToggleRow
            id="motivational"
            icon={<Sparkles className="size-5" />}
            title="Motywacyjne"
            desc="Przypomnienia o świadomych zakupach, podsumowanie tygodnia i miesiąca: ile odpuszczono i zaoszczędzono."
            checked={prefs.motivational}
            onChange={(v) => void update({ motivational: v })}
            border
          />
          <ToggleRow
            id="marketing"
            icon={<Megaphone className="size-5" />}
            title="Marketingowe"
            desc="Kody rabatowe, nowe funkcje i promocje Plus. Najwyżej raz w tygodniu."
            checked={prefs.marketing}
            onChange={(v) => void update({ marketing: v })}
            border
          />
        </ul>
        <p className="px-1 text-xs leading-relaxed text-subtle">
          Marketingowe są domyślnie wyłączone. Włączając je, zgadzasz się na otrzymywanie od Zanim informacji handlowych w
          formie powiadomień push. Zgodę możesz wycofać w każdej chwili tym przełącznikiem.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Cisza nocna</p>
        <div className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface p-4 shadow-card">
          <span className="grid size-10 place-items-center rounded-xl bg-elevated text-fg">
            <Moon className="size-5" />
          </span>
          <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Bez powiadomień od</span>
            <HourSelect testId="quiet-start" value={prefs.quietStart} onChange={(h) => void update({ quietStart: h })} />
            <span className="text-muted">do</span>
            <HourSelect testId="quiet-end" value={prefs.quietEnd} onChange={(h) => void update({ quietEnd: h })} />
          </div>
        </div>
        <p className="px-1 text-xs text-subtle">Czas polski (Europe/Warsaw). Wiadomości z nocy nie przychodzą rano hurtem.</p>
      </section>

      {msg ? (
        <p className="text-sm text-muted" data-testid="push-msg">
          {msg}
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-subtle">
        Do przypomnień zapisujemy na serwerze tylko to, co potrzebne: subskrypcję push, Twoje ustawienia, a przy włączonych
        kategoriach — nazwę i czas „gotowe” rzeczy z poczekalni (Automatyczne) oraz zbiorcze kwoty odpuszczone w
        tygodniu/miesiącu (Motywacyjne). Szczegóły w{" "}
        <Link to="/prywatnosc" className="font-medium text-fg underline-offset-2 hover:underline">
          polityce prywatności
        </Link>
        .
      </p>

      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}

function ToggleRow(props: {
  id: string;
  icon: ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  border?: boolean;
}) {
  return (
    <li className={props.border ? "border-t border-line/70" : ""}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-fg">{props.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{props.title}</span>
          <span className="block text-sm leading-snug text-muted">{props.desc}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-label={props.title}
          aria-checked={props.checked}
          data-testid={`toggle-${props.id}`}
          className="theme-switch"
          data-on={props.checked ? "true" : "false"}
          onClick={() => props.onChange(!props.checked)}
        >
          <span className="theme-switch-knob" />
        </button>
      </div>
    </li>
  );
}

function HourSelect({ value, onChange, testId }: { value: number; onChange: (h: number) => void; testId: string }) {
  return (
    <select
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-line bg-bg px-2 py-1.5 text-sm text-fg outline-none focus:ring-2 focus:ring-fg/20"
    >
      {HOURS.map((h) => (
        <option key={h} value={h}>
          {hh(h)}
        </option>
      ))}
    </select>
  );
}
