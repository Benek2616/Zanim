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
  recent: { email: string; displayName: string; plus: boolean; createdAt: string }[];
  visitsTotal: number;
  visitsLast7: number;
  visitsLast30: number;
  uniqueVisitors7: number;
  topPaths: { path: string; count: number }[];
  recentVisits: { path: string; createdAt: string; referrer: string | null }[];
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
  const [tab, setTab] = useState<"overview" | "signups" | "visits">("overview");

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(STORAGE_KEY);
      if (p) setSavedPw(p);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchStats = useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
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
          (res.status === 401
            ? "Złe hasło."
            : res.status === 503
              ? "Hasło nie jest ustawione na serwerze — zrób Redeploy."
              : `Błąd ${res.status}`);
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
      });
      setSavedPw(pw);
      try {
        sessionStorage.setItem(STORAGE_KEY, pw);
      } catch {
        /* ignore */
      }
    } catch {
      setError("Nie udało się połączyć z serwerem (/api/admin-stats).");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div className="rise-in space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Admin</p>
          <h1 className="mt-1 font-serif text-2xl font-medium">Panel</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.configured ? "Supabase OK" : "Tracking wyłączony"}
          </p>
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

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Eye} label="Wizyty łącznie" value={stats.visitsTotal} />
            <StatCard icon={UserRound} label="Unikalni (7 dni)" value={stats.uniqueVisitors7} />
            <StatCard icon={Users} label="Konta" value={stats.total} />
            <StatCard icon={Sparkles} label="Plus" value={stats.plus} />
            <StatCard icon={Calendar} label="Wizyty 7 dni" value={stats.visitsLast7} />
            <StatCard icon={Calendar} label="Wizyty 30 dni" value={stats.visitsLast30} />
          </div>

          {stats.topPaths.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Najpopularniejsze ścieżki (30 dni)</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Wszystkie" value={stats.total} />
            <StatCard icon={Sparkles} label="Plus" value={stats.plus} />
            <StatCard icon={Calendar} label="7 dni" value={stats.last7} />
            <StatCard icon={Calendar} label="30 dni" value={stats.last30} />
          </div>
          <h2 className="text-sm font-semibold text-muted">Ostatnie konta</h2>
          {stats.recent.length === 0 ? (
            <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">
              Brak kont — pojawią się po „Załóż konto → Plus”.
            </p>
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
                  <div className="shrink-0 text-right text-xs text-subtle">
                    <p>{r.plus ? "Plus" : "Free"}</p>
                    <p>{formatDate(r.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "visits" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Eye} label="Łącznie" value={stats.visitsTotal} />
            <StatCard icon={UserRound} label="Unikalni 7d" value={stats.uniqueVisitors7} />
          </div>
          <h2 className="text-sm font-semibold text-muted">Ostatnie wizyty</h2>
          {stats.recentVisits.length === 0 ? (
            <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">
              Brak wizyt — pojawią się po wejściu użytkowników na stronę (i po utworzeniu tabeli
              visits w Supabase).
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
                  <p className="shrink-0 text-xs text-subtle">{formatDate(v.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <p className="text-center text-xs text-subtle">/zarzadzanie — tylko dla Ciebie</p>
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
