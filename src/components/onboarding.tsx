import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PauseBars } from "@/components/pause-bars";
import { ZMark } from "@/components/mark";
import { useZanim } from "@/lib/store";

const STEPS = [
  {
    title: "Impuls chce decyzji teraz",
    body: "Sklepy i powiadomienia naciskają. Zanim daje przerwę — zanim klikniesz „kup”.",
  },
  {
    title: "48 godzin w poczekalni",
    body: "Wrzuć rzecz na listę. Czas mija. Emocja często słabnie. Potem świadomy werdykt.",
  },
  {
    title: "Kupujesz albo odpuszczasz",
    body: "Widzisz, ile nie wydałaś / nie wydałeś. Passa, cel i godziny pracy — konkret, nie wyrzuty.",
  },
];

export function Onboarding() {
  const finish = useZanim((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZMark />
            <span className="text-2xs font-semibold uppercase tracking-mark text-subtle">Zanim</span>
          </div>
          <span className="text-xs text-subtle">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        <div className="mt-6 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-fg" : "bg-elevated"}`}
            />
          ))}
        </div>

        <h1 className="rise-in mt-10 font-serif text-[2.1rem] font-medium leading-[1.15] tracking-tight">
          {current.title}
        </h1>
        <p className="rise-in-2 mt-4 max-w-sm text-[15px] leading-relaxed text-muted">{current.body}</p>

        {last ? (
          <div className="float-soft mt-14 flex justify-center text-fg opacity-90">
            <PauseBars />
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-line/70 bg-surface/90 p-4 shadow-card">
            <p className="text-sm font-medium">Nie moralizujemy.</p>
            <p className="mt-1 text-sm text-muted">
              Dajemy czas między bodźcem a decyzją. Reszta należy do Ciebie.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 space-y-2">
        <Button
          className="w-full rounded-xl"
          size="lg"
          onClick={() => (last ? finish() : setStep((s) => s + 1))}
        >
          {last ? "Zaczynam odczekiwanie" : "Dalej"}
        </Button>
        {!last ? (
          <button
            type="button"
            className="w-full py-2 text-sm text-muted"
            onClick={finish}
          >
            Pomiń
          </button>
        ) : null}
      </div>
    </div>
  );
}
