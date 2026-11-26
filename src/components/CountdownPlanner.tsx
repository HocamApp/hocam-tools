"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  type ConceptPlanResult,
  EXAM_SCHEDULES,
  type ExamKind,
  computeCountdown,
  formatTrDecimal,
  parsePositiveInt,
  planConceptsUntilExam,
} from "@/lib/countdown";
import { TUTOR_LIST_HASH, mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const EDITORIAL_COPY: Record<
  ExamKind,
  {
    kicker: string;
    heading: string;
    paragraphs: readonly string[];
    ctaTitle: string;
    ctaBody: string;
    ctaLabel: string;
    ctaParams: Record<string, string>;
  }
> = {
  yks: {
    kicker: "GERÇEKÇİ OLALIM",
    heading: "Takvime bakıp iç çekmek net artırmaz. Kaç konun kaldı, onu söyle.",
    paragraphs: [
      "Her pazartesi sabahı renkli kalemlerle yeni bir çalışma programı yazıp çarşamba akşamı çöpe atıyorsan yalnız değilsin. Sınav yaklaştıkça eriyen şey sadece gün sayısı değil, son aya bıraktığın konuların oturma ihtimali.",
      "Dereceye girenlerle yerinde sayanlar arasındaki fark günde on dört saat masa başında oturmak değil; elindeki kalan günleri eksiklerini kapatacak net bir tempoya bölebilmek. Şimdi dürüstçe yaz: TYT ve AYT'de toplam kaç konun eksik. Şu andan sınava kalan güne göre gerçekçi temponu çıkaralım.",
    ],
    ctaTitle: "Konu kapatırken takıldığın yerde haftalar kaybetme",
    ctaBody:
      "Hocam'daki her hoca YKS'de ilk 20.000'e girmiş; onlarla yalnız eksik konularına yönelik birebir online ders yapabilirsin.",
    ctaLabel: "YKS özel ders hocalarını gör",
    ctaParams: { exam_type: "TYT" },
  },
  lgs: {
    kicker: "AÇIK KONUŞALIM",
    heading: "Gün saymak kolay. Asıl soru şu: Eksik konuların ne zaman bitecek?",
    paragraphs: [
      "LGS'de herkes aynı sekizinci sınıf müfredatından sınava giriyor ama herkes aynı sırayla çıkmıyor. Farkı yaratan şey, mayıs ayında hâlâ konu anlatımı dinlemek yerine beceri temelli yeni nesil sorularda süre tutabilmek.",
      "Masada saatlerce oturup bildiğin konudan üç yüz soru çözmek seni rahatlatır ama yüzdelik dilimini yerinden oynatmaz. Kaç konun eksik kaldığını aşağıya yaz; şu andan LGS sabahına kadar kalan günleri baz alıp haftalık kaç konu kapatman gerektiğini netleştirelim.",
    ],
    ctaTitle: "Yeni nesil sorularda hız kazanmak tek başına zor geliyorsa",
    ctaBody:
      "Hocam'daki her hoca YKS'de ilk 20.000'e girmiş; onlarla eksik kazanımların üzerine birebir gidip soru çözüm pratiği kurabilirsin.",
    ctaLabel: "Özel ders hocalarını gör",
    ctaParams: {},
  },
};

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function CountdownPlanner() {
  const baseId = useId();
  const conceptsErrId = `${baseId}-concepts-err`;
  const resultRef = useRef<HTMLDivElement>(null);

  const [activeExam, setActiveExam] = useState<ExamKind>("yks");
  const [nowMs, setNowMs] = useState<number | null>(null);

  const [conceptsByExam, setConceptsByExam] = useState<Record<ExamKind, string>>({
    yks: "18",
    lgs: "12",
  });
  const [studyDaysByExam, setStudyDaysByExam] = useState<Record<ExamKind, string>>({
    yks: "6",
    lgs: "6",
  });
  const [errors, setErrors] = useState<{ concepts?: string }>({});
  const [plans, setPlans] = useState<Partial<Record<ExamKind, ConceptPlanResult>>>({});

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const schedule = EXAM_SCHEDULES[activeExam];
  const editorial = EDITORIAL_COPY[activeExam];
  const countdown = useMemo(
    () => (nowMs === null ? null : computeCountdown(nowMs, schedule.primaryTargetIso)),
    [nowMs, schedule.primaryTargetIso],
  );
  const currentPlan = plans[activeExam] ?? null;

  function handleSelectTab(nextExam: ExamKind) {
    setActiveExam(nextExam);
    setErrors({});
  }

  function handlePlanSubmit(event: React.FormEvent) {
    event.preventDefault();
    const rawConcepts = conceptsByExam[activeExam];
    const parsedConcepts = parsePositiveInt(rawConcepts, 1, 250);
    if (parsedConcepts === null) {
      setErrors({
        concepts: "Kalan konu sayısı 1 ile 250 arasında tam sayı olmalı.",
      });
      return;
    }

    const referenceNow = nowMs ?? Date.now();
    const liveCountdown = computeCountdown(referenceNow, schedule.primaryTargetIso);
    const studyDaysPerWeek = Number(studyDaysByExam[activeExam]);

    const result = planConceptsUntilExam({
      exam: activeExam,
      conceptsLeft: parsedConcepts,
      daysLeft: Math.max(1, liveCountdown.days),
      studyDaysPerWeek: Number.isFinite(studyDaysPerWeek) ? studyDaysPerWeek : 6,
      nowMs: referenceNow,
    });

    setErrors({});
    setPlans((prev) => ({ ...prev, [activeExam]: result }));
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label="Sınav seçimi" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["yks", "lgs"] as const).map((examKey) => {
          const item = EXAM_SCHEDULES[examKey];
          const selected = activeExam === examKey;
          return (
            <button
              key={examKey}
              type="button"
              role="tab"
              id={`${baseId}-tab-${examKey}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${examKey}`}
              onClick={() => handleSelectTab(examKey)}
              className={`min-h-11 rounded-xl border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-plum bg-plum text-on-plum"
                  : "border-line bg-surface text-ink hover:border-plum"
              }`}
            >
              <span className="block text-base font-bold">{item.tabLabel}</span>
              <span
                className={`mt-0.5 block text-xs ${selected ? "text-white/80" : "text-ink-mid"}`}
              >
                {item.dateSummary}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeExam}`}
        aria-labelledby={`${baseId}-tab-${activeExam}`}
        className="grid gap-8 lg:grid-cols-2 lg:items-start"
      >
        <section
          aria-label={`${schedule.title} geri sayımı`}
          className="rounded-2xl border border-line bg-surface p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-block rounded-full bg-plum px-3 py-1 text-xs font-bold text-on-plum">
              RESMÎ TARİH · {schedule.dateSummary}
            </span>
            <a
              href={schedule.sourceUrl}
              rel="noopener"
              className="text-xs font-medium text-ink underline underline-offset-4"
            >
              {schedule.sourceLabel}
            </a>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ink">
            {countdown?.isPast
              ? `${schedule.title} tarihi geçti`
              : `${schedule.title} oturumuna kalan süre`}
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Gün", value: countdown ? String(countdown.days) : "--" },
              { label: "Saat", value: countdown ? padTwo(countdown.hours) : "--" },
              { label: "Dakika", value: countdown ? padTwo(countdown.minutes) : "--" },
              { label: "Saniye", value: countdown ? padTwo(countdown.seconds) : "--" },
            ].map((cell) => (
              <div
                key={cell.label}
                className="rounded-xl border border-line bg-paper p-4 text-center"
              >
                <p className="font-sans text-4xl font-bold tabular-nums text-ink sm:text-5xl">
                  {cell.value}
                </p>
                <p className="mt-1 text-sm font-medium text-ink-mid">{cell.label}</p>
              </div>
            ))}
          </div>

          {countdown && !countdown.isPast && (
            <div className="mt-4 grid gap-3 rounded-xl border border-line bg-paper p-4 text-sm text-ink sm:grid-cols-2">
              <p>
                <span className="font-bold">Kalan tam hafta:</span>{" "}
                <span className="tabular-nums">
                  {countdown.fullWeeks} hafta + {countdown.remainingDaysAfterWeeks} gün
                </span>
              </p>
              <p>
                <span className="font-bold">Kalan hafta sonu:</span>{" "}
                <span className="tabular-nums">{countdown.weekendsLeft} hafta sonu</span>
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink-mid">
                Sınav oturumları
              </h3>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {schedule.sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <span className="font-bold text-ink">{session.name}</span>
                    <span className="text-ink-mid">
                      {session.dateTimeLabel} · {session.durationLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="grid gap-3 pt-1 text-sm sm:grid-cols-3">
              {schedule.milestones.map((m) => (
                <div key={m.label} className="rounded-xl border border-line bg-paper px-4 py-3">
                  <dt className="text-xs font-medium text-ink-mid">{m.label}</dt>
                  <dd className="mt-0.5 font-bold text-ink">{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          aria-label="Kalan konularına göre çalışma planı"
          className="rounded-2xl border border-line bg-surface p-6"
        >
          <span className="inline-block rounded-full bg-plum px-3 py-1 text-xs font-bold text-on-plum">
            {editorial.kicker}
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-snug text-ink sm:text-3xl">
            {editorial.heading}
          </h2>
          <div className="mt-3 space-y-3 text-base leading-relaxed text-ink">
            {editorial.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>

          <form
            onSubmit={handlePlanSubmit}
            noValidate
            className="mt-6 rounded-xl border border-line bg-surface p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${baseId}-concepts`} className={labelCls}>
                  Bitirmen gereken konu sayısı
                </label>
                <input
                  id={`${baseId}-concepts`}
                  type="text"
                  inputMode="numeric"
                  value={conceptsByExam[activeExam]}
                  onChange={(e) =>
                    setConceptsByExam((prev) => ({ ...prev, [activeExam]: e.target.value }))
                  }
                  aria-invalid={Boolean(errors.concepts)}
                  aria-describedby={errors.concepts ? conceptsErrId : undefined}
                  placeholder={activeExam === "yks" ? "Örn. 18" : "Örn. 12"}
                  className={inputCls}
                />
                {errors.concepts && (
                  <p id={conceptsErrId} className="mt-1 text-sm font-medium text-error">
                    Hata: {errors.concepts}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor={`${baseId}-days`} className={labelCls}>
                  Haftada kaç gün çalışacaksın
                </label>
                <select
                  id={`${baseId}-days`}
                  value={studyDaysByExam[activeExam]}
                  onChange={(e) =>
                    setStudyDaysByExam((prev) => ({ ...prev, [activeExam]: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="3">Haftada 3 gün</option>
                  <option value="4">Haftada 4 gün</option>
                  <option value="5">Haftada 5 gün</option>
                  <option value="6">Haftada 6 gün</option>
                  <option value="7">Haftada 7 gün</option>
                </select>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-ink-mid">
              Şu andan itibaren sınava kalan{" "}
              <span className="font-bold tabular-nums text-ink">
                {countdown ? countdown.days : "--"} gün
              </span>{" "}
              üzerinden otomatik hesaplanır.
            </p>

            <button type="submit" className={`${btnPrimary} mt-4`}>
              Planımı çıkar
            </button>
          </form>

          {currentPlan && (
            <div
              ref={resultRef}
              tabIndex={-1}
              aria-label="Kişisel çalışma planı sonucu"
              className="mt-6 space-y-5 rounded-2xl border-[1.5px] border-plum bg-surface p-6 focus:outline-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block rounded-full bg-plum px-3 py-1 text-xs font-bold text-on-plum">
                  {currentPlan.paceLabel}
                </span>
                <span className="text-sm font-medium text-ink-mid">
                  {currentPlan.conceptsLeft} konu · sınava kalan {currentPlan.daysLeft} gün (
                  {currentPlan.activeStudyDays} aktif çalışma günü)
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="text-xs font-medium text-ink-mid">Haftalık konu hedefin</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {formatTrDecimal(currentPlan.conceptsPerWeek)} konu
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="text-xs font-medium text-ink-mid">Bir konuya düşen aktif gün</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {formatTrDecimal(currentPlan.studyDaysPerConcept)} gün
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="text-xs font-medium text-ink-mid">Günlük konu ve soru süresi</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {currentPlan.dailyTopicMinutes} dk
                  </p>
                  <p className="mt-0.5 text-xs text-ink-mid">
                    yaklaşık {currentPlan.dailyPomodoros25} adet 25 dk Pomodoro
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="text-xs font-medium text-ink-mid">Kalan toplam süre</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {currentPlan.daysLeft} gün
                  </p>
                  <p className="mt-0.5 text-xs text-ink-mid">
                    {currentPlan.activeStudyDays} aktif çalışma günü
                  </p>
                </div>
              </div>

              <p className="text-base leading-relaxed text-ink">{currentPlan.paceAdvice}</p>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-ink">Sınava kadar yol haritan</h3>
                <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {currentPlan.phases.map((phase) => (
                    <li
                      key={phase.title}
                      className="rounded-xl border border-line bg-paper p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-mid">
                        {phase.durationDays} gün
                      </p>
                      <p className="mt-1 text-base font-bold text-ink">{phase.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-mid">{phase.summary}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="pt-2">
                <Link href="/pomodoro-sayaci" className={btnSecondary}>
                  Günlük {currentPlan.dailyPomodoros25} Pomodoro temposunu başlat
                </Link>
              </div>
            </div>
          )}
        </section>

        <section
          aria-labelledby={`${baseId}-cta-title`}
          className="rounded-[24px] bg-plum p-6 text-on-plum sm:p-8 lg:col-span-2"
        >
          <span className="inline-block rounded-full bg-yellow px-3 py-1 text-xs font-bold text-ink">
            DÜNÜN ÖĞRENCİSİ, BUGÜNÜN ÖĞRETMENİ
          </span>
          <h2 id={`${baseId}-cta-title`} className="mt-3 text-xl font-bold sm:text-2xl">
            {editorial.ctaTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-base text-on-band/85">{editorial.ctaBody}</p>
          <a
            href={mainUrl("/", "yks-lgs-kac-gun-kaldi", editorial.ctaParams, TUTOR_LIST_HASH)}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-yellow px-5 py-2 font-bold text-ink hover:bg-surface"
          >
            {editorial.ctaLabel}
          </a>
        </section>
      </div>
    </div>
  );
}
