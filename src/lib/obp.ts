/**
 * OBP (Ortaöğretim Başarı Puanı): diploma notu (100'lük) × 5 → 250–500.
 * Yerleştirme puanına katkısı OBP × 0,12 (en çok 60). Önceki yıllarda bir
 * yükseköğretim programına yerleşmiş adaylarda katsayı 0,06'dır ("kırık OBP").
 *
 * Katsayılar ÖSYM kılavuzundan her yıl doğrulanmalı.
 */

export const MIN_DIPLOMA = 50;
export const MAX_DIPLOMA = 100;
const FACTOR = 0.12;
const FACTOR_PREVIOUSLY_PLACED = 0.06;

/** "85,5" veya "85.5"; en çok iki ondalık, 50–100. Geçersizse null. */
export function parseDiploma(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n >= MIN_DIPLOMA && n <= MAX_DIPLOMA ? n : null;
}

export function computeObp(diploma: number, previouslyPlaced: boolean) {
  const obp = diploma * 5;
  const contribution = obp * (previouslyPlaced ? FACTOR_PREVIOUSLY_PLACED : FACTOR);
  return { obp, contribution };
}

/** 51,30 gibi Türkçe ondalık, iki hane. */
export function formatScore(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
