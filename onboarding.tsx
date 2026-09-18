import { Clock, Hourglass, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PauseBars } from "@/components/pause-bars";
import { ZMark } from "@/components/mark";
import { useZanim } from "@/lib/store";
import { useState } from "react";

const STEPS = [
  {
    kicker: "48 godzin ciszy · potem decyzja",
    title: "Zanim kupisz.\nZanim żałujesz.",
    body: "Sklepy krzyczą „kup teraz”. Zanim jest pauzą: wrzucasz rzecz, odczekujesz, i dopiero wtedy decydujesz — z chłodną głową.",
  },
  {
    kicker: "Jak to działa",
    title: "Trzy ruchy.\nŻadnego koszyka.",
    body: "Wrzucasz chęć. Odczekujesz. Dajesz werdykt. Widzisz, ile godzin twojej pracy to było — i ile zostało w kieszeni.",
  },
  {
    kicker: "Gotowe",
    title: "Poczekalnia\nczeka.",
    body: "Gdy coś kusi, wrzuć to tutaj zamiast do koszyka. 48 godzin robi różnicę. Dane zostają na tym telefonie.",
  },
];

export function Onboarding() {
  const finish = useZanim((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div className="flex min-h-dvh flex-col px-6 pb-[max(6.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ZMark />
          <span className="font-serif text-lg font-medium tracking-tight">Zanim</span>
        </div>
        {step > 0 ? (
          <button
            type="button"
            className="h-11 px-2 text-sm font-medium text-muted"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Wstecz
          </button>
        ) : (
          <span className="h-11" />
        )}
      </div>

      <div className="rise-in my-auto py-10">
        {step === 0 ? (
          <div className="mb-8 flex h-16 items-end text-fg">
            <PauseBars className="h-16 text-fg" />
          </div>
        ) : step === 1 ? (
          <ol className="mb-8 grid gap-3">
            <StepRow n="01" icon={Hourglass} title="Wrzucasz chęć" />
            <StepRow n="02" icon={Clock} title="Odczekujesz" />
            <StepRow n="03" icon={PiggyBank} title="Werdykt" />
          </ol>
        ) : (
          <div className="mb-8 rounded-xl bg-fg p-5 text-accent-fg shadow-ink">
            <p className="text-2xs font-medium tracking-mark uppercase text-accent-fg/55">
              W poczekalni
            </p>
            <p className="mt-1 font-serif text-3xl font-medium tabular-nums">0 zł</p>
            <p className="mt-4 text-sm text-accent-fg/70">Pusto. To dobrze.</p>
          </div>
        )}

        <p className="text-2xs font-medium tracking-mark text-subtle uppercase">{current.kicker}</p>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[0.95] tracking-tight whitespace-pre-line">
          {current.title}
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">{current.body}</p>
      </div>

      <div className="grid gap-3">
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                i === step ? "h-1.5 w-5 rounded-full bg-fg" : "h-1.5 w-1.5 rounded-full bg-line"
              }
            />
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
          {last ? "Otwórz poczekalnię" : "Dalej"}
        </Button>
        {!last ? (
          <button
            type="button"
            className="h-11 text-sm font-medium text-muted"
            onClick={finish}
          >
            Pomiń
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StepRow({
  n,
  icon: Icon,
  title,
}: {
  n: string;
  icon: typeof Hourglass;
  title: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
      <span className="font-mono text-xs tabular-nums text-subtle">{n}</span>
      <Icon className="size-4 text-subtle" strokeWidth={1.75} />
      <span className="font-serif text-base font-medium">{title}</span>
    </li>
  );
}
