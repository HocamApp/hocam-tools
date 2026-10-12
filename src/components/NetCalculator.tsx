"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  AYT_FIELDS,
  TYT_SECTIONS,
  computeNet,
  errorMessage,
  formatNet,
  weakestSection,
  type Answers,
  type AytField,
  type Section,
} from "@/lib/net";
import { TUTOR_LIST_HASH, mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

type Props = { exam: "TYT" | "AYT"; campaign: string };

const BLANK: Answers = { correct: "", wrong: "" };

export function NetCalculator({ exam, campaign }: Props) {
  const [field, setField] = useState<AytField>("sayisal");
  const [answers, setAnswers] = useState<Record<string, Answers>>({});
  const [result, setResult] = useState<ReturnType<typeof computeNet> | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const sections: Section[] = exam === "TYT" ? TYT_SECTIONS : AYT_FIELDS[field].sections;
  // Her render'da hesaplanır (en çok 7 bölüm); satır içi hata mesajları buradan gelir.
  const live = computeNet(sections, answers);
  const inputId = (s: Section, key: keyof Answers) => `${exam}-${s.id}-${key}`;

  // Sonuç görününce odak oraya taşınır: ekran okuyucu sonucu okur, klavye kullanıcısı üstüne düşer.
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function update(id: string, key: keyof Answers, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: { ...(prev[id] ?? BLANK), [key]: value } }));
    setResult(null); // girdi değişince eski sonuç kalmasın
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!live.ok) {
      const first = sections.find((s) => live.errors[s.id]);
      if (first) document.getElementById(inputId(first, "correct"))?.focus();
      return;
    }
    setResult(live);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    document.getElementById(inputId(sections[0], "correct"))?.focus();
  }

  // CTA yalnızca ana sitede hoca filtresi karşılığı olan, cevaplanmış bölümlerden seçilir.
  const weakest = result
    ? weakestSection(result.rows.filter((r) => r.section.tutorSubject && r.correct + r.wrong > 0))
    : null;

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label={`${exam} net hesaplama`}>
        {exam === "AYT" && (
          <fieldset className="mb-6">
            <legend className="text-base font-bold">Alanın</legend>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {(Object.keys(AYT_FIELDS) as AytField[]).map((key) => (
                <label key={key} className="flex min-h-11 items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="ayt-alan"
                    value={key}
                    checked={field === key}
                    onChange={() => {
                      setField(key);
                      setResult(null);
                    }}
                    className="h-5 w-5 accent-pink-deep"
                  />
                  {AYT_FIELDS[key].label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const a = answers[section.id] ?? BLANK;
            const err = live.errors[section.id];
            const errId = `${exam}-${section.id}-error`;
            const a11y = {
              "aria-invalid": err ? true : undefined,
              "aria-describedby": err ? errId : undefined,
            } as const;
            return (
              <fieldset key={section.id} className="rounded-xl border border-line bg-surface p-4">
                <legend className="px-1 text-base font-bold">
                  {section.label}{" "}
                  <span className="font-normal text-ink-mid">({section.questions} soru)</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={inputId(section, "correct")} className={labelCls}>Doğru</label>
                    <input
                      id={inputId(section, "correct")}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={3}
                      value={a.correct}
                      onChange={(e) => update(section.id, "correct", e.target.value)}
                      className={inputCls}
                      {...a11y}
                    />
                  </div>
                  <div>
                    <label htmlFor={inputId(section, "wrong")} className={labelCls}>Yanlış</label>
                    <input
                      id={inputId(section, "wrong")}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={3}
                      value={a.wrong}
                      onChange={(e) => update(section.id, "wrong", e.target.value)}
                      className={inputCls}
                      {...a11y}
                    />
                  </div>
                </div>
                {err && (
                  <p id={errId} className="mt-2 text-sm font-medium text-error">
                    {errorMessage(section, err)}
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Hesapla</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby={`${exam}-sonuc`}
          className="mt-8 rounded-2xl border-2 border-ink bg-surface p-4 outline-offset-4 sm:p-5"
        >
          <h2 id={`${exam}-sonuc`} className="text-xl font-bold">Sonuç</h2>
          <p className="mt-2 text-lg">
            Toplam net: <strong className="text-3xl">{formatNet(result.total)}</strong>
          </p>
          <p className="mt-2">
            <Link href="/yks-puan-siralama-hesaplama" className="font-medium text-pink-deep underline">
              Netini puana ve sıralamaya çevir
            </Link>
          </p>

          <div className="mt-4 overflow-x-auto">
            {/* Dar ekranda sütunlar sığmalı: Net en önemli sütun, kaydırmanın arkasında kalmamalı. */}
            <table className="w-full border-collapse text-left text-sm sm:text-base">
              <caption className="sr-only">Ders bazında doğru, yanlış, boş ve net sayıları</caption>
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="py-2 pr-2 font-bold">Ders</th>
                  <th scope="col" className="px-1 py-2 text-right font-bold sm:px-2">Doğru</th>
                  <th scope="col" className="px-1 py-2 text-right font-bold sm:px-2">Yanlış</th>
                  <th scope="col" className="px-1 py-2 text-right font-bold sm:px-2">Boş</th>
                  <th scope="col" className="py-2 pl-1 text-right font-bold sm:pl-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.section.id} className="border-b border-line">
                    <th scope="row" className="py-2 pr-2 font-medium">{r.section.label}</th>
                    <td className="px-1 py-2 text-right sm:px-2">{r.correct}</td>
                    <td className="px-1 py-2 text-right sm:px-2">{r.wrong}</td>
                    <td className="px-1 py-2 text-right sm:px-2">{r.empty}</td>
                    <td className="py-2 pl-1 text-right font-bold sm:pl-2">{formatNet(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-pink-pale p-4">
            {weakest ? (
              <>
                <p>
                  <strong>{weakest.section.tutorSubject}</strong> netini yükseltmek için kimliği
                  doğrulanmış hocalara göz at.
                </p>
                <a
                  href={mainUrl(
                    "/",
                    campaign,
                    { exam_type: exam, subject: weakest.section.tutorSubject! },
                    TUTOR_LIST_HASH,
                  )}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
                >
                  {weakest.section.tutorSubject} hocalarını incele
                </a>
              </>
            ) : (
              <>
                <p>Netini yükseltmek için YKS&apos;de derece yapmış hocalara göz at.</p>
                <a
                  href={mainUrl("/yks-ozel-ders", campaign)}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
                >
                  YKS özel ders hocalarını gör
                </a>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
