import { createFileRoute } from "@tanstack/react-router";
import { Download, Smartphone, Bell, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getInstallPrompt,
  isStandalone,
  onInstallPromptChange,
  promptInstall,
} from "@/lib/pwa";
import { notificationPermission, requestNotifications } from "@/lib/notify";

export const Route = createFileRoute("/na-telefon")({ component: NaTelefonPage });

function NaTelefonPage() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [perm, setPerm] = useState(() =>
    typeof window === "undefined" ? "default" : notificationPermission(),
  );

  useEffect(() => {
    setInstalled(isStandalone());
    setCanInstall(Boolean(getInstallPrompt()));
    return onInstallPromptChange(() => {
      setCanInstall(Boolean(getInstallPrompt()));
      setInstalled(isStandalone());
    });
  }, []);

  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Aplikacja</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Na telefon</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Zainstaluj Zanim na ekranie głównym — działa jak zwykła aplikacja, także offline.
        </p>
      </div>

      {installed ? (
        <div className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-card">
          <p className="font-medium text-saved">Już zainstalowane</p>
          <p className="mt-1 text-sm text-muted">Korzystasz z trybu aplikacji (standalone).</p>
        </div>
      ) : canInstall ? (
        <Button
          className="w-full"
          size="lg"
          onClick={() => void promptInstall().then(() => setInstalled(isStandalone()))}
        >
          <Download className="size-4" />
          Zainstaluj aplikację
        </Button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">iPhone (Safari)</p>
              <p className="mt-1 text-sm text-muted">
                Udostępnij → <strong className="text-fg">Dodaj do ekranu początkowego</strong>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-line pt-3">
            <Smartphone className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Android (Chrome)</p>
              <p className="mt-1 text-sm text-muted">
                Menu ⋮ → <strong className="text-fg">Zainstaluj aplikację</strong> / Dodaj do
                ekranu głównego
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Powiadomienia</p>
            <p className="mt-1 text-sm text-muted">
              Damy znać, gdy czas w poczekalni minie.
              {perm === "granted"
                ? " Włączone."
                : perm === "denied"
                  ? " Zablokowane w ustawieniach systemu."
                  : ""}
            </p>
            {perm !== "granted" && perm !== "denied" && perm !== "unsupported" ? (
              <Button
                className="mt-3"
                size="sm"
                onClick={() =>
                  void requestNotifications().then(() => setPerm(notificationPermission()))
                }
              >
                Włącz powiadomienia
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-start gap-3">
          <WifiOff className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Działa offline</p>
            <p className="mt-1 text-sm text-muted">
              Lista i decyzje są u Ciebie na telefonie. Po instalacji podstawowe ekrany działają też
              bez sieci.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
