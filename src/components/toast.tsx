import { useEffect, useState } from "react";
import { useZanim } from "@/lib/store";

export function ToastHost() {
  const toast = useZanim((s) => s.lastToast);
  const pendingUndo = useZanim((s) => s.pendingUndo);
  const clearToast = useZanim((s) => s.clearToast);
  const undoLast = useZanim((s) => s.undoLast);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!toast && !pendingUndo) return;
    const id = window.setTimeout(() => clearToast(), 2800);
    return () => window.clearTimeout(id);
  }, [toast, pendingUndo, clearToast]);

  useEffect(() => {
    if (!pendingUndo) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [pendingUndo]);

  const undoLeft =
    pendingUndo && pendingUndo.expiresAt > Date.now()
      ? Math.ceil((pendingUndo.expiresAt - Date.now()) / 1000)
      : 0;

  // silence unused when no undo
  void tick;

  if (!toast && undoLeft <= 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="flex max-w-sm items-center gap-3 rounded-2xl bg-fg px-4 py-3 text-sm font-medium text-accent-fg shadow-soft">
        <span className="min-w-0 flex-1">{toast}</span>
        {undoLeft > 0 ? (
          <button
            type="button"
            className="shrink-0 rounded-lg bg-accent-fg/15 px-2.5 py-1 text-xs font-semibold text-accent-fg"
            onClick={() => undoLast()}
          >
            Cofnij {undoLeft}s
          </button>
        ) : null}
      </div>
    </div>
  );
}
