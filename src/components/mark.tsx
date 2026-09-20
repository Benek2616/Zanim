import { cn } from "@/lib/utils";

export function ZMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-xl bg-fg font-serif text-sm font-semibold text-accent-fg shadow-soft",
        className,
      )}
      aria-hidden="true"
    >
      Z
    </span>
  );
}
