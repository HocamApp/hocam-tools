/**
 * Net + OBP → yaklaşık puan → yaklaşık başarı sırası.
 *
 * ÖSYM yöntemi (Kılavuz §3.10.1): her test için standart puan SP = 50 + 10·(net − ort)/SS (ort ve SS
 * son sınıf adaylarından), ağırlıklı puan A = Σ ağırlık·SP, sonra A "kendi içinde en küçüğü 100, en
 * büyüğü 500" olacak şekilde ölçeklenir. ÖSYM en küçük/en büyük A değerlerini yayımlamaz, bu yüzden:
 * - A_max = tüm geçerli soruların doğru olduğu aday (500 puanlı aday sayısı yalnızca 1-5'tir),
 * - A_min = yayımlanan puan dağılımının ortalamasını tutturan değer (kalibrasyon). 2025 ve 2026'da,
 *   dört puan türünde de bu değer "tüm testlerde net 0" noktasının 1-4 SP altına çıkar; tutarlılık
 *   bu yaklaşımın makul olduğunu gösterir ama resmî bir doğrulama değildir.
 * Sonuç tek sayı değil aralıktır: A_min ±MIN_SLACK ve A_max −MAX_SLACK varyantlarının uç değerleri.
 * Sıra: ÖSYM'nin yığınsal tablosunda (20 puan basamaklı) logaritmik interpolasyon.
 */
import {
  CUM_2025,
  CUM_2026,
  STATS_2025,
  STATS_2026,
  WEIGHTS,
  TYT_WEIGHTS,
  type Row,
  type Scheme,
  type TestKey,
} from "./osym-data";

export type Year = 2026 | 2025;
export const YEARS: Year[] = [2026, 2025];

const DATA = {
  2026: { stats: STATS_2026, cum: CUM_2026 },
  2025: { stats: STATS_2025, cum: CUM_2025 },
} as const;

/** A_min için ±SP; A_max için en çok −SP. Değerler kalibrasyon tutarlılığından (yukarı bakın) seçildi. */
export const MIN_SLACK = 3;
export const MAX_SLACK = 2;

export type Nets = Partial<Record<TestKey, number>>;

function flatWeights(scheme: Scheme): Partial<Record<TestKey, number>> {
  const out: Partial<Record<TestKey, number>> = {};
  for (const [k, w] of Object.entries(WEIGHTS[scheme]) as [TestKey | "tyt", number][]) {
    if (k === "tyt") {
      for (const [tk, tw] of Object.entries(TYT_WEIGHTS) as [TestKey, number][]) out[tk] = (out[tk] ?? 0) + (w * tw) / 100;
    } else out[k] = (out[k] ?? 0) + w;
  }
  return out; // yüzde; toplam 100
}

/** Ağırlıklı standart puan A. Girilmeyen test 0 net sayılır. */
export function weightedScore(scheme: Scheme, nets: Nets, year: Year): number {
  const stats = DATA[year].stats;
  let sum = 0;
  for (const [k, w] of Object.entries(flatWeights(scheme)) as [TestKey, number][]) {
    const [, mu, sd] = stats[k];
    sum += w * (50 + (10 * ((nets[k] ?? 0) - mu)) / sd);
  }
  return sum / 100;
}

function perfectNets(year: Year): Nets {
  const out: Nets = {};
  for (const [k, s] of Object.entries(DATA[year].stats) as [TestKey, number[]][]) out[k] = s[0];
  return out;
}

function allMeanNets(year: Year): Nets {
  const out: Nets = {};
  for (const [k, s] of Object.entries(DATA[year].stats) as [TestKey, number[]][]) out[k] = s[3];
  return out;
}

/** Yığınsal tablodan aday başına ortalama puan (20'lik basamakların orta noktası). */
export function meanFromCumulative(rows: Row[]): number {
  const sorted = [...rows].sort((a, b) => a[0] - b[0]);
  const total = sorted[0][1];
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) {
    const [lo, c] = sorted[i];
    const next = i + 1 < sorted.length ? sorted[i + 1] : null;
    const n = c - (next ? next[1] : 0);
    const mid = next ? (lo + next[0]) / 2 : lo; // en üst satır tam değer
    sum += n * mid;
  }
  return sum / total;
}

export type Scale = { aMin: number; aMax: number };

