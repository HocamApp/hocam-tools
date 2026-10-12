"use client";

import { useState, type FormEvent } from "react";

import { AYT_FIELDS, TYT_SECTIONS, nearestAchievableNet, type AytField, type Section } from "@/lib/net";
import type { Scheme } from "@/lib/osym-data";
import { AYT_KEYS, TYT_KEYS, YEARS, maxRank, netsForRank, type Nets } from "@/lib/puan";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

const PRESETS = [10_000, 25_000, 50_000, 100_000, 200_000, 300_000];
const SCHEME_OF: Record<AytField, Scheme> = { sayisal: "say", "esit-agirlik": "ea", sozel: "soz" };
const nf = new Intl.NumberFormat("tr-TR");
const one = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "100.000", "100 000" veya "100000". Geçersizse null. */
function parseRank(value: string): number | null {
  const v = value.replace(/[.\s]/g, "");
  return /^\d{1,7}$/.test(v) && Number(v) >= 1 ? Number(v) : null;
}

type Props = {
  mode: AytField | "tyt";
  /** Diploma notu girildiyse OBP katkısı: sıra yerleştirme puanına göre; yoksa sınav puanına göre. */
  contribution: number | null;
};

export function TargetNets({ mode, contribution }: Props) {
  const [text, setText] = useState("");
  const [rank, setRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scheme: Scheme = mode === "tyt" ? "tyt" : SCHEME_OF[mode];
  const limit = maxRank(scheme);

  function pick(r: number) {
    setText(nf.format(r));
    setError(null);
    setRank(r);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const r = parseRank(text);
    if (r === null || r > limit) {
      setRank(null);
      setError(`1 ile ${nf.format(limit)} arasında bir sıra gir.`);
      document.getElementById("hedef-sira")?.focus();
      return;
    }
    setError(null);
    setRank(r);
  }

  // Her render'da hesaplanır: alan veya diploma değişince sonuç kendini günceller.
  let result: { nets: Nets; fraction: number } | null = null;
  if (rank !== null && rank <= limit) {
    const per = YEARS.map((y) => netsForRank(scheme, y, rank, contribution));
    const nets: Nets = {};
    for (const k of Object.keys(per[0].nets) as (keyof Nets)[]) {
      nets[k] = per.reduce((s, p) => s + (p.nets[k] ?? 0), 0) / per.length;
    }
    result = { nets, fraction: per.reduce((s, p) => s + p.fraction, 0) / per.length };
  }

  const aytSections: Section[] = mode === "tyt" ? [] : AYT_FIELDS[mode].sections;
  const row = (s: Section, map: Record<string, keyof Nets>) => ({
    label: s.label,
    // Gerçekte ulaşılabilir en yakın net (4 yanlış 1 doğruyu götürür; 14 soruda 13,5 net olmaz).
    net: nearestAchievableNet(result!.nets[map[s.id]] ?? 0, s.questions),
  });
  const tytRows = result ? TYT_SECTIONS.map((s) => row(s, TYT_KEYS)) : [];
  const aytRows = result ? aytSections.map((s) => row(s, AYT_KEYS)) : [];
  const sum = (rows: { net: number }[]) => rows.reduce((t, r) => t + r.net, 0);

  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="hedef-baslik">
      <h2 id="hedef-baslik" className="text-xl font-bold">Hedef sıralamama kaç net lazım?</h2>
      <p className="mt-1 text-sm text-ink-mid">
        Hedef sıranı yaz ya da hazır olanlardan birini seç; yukarıda seçtiğin alana göre tahmini netlerini göster.
        {contribution === null
          ? " Sıra, sınav puanına göre hesaplanır. Aşağıya diploma notunu girersen yerleştirme puanına göre hesaplanır."
          : " Sıra, diploma notunla bulunan yerleştirme puanına göre hesaplanır."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Hazır hedef sıralar">
        {PRESETS.filter((p) => p <= limit).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            aria-pressed={rank === p}
            className={`inline-flex min-h-11 items-center rounded-lg border-2 px-4 py-2 text-base font-bold ${
              rank === p ? "border-ink bg-ink text-white" : "border-ink bg-surface text-ink hover:bg-pink-pale"
            }`}
          >
            {nf.format(p)}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-4 flex max-w-md flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="hedef-sira" className={labelCls}>Ya da kendi hedef sıran</label>
          <input
            id="hedef-sira"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "hedef-hata" : undefined}
            className={inputCls}
          />
        </div>
        <button type="submit" className={btnPrimary}>Göster</button>
        {error && (
          <p id="hedef-hata" className="w-full text-sm font-medium text-error">{error}</p>
        )}
      </form>

      {result && rank !== null && (
        <div className="mt-5" role="status" aria-live="polite">
          <h3 className="text-lg font-bold">
            {nf.format(rank)}. sıra için gereken ortalama netler{" "}
            <span className="font-normal text-ink-mid">(yaklaşık olarak)</span>
          </h3>
          {result.fraction <= 0.001 ? (
            <p className="mt-2">Bu sıra için neredeyse hiç net gerekmez: sıfır net bile bu sıranın üzerinde sayılır.</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm sm:text-base">
                  <caption className="sr-only">Ders bazında gereken tahmini net</caption>
                  <thead>
                    <tr className="border-b-2 border-ink">
                      <th scope="col" className="py-2 pr-2 font-bold">Ders</th>
                      <th scope="col" className="py-2 pl-2 text-right font-bold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...tytRows.map((r) => ({ ...r, group: "TYT" })), ...aytRows.map((r) => ({ ...r, group: "AYT" }))].map(
                      (r) => (
                        <tr key={`${r.group}-${r.label}`} className="border-b border-line">
                          <th scope="row" className="py-2 pr-2 font-medium">
                            <span className="text-ink-mid">{r.group}</span> {r.label}
                          </th>
                          <td className="py-2 pl-2 text-right font-bold">{one.format(r.net)}</td>
                        </tr>
                      ),
                    )}
                    <tr className="border-b-2 border-ink">
                      <th scope="row" className="py-2 pr-2 font-bold">TYT toplam</th>
                      <td className="py-2 pl-2 text-right font-bold">{one.format(sum(tytRows))}</td>
                    </tr>
                    {aytRows.length > 0 && (
                      <tr>
                        <th scope="row" className="py-2 pr-2 font-bold">AYT toplam</th>
                        <td className="py-2 pl-2 text-right font-bold">{one.format(sum(aytRows))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-ink-mid">
                Bu netler, 2026 ve 2025 verisiyle bulunan değerlerin ortalamasıdır ve derslerde dengeli bir başarı
                varsayar; gerçekte netlerin dersler arasındaki dağılımı farklı olabilir (aynı sıraya farklı net
                kombinasyonlarıyla ulaşılır). Resmî sıran
                ÖSYM sonuç belgesindedir.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
