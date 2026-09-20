import { Link, useRouterState } from "@tanstack/react-router";
import { Hourglass, Pause, PiggyBank, UserRound } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { ZMark } from "@/components/mark";
import { Onboarding } from "@/components/onboarding";
import { cn } from "@/lib/utils";
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
  return ["/konto", "/opinie", "/na-telefon", "/prywatnosc", "/regulamin"].includes(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useZanim((s) => s.hydrated);
  const onboardingDone = useZanim((s) => s.onboardingDone);
  const markHydrated = useZanim((s) => s.markHydrated);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void Promise.resolve(useZanim.persist.rehydrate()).then(() => markHydrated());
  }, [markHydrated]);

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-dvh max-w-md px-5 pt-8">
        <p className="font-serif text-lg font-medium">Zanim</p>
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-elevated" />
      </div>
    );
  }

  if (!onboardingDone) return <Onboarding />;

  const hideTabs = pathname === "/nowe";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
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
            className="rounded-md bg-fg px-3 py-2 text-sm font-medium text-accent-fg"
          >
            + Nowe
          </Link>
        )}
      </header>
      <main className={cn("flex-1 px-5", hideTabs ? "pb-8" : "pb-28")}>{children}</main>
      {!hideTabs ? (
        <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
            {TABS.map(({ to, label, icon: Icon }) => {
              const active = isTabActive(to, pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium",
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
