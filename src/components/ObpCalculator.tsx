"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { MAX_DIPLOMA, MIN_DIPLOMA, computeObp, formatScore, parseDiploma } from "@/lib/obp";
import { mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const CAMPAIGN = "obp-hesaplama";

export function ObpCalculator() {
  const [value, setValue] = useState("");
  const [placedLastYear, setPlacedLastYear] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof computeObp> | null>(null);
  const [error, setError] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const diploma = parseDiploma(value);
    if (diploma === null) {
      setError(true);
      setResult(null);
      document.getElementById("diploma")?.focus();
      return;
    }
    setError(false);
    setResult(computeObp(diploma, placedLastYear));
  }

  function reset() {
    setValue("");
    setPlacedLastYear(false);
    setResult(null);
    setError(false);
    document.getElementById("diploma")?.focus();
  }

  function changed() {
    setResult(null); // girdi değişince eski sonuç kalmasın
    setError(false);
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="OBP hesaplama" className="max-w-md">
        <label htmlFor="diploma" className={labelCls}>
          Diploma notu (100&apos;lük sistem)
        </label>
        <input
          id="diploma"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          maxLength={6}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            changed();
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "diploma-hata" : "diploma-ipucu"}
          className={inputCls}
        />
        <p id="diploma-ipucu" className="mt-1 text-sm text-ink-mid">Örnek: 85,5</p>
        {error && (
          <p id="diploma-hata" className="mt-1 text-sm font-medium text-error">
            Diploma notu 0 ile {MAX_DIPLOMA} arasında olmalı ve en çok iki ondalık içerebilir.
          </p>
        )}

        <label className="mt-5 flex items-start gap-3 text-base">
          <input
            type="checkbox"
            checked={placedLastYear}
            onChange={(e) => {
              setPlacedLastYear(e.target.checked);
              setResult(null);
            }}
            aria-describedby="kirik-ipucu"
            className="mt-1 h-5 w-5 accent-pink-deep"
          />
          <span>Geçen yıl bir yükseköğretim programına yerleştim (kırık OBP)</span>
        </label>
        <p id="kirik-ipucu" className="mt-1 pl-8 text-sm text-ink-mid">
          Sınava girdiğin yılın bir önceki yılında ÖSYM merkezî yerleştirmesiyle (ÖZYES dâhil) bir
          programa yerleştiysen, kayıt yaptırmasan bile, ya da özel yetenek sınavıyla bir programa
          kayıt olduysan işaretle. Daha eski yıllardaki yerleşme sayılmaz.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Hesapla</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="obp-sonuc"
          className="mt-8 max-w-md rounded-2xl border-2 border-ink bg-surface p-5 outline-offset-4"
        >
          <h2 id="obp-sonuc" className="text-xl font-bold">Sonuç</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-lg">
            <dt>OBP puanı</dt>
            <dd className="text-right font-bold">{formatScore(result.obp)}</dd>
            <dt>Yerleştirme puanına katkı</dt>
            <dd className="text-right text-2xl font-bold">{formatScore(result.contribution)}</dd>
          </dl>
          <p className="mt-3">
            <Link href="/yks-puan-siralama-hesaplama" className="font-medium text-pink-deep underline">
              Netlerinle birlikte puanını ve sıralamanı hesapla
            </Link>
          </p>
          {result.clamped && (
            <p className="mt-3 text-sm text-ink-mid">
              Diploma notu {MIN_DIPLOMA}&apos;nin altında olduğu için ÖSYM {MIN_DIPLOMA} olarak değerlendirir.
            </p>
          )}
          <div className="mt-5 rounded-xl bg-pink-pale p-4">
            <p>Hedef puanına ulaşmak için net artırman gerekiyorsa hocalarla tanış.</p>
            <a
              href={mainUrl("/yks-ozel-ders", CAMPAIGN)}
              className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 font-bold text-white hover:bg-ink"
            >
              YKS özel ders hocalarını gör
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
