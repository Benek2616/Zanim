import { cn } from "@/lib/utils";

export function ZMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-sm bg-fg font-serif text-sm font-medium text-accent-fg",
        className,
      )}
      aria-hidden="true"
    >
      Z
    </span>
  );
}
