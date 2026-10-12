"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { MAX_DIPLOMA, computeObp, parseDiploma } from "@/lib/obp";
import {
  AYT_KEYS,
  TYT_KEYS,
  YEARS,
  aytEligible,
  computeScheme,
  roundRank,
  tytEligible,
  type Nets,
  type Range,
  type SchemeResult,
  type Year,
} from "@/lib/puan";
import {
  AYT_FIELDS,
  TYT_SECTIONS,
  computeNet,
  errorMessage,
  weakestSection,
  type Answers,
  type AytField,
  type Section,
} from "@/lib/net";
import type { Scheme } from "@/lib/osym-data";
import { TUTOR_LIST_HASH, mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const CAMPAIGN = "yks-puan-siralama-hesaplama";
const BLANK: Answers = { correct: "", wrong: "" };

type Mode = AytField | "tyt";
const SCHEME_OF: Record<AytField, Scheme> = { sayisal: "say", "esit-agirlik": "ea", sozel: "soz" };
const SCHEME_LABEL: Record<Scheme, string> = { tyt: "TYT", say: "SAY (Sayısal)", ea: "EA (Eşit Ağırlık)", soz: "SÖZ (Sözel)" };
const MODES: { id: Mode; label: string }[] = [
  { id: "sayisal", label: "Sayısal" },
  { id: "esit-agirlik", label: "Eşit Ağırlık" },
  { id: "sozel", label: "Sözel" },
  { id: "tyt", label: "Sadece TYT" },
];

const nf = new Intl.NumberFormat("tr-TR");
const puanText = (r: Range) => `${Math.round(r.low)} – ${Math.round(r.high)}`;
const rankText = (r: Range) => `${nf.format(roundRank(r.low))} – ${nf.format(roundRank(r.high))}`;

type Output = {
  year: Year;
  tyt: SchemeResult | null;
  field: SchemeResult | null;
}[];

type State = {
  out: Output;
  mode: Mode;
  hasObp: boolean;
  tytOk: boolean;
  fieldOk: boolean;
  weakest: { subject: string; exam: "TYT" | "AYT" } | null;
};

export function PuanCalculator() {
  const [mode, setMode] = useState<Mode>("sayisal");
  const [tytAns, setTytAns] = useState<Record<string, Answers>>({});
  const [aytAns, setAytAns] = useState<Record<string, Answers>>({});
  const [diploma, setDiploma] = useState("");
  const [placed, setPlaced] = useState(false);
  const [diplomaError, setDiplomaError] = useState(false);
  const [result, setResult] = useState<State | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  const aytSections: Section[] = mode === "tyt" ? [] : AYT_FIELDS[mode].sections;
  const tytLive = computeNet(TYT_SECTIONS, tytAns);
  const aytLive = computeNet(aytSections, aytAns);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function changed() {
    setResult(null);
    setDiplomaError(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const bad = !tytLive.ok || !aytLive.ok;
    const dip = diploma.trim() === "" ? undefined : parseDiploma(diploma);
    if (dip === null) setDiplomaError(true);
    if (bad || dip === null) {
      setResult(null);
      const first =
        TYT_SECTIONS.find((s) => tytLive.errors[s.id]) ?? aytSections.find((s) => aytLive.errors[s.id]);
      const id = first
        ? `${TYT_SECTIONS.includes(first) ? "t" : "a"}-${first.id}-correct`
        : "diploma";
      document.getElementById(id)?.focus();
      return;
    }

    const nets: Nets = {};
    for (const r of tytLive.rows) nets[TYT_KEYS[r.section.id]] = r.net;
    for (const r of aytLive.rows) nets[AYT_KEYS[r.section.id]] = r.net;

    const contribution = dip === undefined ? null : computeObp(dip, placed).contribution;
    const tytOk = tytEligible(nets);
    const fieldScheme = mode === "tyt" ? null : SCHEME_OF[mode];
    const fieldOk = fieldScheme !== null && tytOk && aytEligible(fieldScheme, nets);

    const out: Output = YEARS.map((year) => ({
      year,
      tyt: tytOk ? computeScheme("tyt", nets, year, contribution) : null,
      field: fieldOk && fieldScheme ? computeScheme(fieldScheme, nets, year, contribution) : null,
    }));

    const cands = [
      ...tytLive.rows.map((r) => ({ r, exam: "TYT" as const })),
      ...aytLive.rows.map((r) => ({ r, exam: "AYT" as const })),
    ].filter((x) => x.r.section.tutorSubject && x.r.correct + x.r.wrong > 0);
    const w = weakestSection(cands.map((x) => x.r));
    const weakest = w ? { subject: w.section.tutorSubject!, exam: cands.find((x) => x.r === w)!.exam } : null;

    setResult({ out, mode, hasObp: contribution !== null, tytOk, fieldOk, weakest });
  }

  function reset() {
    setTytAns({});
    setAytAns({});
    setDiploma("");
    setPlaced(false);
    setResult(null);
    setDiplomaError(false);
    document.getElementById("t-turkce-correct")?.focus();
  }

  function fieldset(prefix: "t" | "a", title: string, sections: Section[], live: ReturnType<typeof computeNet>,
    answers: Record<string, Answers>, set: (f: (p: Record<string, Answers>) => Record<string, Answers>) => void) {
    return (
      <section className="mt-8" aria-labelledby={`${prefix}-baslik`}>
        <h2 id={`${prefix}-baslik`} className="text-xl font-bold">{title}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const a = answers[section.id] ?? BLANK;
            const err = live.errors[section.id];
            const errId = `${prefix}-${section.id}-error`;
            const a11y = {
              "aria-invalid": err ? true : undefined,
              "aria-describedby": err ? errId : undefined,
            } as const;
            const field = (key: keyof Answers, label: string) => (
              <div>
                <label htmlFor={`${prefix}-${section.id}-${key}`} className={labelCls}>{label}</label>
                <input
                  id={`${prefix}-${section.id}-${key}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={3}
                  value={a[key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    set((p) => ({ ...p, [section.id]: { ...(p[section.id] ?? BLANK), [key]: v } }));
                    changed();
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
                {err && (
                  <p id={errId} className="mt-2 text-sm font-medium text-error">{errorMessage(section, err)}</p>
                )}
              </fieldset>
            );
          })}
        </div>
      </section>
    );
  }

  const headline = result?.out[0];

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="YKS puan ve sıralama hesaplama">
        <fieldset>
          <legend className="text-base font-bold">Alanın</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {MODES.map((m) => (
              <label key={m.id} className="flex min-h-11 items-center gap-2 text-base">
                <input
                  type="radio"
                  name="alan"
                  value={m.id}
                  checked={mode === m.id}
                  onChange={() => {
                    setMode(m.id);
                    setAytAns({});
                    changed();
                  }}
                  className="h-5 w-5 accent-pink-deep"
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        {fieldset("t", "TYT netlerin", TYT_SECTIONS, tytLive, tytAns, setTytAns)}
        {mode !== "tyt" &&
          fieldset("a", `AYT netlerin (${AYT_FIELDS[mode].label})`, aytSections, aytLive, aytAns, setAytAns)}

        <section className="mt-8 max-w-md" aria-labelledby="obp-baslik">
          <h2 id="obp-baslik" className="text-xl font-bold">Diploma notun (isteğe bağlı)</h2>
          <label htmlFor="diploma" className={`${labelCls} mt-3`}>Diploma notu (100&apos;lük sistem)</label>
          <input
            id="diploma"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            maxLength={6}
            value={diploma}
            onChange={(e) => {
              setDiploma(e.target.value);
              changed();
            }}
            aria-invalid={diplomaError ? true : undefined}
            aria-describedby={diplomaError ? "diploma-hata" : "diploma-ipucu"}
            className={inputCls}
          />
          <p id="diploma-ipucu" className="mt-1 text-sm text-ink-mid">
            Boş bırakırsan yalnızca sınav puanın ve sıran hesaplanır. Örnek: 85,5
          </p>
          {diplomaError && (
            <p id="diploma-hata" className="mt-1 text-sm font-medium text-error">
              Diploma notu 0 ile {MAX_DIPLOMA} arasında olmalı ve en çok iki ondalık içerebilir.
            </p>
          )}
          <label className="mt-4 flex items-start gap-3 text-base">
            <input
              type="checkbox"
              checked={placed}
              onChange={(e) => {
                setPlaced(e.target.checked);
                changed();
              }}
              className="mt-1 h-5 w-5 accent-pink-deep"
            />
            <span>Geçen yıl bir programa yerleştim (kırık OBP)</span>
          </label>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Puan ve sıramı hesapla</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="puan-sonuc"
          className="mt-8 rounded-2xl border-2 border-ink bg-surface p-4 outline-offset-4 sm:p-5"
        >
          <h2 id="puan-sonuc" className="text-xl font-bold">Sonuç</h2>

          {!result.tytOk ? (
            <p className="mt-3 text-base">
              ÖSYM, TYT puanını Türkçe veya Temel Matematik testinden en az 0,5 net yapan adaylar için
              hesaplar. Bu netlerle puan oluşmaz.
            </p>
          ) : (
            <>
              {(() => {
                const main = headline?.field ?? headline?.tyt;
                if (!main) return null;
                const rank = main.placementRank ?? main.examRank;
                return (
                  <p className="mt-3 text-lg">
                    Tahmini başarı sıran ({main.placementRank ? "yerleştirme puanı" : "sınav puanı"}, 2026 dağılımı):{" "}
                    <strong className="text-2xl">{rankText(rank)}</strong>
                  </p>
                );
              })()}
              <p className="mt-1 text-sm text-ink-mid">
                Bu bir aralıktır, tek bir sayı değildir; aşağıda nedenini ve 2025 dağılımıyla karşılaştırmayı bulabilirsin.
              </p>

              {(
                [
                  ["tyt", result.out.map((o) => o.tyt)],
                  ...(result.mode !== "tyt" ? [[SCHEME_OF[result.mode], result.out.map((o) => o.field)]] : []),
                ] as [Scheme, (SchemeResult | null)[]][]
              ).map(([scheme, rows]) => (
                <div key={scheme} className="mt-5 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm sm:text-base">
                    <caption className="py-2 text-left text-base font-bold">{SCHEME_LABEL[scheme]}</caption>
                    <thead>
                      <tr className="border-b-2 border-ink">
                        <th scope="col" className="py-2 pr-2 font-bold"><span className="sr-only">Ölçü</span></th>
                        {YEARS.map((y) => (
                          <th key={y} scope="col" className="px-1 py-2 text-right font-bold sm:px-2">{y} verisiyle</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Sınav puanı", get: (r: SchemeResult) => puanText(r.puan) },
                        { label: "Sınav puanına göre sıra", get: (r: SchemeResult) => rankText(r.examRank) },
                        ...(result.hasObp
                          ? [
                              { label: "Yerleştirme puanı", get: (r: SchemeResult) => puanText(r.placement!) },
                              { label: "Yerleştirme puanına göre sıra", get: (r: SchemeResult) => rankText(r.placementRank!) },
                            ]
                          : []),
                      ].map((row) => (
                        <tr key={row.label} className="border-b border-line">
                          <th scope="row" className="py-2 pr-2 font-medium">{row.label}</th>
                          {rows.map((r, i) => (
                            <td key={YEARS[i]} className="px-1 py-2 text-right sm:px-2">{r ? row.get(r) : "–"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {result.mode !== "tyt" && !result.fieldOk && (
                <p className="mt-4 text-sm text-ink-mid">
                  Alan puanı için seçtiğin alanın AYT testlerinden en az birinde 0,5 net gerekir (ÖSYM kuralı).
                </p>
              )}
            </>
          )}

          <div className="mt-5 rounded-xl bg-pink-pale p-4">
            {result.weakest ? (
              <>
                <p>
                  Sıranı yükseltmenin en kısa yolu <strong>{result.weakest.subject}</strong> netin. Kimliği
                  doğrulanmış hocalara göz at.
                </p>
                <a
                  href={mainUrl("/", CAMPAIGN, { exam_type: result.weakest.exam, subject: result.weakest.subject }, TUTOR_LIST_HASH)}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
                >
                  {result.weakest.subject} hocalarını incele
                </a>
              </>
            ) : (
              <>
                <p>Sıranı yükseltmek için YKS&apos;de derece yapmış hocalara göz at.</p>
                <a
                  href={mainUrl("/yks-ozel-ders", CAMPAIGN)}
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
