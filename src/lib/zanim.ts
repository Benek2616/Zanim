export const CATEGORIES = [
  { id: "elektronika", label: "Elektronika" },
  { id: "ubrania", label: "Ubrania" },
  { id: "dom", label: "Dom" },
  { id: "jedzenie", label: "Jedzenie" },
  { id: "podroz", label: "Podróż" },
  { id: "hobby", label: "Hobby" },
  { id: "inne", label: "Inne" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const WAIT_OPTIONS = [
  { hours: 24, label: "24 godziny", plus: true },
  { hours: 48, label: "48 godzin", plus: false },
  { hours: 72, label: "3 dni", plus: true },
  { hours: 168, label: "7 dni", plus: true },
  { hours: 336, label: "14 dni", plus: true },
  { hours: 720, label: "30 dni", plus: true },
] as const;

export const SKIP_REASONS = [
  { id: "drogo", label: "Za drogie" },
  { id: "nie_potrzebuje", label: "Nie potrzebuję" },
  { id: "emocje", label: "To były emocje" },
  { id: "taniej", label: "Znajdę taniej" },
  { id: "poczekam", label: "Jeszcze poczekam" },
  { id: "inne", label: "Inny powód" },
] as const;

export type SkipReasonId = (typeof SKIP_REASONS)[number]["id"];

export type PlanId = "free" | "plus_month" | "plus_year";

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    priceGrosze: number;
    periodDays: number;
    priceLabel: string;
    periodLabel: string;
    blurb: string;
    features: string[];
  }
> = {
  free: {
    id: "free",
    name: "Darmowy",
    priceGrosze: 0,
    periodDays: 0,
    priceLabel: "0 zł",
    periodLabel: "bez konta",
    blurb: "Szybki start bez rejestracji.",
    features: [
      "5 rzeczy naraz w poczekalni",
      "Stałe 48 godzin oddechu",
      "Werdykt: kupuję albo odpuszczam",
      "Historia decyzji",
    ],
  },
  plus_month: {
    id: "plus_month",
    name: "Plus",
    priceGrosze: 0,
    periodDays: 0,
    priceLabel: "0 zł",
    periodLabel: "za konto",
    blurb: "Załóż konto — odblokujesz Plus bez płatności.",
    features: [
      "Bez limitu rzeczy w poczekalni",
      "Czas oddechu od 24 h do 30 dni",
      "Raport i cel oszczędności",
      "Przelicznik na godziny pracy",
    ],
  },
  plus_year: {
    id: "plus_year",
    name: "Plus",
    priceGrosze: 0,
    periodDays: 0,
    priceLabel: "0 zł",
    periodLabel: "za konto",
    blurb: "Ten sam Plus — aktywowany kontem, nie subskrypcją.",
    features: ["Wszystko z planu Plus", "Bez karty i bez firmy na start"],
  },
};

export const FREE_WAIT_LIMIT = 5;
export const FREE_WAIT_HOURS = 48;

export type ItemStatus = "waiting" | "bought" | "skipped";

export type WaitItem = {
  id: string;
  title: string;
  amountGrosze: number;
  category: CategoryId;
  note: string;
  waitHours: number;
  createdAt: string;
  readyAt: string;
  status: ItemStatus;
  verdictAt?: string;
  skipReason?: SkipReasonId;
};

export type Profile = {
  displayName: string;
  email: string;
  accountCreated: boolean;
  monthlyIncomeGrosze: number | null;
  monthlyHours: number;
  savingsGoalGrosze: number | null;
};

export type Entitlements = {
  plan: PlanId;
  plus: boolean;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type Review = {
  stars: number;
  body: string;
  displayName: string;
  createdAt: string;
};

export const SUGGESTIONS: {
  title: string;
  amountZl: number;
  category: CategoryId;
}[] = [
  { title: "AirPods", amountZl: 899, category: "elektronika" },
  { title: "Kurtka na jesień", amountZl: 429, category: "ubrania" },
  { title: "Kolacja", amountZl: 260, category: "jedzenie" },
  { title: "Bilet na mecz", amountZl: 190, category: "hobby" },
  { title: "Krem", amountZl: 348, category: "inne" },
  { title: "Słuchawki nauszne", amountZl: 649, category: "elektronika" },
  { title: "Weekend w Gdańsku", amountZl: 1180, category: "podroz" },
  { title: "Buty", amountZl: 519, category: "ubrania" },
  { title: "Lampa", amountZl: 279, category: "dom" },
  { title: "Gra", amountZl: 249, category: "hobby" },
];

export const PSYCHO_TIPS = [
  "Kupujesz rzecz — czy nastrój?",
  "Za 48 godzin ta chęć może być słabsza. To normalne.",
  "Okazja rzadko znika na zawsze. Impuls mija szybciej.",
  "Policz: ile godzin pracy kosztuje ten zakup?",
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function formatZl(grosze: number): string {
  const zl = grosze / 100;
  return (
    zl.toLocaleString("pl-PL", {
      minimumFractionDigits: zl % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }) + " zł"
  );
}

export function parseAmountToGrosze(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 100);
}

export function hoursOfWork(
  amountGrosze: number,
  monthlyIncomeGrosze: number | null,
  monthlyHours: number,
): number | null {
  if (!monthlyIncomeGrosze || monthlyIncomeGrosze <= 0 || monthlyHours <= 0) return null;
  const rate = monthlyIncomeGrosze / monthlyHours;
  if (rate <= 0) return null;
  return amountGrosze / rate;
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h} godz.` : `${h} godz. ${m} min`;
}

export function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) {
    const rest = hours % 24;
    return rest ? `${days} d. ${rest} godz.` : `${days} d.`;
  }
  if (hours >= 1) return `${hours} godz.`;
  return `${Math.max(1, Math.round(ms / 60_000))} min`;
}

export function pluralPl(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (abs === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function skipStreakDays(items: WaitItem[]): number {
  const days = new Set(
    items
      .filter((i) => i.status === "skipped" && i.verdictAt)
      .map((i) => new Date(i.verdictAt!).toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) {
      if (streak === 0) {
        d.setDate(d.getDate() - 1);
        const y = d.toISOString().slice(0, 10);
        if (!days.has(y)) return 0;
        streak = 1;
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function suggestedWaitHours(amountGrosze: number): number {
  if (amountGrosze >= 100_000) return 168;
  if (amountGrosze >= 50_000) return 72;
  if (amountGrosze >= 20_000) return 48;
  return 48;
}

function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function weekSkippedSum(items: WaitItem[], weeksAgo = 0): number {
  const start = startOfWeek();
  start.setDate(start.getDate() - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return items
    .filter((i) => {
      if (i.status !== "skipped" || !i.verdictAt) return false;
      const t = new Date(i.verdictAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .reduce((s, i) => s + i.amountGrosze, 0);
}

export const DEFAULT_PROFILE: Profile = {
  displayName: "",
  email: "",
  accountCreated: false,
  monthlyIncomeGrosze: null,
  monthlyHours: 160,
  savingsGoalGrosze: null,
};

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  plan: "free",
  plus: false,
  periodEnd: null,
  cancelAtPeriodEnd: false,
};
