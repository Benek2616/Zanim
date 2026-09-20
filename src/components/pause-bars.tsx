import { cn } from "@/lib/utils";

export function PauseBars({ className }: { className?: string }) {
  return (
    <div className={cn("pause-bars", className)} aria-hidden="true">
      <span />
      <span />
    </div>
  );
}
