import type { WaitItem } from "./zanim";

export type Analysis = {
  verdict: "warto" | "poczekaj" | "zastanów się";
  summary: string;
  questions: string[];
  alternatives: string[];
  insight?: string;
};

export function analyzeItem(item: WaitItem, history: WaitItem[] = []): Analysis {
  const amount = item.amountGrosze / 100;
  const title = item.title.toLowerCase();
  const note = (item.note || "").toLowerCase();
  const cat = item.category;

  const questions: string[] = [];
  const alternatives: string[] = [];

  // Pytania podstawowe
  questions.push("Czy używałeś już czegoś podobnego w ostatnim roku?");
  questions.push("Co się stanie, jeśli nie kupisz tego przez najbliższe 30 dni?");

  if (amount > 250) {
    questions.push("Czy ta kwota to więcej niż kilka dni Twojej pracy?");
  }

  if (note.includes("chcę") || note.includes("fajne") || note.includes("impuls") || note.includes("okazja")) {
    questions.push("Czy decyzja wynika bardziej z emocji czy z realnej potrzeby?");
  }

  // Historia kategorii
  const sameCat = history.filter((h) => h.category === cat && h.status !== "waiting");
  const skippedInCat = sameCat.filter((h) => h.status === "skipped").length;
  if (skippedInCat >= 2) {
    questions.push(`W tej kategorii odpuszczałeś już ${skippedInCat} razy. Czy tym razem jest inaczej?`);
  }

  // Alternatywy
  if (amount > 150) {
    alternatives.push("Sprawdź używane / outlet tej samej kategorii");
    alternatives.push("Odłóż decyzję o tydzień i zobacz, czy nadal tego chcesz");
  }
  if (title.includes("słuchawki") || title.includes("airpods")) {
    alternatives.push("Porównaj z tańszymi modelami z ANC");
  }
  if (cat === "ubrania" && amount > 200) {
    alternatives.push("Sprawdź outlet lub second-hand tej samej marki");
  }

  // Werdykt
  let verdict: Analysis["verdict"] = "zastanów się";
  let summary = "Warto dać sobie jeszcze chwilę na spokojne przemyślenie.";
  let insight: string | undefined;

  if (amount < 80 && skippedInCat === 0 && !note.includes("impuls")) {
    verdict = "warto";
    summary = "Niska kwota i brak silnych sygnałów impulsu. Jeśli naprawdę potrzebujesz — możesz kupić.";
  } else if (amount > 700 || note.includes("bardzo chcę") || skippedInCat >= 3) {
    verdict = "poczekaj";
    summary = "Wyższa kwota, silne emocje lub historia odpuszczania w tej kategorii. Lepiej odczekać pełny czas.";
    if (skippedInCat >= 3) {
      insight = "W tej kategorii często odpuszczasz. To dobry sygnał, że warto dać sobie więcej czasu.";
    }
  }

  return { verdict, summary, questions, alternatives, insight };
}
