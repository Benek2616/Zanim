import { useEffect } from "react";
import { useZanim } from "@/lib/store";

export function ToastHost() {
  const toast = useZanim((s) => s.lastToast);
  const clearToast = useZanim((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => clearToast(), 2800);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="max-w-sm rounded-2xl bg-fg px-4 py-3 text-center text-sm font-medium text-accent-fg shadow-soft">
        {toast}
      </div>
    </div>
  );
}
