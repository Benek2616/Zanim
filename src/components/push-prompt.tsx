import { Link } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enablePush, shouldShowSoftPrompt, usePush } from "@/lib/push/client";

/**
 * Delikatna prośba o zgodę na powiadomienia — pojawia się dopiero, gdy w poczekalni jest
 * pierwsza rzecz (kontekst: „damy znać, gdy minie 48 h”). Systemowe okno zgody otwiera się
 * dopiero po kliknięciu „Tak, przypominaj”. „Nie teraz” chowa kartę na 7 dni (potem 30).
 */
export function PushPrompt({ itemsCount }: { itemsCount: number }) {
  const dismissCount = usePush((s) => s.promptDismissCount);
  const dismissedAt = usePush((s) => s.promptDismissedAt);
  const enabled = usePush((s) => s.enabled);
  const dismiss = usePush((s) => s.dismissPrompt);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // dismissCount/dismissedAt/enabled — subskrypcja store'u wymusza przeliczenie po zmianie
  void dismissCount;
  void dismissedAt;
  void enabled;
  const visible = !hidden && typeof window !== "undefined" && shouldShowSoftPrompt({ itemsCount });

  if (msg) {
    return (
      <div data-testid="push-prompt-result" className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted shadow-card">
        {msg}{" "}
        <Link to="/powiadomienia" className="font-medium text-fg underline-offset-2 hover:underline">
          Ustawienia
        </Link>
      </div>
    );
  }
  if (!visible) return null;

  async function onEnable() {
    setBusy(true);
    const r = await enablePush();
    setBusy(false);
    setHidden(true);
    if (r === "on" || r === "unconfigured") setMsg("Gotowe — damy znać, gdy czas oddechu minie. Wybierz, co chcesz dostawać:");
    else if (r === "denied") setMsg("Powiadomienia są zablokowane w ustawieniach telefonu. Możesz je włączyć później.");
    else setMsg("Nie udało się włączyć powiadomień. Spróbuj w ustawieniach.");
  }

  return (
    <div data-testid="push-prompt" className="rise-in mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-fg">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">Przypomnieć, gdy minie 48 godzin?</p>
          <p className="mt-0.5 text-sm leading-snug text-muted">
            Jedno krótkie powiadomienie, kiedy rzecz będzie gotowa do werdyktu. Bez spamu, nie w nocy —
            sam wybierzesz, co dostajesz.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" disabled={busy} onClick={() => void onEnable()}>
          Tak, przypominaj
        </Button>
        <Button size="sm" variant="ghost" className="flex-1 text-muted" onClick={dismiss}>
          Nie teraz
        </Button>
      </div>
    </div>
  );
}
