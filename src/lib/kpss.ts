/**
 * KPSS Lisans (GY-GK) puanı: P1, P2, P3.
 *
 * Resmî yöntem (ÖSYM 2026 KPSS Lisans Kılavuzu §3.10, https://dokuman.osym.gov.tr/pdfdokuman/2026/KPSS/LISANS/kilavuz_Ld01072026.pdf):
 * ham puan = doğru − yanlış/4; standart puan SP = 50 + 10·(ham − ort)/SS; ağırlıklı standart puan
 * ASP = Σ ağırlık·SP; KPSS puanı = 70 + 30·[2(ASP − X) − S] / [2(B − X) − S]
 * (X ASP ortalaması, S ASP standart sapması, B en yüksek ASP).
 * Ağırlıklar: Tablo-2 (P1: GY 0,70 GK 0,30; P2: 0,60/0,40; P3: 0,50/0,50).
 * Ortalama ve SS: ÖSYM "2026-KPSS Lisans Sınavı Sonuçlarına İlişkin Sayısal Bilgiler" Tablo 2
 * (https://dokuman.osym.gov.tr/web/2026/10/2026-kpss-lisans-sinavi-sonuclarina-liskin-sayisal-bilgiler-l38b0s-07100549.pdf).
 *
 * ÖSYM S ve B'yi yayımlamaz, bu yüzden: X = 50 (her SP'nin ortalaması 50), S = 10·√(Σw² + 2·w1·w2·ρ) ile
 * GY-GK korelasyonu ρ = 0,8 varsayılır (S, ρ 0,7-0,9 arasında ±0,3 oynar), B = tüm soruları doğru yapan
 * adayın ASP'si (üst sınır). Sonuç yaklaşık ±2 puandır. Puan dağılımı yayımlanmadığı için sıra hesaplanmaz.
 */

export const KPSS_QUESTIONS = 60;
const STATS = {
  gy: { mean: 19.43895, sd: 8.86348 },
  gk: { mean: 20.07724, sd: 12.15079 },
} as const;
const RHO = 0.8;

export const KPSS_TYPES = [
  { id: "P1", wGy: 0.7, wGk: 0.3 },
  { id: "P2", wGy: 0.6, wGk: 0.4 },
  { id: "P3", wGy: 0.5, wGk: 0.5 },
] as const;
export type KpssType = (typeof KPSS_TYPES)[number];

const sp = (key: "gy" | "gk", net: number) => 50 + (10 * (net - STATS[key].mean)) / STATS[key].sd;

/** ÖSYM: puan için ilgili testte en az 1 ham puan (net) gerekir. */
export function kpssEligible(gyNet: number, gkNet: number): boolean {
  return gyNet >= 1 && gkNet >= 1;
}

export function kpssPuan(t: KpssType, gyNet: number, gkNet: number): number {
  const asp = t.wGy * sp("gy", gyNet) + t.wGk * sp("gk", gkNet);
  const x = 50;
  const s = 10 * Math.sqrt(t.wGy ** 2 + t.wGk ** 2 + 2 * t.wGy * t.wGk * RHO);
  const b = t.wGy * sp("gy", KPSS_QUESTIONS) + t.wGk * sp("gk", KPSS_QUESTIONS);
  const puan = 70 + (30 * (2 * (asp - x) - s)) / (2 * (b - x) - s);
  return Math.min(100, puan);
}
