import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Users, Sparkles, Calendar, RefreshCw, LogOut } from "lucide-react";

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
  message?: string;
};

const STORAGE_KEY = "zanim.admin.pw";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [savedPw, setSavedPw] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const data = (await res.json().catch(() => ({}))) as Stats & { statusMessage?: string };
      if (!res.ok) {
        setError(data.statusMessage || "Błąd autoryzacji.");
        setStats(null);
        setSavedPw(null);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      setStats(data);
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
        <p className="text-sm text-muted">
          Hasło ustawiasz w Vercel → Environment Variables jako <code className="text-fg">ADMIN_PASSWORD</code>.
        </p>
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
    <div className="rise-in space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Admin</p>
          <h1 className="mt-1 font-serif text-2xl font-medium">Panel zarządzania</h1>
          <p className="mt-1 text-sm text-muted">
            {stats.configured ? "Dane z Supabase (signups)" : "Tracking nie skonfigurowany"}
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

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Wszystkie konta" value={stats.total} />
        <StatCard icon={Sparkles} label="Plus" value={stats.plus} />
        <StatCard icon={Calendar} label="Ostatnie 7 dni" value={stats.last7} />
        <StatCard icon={Calendar} label="Ostatnie 30 dni" value={stats.last30} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted">Ostatnie rejestracje</h2>
        {stats.recent.length === 0 ? (
          <p className="rounded-xl border border-line/70 bg-surface p-4 text-sm text-muted">
            Brak danych — konta pojawią się po założeniu w aplikacji.
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

      <p className="text-center text-xs text-subtle">
        Adres panelu jest ukryty — nie ma linku w nawigacji.
      </p>
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
