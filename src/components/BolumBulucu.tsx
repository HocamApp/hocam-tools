"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  BANDS,
  MAX_SIRA,
  TURLER,
  loadDataset,
  matchPrograms,
  parseSira,
  poolScale,
  yearRows,
  type Band,
  type Matches,
  type Program,
  type Tur,
} from "@/lib/bolum";
import { roundRank } from "@/lib/puan";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const nf = new Intl.NumberFormat("tr-TR");
const pf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const PAGE = 30;

const BAND_TEXT: Record<Band, { title: string; hint: string }> = {
  rahat: { title: "Rahat girebilirsin", hint: "Sıran, programın geçen yılki taban sırasından belirgin biçimde daha iyi." },
  sinirda: { title: "Sınırda", hint: "Sıran, geçen yılki taban sırasına yakın; kontenjan ve aday havuzuna göre iki yönde de değişebilir." },
  zor: { title: "Zor ama olabilir", hint: "Sıran taban sırasının biraz gerisinde; ancak kontenjan veya talep düşerse girebilirsin." },
};

type Result = { tur: Tur; sira: number; scaled: number; scale: number; matches: Matches; total: number; yil: number; gecmisYillar: number[] };

/* Tablo ızgarası (md ve üstü): Üniversite | Bölüm | Puan türü | [Yıl | Kont. | Taban puan | Başarı sırası = 22 rem].
   Başlık satırı ve her program bloğu aynı şablonu kullanır, sütunlar hizalı kalır. */
const GRID = "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_4.5rem_22rem]";
const YEAR_COLS = "grid grid-cols-[4rem_4rem_7rem_7rem]";

function Val({ v, missing, fmt = nf.format }: { v: number | null; missing: string; fmt?: (n: number) => string }) {
  if (v === null) {
    return (
      <>
        <span aria-hidden="true">–</span>
        <span className="sr-only">{missing}</span>
      </>
    );
  }
  return <>{fmt(v)}</>;
}

function TableHeader() {
  const th = "flex items-center justify-center px-2 py-3 text-center";
  return (
    <div aria-hidden="true" className="hidden border-2 border-ink bg-gold font-bold text-ink md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_4.5rem_22rem]">
      <div className={th}>Üniversite Adı</div>
      <div className={`${th} border-l-2 border-ink`}>Bölüm</div>
      <div className={`${th} border-l-2 border-ink`}>Puan Türü</div>
      <div className={`${YEAR_COLS} border-l-2 border-ink`}>
        <div className={th}>Yıl</div>
        <div className={`${th} border-l border-ink`}>Kont.</div>
        <div className={`${th} border-l border-ink`}>Taban Puan</div>
        <div className={`${th} border-l border-ink`}>Başarı Sırası</div>
      </div>
    </div>
  );
}

