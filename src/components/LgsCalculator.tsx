"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { LGS_MAX_PUAN, LGS_MIN_PUAN, lgsRank, parseLgsPuan, type LgsResult } from "@/lib/lgs";
import { roundRank } from "@/lib/puan";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const nf = new Intl.NumberFormat("tr-TR");
const pct = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LgsCalculator() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [result, setResult] = useState<LgsResult | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const puan = parseLgsPuan(value);
    if (puan === null) {
      setError(true);
      setResult(null);
      document.getElementById("lgs-puan")?.focus();
      return;
    }
    setError(false);
    setResult(lgsRank(puan));
  }

  function reset() {
    setValue("");
    setError(false);
    setResult(null);
    document.getElementById("lgs-puan")?.focus();
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="LGS sıralama hesaplama" className="max-w-md">
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
            setResult(null);
            setError(false);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "lgs-hata" : "lgs-ipucu"}
          className={inputCls}
        />
        <p id="lgs-ipucu" className="mt-1 text-sm text-ink-mid">
          Sonuç belgendeki Merkezî Sınav puanı. Örnek: 432,57
        </p>
        {error && (
          <p id="lgs-hata" className="mt-1 text-sm font-medium text-error">
            Puan 100 ile {LGS_MAX_PUAN} arasında bir sayı olmalı.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className={btnPrimary}>Sıramı hesapla</button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="lgs-sonuc"
          className="mt-8 max-w-md rounded-2xl border-2 border-ink bg-surface p-5 outline-offset-4"
        >
          <h2 id="lgs-sonuc" className="text-xl font-bold">Sonuç</h2>
          {result.ok ? (
            <>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-lg">
                <dt>Yüzdelik dilimin</dt>
                <dd className="text-right text-2xl font-bold">%{pct.format(result.percentile)}</dd>
                <dt>Sıran</dt>
                <dd className="text-right text-2xl font-bold">{nf.format(roundRank(result.rank))}</dd>
              </dl>
              <p className="mt-3 text-base">(yaklaşık olarak)</p>
              <p className="mt-2 text-sm text-ink-mid">
                2025 LGS dağılımına göre hesaplanır. Yüzdelik dilim, sınava girenlerin yüzde kaçının senden
                yüksek puan aldığını gösterir. Resmî yüzdelik dilimin MEB sonuç belgesindedir.
              </p>
            </>
          ) : (
            <p className="mt-3 text-base">
              Bu araç yaklaşık ilk %35&apos;lik dilimi (puan {LGS_MIN_PUAN} ve üstü) destekler. Daha düşük
              puanlar için MEB&apos;in yayımladığı güvenilir bir veri olmadığından sıra hesaplanmaz.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
