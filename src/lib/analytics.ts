const VISITOR_KEY = "zanim.vid";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v_tmp_${Date.now()}`;
  }
}

/** Lekki tracking wizyty — fire-and-forget */
export function trackVisit(path: string) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/zarzadzanie") || path.startsWith("/api")) return;

  const visitorId = getVisitorId();
  const referrer = document.referrer || null;

  void fetch("/api/track-visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, visitorId, referrer }),
    keepalive: true,
  }).catch(() => {
    /* opcjonalne */
  });
}
