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
  type Band,
  type Matches,
  type Program,
  type Tur,
} from "@/lib/bolum";
import { roundRank } from "@/lib/puan";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "@/lib/ui";

const nf = new Intl.NumberFormat("tr-TR");
const PAGE = 30;

const BAND_TEXT: Record<Band, { title: string; hint: string }> = {
  rahat: { title: "Rahat girebilirsin", hint: "Sıran, programın geçen yılki taban sırasından belirgin biçimde daha iyi." },
  sinirda: { title: "Sınırda", hint: "Sıran, geçen yılki taban sırasına yakın; kontenjan ve aday havuzuna göre iki yönde de değişebilir." },
  zor: { title: "Zor ama olabilir", hint: "Sıran taban sırasının biraz gerisinde; ancak kontenjan veya talep düşerse girebilirsin." },
};

type Result = { tur: Tur; sira: number; scaled: number; scale: number; matches: Matches; total: number };

function ProgramCard({ p }: { p: Program }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <p className="font-bold text-ink">{p.ad}</p>
      <p className="mt-0.5 text-sm text-ink-mid">
        {p.uni} · {p.uniTur} üniversitesi
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-mid">2025 taban sırası</dt>
          <dd className="font-bold">{nf.format(p.sira)}</dd>
        </div>
        <div>
          <dt className="text-ink-mid">2025 taban puanı</dt>
          <dd className="font-bold">{p.puan.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
        </div>
        <div>
          <dt className="text-ink-mid">2026 kontenjan</dt>
          <dd className="font-bold">{nf.format(p.kont)}</dd>
        </div>
        <div>
          <dt className="text-ink-mid">Süre</dt>
          <dd className="font-bold">{p.sure} yıl</dd>
        </div>
      </dl>
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
      const { programs } = await loadDataset(tur);
      const scale = poolScale(tur);
      const scaled = n * scale;
      const matches = matchPrograms(programs, scaled, { query, uniTur });
      setShown({ rahat: PAGE, sinirda: PAGE, zor: PAGE });
      setResult({ tur, sira: n, scaled, scale, matches, total: programs.length });
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
                Aday sayısı 2025&apos;ten farklı olduğu için sıran 2025 ölçeğine çevrildi (yaklaşık{" "}
                {nf.format(roundRank(result.scaled))}) ve taban sıralarıyla bu değer karşılaştırıldı.
              </>
            )}{" "}
            Yalnızca 2025&apos;te kontenjanı dolan {nf.format(result.total)} {result.tur} lisans programı taranır.
          </p>

          {count > 0 && (
            <nav aria-label="Gruplara git" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-base">
              {BANDS.filter((b) => result.matches[b].length > 0).map((b) => (
                <a key={b} href={`#bolum-${b}`} className="font-medium text-pink-deep underline">
                  {BAND_TEXT[b].title} ({nf.format(result.matches[b].length)})
                </a>
              ))}
            </nav>
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
                <ul className="mt-3 flex max-w-3xl flex-col gap-3">
                  {list.slice(0, shown[b]).map((p) => (
                    <ProgramCard key={p.kod} p={p} />
                  ))}
                </ul>
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
