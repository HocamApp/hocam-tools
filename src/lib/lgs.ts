/**
 * LGS puanı (100-500) → yaklaşık yüzdelik dilim ve sıra.
 *
 * MEB puan dağılımı yayımlamaz; yayımladığı tek ulusal eğri noktaları okulların taban puanı ve
 * yüzdelik dilimleridir (lgs-data.ts). Her 10 puanlık dilimde medyan alınır (okullar arası gürültü ve
 * farklı yerleştirme esasları medyanla zayıflar), eğri puan arttıkça azalan olacak şekilde düzeltilir
 * ve noktalar arası doğrusal interpolasyon yapılır. 500 noktası 719/963.142'dir (2025 tam puan).
 * Destek aralığı: en düşük bin merkezinin altında yüzdelik dilim ~%35'yi geçer; güvenilir veri yoktur.
 */
import { LGS_2025_FULL_SCORE, LGS_2025_TAKERS, LGS_PAIRS } from "./lgs-data";

export const LGS_MAX_PUAN = 500;
const BIN = 10;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** [puan, yüzdelik] noktaları, puan artan, yüzdelik azalan. */
function buildCurve(): [number, number][] {
  const bins = new Map<number, [number, number][]>();
  for (const pair of LGS_PAIRS) {
    const b = Math.floor(pair[0] / BIN) * BIN;
    bins.set(b, [...(bins.get(b) ?? []), pair]);
  }
  const pts: [number, number][] = [...bins.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, ps]) => [median(ps.map((p) => p[0])), median(ps.map((p) => p[1]))]);
  pts.push([LGS_MAX_PUAN, (LGS_2025_FULL_SCORE / LGS_2025_TAKERS) * 100]);
  // Puan arttıkça yüzdelik azalmalı: soldan sağa en küçük değeri taşı.
  for (let i = 1; i < pts.length; i++) pts[i][1] = Math.min(pts[i][1], pts[i - 1][1]);
  return pts;
}

const CURVE = buildCurve();
export const LGS_CURVE: readonly [number, number][] = CURVE;
/** Eğrinin ilk noktası; bunun altında sıra hesaplanmaz. */
export const LGS_MIN_PUAN = Math.ceil(CURVE[0][0]);

/** "85,5" veya "85.5"; en çok iki ondalık. Aralık dışı veya geçersizse null. */
export function parseLgsPuan(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,3})?$/.test(v)) return null;
  const n = Number(v);
  return n >= 100 && n <= LGS_MAX_PUAN ? n : null;
}

export type LgsResult =
  | { ok: true; percentile: number; rank: number }
  | { ok: false; reason: "below-range" };

export function lgsRank(puan: number): LgsResult {
  const first = CURVE[0];
  if (puan < first[0]) return { ok: false, reason: "below-range" };
  let percentile = CURVE[CURVE.length - 1][1];
  for (let i = 0; i + 1 < CURVE.length; i++) {
    const [p0, y0] = CURVE[i];
    const [p1, y1] = CURVE[i + 1];
    if (puan >= p0 && puan <= p1) {
      percentile = y0 + ((y1 - y0) * (puan - p0)) / (p1 - p0);
      break;
    }
  }
  return { ok: true, percentile, rank: (percentile / 100) * LGS_2025_TAKERS };
}

/* ---------------------------------------------------------------------------------------------
 * Net → LGS puanı (tahmini)
 *
 * MEB ders ortalaması ve standart sapmasını yayımlamaz; yayımladığı, madde sayısı, ortalama madde güçlüğü (p, doğru
 * oranı) ve güvenirlik katsayısıdır (2026 Merkezî Sınav Raporu Tablo 8:
 * https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr). Kestirim zinciri:
 * 1. Ortalama doğru = n·p. Doğru sayısının varyansı: σ² = (n·p·q − n·VAR_P) / (1 − α·(n−1)/n)  (KR-20'nin tersi,
 *    VAR_P = madde güçlüklerinin varyansı, varsayım).
 * 2. Hepsi cevaplanmışsa ham puan HP = D − Y/3 = (4D − n)/3: ortalama (4·n·p − n)/3, SS = (4/3)·σ. Boş bırakma
 *    ortalamayı hafifçe yükseltir, ihmal edilir.
 * 3. SP = 50 + 10·(HP − ort)/SS, TASP = Σ katsayı·SP (Tablo 7: 4,1,1,1,4,4), MSP = 100 + 400·(TASP − min)/(max − min).
 *    max: tüm sorular doğru (2026'da 452 öğrenci 500 aldı). min: bilinmez; 2025 yüzdelik eğrisinin %8-%36 aralığına
 *    normal dağılım uydurularak (z doğrusal MSP'de) kalibre edilir.
 * Doğrulama: eşit dağılımlı toplam 50/60/70 net → ~351/388/426 puan; üçüncü taraf bir sitenin tablosu 357/393/429.
 * Hata payı ±10 puan civarıdır; sonuç yaklaşık olarak sunulmalıdır.
 * ponytail: VAR_P ve hepsi cevaplandı varsayımı; MEB ders SS yayımlarsa doğrudan kullanılır.
 * ------------------------------------------------------------------------------------------- */