function ProgramRow({ p, tur, yil, gecmisYillar }: { p: Program; tur: Tur; yil: number; gecmisYillar: number[] }) {
  const rows = yearRows(p, yil, gecmisYillar);
  const td = "px-2 py-2 text-center tabular-nums";
  const vl = "md:border-l md:border-line";
  return (
    <li className={`${GRID} mb-3 rounded-xl border-2 border-ink bg-surface md:mb-0 md:rounded-none md:border-t-0`}>
      <div className="flex flex-col justify-center gap-0.5 px-3 pt-3 md:items-center md:px-2 md:py-3 md:text-center">
        <p className="font-bold text-ink">{p.uni}</p>
        <p className="text-sm text-ink-mid">{p.uniTur} üniversitesi</p>
      </div>
      <div className="flex items-center px-3 pb-1 pt-1 md:justify-center md:border-l-2 md:border-ink md:px-2 md:py-3 md:text-center">
        <p className="text-ink">{p.ad}</p>
      </div>
      <div className="flex items-center px-3 pb-2 font-bold text-ink md:justify-center md:border-l-2 md:border-ink md:px-2 md:py-3">
        <span className="rounded-full border-2 border-ink px-2 text-sm md:border-0 md:px-0 md:text-base">{tur}</span>
      </div>
      <div className="md:border-l-2 md:border-ink">
        <table className="w-full table-fixed border-collapse text-sm md:text-base">
          <caption className="sr-only">
            {p.uni}, {p.ad}: yıllara göre kontenjan, taban puanı ve başarı sırası
          </caption>
          <colgroup>
            <col className="w-[18%] md:w-16" />
            <col className="w-[18%] md:w-16" />
            <col className="w-[32%] md:w-28" />
            <col className="w-[32%] md:w-28" />
          </colgroup>
          <thead className="md:sr-only">
            <tr className="border-t border-ink bg-gold text-ink">
              <th scope="col" className="px-1 py-2 text-center font-bold">Yıl</th>
              <th scope="col" className="px-1 py-2 text-center font-bold">Kont.</th>
              <th scope="col" className="px-1 py-2 text-center font-bold">Taban Puan</th>
              <th scope="col" className="px-1 py-2 text-center font-bold">Başarı Sırası</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.yil}
                className={`border-t ${i === 0 ? "border-ink md:border-t-0" : "border-line"} ${r.yil === yil ? "bg-pink-pale font-medium" : ""}`}
              >
                <th scope="row" className={`${td} font-bold`}>{r.yil}</th>
                <td className={`${td} ${vl}`}><Val v={r.kont} missing="veri yok" /></td>
                <td className={`${td} ${vl}`}>
                  <Val v={r.puan} missing={r.yil > yil ? "henüz yayımlanmadı" : "veri yok"} fmt={pf.format} />
                </td>
                <td className={`${td} ${vl}`}>
                  <Val v={r.sira} missing={r.yil > yil ? "henüz yayımlanmadı" : "veri yok"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </li>
  );
}

