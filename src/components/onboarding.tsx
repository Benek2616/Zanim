import { Button } from "@/components/ui/button";
import { PauseBars } from "@/components/pause-bars";
import { ZMark } from "@/components/mark";
import { useZanim } from "@/lib/store";

export function Onboarding() {
  const finish = useZanim((s) => s.finishOnboarding);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <div>
        <div className="flex items-center gap-2">
          <ZMark />
          <span className="text-2xs font-semibold uppercase tracking-mark text-subtle">Zanim</span>
        </div>
        <h1 className="rise-in mt-8 font-serif text-[2.15rem] font-medium leading-[1.15] tracking-tight">
          Kupuj z głową,
          <br />
          nie z impulsem
        </h1>
        <p className="rise-in-2 mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
          Wrzuć rzecz do poczekalni na 48 godzin. Jak czas minie — decydujesz: kupujesz albo
          odpuszczasz. Prosto, bez presji.
        </p>

        <div className="rise-in-3 mt-10 grid gap-3">
          {[
            { t: "48 godzin oddechu", d: "Zanim klikniesz „kup”, daj sobie czas." },
            { t: "Werdykt na spokojnie", d: "Kupuję albo odpuszczam — Ty wybierasz." },
            { t: "Raport oszczędności", d: "Zobacz, ile nie wydałaś / nie wydałeś." },
          ].map((item) => (
            <div
              key={item.t}
              className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-3.5 shadow-card"
            >
              <p className="font-medium">{item.t}</p>
              <p className="mt-0.5 text-sm text-muted">{item.d}</p>
            </div>
          ))}
        </div>

        <div className="float-soft mt-12 flex justify-center text-fg opacity-90">
          <PauseBars />
        </div>
      </div>

      <Button className="mt-10 w-full rounded-xl" size="lg" onClick={finish}>
        Zaczynam odczekiwanie
      </Button>
    </div>
  );
}
