const READY_KEY = "zanim.ready-notified";
const PRICE_KEY = "zanim.price-notified";

function readSet(key: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, ids: string[]) {
  try {
    const next = new Set(readSet(key));
    for (const id of ids) next.add(id);
    sessionStorage.setItem(key, JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestNotifications(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
}

export function notifyReady(items: { id: string; title: string; amountLabel: string }[]) {
  const seen = readSet(READY_KEY);
  const fresh = items.filter((item) => !seen.has(item.id));
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    for (const item of fresh) {
      try {
        new Notification("Zanim — czas minął", {
          body: `${item.title} · ${item.amountLabel}. Kupujesz albo odpuszczasz.`,
          tag: `ready-${item.id}`,
          lang: "pl",
        });
      } catch {
        /* ignore */
      }
    }
  }
  writeSet(READY_KEY, fresh.map((item) => item.id));
}

/** Powiadomienie o zmianie ceny (spadek / wzrost). */
export function notifyPriceChange(opts: {
  title: string;
  changePct: number;
  newPriceGrosze: number;
  dealUrl?: string;
}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const drop = opts.changePct < 0;
  const pct = Math.abs(opts.changePct).toFixed(0);
  const zl = (opts.newPriceGrosze / 100).toLocaleString("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const key = `price-${opts.title}-${pct}-${Date.now() % 100000}`;
  const seen = readSet(PRICE_KEY);
  if (seen.has(key)) return;

  try {
    new Notification(drop ? "Zanim — spadek ceny" : "Zanim — wzrost ceny", {
      body: drop
        ? `„${opts.title}” potaniała o ${pct}% · ~${zl} zł`
        : `„${opts.title}” podrożała o ${pct}% · ~${zl} zł`,
      tag: `price-${opts.title}`,
      lang: "pl",
    });
  } catch {
    /* ignore */
  }
  writeSet(PRICE_KEY, [key]);
}

export function setAppBadge(count: number) {
  const nav = navigator as Navigator & {
    setAppBadge?: (n: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count > 0) void nav.setAppBadge?.(count);
    else void nav.clearAppBadge?.();
  } catch {
    /* ignore */
  }
}
