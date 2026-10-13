/**
 * Sıralamadan bölüm bulma: kullanıcının sıralamasını, lisans programlarının 2025 genel kontenjan en küçük
 * başarı sırasıyla karşılaştırır.
 *
 * Veri: ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzları (2023-2026), Tablo 4 (bolum-data/*.json;
 * kaynaklar ve üretim tarihi her dosyanın "meta" alanında, üretici: scripts/parse_tablo4.py). Eşleştirme en yeni
 * yılı (2025) kullanır; önceki yıllar kartta bilgi olarak gösterilir.
 *
 * Ölçek: aday havuzu yıldan yıla değişir (SAY 2025: 1.291.531, 2026: 1.135.718 aday), bu yüzden 2026
 * sıralaması 2025 ölçeğine çevrilir: sıra × (2025 havuzu ÷ 2026 havuzu). Havuz, ÖSYM'nin yerleştirme
 * puanı tablosunun ilk satırıdır (osym-data.ts). DİL için havuz verisi yok, çarpan 1.
 *
 * Bantlar sezgiseldir (resmî bir kural değil): q = çevrilmiş sıra ÷ 2025 taban sırası.
 */
import { CUM_2025, CUM_2026, type Scheme } from "./osym-data";

export type Tur = "SAY" | "EA" | "SÖZ" | "DİL";
export const TURLER: Tur[] = ["SAY", "EA", "SÖZ", "DİL"];

export type Program = {
  kod: string;
  uni: string;
  uniTur: string;
  ad: string;
  sure: number;
  kont: number;
  sira: number;
  puan: number;
  /** Önceki yılların [taban sırası, taban puanı] değerleri (Dataset.gecmisYillar sırasıyla); program o yıl yoksa null. */
  gecmis: ([number, number] | null)[];
};

export type Band = "rahat" | "sinirda" | "zor";
export const BANDS: Band[] = ["rahat", "sinirda", "zor"];
/** q üst sınırları: Rahat q ≤ 0,85; Sınırda q ≤ 1,15; Zor q ≤ 1,30; üstü listelenmez. */
export const BAND_LIMITS: Record<Band, number> = { rahat: 0.85, sinirda: 1.15, zor: 1.3 };

export const MAX_SIRA = 3_000_000;

/** "53.079", "53 079" veya "53079" → 53079. Geçersizse null. */
export function parseSira(value: string): number | null {
  const v = value.trim().replace(/[.\s]/g, "");
  if (!/^\d{1,7}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= MAX_SIRA ? n : null;
}

const SCHEME: Partial<Record<Tur, Scheme>> = { SAY: "say", EA: "ea", SÖZ: "soz" };

/** Sıralamayı 2025 aday havuzuna çeviren çarpan (>1: 2026 havuzu daha küçük). */
export function poolScale(tur: Tur): number {
  const s = SCHEME[tur];
  if (!s) return 1;
  return CUM_2025.placement[s][0][1] / CUM_2026.placement[s][0][1];
}

export function bandOf(rank: number, taban: number): Band | null {
  const q = rank / taban;
  for (const b of BANDS) if (q <= BAND_LIMITS[b]) return b;
  return null;
}

/** Aramada küçük/büyük harf ve Türkçe karakter farkını yok sayar. */
export function fold(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Sık yazılan kısaltmalar (fold edilmiş) → kılavuzdaki ad parçaları. ponytail: elle liste, eksik olanlar eklenir. */
const ALIASES: Record<string, string> = {
  odtu: "orta dogu teknik",
  itu: "istanbul teknik",
  ytu: "yildiz teknik",
  gtu: "gebze teknik",
  ktu: "karadeniz teknik",
  deu: "dokuz eylul",
  msgsu: "mimar sinan guzel sanatlar",
  tobb: "tobb ekonomi ve teknoloji",
};

export type Filters = { query?: string; uniTur?: string };
export type Matches = Record<Band, Program[]>;

/** Her bant sırası artan (zor programlar önce). `rank` zaten 2025 ölçeğinde olmalı. */
export function matchPrograms(programs: Program[], rank: number, { query = "", uniTur = "" }: Filters = {}): Matches {
  const words = fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (ALIASES[w] ?? w).split(" "));
  const out: Matches = { rahat: [], sinirda: [], zor: [] };
  for (const p of programs) {
    if (uniTur && p.uniTur !== uniTur) continue;
    if (words.length) {
      const hay = fold(`${p.uni} ${p.ad}`);
      if (!words.every((w) => hay.includes(w))) continue;
    }
    const band = bandOf(rank, p.sira);
    if (band) out[band].push(p);
  }
  for (const b of BANDS) out[b].sort((a, c) => a.sira - c.sira || a.kod.localeCompare(c.kod));
  return out;
}

type Raw = {
  meta: { yil: number; gecmisYillar: number[]; kaynaklar: { yil: number; ad: string; url: string; arsiv?: string }[]; uretim: string };
  unis: [string, string][];
  rows: [string, number, string, number, number, number, number, ([number, number] | null)[]][];
};

export type Dataset = { programs: Program[]; yil: number; gecmisYillar: number[]; kaynaklar: Raw["meta"]["kaynaklar"] };

export function toDataset(raw: Raw): Dataset {
  const programs = raw.rows.map(([kod, u, ad, sure, kont, sira, puan, gecmis]) => ({
    kod,
    uni: raw.unis[u][0],
    uniTur: raw.unis[u][1],
    ad,
    sure,
    kont,
    sira,
    puan,
    gecmis,
  }));
  return { programs, yil: raw.meta.yil, gecmisYillar: raw.meta.gecmisYillar, kaynaklar: raw.meta.kaynaklar };
}

/** Puan türünün verisini ayrı parça olarak yükler (yalnız seçilen tür indirilir). */
export async function loadDataset(tur: Tur): Promise<Dataset> {
  const raw = await {
    SAY: () => import("./bolum-data/say.json"),
    EA: () => import("./bolum-data/ea.json"),
    SÖZ: () => import("./bolum-data/soz.json"),
    DİL: () => import("./bolum-data/dil.json"),
  }[tur]();
  return toDataset(raw.default as unknown as Raw);
}
