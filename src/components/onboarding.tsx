import { Button } from "@/components/ui/button";
import { PauseBars } from "@/components/pause-bars";
import { useZanim } from "@/lib/store";

export function Onboarding() {
  const finish = useZanim((s) => s.finishOnboarding);
  return (
    <div className="flex min-h-dvh flex-col justify-between px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Zanim</p>
        <h1 className="mt-3 font-serif text-3xl font-medium leading-tight">
          Odczekaj, zanim wydasz
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Wrzuć rzecz do poczekalni na 48 godzin. Jak czas minie — kupujesz albo odpuszczasz.
          Bez pośpiechu, bez impulsu.
        </p>
        <div className="mt-10 flex justify-center text-fg">
          <PauseBars />
        </div>
      </div>
      <Button className="w-full" size="lg" onClick={finish}>
        Zaczynam
      </Button>
    </div>
  );
}
