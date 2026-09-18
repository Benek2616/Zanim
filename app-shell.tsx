import { Link, useRouterState } from "@tanstack/react-router";
import { Hourglass, Pause, PiggyBank, UserRound } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { ZMark } from "@/components/mark";
import { Onboarding } from "@/components/onboarding";
import { cn } from "@/lib/utils";
import { useZanim } from "@/lib/store";

const TABS = [
  { to: "/", label: "Poczekalnia", icon: Hourglass, exact: true },
  { to: "/raport", label: "Raport", icon: PiggyBank, exact: true },
  { to: "/cennik", label: "Plus", icon: Pause, exact: false },
  { to: "/konto", label: "Więcej", icon: UserRound, exact: false },
] as const;

function isTabActive(to: string, pathname: string): boolean {
  if (to === "/") return pathname === "/";
  if (to === "/cennik") return pathname === "/cennik";
  if (to === "/raport") return pathname === "/raport";
  return (
    pathname === "/konto" ||
    pathname === "/opinie" ||
    pathname === "/na-telefon" ||
    pathname === "/prywatnosc" ||
    pathname === "/regulamin"
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useZanim((s) => s.hydrated);
  const onboardingDone = useZanim((s) => s.onboardingDone);
  const markHydrated = useZanim((s) => s.markHydrated);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void Promise.resolve(useZanim.persist.rehydrate()).then(() => {
      markHydrated();
    });
  }, [markHydrated]);

  if (!hydrated) {
    return (
      <PhoneFrame>
        <div className="flex min-h-dvh flex-col px-5 pt-8">
          <p className="font-serif text-lg font-medium">Zanim</p>
          <div className="mt-8 h-40 animate-pulse rounded-xl bg-elevated" />
        </div>
      </PhoneFrame>
    );
  }

  if (!onboardingDone) {
    return (
      <PhoneFrame>
        <Onboarding />
      </PhoneFrame>
    );
  }

  const hideTabs = pathname === "/nowe";

  return (
    <PhoneFrame>
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex items-center gap-2.5 text-fg">
          <ZMark />
          <span className="font-serif text-lg font-medium tracking-tight">Zanim</span>
        </Link>
        {pathname === "/nowe" ? (
          <Link to="/" className="h-11 px-1 text-sm font-medium text-muted">
            Anuluj
          </Link>
        ) : (
          <Link
            to="/nowe"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
          >
            Dodaj
          </Link>
        )}
      </header>
      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-5",
          hideTabs ? "pb-28" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </main>
      {hideTabs ? null : (
        <nav
          className="absolute inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="grid grid-cols-4">
            {TABS.map((tab) => {
              const active = isTabActive(tab.to, pathname);
              const Icon = tab.icon;
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                      active ? "text-fg" : "text-subtle",
                    )}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </PhoneFrame>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
        {children}
      </div>
    </div>
  );
}
