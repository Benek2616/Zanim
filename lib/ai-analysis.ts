import type { WaitItem } from "./zanim";

export type Analysis = {
  verdict: "warto" | "poczekaj" | "zastanów się";
  summary: string;
  questions: string[];
  alternatives: string[];
};

export function analyzeItem(item: WaitItem): Analysis {
  const amount = item.amountGrosze / 100;
  const title = item.title.toLowerCase();
  const note = item.note.toLowerCase();

  const questions: string[] = [];
  const alternatives: string[] = [];

  // Pytania o potrzebę
  questions.push("Czy używałeś już czegoś podobnego w ostatnim roku?");
  questions.push("Co się stanie, jeśli nie kupisz tego przez najbliższe 30 dni?");

  if (amount > 300) {
    questions.push("Czy ta kwota to więcej niż tydzień Twojej pracy?");
  }

  if (note.includes("chcę") || note.includes("fajne") || note.includes("impuls")) {
    questions.push("Czy decyzja wynika bardziej z emocji czy z realnej potrzeby?");
  }

  // Alternatywy
  if (amount > 200) {
    alternatives.push("Sprawdź używane / outlet tej samej kategorii");
    alternatives.push("Odłóż decyzję o tydzień i zobacz, czy nadal tego chcesz");
  }

  if (title.includes("słuchawki") || title.includes("airpods")) {
    alternatives.push("Porównaj z tańszymi modelami z ANC");
  }

  // Werdykt
  let verdict: Analysis["verdict"] = "zastanów się";
  let summary = "Warto dać sobie jeszcze chwilę na spokojne przemyślenie.";

  if (amount < 100 && questions.length <= 2) {
    verdict = "warto";
    summary = "Niska kwota i brak silnych sygnałów impulsu. Jeśli naprawdę potrzebujesz — możesz kupić.";
  } else if (amount > 800 || note.includes("bardzo chcę")) {
    verdict = "poczekaj";
    summary = "Wyższa kwota lub silne emocje. Lepiej odczekać pełny czas i sprawdzić alternatywy.";
  }

  return { verdict, summary, questions, alternatives };
}
