"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { biggestGap, computeGoal, goalErrorMessage, type GoalInput } from "@/lib/goal";
import { AYT_FIELDS, TYT_SECTIONS, formatNet, type AytField, type Section } from "@/lib/net";
import { TUTOR_LIST_HASH, mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const CAMPAIGN = "hedef-net-planlayici";
const BLANK: GoalInput = { current: "", target: "" };

type Exam = "TYT" | AytField;

const EXAMS: { id: Exam; label: string; sections: Section[] }[] = [
  { id: "TYT", label: "TYT", sections: TYT_SECTIONS },
  ...(Object.keys(AYT_FIELDS) as AytField[]).map((k) => ({
    id: k,
    label: `AYT ${AYT_FIELDS[k].label}`,
    sections: AYT_FIELDS[k].sections,
  })),
];

export function GoalPlanner() {
  const [exam, setExam] = useState<Exam>("TYT");
  const [inputs, setInputs] = useState<Record<string, GoalInput>>({});
  const [result, setResult] = useState<ReturnType<typeof computeGoal> | null>(null);
  const [noTarget, setNoTarget] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const current = EXAMS.find((e) => e.id === exam)!;
  const sections = current.sections;
  const live = computeGoal(sections, inputs);
  const examKey = exam === "TYT" ? "TYT" : "AYT";
  const inputId = (s: Section, key: keyof GoalInput) => `${exam}-${s.id}-${key}`;

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function update(id: string, key: keyof GoalInput, value: string) {
    setInputs((prev) => ({ ...prev, [id]: { ...(prev[id] ?? BLANK), [key]: value } }));
    setResult(null);
    setNoTarget(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!live.ok) {
      const first = sections.find((s) => live.errors[s.id]);
      if (first) document.getElementById(inputId(first, "current"))?.focus();
      return;
    }
    if (live.rows.length === 0) {
      setNoTarget(true);
      document.getElementById(inputId(sections[0], "target"))?.focus();
      return;
    }
    setResult(live);
  }

  function reset() {
    setInputs({});
    setResult(null);
    setNoTarget(false);
    document.getElementById(inputId(sections[0], "current"))?.focus();
  }

  const focus = result
    ? biggestGap(result.rows.filter((r) => r.section.tutorSubject))
    : null;

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="Hedef net planlayıcı">
        <fieldset className="mb-6">
          <legend className="text-base font-bold">Sınav</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {EXAMS.map((e) => (
              <label key={e.id} className="flex min-h-11 items-center gap-2 text-base">
                <input
                  type="radio"
                  name="sinav"
                  value={e.id}
                  checked={exam === e.id}
                  onChange={() => {
                    setExam(e.id);
                    setInputs({}); // bölümler değişir; eski girdi yanlış derse yazılmasın
                    setResult(null);
                    setNoTarget(false);
                  }}
                  className="h-5 w-5 accent-pink-deep"
                />
                {e.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const a = inputs[section.id] ?? BLANK;
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
                    <label htmlFor={inputId(section, "current")} className={labelCls}>Şimdiki net</label>
                    <input
                      id={inputId(section, "current")}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      maxLength={6}
                      value={a.current}
                      onChange={(e) => update(section.id, "current", e.target.value)}
                      className={inputCls}
                      {...a11y}
                    />
                  </div>
                  <div>
                    <label htmlFor={inputId(section, "target")} className={labelCls}>Hedef net</label>
                    <input
                      id={inputId(section, "target")}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      maxLength={6}
                      value={a.target}
                      onChange={(e) => update(section.id, "target", e.target.value)}
                      className={inputCls}
                      {...a11y}
                    />
                  </div>
                </div>
                {err && (
                  <p id={errId} className="mt-2 text-sm font-medium text-error">
                    {goalErrorMessage(section, err)}
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>

        {noTarget && (
          <p role="alert" className="mt-4 text-base font-medium text-error">
            En az bir dersin hedef netini gir.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Planı çıkar</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="hedef-sonuc"
          className="mt-8 rounded-2xl border-2 border-ink bg-surface p-4 outline-offset-4 sm:p-5"
        >
          <h2 id="hedef-sonuc" className="text-xl font-bold">Planın</h2>
          <p className="mt-2 text-lg">
            {result.totalGap > 0 ? (
              <>
                Hedefe kalan toplam: <strong className="text-3xl">{formatNet(result.totalGap)}</strong> net
              </>
            ) : (
              <strong>Girdiğin tüm hedeflere ulaşmışsın.</strong>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-mid">
            Şimdi {formatNet(result.totalCurrent)} net, hedef {formatNet(result.totalTarget)} net (hedef girdiğin
            dersler toplamı).
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm sm:text-base">
              <caption className="sr-only">Ders bazında şimdiki net, hedef net ve kalan fark</caption>
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="py-2 pr-2 font-bold">Ders</th>
                  <th scope="col" className="px-1 py-2 text-right font-bold sm:px-2">Şimdi</th>
                  <th scope="col" className="px-1 py-2 text-right font-bold sm:px-2">Hedef</th>
                  <th scope="col" className="py-2 pl-1 text-right font-bold sm:pl-2">Kalan</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.section.id} className="border-b border-line">
                    <th scope="row" className="py-2 pr-2 font-medium">{r.section.label}</th>
                    <td className="px-1 py-2 text-right sm:px-2">{formatNet(r.current)}</td>
                    <td className="px-1 py-2 text-right sm:px-2">{formatNet(r.target)}</td>
                    <td className="py-2 pl-1 text-right font-bold sm:pl-2">{formatNet(r.gap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-pink-pale p-4">
            {focus ? (
              <>
                <p>
                  En büyük fark <strong>{focus.section.tutorSubject}</strong> dersinde. Bu dersi
                  kimliği doğrulanmış hocalarla çalışabilirsin.
                </p>
                <a
                  href={mainUrl(
                    "/",
                    CAMPAIGN,
                    { exam_type: examKey, subject: focus.section.tutorSubject! },
                    TUTOR_LIST_HASH,
                  )}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
                >
                  {focus.section.tutorSubject} hocalarını incele
                </a>
              </>
            ) : (
              <>
                <p>Hedefine ulaşmak için YKS&apos;de derece yapmış hocalara göz at.</p>
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
