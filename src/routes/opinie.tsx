import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useZanim } from "@/lib/store";

export const Route = createFileRoute("/opinie")({ component: OpiniePage });

function OpiniePage() {
  const review = useZanim((s) => s.review);
  const setReview = useZanim((s) => s.setReview);
  const [stars, setStars] = useState(review?.stars ?? 5);
  const [body, setBody] = useState(review?.body ?? "");
  const [sent, setSent] = useState(false);

  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-mark text-subtle">Opinie</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Co myślisz o Zanim?</h1>
        <p className="mt-2 text-sm text-muted">
          Twoja opinia zostaje na tym urządzeniu — pomaga nam wiedzieć, co działa.
        </p>
      </div>

      <div className="rounded-2xl border border-line/70 bg-surface p-5 shadow-card">
        <p className="text-sm font-medium">Ocena</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`size-11 rounded-xl text-lg transition ${
                n <= stars ? "bg-fg text-accent-fg" : "bg-elevated text-subtle"
              }`}
              onClick={() => setStars(n)}
            >
              ★
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-muted">Komentarz (opcjonalnie)</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Co Ci się podoba? Czego brakuje?"
          />
        </label>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            setReview(stars, body);
            setSent(true);
          }}
        >
          {sent ? "Zapisano — dziękujemy" : "Wyślij opinię"}
        </Button>
      </div>

      {review ? (
        <div className="rounded-2xl bg-elevated/50 px-4 py-3 text-sm text-muted">
          Ostatnio: {"★".repeat(review.stars)}
          {"☆".repeat(5 - review.stars)}
          {review.body ? ` — ${review.body}` : ""}
        </div>
      ) : null}

      <Link to="/konto" className="block text-sm font-medium text-fg">
        ← Wróć do Więcej
      </Link>
    </div>
  );
}
