export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let updateSetupDone = false;

export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function onInstallPromptChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  for (const cb of listeners) cb();
}

function reloadForUpdate() {
  // unika pętli przeładowań
  const key = "zanim_sw_reload";
  const last = Number(sessionStorage.getItem(key) || "0");
  if (Date.now() - last < 15_000) return;
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
}

/** Rejestracja SW + auto-aktualizacja po deployu (bez nowej ikony na ekranie). */
export function setupPwa() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });

  if (!("serviceWorker" in navigator)) return;
  if (updateSetupDone) return;
  updateSetupDone = true;

  // Nowa wersja SW przejęła kontrolę → odśwież stronę (dane w localStorage zostają)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    reloadForUpdate();
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "ZANIM_SW_ACTIVATED") {
      reloadForUpdate();
    }
  });

  void navigator.serviceWorker
    .register("/sw.js", { updateViaCache: "none" })
    .then((reg) => {
      // sprawdź aktualizacje przy starcie i co ~godzinę / po powrocie do karty
      const check = () => {
        void reg.update().catch(() => {});
      };
      check();
      window.setInterval(check, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.addEventListener("online", check);

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            // jest nowa wersja — od razu aktywuj
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // jeśli czeka waiting worker
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    })
    .catch(() => {
      /* ignore */
    });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === "accepted";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone;
  return Boolean(mq || ios);
}
