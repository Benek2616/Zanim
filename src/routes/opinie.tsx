import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useZanim } from "@/lib/store";

export const Route = createFileRoute("/opinie")({ component: OpiniePage });

function OpiniePage() {
  const review = useZanim((s) => s.review);
  const setReview = useZanim((s) => s.setReview);
  const [stars, setStars] = useState(review?.stars ?? 5);
  const [body, setBody] = useState(review?.body ?? "");

  return (
    <div className="rise-in space-y-5 pb-6">
      <div>
        <p className="text-2xs font-medium uppercase tracking-mark text-subtle">Opinie</p>
        <h1 className="mt-1 font-serif text-3xl font-medium">Co myślisz o Zanim?</h1>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`size-10 rounded-md text-lg ${n <= stars ? "bg-fg text-accent-fg" : "bg-elevated"}`}
            onClick={() => setStars(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded-md border border-line bg-surface px-3 py-3 outline-none focus:ring-2 focus:ring-fg/20"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Opcjonalnie — kilka słów"
      />
      <Button onClick={() => setReview(stars, body)}>Zapisz opinię</Button>
      {review ? (
        <p className="text-sm text-muted">
          Zapisano: {review.stars}★ — {review.body || "(bez treści)"}
        </p>
      ) : null}
    </div>
  );
}
