/**
 * 2027 YKS ve 2027 LGS sınav tarihleri ve konu planlayıcı saf işlevleri.
 *
 * Doğrulama: 15 Kasım 2026.
 * - YKS 2027: ÖSYM 2027 Yılı Sınav Takvimi (TYT 19 Haziran 2027 Cumartesi 10:15,
 *   AYT 20 Haziran 2027 Pazar 10:15, YDT 20 Haziran 2027 Pazar 15:45;
 *   Başvuru 4 Şubat - 2 Mart 2027; Geç başvuru 16 - 18 Mart 2027; Sonuç 21 Temmuz 2027).
 *   Kaynaklar:
 *   https://www.osym.gov.tr/yks-19-20-haziran-2027de-yapilacak
 *   https://dokuman.osym.gov.tr/web/2026/10/osym-2027-yili-sinav-takvimi-7d09wi-28090734.pdf
 * - LGS 2027: MEB 2027 Yılı Sınav Uygulama Takvimi (13 Haziran 2027 Pazar,
 *   1. oturum Sözel 09:30, 2. oturum Sayısal 11:30).
 *   Kaynak:
 *   https://www.meb.gov.tr/meb_iys_dosyalar/2026_11/6af468aeb17c0634849300_2027_YILI_SINAV_UYGULAMA_TAKVIMI.pdf
 */

export type ExamKind = "yks" | "lgs";

export type ExamSessionInfo = {
  id: string;
  name: string;
  dateTimeLabel: string;
  durationLabel: string;
  targetIso: string;
};

export type ExamScheduleInfo = {
  exam: ExamKind;
  title: string;
  tabLabel: string;
  primaryTargetIso: string;
  dateSummary: string;
  sourceLabel: string;
  sourceUrl: string;
  milestones: readonly { label: string; value: string }[];
  sessions: readonly ExamSessionInfo[];
};

export const EXAM_SCHEDULES: Record<ExamKind, ExamScheduleInfo> = {
  yks: {
    exam: "yks",
    title: "2027 YKS (TYT · AYT · YDT)",
    tabLabel: "YKS 2027 (TYT · AYT · YDT)",
    primaryTargetIso: "2027-06-19T10:15:00+03:00",
    dateSummary: "19-20 Haziran 2027",
    sourceLabel: "ÖSYM 2027 Yılı Sınav Takvimi",
    sourceUrl: "https://www.osym.gov.tr/yks-19-20-haziran-2027de-yapilacak",
    milestones: [
      { label: "Başvuru tarihleri", value: "4 Şubat – 2 Mart 2027" },
      { label: "Geç başvuru", value: "16 – 18 Mart 2027" },
      { label: "Sonuç açıklama", value: "21 Temmuz 2027" },
    ],
    sessions: [
      {
        id: "tyt",
        name: "1. Oturum · TYT",
        dateTimeLabel: "19 Haziran 2027 Cumartesi, 10:15",
        durationLabel: "165 dakika",
        targetIso: "2027-06-19T10:15:00+03:00",
      },
      {
        id: "ayt",
        name: "2. Oturum · AYT",
        dateTimeLabel: "20 Haziran 2027 Pazar, 10:15",
        durationLabel: "180 dakika",
        targetIso: "2027-06-20T10:15:00+03:00",
      },
      {
        id: "ydt",
        name: "3. Oturum · YDT",
        dateTimeLabel: "20 Haziran 2027 Pazar, 15:45",
        durationLabel: "120 dakika",
        targetIso: "2027-06-20T15:45:00+03:00",
      },
    ],
  },
  lgs: {
    exam: "lgs",
    title: "2027 LGS Merkezî Sınav",
    tabLabel: "LGS 2027",
    primaryTargetIso: "2027-06-13T09:30:00+03:00",
    dateSummary: "13 Haziran 2027 Pazar",
    sourceLabel: "MEB 2027 Yılı Sınav Uygulama Takvimi",
    sourceUrl:
      "https://www.meb.gov.tr/meb_iys_dosyalar/2026_11/6af468aeb17c0634849300_2027_YILI_SINAV_UYGULAMA_TAKVIMI.pdf",
    milestones: [
      { label: "Kapsam", value: "8. sınıf müfredat konu ve kazanımları" },
      { label: "Oturum arası", value: "45 dakika dinlenme arası (10:45 – 11:30)" },
      { label: "Okulların kapanışı", value: "25 Haziran 2027 Cuma" },
    ],
    sessions: [
      {
        id: "lgs-sozel",
        name: "1. Oturum · Sözel Bölüm",
        dateTimeLabel: "13 Haziran 2027 Pazar, 09:30",
        durationLabel: "75 dakika (50 soru)",
        targetIso: "2027-06-13T09:30:00+03:00",
      },
      {
        id: "lgs-sayisal",
        name: "2. Oturum · Sayısal Bölüm",
        dateTimeLabel: "13 Haziran 2027 Pazar, 11:30",
        durationLabel: "80 dakika (40 soru)",
        targetIso: "2027-06-13T11:30:00+03:00",
      },
    ],
  },
};

