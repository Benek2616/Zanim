import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ENTITLEMENTS,
  DEFAULT_PROFILE,
  FREE_WAIT_HOURS,
  FREE_WAIT_LIMIT,
  PLANS,
  type CategoryId,
  type Entitlements,
  type ItemStatus,
  type PlanId,
  type Profile,
  type Review,
  type WaitItem,
} from "@/lib/zanim";

export type ZanimState = {
  hydrated: boolean;
  onboardingDone: boolean;
  darkMode: boolean;
  items: WaitItem[];
  profile: Profile;
  entitlements: Entitlements;
  review: Review | null;
  markHydrated: () => void;
  finishOnboarding: () => void;
  setDarkMode: (value: boolean) => void;
  addItem: (input: {
    title: string;
    amountGrosze: number;
    category: CategoryId;
    note: string;
    waitHours: number;
  }) => { ok: true; id: string } | { ok: false; error: string; code: "limit" | "plus" };
  decide: (id: string, status: Exclude<ItemStatus, "waiting">) => void;
  extend: (id: string) => void;
  remove: (id: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  activatePlus: (plan: Exclude<PlanId, "free">) => void;
  cancelPlus: () => void;
  resumePlus: () => void;
  setReview: (stars: number, body: string) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `z_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function plusActive(ent: Entitlements, now = Date.now()): boolean {
  if (!ent.plus) return false;
  if (!ent.periodEnd) return true;
  return new Date(ent.periodEnd).getTime() > now;
}

export const useZanim = create<ZanimState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingDone: false,
      darkMode: false,
      items: [],
      profile: DEFAULT_PROFILE,
      entitlements: DEFAULT_ENTITLEMENTS,
      review: null,
      markHydrated: () => set({ hydrated: true }),
      finishOnboarding: () => set({ onboardingDone: true }),
      setDarkMode: (value) => set({ darkMode: value }),
      addItem: (input) => {
        const { items, entitlements } = get();
        const plus = plusActive(entitlements);
        const waiting = items.filter((i) => i.status === "waiting");
        if (!plus && waiting.length >= FREE_WAIT_LIMIT) {
          return {
            ok: false,
            error: "Darmowy plan ma 5 rzeczy naraz. Odpuszczone zwolnią miejsce — albo weź Plus.",
            code: "limit",
          };
        }
        if (!plus && input.waitHours !== FREE_WAIT_HOURS) {
          return { ok: false, error: "Własny czas oddechu jest w Plusie.", code: "plus" };
        }
        const now = Date.now();
        const waitHours = plus ? input.waitHours : FREE_WAIT_HOURS;
        const item: WaitItem = {
          id: newId(),
          title: input.title.trim(),
          amountGrosze: input.amountGrosze,
          category: input.category,
          note: input.note.trim(),
          waitHours,
          createdAt: new Date(now).toISOString(),
          readyAt: new Date(now + waitHours * 3_600_000).toISOString(),
          status: "waiting",
        };
        set({ items: [item, ...items] });
        return { ok: true, id: item.id };
      },
      decide: (id, status) => {
        set({
          items: get().items.map((item) =>
            item.id === id && item.status === "waiting"
              ? { ...item, status, verdictAt: new Date().toISOString() }
              : item,
          ),
        });
      },
      extend: (id) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== id || item.status !== "waiting") return item;
            const from = Math.max(Date.now(), new Date(item.readyAt).getTime());
            return { ...item, readyAt: new Date(from + item.waitHours * 3_600_000).toISOString() };
          }),
        });
      },
      remove: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      setProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      activatePlus: (plan) => {
        const days = PLANS[plan].periodDays;
        const periodEnd = new Date(Date.now() + days * 86_400_000).toISOString();
        set({ entitlements: { plan, plus: true, periodEnd, cancelAtPeriodEnd: false } });
      },
      cancelPlus: () => {
        const current = get().entitlements;
        if (!current.plus) return;
        set({ entitlements: { ...current, cancelAtPeriodEnd: true } });
      },
      resumePlus: () => {
        const current = get().entitlements;
        if (!current.plus) return;
        set({ entitlements: { ...current, cancelAtPeriodEnd: false } });
      },
      setReview: (stars, body) => {
        const name = get().profile.displayName.trim() || "Ty";
        set({
          review: {
            stars,
            body: body.trim(),
            displayName: name,
            createdAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: "zanim.v1",
      skipHydration: true,
      partialize: (state) => ({
        onboardingDone: state.onboardingDone,
        darkMode: state.darkMode,
        items: state.items,
        profile: state.profile,
        entitlements: state.entitlements,
        review: state.review,
      }),
    },
  ),
);

export function isPlusActive(ent: Entitlements): boolean {
  if (ent.cancelAtPeriodEnd && ent.periodEnd && new Date(ent.periodEnd).getTime() <= Date.now()) {
    return false;
  }
  return plusActive(ent);
}