const VAR_P = 0.02;

export type LgsSubject = {
  id: "tr" | "ink" | "din" | "yd" | "mat" | "fen";
  label: string;
  questions: number;
  coef: number;
  /** Ortalama madde güçlüğü (doğru oranı) ve güvenirlik katsayısı: MEB 2026 Tablo 8. */
  p: number;
  alpha: number;
};

export const LGS_SUBJECTS: LgsSubject[] = [
  { id: "tr", label: "Türkçe", questions: 20, coef: 4, p: 0.47, alpha: 0.82 },
  { id: "ink", label: "T.C. İnkılap Tarihi ve Atatürkçülük", questions: 10, coef: 1, p: 0.53, alpha: 0.81 },
  { id: "din", label: "Din Kültürü ve Ahlak Bilgisi", questions: 10, coef: 1, p: 0.63, alpha: 0.72 },
  { id: "yd", label: "Yabancı Dil", questions: 10, coef: 1, p: 0.44, alpha: 0.88 },
  { id: "mat", label: "Matematik", questions: 20, coef: 4, p: 0.28, alpha: 0.86 },
  { id: "fen", label: "Fen Bilimleri", questions: 20, coef: 4, p: 0.45, alpha: 0.87 },
];

function hpStats(s: LgsSubject) {
  const n = s.questions;
  const sigma2 = (n * s.p * (1 - s.p) - n * VAR_P) / (1 - (s.alpha * (n - 1)) / n);
  return { mean: (4 * n * s.p - n) / 3, sd: (4 / 3) * Math.sqrt(sigma2) };
}

const STATS = Object.fromEntries(LGS_SUBJECTS.map((s) => [s.id, hpStats(s)])) as Record<LgsSubject["id"], { mean: number; sd: number }>;

function tasp(hp: Record<LgsSubject["id"], number>): number {
  return LGS_SUBJECTS.reduce((sum, s) => sum + s.coef * (50 + (10 * (hp[s.id] - STATS[s.id].mean)) / STATS[s.id].sd), 0);
}

/** Standart normal ters dağılım fonksiyonu (Acklam yaklaşımı, hata < 1e-8). */
export function normInv(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) return -normInv(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

const TASP_MEAN = LGS_SUBJECTS.reduce((s, x) => s + x.coef * 50, 0);
const TASP_MAX = tasp(Object.fromEntries(LGS_SUBJECTS.map((s) => [s.id, s.questions])) as Record<LgsSubject["id"], number>);

/** TASP'ın en küçük değeri: eğrinin %8-%36 aralığında z = α + β·MSP doğrusal uydurma, TASP ~ normal(750, S). */
const TASP_MIN = (() => {
  const pts = CURVE.filter(([, y]) => y >= 8 && y <= 36).map(([m, y]) => [m, normInv(1 - y / 100)] as const);
  const n = pts.length;
  const mx = pts.reduce((s, [m]) => s + m, 0) / n;
  const mz = pts.reduce((s, [, z]) => s + z, 0) / n;
  const beta = pts.reduce((s, [m, z]) => s + (m - mx) * (z - mz), 0) / pts.reduce((s, [m]) => s + (m - mx) ** 2, 0);
  const alpha = mz - beta * mx;
  // alpha·(max−min)/(400·beta) = min − mean − (max−min)/4  ⇒ min için doğrusal denklem.
  const c = alpha / (400 * beta);
  return ((c + 0.25) * TASP_MAX + TASP_MEAN) / (1 + c + 0.25);
})();

export type LgsAnswer = { correct: number; wrong: number };

/** Ham puan: doğru − yanlış/3. */
export const lgsNet = (a: LgsAnswer) => a.correct - a.wrong / 3;

/** Derslerin doğru/yanlışından tahmini LGS puanı (100-500). */
export function lgsPuanFromNets(answers: Record<LgsSubject["id"], LgsAnswer>): number {
  const hp = Object.fromEntries(LGS_SUBJECTS.map((s) => [s.id, lgsNet(answers[s.id])])) as Record<LgsSubject["id"], number>;
  const msp = 100 + (400 * (tasp(hp) - TASP_MIN)) / (TASP_MAX - TASP_MIN);
  return Math.min(LGS_MAX_PUAN, Math.max(100, msp));
}
