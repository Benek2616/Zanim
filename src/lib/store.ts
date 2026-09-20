import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ENTITLEMENTS,
  DEFAULT_PROFILE,
  FREE_WAIT_HOURS,
  FREE_WAIT_LIMIT,
  type CategoryId,
  type Entitlements,
  type ItemStatus,
  type Profile,
  type Review,
  type SkipReasonId,
  type WaitItem,
} from "@/lib/zanim";

function normalizeProfile(p: Partial<Profile> | Profile | undefined): Profile {
  return {
    displayName: p?.displayName ?? "",
    email: p?.email ?? "",
    accountCreated: Boolean(p?.accountCreated),
    monthlyIncomeGrosze: p?.monthlyIncomeGrosze ?? null,
    monthlyHours: p?.monthlyHours ?? 160,
    savingsGoalGrosze: p?.savingsGoalGrosze ?? null,
  };
}

export type PendingUndo = {
  itemId: string;
  snapshot: WaitItem;
  expiresAt: number;
};

export type ZanimState = {
  hydrated: boolean;
  onboardingDone: boolean;
  darkMode: boolean;
  items: WaitItem[];
  profile: Profile;
  entitlements: Entitlements;
  review: Review | null;
  lastToast: string | null;
  pendingUndo: PendingUndo | null;
  lastSkipId: string | null;
  markHydrated: () => void;
  finishOnboarding: () => void;
  setDarkMode: (value: boolean) => void;
  clearToast: () => void;
  clearLastSkip: () => void;
  /** Zakłada lokalne konto i aktywuje Plus (bez płatności). */
  createAccount: (input: { displayName: string; email: string }) => void;
  deleteAccount: () => void;
  addItem: (input: {
    title: string;
    amountGrosze: number;
    category: CategoryId;
    note: string;
    waitHours: number;
  }) => { ok: true; id: string } | { ok: false; error: string; code: "limit" | "plus" };
  decide: (
    id: string,
    status: Exclude<ItemStatus, "waiting">,
    skipReason?: SkipReasonId,
  ) => void;
  undoLast: () => void;
  extend: (id: string) => void;
  remove: (id: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  setReview: (stars: number, body: string) => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `z_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function plusEntitlements(): Entitlements {
  return {
    plan: "plus_month",
    plus: true,
    periodEnd: null,
    cancelAtPeriodEnd: false,
  };
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
      lastToast: null,
      pendingUndo: null,
      lastSkipId: null,
      markHydrated: () => set({ hydrated: true }),
      finishOnboarding: () => set({ onboardingDone: true }),
      setDarkMode: (value) => set({ darkMode: value }),
      clearToast: () => set({ lastToast: null }),
      clearLastSkip: () => set({ lastSkipId: null }),
      createAccount: ({ displayName, email }) => {
        set({
          profile: normalizeProfile({
            ...get().profile,
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
            accountCreated: true,
          }),
          entitlements: plusEntitlements(),
          lastToast: "Konto utworzone — Plus aktywny",
        });
      },
      deleteAccount: () => {
        set({
          profile: normalizeProfile({
            ...get().profile,
            email: "",
            accountCreated: false,
          }),
          entitlements: DEFAULT_ENTITLEMENTS,
          lastToast: "Konto usunięte — plan darmowy",
        });
      },
      addItem: (input) => {
        const { items, entitlements } = get();
        const plus = entitlements.plus;
        const waiting = items.filter((i) => i.status === "waiting");
        if (!plus && waiting.length >= FREE_WAIT_LIMIT) {
          return {
            ok: false,
            error: "Darmowy plan ma 5 rzeczy naraz. Załóż konto (Plus) albo odpuść coś z listy.",
            code: "limit",
          };
        }
        if (!plus && input.waitHours !== FREE_WAIT_HOURS) {
          return { ok: false, error: "Własny czas oddechu jest w Plusie (po założeniu konta).", code: "plus" };
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
        set({ items: [item, ...items], lastToast: `„${item.title}” w poczekalni` });
        return { ok: true, id: item.id };
      },
      decide: (id, status, skipReason) => {
        const item = get().items.find((i) => i.id === id);
        if (!item || item.status !== "waiting") return;
        const snapshot = { ...item };
        set({
          items: get().items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  verdictAt: new Date().toISOString(),
                  skipReason: status === "skipped" ? skipReason : undefined,
                }
              : i,
          ),
          pendingUndo: { itemId: id, snapshot, expiresAt: Date.now() + 10_000 },
          lastSkipId: status === "skipped" ? id : get().lastSkipId,
          lastToast:
            status === "skipped" ? `Odpuszczasz ${item.title}` : `Kupujesz ${item.title}`,
        });
      },
      undoLast: () => {
        const u = get().pendingUndo;
        if (!u || Date.now() > u.expiresAt) {
          set({ pendingUndo: null });
          return;
        }
        set({
          items: get().items.map((i) => (i.id === u.itemId ? { ...u.snapshot } : i)),
          pendingUndo: null,
          lastSkipId: null,
          lastToast: "Cofnięto decyzję",
        });
      },
      extend: (id) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== id || item.status !== "waiting") return item;
            const from = Math.max(Date.now(), new Date(item.readyAt).getTime());
            return { ...item, readyAt: new Date(from + item.waitHours * 3_600_000).toISOString() };
          }),
          lastToast: "Przedłużono czas oddechu",
        });
      },
      remove: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      setProfile: (patch) => set({ profile: normalizeProfile({ ...get().profile, ...patch }) }),
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
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ZanimState>;
        const profile = normalizeProfile(p.profile ?? current.profile);
        // konto = Plus
        const entitlements = profile.accountCreated
          ? plusEntitlements()
          : (p.entitlements ?? current.entitlements)?.plus && !profile.accountCreated
            ? DEFAULT_ENTITLEMENTS
            : profile.accountCreated
              ? plusEntitlements()
              : (p.entitlements ?? DEFAULT_ENTITLEMENTS);
        return {
          ...current,
          ...p,
          profile,
          entitlements: profile.accountCreated ? plusEntitlements() : DEFAULT_ENTITLEMENTS,
          hydrated: false,
          lastToast: null,
          pendingUndo: null,
          lastSkipId: null,
        };
      },
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
  return Boolean(ent.plus);
}
