/**
 * YKS net hesabı: net = doğru − yanlış / 4. Boş sorular neti etkilemez.
 *
 * Kaynaklar (doğrulama: 10 Ekim 2026; 2027 kılavuzu yayımlanınca yeniden kontrol edilmeli):
 * - Net formülü: ÖSYM 2026-YKS Sıkça Sorulan Sorular, soru 40
 *   (https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/sss_yksd19022026.pdf).
 * - Test yapısı: ÖSYM 2026-TYT ve 2026-AYT soru kitapçıkları ilk sayfaları
 *   (dokuman.osym.gov.tr/pdfdokuman/2026/YKS/TSK/yks_tyt_2026_kitapcik_d350.pdf ve
 *   yks_ayt_2026_kitapcik_kt12.pdf). TYT 120 soru, her AYT alan testi 80 soru.
 * - Din Kültürü ve Ahlak Bilgisi almayan adaylar o bölümde ilave Felsefe (TYT) / Felsefe Grubu
 *   (AYT Sosyal Bilimler-2) sorularını cevaplar; cevaplanan soru sayısı değişmez.
 */

export type Section = {
  id: string;
  label: string;
  questions: number;
  /** Ana sitedeki hoca filtresinde karşılığı olan ders adı; yoksa CTA genel kalır. */
  tutorSubject?: string;
};

export const TYT_SECTIONS: Section[] = [
  { id: "turkce", label: "Türkçe", questions: 40, tutorSubject: "Türkçe" },
  { id: "sosyal", label: "Sosyal Bilimler", questions: 20 },
  { id: "matematik", label: "Temel Matematik", questions: 40, tutorSubject: "Matematik" },
  { id: "fen", label: "Fen Bilimleri", questions: 20 },
];

const AYT_MATEMATIK: Section = { id: "matematik", label: "Matematik", questions: 40, tutorSubject: "Matematik" };
const AYT_EDEBIYAT_SOSYAL_1: Section[] = [
  { id: "edebiyat", label: "Türk Dili ve Edebiyatı", questions: 24 },
  { id: "tarih1", label: "Tarih-1", questions: 10 },
  { id: "cografya1", label: "Coğrafya-1", questions: 6 },
];

export type AytField = "sayisal" | "esit-agirlik" | "sozel";

export const AYT_FIELDS: Record<AytField, { label: string; sections: Section[] }> = {
  sayisal: {
    label: "Sayısal",
    sections: [
      AYT_MATEMATIK,
      { id: "fizik", label: "Fizik", questions: 14, tutorSubject: "Fizik" },
      { id: "kimya", label: "Kimya", questions: 13, tutorSubject: "Kimya" },
      { id: "biyoloji", label: "Biyoloji", questions: 13, tutorSubject: "Biyoloji" },
    ],
  },
  "esit-agirlik": {
    label: "Eşit Ağırlık",
    sections: [...AYT_EDEBIYAT_SOSYAL_1, AYT_MATEMATIK],
  },
  sozel: {
    label: "Sözel",
    sections: [
      ...AYT_EDEBIYAT_SOSYAL_1,
      { id: "tarih2", label: "Tarih-2", questions: 11 },
      { id: "cografya2", label: "Coğrafya-2", questions: 11 },
      { id: "felsefe", label: "Felsefe Grubu", questions: 12 },
      { id: "din", label: "Din Kültürü / ilave Felsefe", questions: 6 },
    ],
  },
};

export type Answers = { correct: string; wrong: string };

/** Boş alan 0 sayılır; yalnızca rakam kabul edilir. Geçersizse null. */
export function parseCount(value: string): number | null {
  const v = value.trim();
  if (v === "") return 0;
  return /^\d{1,3}$/.test(v) ? Number(v) : null;
}

export function net(correct: number, wrong: number): number {
  // Çeyrek adımlar ikilik tabanda tam gösterilir; yuvarlama gerekmez.
  return correct - wrong / 4;
}

export type SectionError = "invalid" | "over";

export type SectionResult = {
  section: Section;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
};

/** Bölüm girdisini doğrular; hata varsa sonucu yerine hata kodunu döner. */
export function checkSection(section: Section, a: Answers): SectionError | null {
  const c = parseCount(a.correct);
  const w = parseCount(a.wrong);
  if (c === null || w === null) return "invalid";
  if (c + w > section.questions) return "over";
  return null;
}

export function errorMessage(section: Section, e: SectionError): string {
  return e === "invalid"
    ? `${section.label}: yalnızca rakam girin.`
    : `${section.label}: doğru ve yanlış toplamı ${section.questions} soruyu geçemez.`;
}

export function computeNet(sections: Section[], answers: Record<string, Answers>) {
  const rows: SectionResult[] = [];
  const errors: Record<string, SectionError> = {};
  for (const section of sections) {
    const a = answers[section.id] ?? { correct: "", wrong: "" };
    const e = checkSection(section, a);
    if (e) {
      errors[section.id] = e;
      continue;
    }
    const correct = parseCount(a.correct)!;
    const wrong = parseCount(a.wrong)!;
    rows.push({
      section,
      correct,
      wrong,
      empty: section.questions - correct - wrong,
      net: net(correct, wrong),
    });
  }
  const total = rows.reduce((sum, r) => sum + r.net, 0);
  return { rows, errors, total, ok: Object.keys(errors).length === 0 };
}

/** En düşük net/soru oranı olan bölüm; eşitlikte listedeki ilki. */
export function weakestSection(rows: SectionResult[]): SectionResult | null {
  let weakest: SectionResult | null = null;
  for (const r of rows) {
    if (!weakest || r.net / r.section.questions < weakest.net / weakest.section.questions) {
      weakest = r;
    }
  }
  return weakest;
}

/** 37,25 gibi Türkçe ondalık; tam sayılar da iki hane gösterilir. */
export function formatNet(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