export type CountdownBreakdown = {
  isPast: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  fullWeeks: number;
  remainingDaysAfterWeeks: number;
  weekendsLeft: number;
};

const TR_OFFSET_MS = 3 * 3600 * 1000;
const DAY_MS = 86_400_000;

export function computeCountdown(nowMs: number, targetIso: string): CountdownBreakdown {
  const targetMs = Date.parse(targetIso);
  if (Number.isNaN(targetMs) || nowMs >= targetMs) {
    return {
      isPast: true,
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      fullWeeks: 0,
      remainingDaysAfterWeeks: 0,
      weekendsLeft: 0,
    };
  }

  const totalSeconds = Math.floor((targetMs - nowMs) / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const fullWeeks = Math.floor(days / 7);
  const remainingDaysAfterWeeks = days % 7;

  const startDay = Math.floor((nowMs + TR_OFFSET_MS) / DAY_MS);
  const endDay = Math.floor((targetMs + TR_OFFSET_MS) / DAY_MS);
  let weekendsLeft = 0;
  for (let d = startDay; d < endDay; d += 1) {
    if (new Date(d * DAY_MS).getUTCDay() === 6) {
      weekendsLeft += 1;
    }
  }

  return {
    isPast: false,
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    fullWeeks,
    remainingDaysAfterWeeks,
    weekendsLeft,
  };
}

export function parsePositiveInt(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < min || value > max) return null;
  return value;
}

export type PaceLevel = "rahat" | "dengeli" | "yogun";

export type ConceptPlanPhase = {
  title: string;
  durationDays: number;
  summary: string;
};

export type ConceptPlanResult = {
  exam: ExamKind;
  conceptsLeft: number;
  daysLeft: number;
  activeStudyDays: number;
  conceptsPerWeek: number;
  studyDaysPerConcept: number;
  hoursPerConcept: number;
  dailyTopicMinutes: number;
  dailyPomodoros25: number;
  paceLevel: PaceLevel;
  paceLabel: string;
  paceAdvice: string;
  finishTopicsDateLabel: string;
  phases: ConceptPlanPhase[];
};

const TR_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const TR_DECIMAL_FORMATTER = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatTrDecimal(value: number): string {
  return TR_DECIMAL_FORMATTER.format(Math.round(value * 10) / 10);
}

