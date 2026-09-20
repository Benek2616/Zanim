import type { Entitlements, Profile, Review, WaitItem } from "@/lib/zanim";

export type ZanimBackup = {
  version: 1;
  exportedAt: string;
  onboardingDone: boolean;
  darkMode: boolean;
  items: WaitItem[];
  profile: Profile;
  entitlements: Entitlements;
  review: Review | null;
};

export function downloadBackup(data: ZanimBackup) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zanim-kopia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): ZanimBackup {
  const raw = JSON.parse(text) as unknown;
  if (!raw || typeof raw !== "object") throw new Error("Nieprawidłowy plik");
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || !Array.isArray(o.items)) throw new Error("Nieobsługiwany format kopii");
  return o as ZanimBackup;
}
