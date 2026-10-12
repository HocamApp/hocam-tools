/**
 * Hedef net planı: bölüm başına mevcut ve hedef net arasındaki fark.
 * Yalnızca net üzerinden çalışır; puan/sıralama tahmini yapmaz (ÖSYM standart puanı her yıl
 * o yılın ortalama ve standart sapmasına göre hesaplanır, doğrulanmış tablo olmadan tahmin edilmez).
 * Test yapısı ve soru sayıları için bkz. net.ts.
 */
import type { Section } from "./net";

export type GoalInput = { current: string; target: string };
export type GoalError = "invalid" | "over";

/** Boş alan null; "28,5" ve "28.5" kabul, en çok 2 ondalık, negatif yok. Geçersizse NaN. */
export function parseNetValue(value: string): number | null {
  const v = value.trim();
  if (v === "") return null;
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(v)) return Number.NaN;
  return Number(v.replace(",", "."));
}

export type GoalRow = { section: Section; current: number; target: number; gap: number };

/** Hedefi girilmeyen bölüm plana girmez; mevcut net boşsa 0 sayılır. */
export function computeGoal(sections: Section[], inputs: Record<string, GoalInput>) {
  const rows: GoalRow[] = [];
  const errors: Record<string, GoalError> = {};
  for (const section of sections) {
    const i = inputs[section.id] ?? { current: "", target: "" };
    const cur = parseNetValue(i.current);
    const tgt = parseNetValue(i.target);
    if (Number.isNaN(cur) || Number.isNaN(tgt)) {
      errors[section.id] = "invalid";
      continue;
    }
    if ((cur ?? 0) > section.questions || (tgt ?? 0) > section.questions) {
      errors[section.id] = "over";
      continue;
    }
    if (tgt === null) continue;
    const current = cur ?? 0;
    rows.push({ section, current, target: tgt, gap: Math.max(0, tgt - current) });
  }
  const totalGap = rows.reduce((s, r) => s + r.gap, 0);
  const totalTarget = rows.reduce((s, r) => s + r.target, 0);
  const totalCurrent = rows.reduce((s, r) => s + r.current, 0);
  return { rows, errors, totalGap, totalTarget, totalCurrent, ok: Object.keys(errors).length === 0 };
}

/** En büyük açık; eşitlikte listedeki ilki. Açık yoksa null. */
export function biggestGap(rows: GoalRow[]): GoalRow | null {
  let best: GoalRow | null = null;
  for (const r of rows) if (r.gap > 0 && (!best || r.gap > best.gap)) best = r;
  return best;
}

export function goalErrorMessage(section: Section, e: GoalError): string {
  return e === "invalid"
    ? `${section.label}: rakam girin, ondalık için virgül kullanın (örn. 28,5).`
    : `${section.label}: net ${section.questions} soruyu geçemez.`;
}
