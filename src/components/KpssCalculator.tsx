"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { KPSS_QUESTIONS, KPSS_TYPES, kpssEligible, kpssPuan } from "@/lib/kpss";
import { computeNet, errorMessage, type Answers, type Section } from "@/lib/net";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const SECTIONS: Section[] = [
  { id: "gy", label: "Genel Yetenek", questions: KPSS_QUESTIONS },
  { id: "gk", label: "Genel Kültür", questions: KPSS_QUESTIONS },
];
const BLANK: Answers = { correct: "", wrong: "" };
const num = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type Out = { gy: number; gk: number; puans: { id: string; puan: number }[] } | { tooLow: true };

export function KpssCalculator() {
  const [answers, setAnswers] = useState<Record<string, Answers>>({});
  const [result, setResult] = useState<Out | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const live = computeNet(SECTIONS, answers);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!live.ok) {
      const first = SECTIONS.find((s) => live.errors[s.id]);
      if (first) document.getElementById(`kpss-${first.id}-correct`)?.focus();
      return;
    }
    const gy = live.rows[0].net;
    const gk = live.rows[1].net;
    setResult(
      kpssEligible(gy, gk)
        ? { gy, gk, puans: KPSS_TYPES.map((t) => ({ id: t.id, puan: kpssPuan(t, gy, gk) })) }
        : { tooLow: true },
    );
  }

  function reset() {
    setAnswers({});
    setResult(null);
    document.getElementById("kpss-gy-correct")?.focus();
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="KPSS lisans puan hesaplama">
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => {
            const a = answers[section.id] ?? BLANK;
            const err = live.errors[section.id];
            const errId = `kpss-${section.id}-error`;
            const a11y = { "aria-invalid": err ? true : undefined, "aria-describedby": err ? errId : undefined } as const;
            const field = (key: keyof Answers, label: string) => (
              <div>
                <label htmlFor={`kpss-${section.id}-${key}`} className={labelCls}>{label}</label>
                <input
                  id={`kpss-${section.id}-${key}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  value={a[key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAnswers((p) => ({ ...p, [section.id]: { ...(p[section.id] ?? BLANK), [key]: v } }));
                    setResult(null);
                  }}
                  className={inputCls}
                  {...a11y}
                />
              </div>
            );
            return (
              <fieldset key={section.id} className="rounded-xl border border-line bg-surface p-4">
                <legend className="px-1 text-base font-bold">
                  {section.label} <span className="font-normal text-ink-mid">({section.questions} soru)</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {field("correct", "Doğru")}
                  {field("wrong", "Yanlış")}
                </div>
                {err && <p id={errId} className="mt-2 text-sm font-medium text-error">{errorMessage(section, err)}</p>}
              </fieldset>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Puanımı hesapla</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="kpss-sonuc"
          className="mt-8 max-w-md rounded-2xl border-2 border-ink bg-surface p-5 outline-offset-4"
        >
          <h2 id="kpss-sonuc" className="text-xl font-bold">Sonuç</h2>
          {"tooLow" in result ? (
            <p className="mt-3 text-base">
              ÖSYM, puanı her testte en az 1 net yapan adaylar için hesaplar. Bu netlerle puan oluşmaz.
            </p>
          ) : (
            <>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-lg">
                {result.puans.map((p) => (
                  <div key={p.id} className="contents">
                    <dt>KPSS {p.id}</dt>
                    <dd className="text-right text-2xl font-bold">{num.format(p.puan)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-base">(yaklaşık olarak)</p>
              <p className="mt-2 text-sm text-ink-mid">
                Genel Yetenek neti {num.format(result.gy)}, Genel Kültür neti {num.format(result.gk)}. Puanlar
                2026 KPSS Lisans verileriyle hesaplanır; resmî puan ÖSYM sonuç belgesindedir.
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