export function calibrate(scheme: Scheme, year: Year): Scale {
  const aMax = weightedScore(scheme, perfectNets(year), year);
  const aBar = weightedScore(scheme, allMeanNets(year), year);
  const r = (meanFromCumulative(DATA[year].cum.exam[scheme]) - 100) / 400;
  return { aMin: (aBar - r * aMax) / (1 - r), aMax };
}

export function toPuan(a: number, { aMin, aMax }: Scale): number {
  const p = 100 + (400 * (a - aMin)) / (aMax - aMin);
  return Math.min(500, Math.max(100, p));
}

/** "p ve üstü" aday sayısı; satırlar arasında logaritmik interpolasyon. */
export function rankAt(rows: Row[], p: number): number {
  const pts = [...rows].sort((a, b) => a[0] - b[0]);
  if (p <= pts[0][0]) return pts[0][1];
  // Yerleştirme tablosu 550'de biter; en yüksek olası yerleştirme puanı 500 + 60 = 560 (sıra 1).
  if (pts[pts.length - 1][0] === 550) pts.push([560, 1]);
  const top = pts[pts.length - 1];
  if (p >= top[0]) return Math.max(1, top[1]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [l0, c0] = pts[i];
    const [l1, c1] = pts[i + 1];
    if (p >= l0 && p <= l1) {
      const t = (p - l0) / (l1 - l0);
      return Math.exp(Math.log(Math.max(c0, 1)) * (1 - t) + Math.log(Math.max(c1, 1)) * t);
    }
  }
  return pts[0][1];
}

export type Range = { low: number; mid: number; high: number };

export type SchemeResult = {
  scheme: Scheme;
  year: Year;
  puan: Range;
  /** OBP verilmişse yerleştirme puanı = puan + katkı. */
  placement: Range | null;
  /** Sınav puanına göre sıra (düşük = iyi). low = en iyi sıra. */
  examRank: Range;
  placementRank: Range | null;
};

/** A için üç varyantın (orta, iyimser, kötümser) puanı. */
function puanRange(a: number, scale: Scale): Range {
  const variants: Scale[] = [
    scale,
    { aMin: scale.aMin - MIN_SLACK, aMax: scale.aMax },
    { aMin: scale.aMin + MIN_SLACK, aMax: scale.aMax },
    { aMin: scale.aMin, aMax: scale.aMax - MAX_SLACK },
    { aMin: scale.aMin - MIN_SLACK, aMax: scale.aMax - MAX_SLACK },
    { aMin: scale.aMin + MIN_SLACK, aMax: scale.aMax - MAX_SLACK },
  ].map((s) => ({ ...s }));
  const ps = variants.map((v) => toPuan(a, v));
  return { low: Math.min(...ps), mid: ps[0], high: Math.max(...ps) };
}

export function computeScheme(
  scheme: Scheme,
  nets: Nets,
  year: Year,
  obpContribution: number | null,
): SchemeResult {
  const a = weightedScore(scheme, nets, year);
  const puan = puanRange(a, calibrate(scheme, year));
  const cum = DATA[year].cum;
  const rankRange = (rows: Row[], r: Range): Range => ({
    low: rankAt(rows, r.high),
    mid: rankAt(rows, r.mid),
    high: rankAt(rows, r.low),
  });
  const placement =
    obpContribution === null
      ? null
      : { low: puan.low + obpContribution, mid: puan.mid + obpContribution, high: puan.high + obpContribution };
  return {
    scheme,
    year,
    puan,
    placement,
    examRank: rankRange(cum.exam[scheme], puan),
    placementRank: placement && rankRange(cum.placement[scheme], placement),
  };
}

/** ÖSYM'nin puanı hesaplama koşulu (Kılavuz Tablo 1D): TYT için Türkçe veya Temel Matematik ≥ 0,5 net. */
export function tytEligible(nets: Nets): boolean {
  return (nets.tr ?? 0) >= 0.5 || (nets.mat ?? 0) >= 0.5;
}

/** AYT puan türleri için ilgili testlerden en az birinde ≥ 0,5 net. */
export function aytEligible(scheme: Scheme, nets: Nets): boolean {
  return (Object.keys(WEIGHTS[scheme]) as (TestKey | "tyt")[]).some(
    (k) => k !== "tyt" && (nets[k as TestKey] ?? 0) >= 0.5,
  );
}