export function planConceptsUntilExam(input: {
  exam: ExamKind;
  conceptsLeft: number;
  daysLeft: number;
  studyDaysPerWeek: number;
  nowMs?: number;
}): ConceptPlanResult {
  const safeDaysLeft = Math.max(1, Math.floor(input.daysLeft));
  const safeConcepts = Math.max(1, Math.floor(input.conceptsLeft));
  const safeStudyDaysPerWeek = Math.min(7, Math.max(1, Math.floor(input.studyDaysPerWeek)));

  const activeStudyDays = Math.max(
    1,
    Math.round(safeDaysLeft * (safeStudyDaysPerWeek / 7)),
  );
  const conceptsPerWeek = safeConcepts / (safeDaysLeft / 7);
  const studyDaysPerConcept = activeStudyDays / safeConcepts;
  const hoursPerConcept = input.exam === "yks" ? 4 : 3;
  const dailyTopicMinutes = Math.ceil((safeConcepts * hoursPerConcept * 60) / activeStudyDays);
  const dailyPomodoros25 = Math.ceil(dailyTopicMinutes / 25);

  let paceLevel: PaceLevel;
  let paceLabel: string;
  let paceAdvice: string;
  if (conceptsPerWeek <= 2) {
    paceLevel = "rahat";
    paceLabel = "Yetişir, tempo kontrol altında";
    paceAdvice =
      "Süreyi erken yakalamış durumdasın. Konuyu sadece okuyup geçme; her konudan sonra en az iki karma test çözüp yanlış defterine not düş.";
  } else if (conceptsPerWeek <= 4.5) {
    paceLevel = "dengeli";
    paceLabel = "Sıkı ama gerçekçi bir tempo";
    paceAdvice =
      "Haftalık hedefin net. Bu hızı düşürmemek için bildiğin konulara zaman kaybetmeden yalnız eksik başlıklara odaklanman gerekir.";
  } else {
    paceLevel = "yogun";
    paceLabel = "Kritik tempo, erteleme payı yok";
    paceAdvice =
      "Kalan güne göre konu yükün yüksek. Uzun anlatım videoları yerine doğrudan soru üzerinden konu kapatıp tıkandığın yerde birebir destek alman zaman kazandırır.";
  }

  const nowMs = input.nowMs ?? Date.now();
  const finishTopicsDateLabel = TR_DATE_FORMATTER.format(new Date(nowMs + safeDaysLeft * DAY_MS));

  const phases: ConceptPlanPhase[] = [];
  if (safeDaysLeft > 21) {
    phases.push(
      {
        title: "1. Temel konu eritme dönemi",
        durationDays: safeDaysLeft - 21,
        summary: `Haftada ${safeStudyDaysPerWeek} gün çalışarak haftalık ortalama ${formatTrDecimal(conceptsPerWeek)} konu kapat. Günde yaklaşık ${dailyTopicMinutes} dk (${dailyPomodoros25} adet 25 dk Pomodoro) eksik konulara ayrılmalı.`,
      },
      {
        title: "2. Konu + branş denemesi geçişi",
        durationDays: 14,
        summary:
          "Kalan son başlıkları kapatırken her gün en az bir branş denemesi ekle; yanlış çıkan soruların ait olduğu kazanımları aynı gün tekrar et.",
      },
      {
        title: "3. Son hafta sınav provası",
        durationDays: 7,
        summary: `Gerçek sınav saatinde süre tutarak çıkmış soru ve genel deneme provası yap. Uyku ve soru ritmini ${finishTopicsDateLabel} sınav gününe kadar sabitle.`,
      },
    );
  } else if (safeDaysLeft > 7) {
    phases.push(
      {
        title: "1. Hızlı konu kapatma dönemi",
        durationDays: safeDaysLeft - 7,
        summary: `Haftada ${safeStudyDaysPerWeek} gün çalışarak haftalık ortalama ${formatTrDecimal(conceptsPerWeek)} konu kapat. Günde yaklaşık ${dailyTopicMinutes} dk (${dailyPomodoros25} adet 25 dk Pomodoro) öncelikli eksiklere ayrılmalı.`,
      },
      {
        title: "2. Son hafta deneme ve tekrar provası",
        durationDays: 7,
        summary: `Gerçek sınav saatinde süre tutarak çıkmış soru ve genel deneme provası yap. Yeni konu yüklemeden ritmini ${finishTopicsDateLabel} gününe sabitle.`,
      },
    );
  } else {
    phases.push({
      title: "1. Yoğun konu ve çıkmış soru taraması",
      durationDays: safeDaysLeft,
      summary: `Kalan ${safeDaysLeft} günde günde yaklaşık ${dailyTopicMinutes} dk (${dailyPomodoros25} adet 25 dk Pomodoro) en çok soru çıkan eksik başlıklara ve çıkmış sorulara odaklan. Hedef gün: ${finishTopicsDateLabel}.`,
    });
  }

  return {
    exam: input.exam,
    conceptsLeft: safeConcepts,
    daysLeft: safeDaysLeft,
    activeStudyDays,
    conceptsPerWeek,
    studyDaysPerConcept,
    hoursPerConcept,
    dailyTopicMinutes,
    dailyPomodoros25,
    paceLevel,
    paceLabel,
    paceAdvice,
    finishTopicsDateLabel,
    phases,
  };
}
