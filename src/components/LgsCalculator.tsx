"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  LGS_MAX_PUAN,
  LGS_MIN_PUAN,
  LGS_SUBJECTS,
  lgsNet,
  lgsPuanFromNets,
  lgsRank,
  parseLgsPuan,
  type LgsAnswer,
  type LgsResult,
  type LgsSubject,
} from "@/lib/lgs";
import { parseCount } from "@/lib/net";
import { roundRank } from "@/lib/puan";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const nf = new Intl.NumberFormat("tr-TR");
const pct = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const two = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Mode = "net" | "puan";
type Blank = { correct: string; wrong: string };
const BLANK: Blank = { correct: "", wrong: "" };

type Out = {
  puan: number;
  result: LgsResult;
  /** Yalnızca netten hesaplamada: ders ders ham puan (net) ve toplam. */
  nets?: { label: string; net: number }[];
  total?: number;
};

export function LgsCalculator() {
  const [mode, setMode] = useState<Mode>("net");
  const [answers, setAnswers] = useState<Record<string, Blank>>({});
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<Out | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (out) resultRef.current?.focus();
  }, [out]);

  // Ders başına satır içi hata: sayı olmayan ya da doğru + yanlış > soru sayısı.
  const rowError = (s: LgsSubject): string | null => {
    const a = answers[s.id] ?? BLANK;
    const c = parseCount(a.correct);
    const w = parseCount(a.wrong);
    if (c === null || w === null) return `${s.label}: yalnızca rakam girin.`;
    if (c + w > s.questions) return `${s.label}: doğru ve yanlış toplamı ${s.questions} soruyu geçemez.`;
    return null;
  };

  function change() {
    setOut(null);
    setError(null);
  }

  function onSubmitNet(e: FormEvent) {
    e.preventDefault();
    const bad = LGS_SUBJECTS.find((s) => rowError(s));
    if (bad) {
      setOut(null);
      document.getElementById(`lgs-${bad.id}-correct`)?.focus();
      return;
    }
    const full = Object.fromEntries(
      LGS_SUBJECTS.map((s) => {
        const a = answers[s.id] ?? BLANK;
        return [s.id, { correct: parseCount(a.correct)!, wrong: parseCount(a.wrong)! }];
      }),
    ) as Record<LgsSubject["id"], LgsAnswer>;
    const puan = lgsPuanFromNets(full);
    const nets = LGS_SUBJECTS.map((s) => ({ label: s.label, net: lgsNet(full[s.id]) }));
    setOut({ puan, result: lgsRank(puan), nets, total: nets.reduce((t, n) => t + n.net, 0) });
  }

  function onSubmitPuan(e: FormEvent) {
    e.preventDefault();
    const puan = parseLgsPuan(value);
    if (puan === null) {
      setError(`Puan 100 ile ${LGS_MAX_PUAN} arasında bir sayı olmalı.`);
      setOut(null);
      document.getElementById("lgs-puan")?.focus();
      return;
    }
    setError(null);
    setOut({ puan, result: lgsRank(puan) });
  }

  function reset() {
    setAnswers({});
    setValue("");
    setError(null);
    setOut(null);
    document.getElementById(mode === "net" ? "lgs-tr-correct" : "lgs-puan")?.focus();
  }

  return (
    <div>
      <fieldset>
        <legend className="text-base font-bold">Neyle hesaplayalım?</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ["net", "Netlerimle"],
              ["puan", "LGS puanımla"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="flex min-h-11 items-center gap-2 text-base">
              <input
                type="radio"
                name="lgs-mod"
                value={id}
                checked={mode === id}
                onChange={() => {
                  setMode(id);
                  change();
                }}
                className="h-5 w-5 accent-pink-deep"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "net" ? (
        <form onSubmit={onSubmitNet} noValidate aria-label="LGS net ile sıralama hesaplama" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {LGS_SUBJECTS.map((s) => {
              const a = answers[s.id] ?? BLANK;
              const err = rowError(s);
              const errId = `lgs-${s.id}-error`;
              const a11y = { "aria-invalid": err ? true : undefined, "aria-describedby": err ? errId : undefined } as const;
              const field = (key: keyof Blank, label: string) => (
                <div>
                  <label htmlFor={`lgs-${s.id}-${key}`} className={labelCls}>{label}</label>
                  <input
                    id={`lgs-${s.id}-${key}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={2}
                    value={a[key]}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAnswers((p) => ({ ...p, [s.id]: { ...(p[s.id] ?? BLANK), [key]: v } }));
                      change();
                    }}
                    className={inputCls}
                    {...a11y}
                  />
                </div>
              );
              return (
                <fieldset key={s.id} className="rounded-xl border border-line bg-surface p-4">
                  <legend className="px-1 text-base font-bold">
                    {s.label} <span className="font-normal text-ink-mid">({s.questions} soru)</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {field("correct", "Doğru")}
                    {field("wrong", "Yanlış")}
                  </div>
                  {err && <p id={errId} className="mt-2 text-sm font-medium text-error">{err}</p>}
                </fieldset>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className={btnPrimary}>Sıramı hesapla</button>
            <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitPuan} noValidate aria-label="LGS puanı ile sıralama hesaplama" className="mt-6 max-w-md">
          <label htmlFor="lgs-puan" className={labelCls}>LGS puanın (100–500)</label>
          <input
            id="lgs-puan"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            maxLength={7}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              change();
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "lgs-hata" : "lgs-ipucu"}
            className={inputCls}
          />
          <p id="lgs-ipucu" className="mt-1 text-sm text-ink-mid">
            Sonuç belgendeki Merkezî Sınav puanı. Örnek: 432,57
          </p>
          {error && <p id="lgs-hata" className="mt-1 text-sm font-medium text-error">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className={btnPrimary}>Sıramı hesapla</button>
            <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
          </div>
        </form>
      )}

      {out && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="lgs-sonuc"
          className="mt-8 max-w-xl rounded-2xl border-2 border-ink bg-surface p-5 outline-offset-4"
        >
          <h2 id="lgs-sonuc" className="text-xl font-bold">Sonuç</h2>

          {out.nets && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm sm:text-base">
                <caption className="sr-only">Ders bazında net (doğru − yanlış ÷ 3)</caption>
                <thead>
                  <tr className="border-b-2 border-ink">
                    <th scope="col" className="py-2 pr-2 font-bold">Ders</th>
                    <th scope="col" className="py-2 pl-2 text-right font-bold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {out.nets.map((n) => (
                    <tr key={n.label} className="border-b border-line">
                      <th scope="row" className="py-2 pr-2 font-medium">{n.label}</th>
                      <td className="py-2 pl-2 text-right">{two.format(n.net)}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="py-2 pr-2 font-bold">Toplam net</th>
                    <td className="py-2 pl-2 text-right font-bold">{two.format(out.total ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-lg">
            <dt>{out.nets ? "Tahmini LGS puanın" : "LGS puanın"}</dt>
            <dd className="text-right text-2xl font-bold">{Math.round(out.puan)}</dd>
            {out.result.ok ? (
              <>
                <dt>Yüzdelik dilimin</dt>
                <dd className="text-right text-2xl font-bold">%{pct.format(out.result.percentile)}</dd>
                <dt>Sıran</dt>
                <dd className="text-right text-2xl font-bold">{nf.format(roundRank(out.result.rank))}</dd>
              </>
            ) : null}
          </dl>
          {out.result.ok ? (
            <>
              <p className="mt-3 text-base">(yaklaşık olarak)</p>
              <p className="mt-2 text-sm text-ink-mid">
                {out.nets
                  ? "Puan; MEB'in yayımladığı madde güçlüğü ve güvenirlik katsayılarından kestirilen ders ortalama ve standart sapmalarıyla hesaplanır, sıra 2025 LGS dağılımına göre bulunur."
                  : "Sıra, 2025 LGS dağılımına göre hesaplanır."}{" "}
                Yüzdelik dilim, sınava girenlerin yüzde kaçının senden yüksek puan aldığını gösterir. Resmî puan ve
                yüzdelik dilimin MEB sonuç belgesindedir.
              </p>
            </>
          ) : (
            <p className="mt-3 text-base">
              Bu araç yaklaşık ilk %35&apos;lik dilimi (puan {LGS_MIN_PUAN} ve üstü) destekler. Daha düşük puanlar için
              güvenilir bir veri olmadığından sıra hesaplanmaz.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
