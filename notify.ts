const READY_KEY = "zanim.ready-notified";

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
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotifications(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
}

export function notifyReady(
  items: { id: string; title: string; amountLabel: string }[],
) {
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
  writeSet(
    READY_KEY,
    fresh.map((item) => item.id),
  );
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
