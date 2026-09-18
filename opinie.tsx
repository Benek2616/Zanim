import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { useZanim } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/opinie")({ component: Opinie });

function Opinie() {
  const review = useZanim((s) => s.review);
  const setReview = useZanim((s) => s.setReview);
  const [stars, setStars] = useState(review?.stars ?? 5);
  const [body, setBody] = useState(review?.body ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const list = review ? [review] : [];
  const avg = list.length ? list.reduce((s, r) => s + r.stars, 0) / list.length : 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    setReview(stars, body);
    setMsg("Dzięki. Ocena jest zapisana na tym telefonie.");
  }

  return (
    <div className="rise-in pb-10">
      <p className="text-2xs font-medium tracking-mark text-subtle uppercase">Opinie</p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">
        Jak Zanim działa u ludzi
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Gwiazdki od osób, które odczekują. Bez recenzji z Tindrów SaaS-u.
      </p>
      {list.length > 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm">
          <Stars value={Math.round(avg)} size="sm" />
          <span className="tabular-nums text-muted">
            {avg.toFixed(1)} · {list.length} {list.length === 1 ? "ocena" : "ocen"}
          </span>
        </p>
      ) : null}

      <section className="mt-8 rounded-xl bg-surface p-5 ring-1 ring-line">
        <h2 className="font-serif text-xl font-medium">Twoja ocena</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <Stars value={stars} onChange={setStars} />
          <textarea
            className="min-h-24 rounded-md bg-bg px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-fg/30"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={280}
            placeholder="Co ci dało odczekanie? Opcjonalnie."
          />
          {msg ? <p className="text-sm text-muted">{msg}</p> : null}
          <Button type="submit" className="w-fit">
            Opublikuj ocenę
          </Button>
        </form>
      </section>

      <ul className="mt-8 grid gap-3">
        {list.length === 0 ? (
          <li className="rounded-xl bg-surface px-5 py-10 text-center text-sm text-muted ring-1 ring-line">
            Jeszcze cicho. Bądź pierwszą osobą.
          </li>
        ) : (
          list.map((r) => (
            <li key={r.createdAt} className="rounded-xl bg-surface p-5 ring-1 ring-line">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{r.displayName}</p>
                <Stars value={r.stars} size="sm" />
              </div>
              {r.body ? <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function Stars({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : "img"} aria-label={`${value} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(
            "grid place-items-center text-fg disabled:cursor-default",
            size === "sm" ? "size-7" : "size-11",
          )}
          aria-label={`${n} gwiazdek`}
        >
          <Star
            className={size === "sm" ? "size-4" : "size-6"}
            strokeWidth={1.75}
            fill={n <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}
