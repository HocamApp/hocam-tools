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
