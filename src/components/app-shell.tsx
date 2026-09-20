import { Link, useRouterState } from "@tanstack/react-router";
import { Hourglass, Pause, PiggyBank, UserRound, Plus } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { ZMark } from "@/components/mark";
import { Onboarding } from "@/components/onboarding";
import { ToastHost } from "@/components/toast";
import { cn } from "@/lib/utils";
import { setupPwa } from "@/lib/pwa";
import { useZanim } from "@/lib/store";

const TABS = [
  { to: "/", label: "Poczekalnia", icon: Hourglass },
  { to: "/raport", label: "Raport", icon: PiggyBank },
  { to: "/cennik", label: "Plus", icon: Pause },
  { to: "/konto", label: "Więcej", icon: UserRound },
] as const;

function isTabActive(to: string, pathname: string): boolean {
  if (to === "/") return pathname === "/";
  if (to === "/cennik") return pathname === "/cennik";
  if (to === "/raport") return pathname === "/raport";
  return ["/konto", "/opinie", "/na-telefon", "/prywatnosc", "/regulamin", "/faq"].includes(
    pathname,
  );
}

function applyDarkClass(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#121110" : "#f4efe6");
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useZanim((s) => s.hydrated);
  const onboardingDone = useZanim((s) => s.onboardingDone);
  const darkMode = useZanim((s) => s.darkMode);
  const markHydrated = useZanim((s) => s.markHydrated);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setupPwa();
    void Promise.resolve(useZanim.persist.rehydrate()).then(() => markHydrated());
  }, [markHydrated]);

  useEffect(() => {
    applyDarkClass(darkMode);
  }, [darkMode]);

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10">
        <div className="flex items-center gap-2.5">
          <ZMark />
          <span className="font-serif text-lg font-medium">Zanim</span>
        </div>
        <div className="mt-10 h-36 animate-pulse rounded-2xl bg-elevated/80" />
        <div className="mt-3 h-24 animate-pulse rounded-2xl bg-elevated/50" />
      </div>
    );
  }

  if (!onboardingDone) return <Onboarding />;

  const hideTabs = pathname === "/nowe";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/60 bg-bg/80 px-5 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 text-fg">
          <ZMark />
          <span className="font-serif text-lg font-medium tracking-tight">Zanim</span>
        </Link>
        {pathname === "/nowe" ? (
          <Link to="/" className="text-sm font-medium text-muted">
            Anuluj
          </Link>
        ) : (
          <Link
            to="/nowe"
            className="chip-shimmer inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-accent-fg shadow-soft"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Nowe
          </Link>
        )}
      </header>

      <main className={cn("flex-1 px-5 pt-5", hideTabs ? "pb-10" : "pb-28")}>{children}</main>
      <ToastHost />

      {!hideTabs ? (
        <nav className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-md px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-4 gap-1 rounded-2xl border border-line/80 bg-surface/95 p-1.5 shadow-soft backdrop-blur-xl">
              {TABS.map(({ to, label, icon: Icon }) => {
                const active = isTabActive(to, pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "tab-pill flex flex-col items-center gap-0.5 rounded-xl py-2.5 text-[10px] font-semibold",
                      active
                        ? "bg-fg text-accent-fg shadow-card"
                        : "text-subtle hover:text-fg",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
