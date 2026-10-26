import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Users,
  Sparkles,
  Calendar,
  RefreshCw,
  LogOut,
  Eye,
  UserRound,
  MapPin,
  Download,
  Ban,
  ShieldOff,
} from "lucide-react";

export const Route = createFileRoute("/zarzadzanie")({
  component: AdminPage,
});

type Stats = {
  ok: boolean;
  configured: boolean;
  total: number;
  plus: number;
  last7: number;
  last30: number;
  recent: {
    email: string;
    emailRaw?: string;
    displayName: string;
    plus: boolean;
    createdAt: string;
  }[];
  visitsTotal: number;
  visitsLast7: number;
  visitsLast30: number;
  uniqueVisitors7: number;
  topPaths: { path: string; count: number }[];
  recentVisits: {
    path: string;
    createdAt: string;
    referrer: string | null;
    visitorId?: string;
  }[];
  dailyVisits: { date: string; count: number }[];
  bans: { kind: string; value: string; reason: string | null; created_at: string }[];
  message?: string;
  error?: string;
};

const STORAGE_KEY = "zanim.admin.pw";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [savedPw, setSavedPw] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"overview" | "signups" | "visits" | "bans">("overview");
  const [banKind, setBanKind] = useState<"visitor" | "email">("visitor");
  const [banValue, setBanValue] = useState("");
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(STORAGE_KEY);
      if (p) setSavedPw(p);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchStats = useCallback(
    async (
      pw: string,
      extra?: { action?: string; kind?: string; value?: string; reason?: string },
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw, ...extra }),
        });
        const data = (await res.json().catch(() => ({}))) as Stats & {
          statusMessage?: string;
          message?: string;
        };

        if (!res.ok || data.ok === false) {
          const msg =
            data.error ||
            data.statusMessage ||
            data.message ||
            (res.status === 401 ? "Złe hasło." : `Błąd ${res.status}`);
          setError(msg);
          setStats(null);
          setSavedPw(null);
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {
            /* ignore */
          }
          return;
        }

        setStats({
          ...data,
          visitsTotal: data.visitsTotal ?? 0,
          visitsLast7: data.visitsLast7 ?? 0,
          visitsLast30: data.visitsLast30 ?? 0,
          uniqueVisitors7: data.uniqueVisitors7 ?? 0,
          topPaths: data.topPaths ?? [],
          recentVisits: data.recentVisits ?? [],
          recent: data.recent ?? [],
          dailyVisits: data.dailyVisits ?? [],
          bans: data.bans ?? [],
        });
        setSavedPw(pw);
        try {
          sessionStorage.setItem(STORAGE_KEY, pw);
        } catch {
          /* ignore */
        }
      } catch {
        setError("Nie udało się połączyć z serwerem.");
        setStats(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (savedPw) void fetchStats(savedPw);
  }, [savedPw, fetchStats]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    void fetchStats(password.trim());
  }

  function logout() {
    setSavedPw(null);
    setStats(null);
    setPassword("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function exportCsv(kind: "signups" | "visits") {
    if (!stats) return;
    let csv = "";
    if (kind === "signups") {
      csv = "displayName,email,plus,createdAt\n";
      for (const r of stats.recent) {
        csv += `"${(r.displayName || "").replace(/"/g, '""')}","${r.emailRaw || r.email}",${r.plus ? "yes" : "no"},"${r.createdAt}"\n`;
      }
    } else {
      csv = "path,createdAt,referrer,visitorId\n";
      for (const v of stats.recentVisits) {
        csv += `"${v.path}","${v.createdAt}","${(v.referrer || "").replace(/"/g, '""')}","${v.visitorId || ""}"\n`;
      }
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zanim-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addBan(e: React.FormEvent) {
    e.preventDefault();
    if (!savedPw || !banValue.trim()) return;
    await fetchStats(savedPw, {
      action: "ban",
      kind: banKind,
      value: banValue.trim(),
      reason: banReason.trim(),
    });
    setBanValue("");
    setBanReason("");
  }

  async function removeBan(kind: string, value: string) {
    if (!savedPw) return;
    await fetchStats(savedPw, { action: "unban", kind, value });
  }

  if (!savedPw || !stats) {
    return (
      <div className="rise-in mx-auto max-w-sm space-y-6 py-10">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-elevated">
            <Lock className="size-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Admin</p>
            <h1 className="font-serif text-2xl font-medium">Panel zarządzania</h1>
          </div>
        </div>
        <form onSubmit={login} className="space-y-3">
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-fg/20"
            placeholder="Hasło admina"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-sm text-warn">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
            {loading ? "Sprawdzam…" : "Zaloguj"}
          </Button>
        </form>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.dailyVisits.map((d) => d.count));

  return (
    <div className="rise-in space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Admin</p>
          <h1 className="mt-1 font-serif text-2xl font-medium">Panel</h1>
          <p className="mt-1 text-sm text-muted">{stats.configured ? "Supabase OK" : "Tracking wyłączony"}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => savedPw && void fetchStats(savedPw)}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {stats.message ? (
        <p className="rounded-xl border border-line/70 bg-surface p-3 text-sm text-muted">{stats.message}</p>
      ) : null}

      <div className="flex gap-1 rounded-xl bg-elevated/70 p-1">
        {(
          [
            { id: "overview" as const, label: "Przegląd" },
            { id: "signups" as const, label: "Konta" },
            { id: "visits" as const, label: "Wizyty" },
            { id: "bans" as const, label: "Bany" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-center text-[11px] font-semibold transition-colors ${
              tab === t.id ? "bg-surface text-fg shadow-card" : "text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Eye} label="Wizyty łącznie" value={stats.visitsTotal} />
            <StatCard icon={UserRound} label="Unikalni (7 dni)" value={stats.uniqueVisitors7} />
            <StatCard icon={Users} label="Konta" value={stats.total} />
            <StatCard icon={Sparkles} label="Plus" value={stats.plus} />
          </div>

          {stats.dailyVisits.length > 0 ? (
            <div className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-muted">Wizyty — ostatnie 14 dni</h2>
              <div className="flex h-28 items-end gap-1">
                {stats.dailyVisits.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] tabular-nums text-subtle">{d.count || ""}</span>
                    <div
                      className="w-full rounded-t bg-fg/80"
                      style={{
                        height: `${Math.max(4, (d.count / maxDaily) * 100)}%`,
                        minHeight: d.count > 0 ? 4 : 2,
                        opacity: d.count > 0 ? 1 : 0.2,
                      }}
                      title={`${d.date}: ${d.count}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-subtle">
                <span>{stats.dailyVisits[0]?.date.slice(5)}</span>
                <span>{stats.dailyVisits[stats.dailyVisits.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          ) : null}

          {stats.topPaths.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Top ścieżki (30 dni)</h2>
              <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
                {stats.topPaths.map((p, i) => (
                  <li
                    key={p.path}
                    className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-line/70" : ""}`}
                  >
                    <span className="flex items-center gap-2 truncate font-medium">
                      <MapPin className="size-3.5 shrink-0 text-subtle" />
                      {p.path}
                    </span>
                    <span className="tabular-nums text-sm text-muted">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "signups" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportCsv("signups")}>
              <Download className="size-4" />
              CSV konta
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Wszystkie" value={stats.total} />
            <StatCard icon={Sparkles} label="Plus" value={stats.plus} />
            <StatCard icon={Calendar} label="7 dni" value={stats.last7} />
            <StatCard icon={Calendar} label="30 dni" value={stats.last30} />
          </div>
          <h2 className="text-sm font-semibold text-muted">Ostatnie konta</h2>
          {stats.recent.length === 0 ? (
            <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">Brak kont.</p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
              {stats.recent.map((r, i) => (
                <li
                  key={`${r.email}-${r.createdAt}-${i}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-line/70" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.displayName}</p>
                    <p className="truncate text-sm text-muted">{r.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-subtle">{formatDate(r.createdAt)}</span>
                    {r.emailRaw ? (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-warn"
                        onClick={() => {
                          setTab("bans");
                          setBanKind("email");
                          setBanValue(r.emailRaw || "");
                        }}
                      >
                        Ban
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "visits" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportCsv("visits")}>
              <Download className="size-4" />
              CSV wizyty
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Eye} label="Łącznie" value={stats.visitsTotal} />
            <StatCard icon={UserRound} label="Unikalni 7d" value={stats.uniqueVisitors7} />
          </div>
          <h2 className="text-sm font-semibold text-muted">Ostatnie wizyty</h2>
          {stats.recentVisits.length === 0 ? (
            <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">
              Brak wizyt — utwórz tabelę visits w Supabase.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
              {stats.recentVisits.map((v, i) => (
                <li
                  key={`${v.path}-${v.createdAt}-${i}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-line/70" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.path}</p>
                    {v.referrer ? (
                      <p className="truncate text-xs text-subtle">{shortRef(v.referrer)}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-subtle">{formatDate(v.createdAt)}</span>
                    {v.visitorId ? (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-warn"
                        onClick={() => {
                          setTab("bans");
                          setBanKind("visitor");
                          setBanValue(v.visitorId || "");
                        }}
                      >
                        Ban
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "bans" ? (
        <div className="space-y-4">
          <form onSubmit={addBan} className="space-y-2 rounded-2xl border border-line/70 bg-surface p-4 shadow-card">
            <p className="text-sm font-semibold">Dodaj ban</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBanKind("visitor")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  banKind === "visitor" ? "bg-fg text-accent-fg" : "bg-elevated text-muted"
                }`}
              >
                visitor_id
              </button>
              <button
                type="button"
                onClick={() => setBanKind("email")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  banKind === "email" ? "bg-fg text-accent-fg" : "bg-elevated text-muted"
                }`}
              >
                e-mail
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fg/20"
              placeholder={banKind === "email" ? "email@example.com" : "visitor id"}
              value={banValue}
              onChange={(e) => setBanValue(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fg/20"
              placeholder="Powód (opcjonalnie)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={!banValue.trim() || loading}>
              <Ban className="size-4" />
              Zbanuj
            </Button>
          </form>

          <h2 className="text-sm font-semibold text-muted">Lista banów</h2>
          {stats.bans.length === 0 ? (
            <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">Brak banów.</p>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
              {stats.bans.map((b, i) => (
                <li
                  key={`${b.kind}-${b.value}-${i}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-line/70" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-subtle">{b.kind}</p>
                    <p className="truncate font-medium">{b.value}</p>
                    {b.reason ? <p className="text-xs text-muted">{b.reason}</p> : null}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-muted"
                    onClick={() => void removeBan(b.kind, b.value)}
                  >
                    <ShieldOff className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <p className="text-center text-xs text-subtle">/zarzadzanie</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-subtle">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 font-serif text-3xl font-medium tabular-nums">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function shortRef(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname === "/" ? "" : u.pathname.slice(0, 40));
  } catch {
    return url.slice(0, 50);
  }
}
