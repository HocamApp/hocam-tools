/**
 * OBP (Ortaöğretim Başarı Puanı).
 *
 * Kaynak: ÖSYM 2026-YKS Sıkça Sorulan Sorular, soru 48-52
 * (https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/sss_yksd19022026.pdf).
 * Doğrulama: 10 Ekim 2026. 2027-YKS kılavuzu/SSS yayımlanınca yeniden kontrol edilmeli.
 *
 * - Diploma notu (100'lük) × 5 = OBP. Not bildirilmeyen veya 50'nin altındaki diploma notu 50
 *   sayılır; OBP en az 250, en çok 500 olur.
 * - Yerleştirme puanına katkı: OBP × 0,12 (en çok 60).
 * - Katsayı yarıya iner (0,06, en çok 30): sınav yılından bir önceki yılın YKS puanıyla ÖSYM
 *   merkezî yerleştirmesiyle (ÖZYES dâhil) bir programa yerleştirilen adaylar (kayıt olsun veya
 *   olmasın) ve özel yetenek sınavı sonucu bir programa kayıt olan adaylar için.
 * - Meslek lisesi ek puanı ayrı bir kuraldır; burada hesaplanmaz.
 */

export const MIN_DIPLOMA = 50;
export const MAX_DIPLOMA = 100;
const FACTOR = 0.12;
const FACTOR_HALVED = 0.06;

/** "85,5" veya "85.5"; en çok iki ondalık, 0–100. Geçersizse null. */
export function parseDiploma(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n <= MAX_DIPLOMA ? n : null;
}

/** `clamped`: not 50'nin altındaydı ve ÖSYM kuralı gereği 50 sayıldı. */
export function computeObp(diploma: number, placedLastYear: boolean) {
  const clamped = diploma < MIN_DIPLOMA;
  const obp = Math.max(diploma, MIN_DIPLOMA) * 5;
  const contribution = obp * (placedLastYear ? FACTOR_HALVED : FACTOR);
  return { obp, contribution, clamped };
}

/** 51,30 gibi Türkçe ondalık, iki hane. */
export function formatScore(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