/** 16.539 → 17.000 gibi 2 anlamlı basamağa yuvarlar; sıra için sahte kesinlik vermez. */
export function roundRank(n: number): number {
  if (n < 100) return Math.max(1, Math.round(n / 10) * 10 || 1);
  const digits = Math.floor(Math.log10(n)) - 1;
  const f = 10 ** digits;
  return Math.round(n / f) * f;
}

/** net.ts bölüm kimlikleri → ÖSYM test anahtarları. */
export const TYT_KEYS: Record<string, TestKey> = { turkce: "tr", sosyal: "sos", matematik: "mat", fen: "fen" };
export const AYT_KEYS: Record<string, TestKey> = {
  edebiyat: "tde",
  tarih1: "t1",
  cografya1: "c1",
  tarih2: "t2",
  cografya2: "c2",
  felsefe: "fel",
  din: "din",
  matematik: "amat",
  fizik: "fiz",
  kimya: "kim",
  biyoloji: "bio",
};

/** Ters rankAt: "p ve üstü" sayısı `rank` olan puan (ikili arama; rankAt puan arttıkça azalır). */
export function puanAtRank(rows: Row[], rank: number): number {
  let lo = 100;
  let hi = 560;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (rankAt(rows, mid) > rank) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Bu puan türünde sıralanabilecek en kötü sıra (iki yılın tablosundan küçüğü). */
export function maxRank(scheme: Scheme): number {
  return Math.min(...YEARS.map((y) => DATA[y].cum.exam[scheme].reduce((m, r) => Math.max(m, r[1]), 0)));
}

export type TargetNets = {
  nets: Nets;
  /** Eşit doluluk profilindeki başarı oranı (0-1); 0 ise sıra en düşük netle bile tutar, 1 ise tam net bile yetmez. */
  fraction: number;
};

/**
 * Hedef puan için "ortalama" net profili. Aynı puana giden sonsuz net kombinasyonu var; iki dengeli profilin
 * ortalaması alınır, ikisi de hedef ağırlıklı puana (A) ulaşır (A netlerde doğrusaldır, ortalama da ulaşır):
 * - eşit doluluk: her testte net = f·geçerli soru (üst sıralarda gerçeğe yakın, AYT'yi orta sıralarda şişirir),
 * - eşit z: her testte net = ortalama + z·SS, [0, soru] ile sınırlı (orta sıralarda AYT'ye gerçekçi, Türkçe'yi
 *   üst sıralarda şişirir).
 * ponytail: gerçek adayların ders dağılımı dengeli değildir; ortak dağılım verisi yok, bu yüzden basit ortalama.
 */
export function netsForPuan(scheme: Scheme, year: Year, targetPuan: number): TargetNets {
  const stats = DATA[year].stats;
  const scale = calibrate(scheme, year);
  const aTarget = scale.aMin + ((targetPuan - 100) / 400) * (scale.aMax - scale.aMin);
  const keys = Object.keys(flatWeights(scheme)) as TestKey[];
  const solve = (profile: (x: number) => Nets, from: number, to: number) => {
    let lo = from;
    let hi = to;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (weightedScore(scheme, profile(mid), year) < aTarget) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const byFraction = (f: number): Nets => {
    const out: Nets = {};
    for (const k of keys) out[k] = f * stats[k][0];
    return out;
  };
  const byZ = (z: number): Nets => {
    const out: Nets = {};
    for (const k of keys) out[k] = Math.min(stats[k][0], Math.max(0, stats[k][1] + z * stats[k][2]));
    return out;
  };
  const fraction = solve(byFraction, 0, 1);
  const pf = byFraction(fraction);
  const pz = byZ(solve(byZ, -6, 12));
  const nets: Nets = {};
  for (const k of keys) nets[k] = ((pf[k] ?? 0) + (pz[k] ?? 0)) / 2;
  return { nets, fraction };
}

/** Hedef sıra → gereken net profili. OBP katkısı verilirse sıra yerleştirme puanına göre, yoksa sınav puanına göre. */
export function netsForRank(
  scheme: Scheme,
  year: Year,
  rank: number,
  obpContribution: number | null,
): TargetNets {
  const cum = DATA[year].cum;
  const p = puanAtRank(obpContribution === null ? cum.exam[scheme] : cum.placement[scheme], rank);
  const examPuan = Math.min(500, Math.max(100, p - (obpContribution ?? 0)));
  return netsForPuan(scheme, year, examPuan);
}