export function BolumBulucu() {
  const [tur, setTur] = useState<Tur>("SAY");
  const [sira, setSira] = useState("");
  const [query, setQuery] = useState("");
  const [uniTur, setUniTur] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [shown, setShown] = useState<Record<Band, number>>({ rahat: PAGE, sinirda: PAGE, zor: PAGE });
  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = parseSira(sira);
    if (n === null) {
      setError(`Sıralaman 1 ile ${nf.format(MAX_SIRA)} arasında bir sayı olmalı.`);
      setResult(null);
      document.getElementById("bolum-sira")?.focus();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { programs, yil, gecmisYillar } = await loadDataset(tur);
      const scale = poolScale(tur);
      const scaled = n * scale;
      const matches = matchPrograms(programs, scaled, { query, uniTur });
      setShown({ rahat: PAGE, sinirda: PAGE, zor: PAGE });
      setResult({ tur, sira: n, scaled, scale, matches, total: programs.length, yil, gecmisYillar });
    } catch {
      setError("Bölüm verisi yüklenemedi. Sayfayı yenileyip tekrar dene.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSira("");
    setQuery("");
    setUniTur("");
    setError(null);
    setResult(null);
    document.getElementById("bolum-sira")?.focus();
  }

  const count = result ? BANDS.reduce((s, b) => s + result.matches[b].length, 0) : 0;

  return (
    <div>
      <form onSubmit={onSubmit} noValidate aria-label="Sıralamadan bölüm bulma" className="max-w-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bolum-tur" className={labelCls}>Puan türün</label>
            <select
              id="bolum-tur"
              value={tur}
              onChange={(e) => {
                setTur(e.target.value as Tur);
                setResult(null);
              }}
              className={inputCls}
            >
              {TURLER.map((t) => (
                <option key={t} value={t}>{t === "SÖZ" ? "Sözel (SÖZ)" : t === "DİL" ? "Dil (DİL)" : t === "EA" ? "Eşit Ağırlık (EA)" : "Sayısal (SAY)"}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bolum-sira" className={labelCls}>2026 YKS sıralaman</label>
            <input
              id="bolum-sira"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              value={sira}
              onChange={(e) => {
                setSira(e.target.value);
                setResult(null);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "bolum-hata" : "bolum-ipucu"}
              className={inputCls}
            />
          </div>
        </div>
        <p id="bolum-ipucu" className="mt-1 text-sm text-ink-mid">
          Sonuç belgendeki, seçtiğin puan türündeki başarı sırası. Örnek: 53.079
        </p>
        {error && (
          <p id="bolum-hata" role="alert" className="mt-1 text-sm font-medium text-error">{error}</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bolum-ara" className={labelCls}>Üniversite veya bölüm ara (isteğe bağlı)</label>
            <input
              id="bolum-ara"
              type="text"
              autoComplete="off"
              maxLength={60}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResult(null);
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="bolum-uni" className={labelCls}>Üniversite türü</label>
            <select
              id="bolum-uni"
              value={uniTur}
              onChange={(e) => {
                setUniTur(e.target.value);
                setResult(null);
              }}
              className={inputCls}
            >
              <option value="">Devlet ve vakıf</option>
              <option value="Devlet">Devlet</option>
              <option value="Vakıf">Vakıf</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Yükleniyor" : "Bölümleri göster"}
          </button>
          <button type="button" onClick={reset} className={btnSecondary}>Temizle</button>
        </div>
      </form>

      <div aria-live="polite" className="sr-only">{loading ? "Bölüm verisi yükleniyor" : ""}</div>

      {result && (
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="bolum-sonuc"
          className="mt-8 outline-offset-4"
        >
          <h2 id="bolum-sonuc" className="text-xl font-bold">
            {count > 0 ? `${nf.format(count)} program bulundu` : "Bu sıralamayla eşleşen program bulunamadı"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-mid">
            {result.tur} sıran {nf.format(result.sira)}.
            {result.scale !== 1 && (
              <>
                {" "}
                Aday sayısı {result.yil}&apos;ten farklı olduğu için sıran {result.yil} ölçeğine çevrildi (yaklaşık{" "}
                {nf.format(roundRank(result.scaled))}) ve taban sıralarıyla bu değer karşılaştırıldı.
              </>
            )}{" "}
            Yalnızca {result.yil}&apos;te kontenjanı dolan {nf.format(result.total)} {result.tur} lisans programı taranır.
          </p>
          {count > 0 && (
            <>
              <p className="mt-2 max-w-2xl text-sm text-ink-mid">
                Gruplama {result.yil} satırındaki (vurgulu) taban sırasına göre yapılır. Kont. genel kontenjandır; özel
                kontenjanlar dahil değildir. {result.yil + 1} için taban puan ve sıra, ÖSYM&apos;nin bir sonraki
                kılavuzuyla yayımlanır.
              </p>
              <nav aria-label="Gruplara git" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-base">
                {BANDS.filter((b) => result.matches[b].length > 0).map((b) => (
                  <a key={b} href={`#bolum-${b}`} className="font-medium text-pink-deep underline">
                    {BAND_TEXT[b].title} ({nf.format(result.matches[b].length)})
                  </a>
                ))}
              </nav>
            </>
          )}

          {BANDS.map((b) => {
            const list = result.matches[b];
            if (!list.length) return null;
            return (
              <section key={b} aria-labelledby={`bolum-${b}`} className="mt-8">
                <h3 id={`bolum-${b}`} className="text-lg font-bold">
                  {BAND_TEXT[b].title} ({nf.format(list.length)})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-ink-mid">{BAND_TEXT[b].hint}</p>
                <div className="mt-3">
                  <TableHeader />
                  <ul>
                    {list.slice(0, shown[b]).map((p) => (
                      <ProgramRow key={p.kod} p={p} tur={result.tur} yil={result.yil} gecmisYillar={result.gecmisYillar} />
                    ))}
                  </ul>
                </div>
                {list.length > shown[b] && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [b]: s[b] + PAGE }))}
                    className={`${btnSecondary} mt-3`}
                  >
                    Daha fazla göster ({nf.format(list.length - shown[b])} kaldı)
                  </button>
                )}
              </section>
            );
          })}
        </section>
      )}
    </div>
  );
}
