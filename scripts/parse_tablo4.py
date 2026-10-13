"""ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzları, Tablo 4 (lisans) -> bolum-data/*.json.

Geliştirici aracı; çalışma zamanında kullanılmaz. Gerekli: pip install pdfplumber.

Her kılavuzun Tablo 4'ü bir önceki yılın genel kontenjan en küçük başarı sırasını ve puanını verir
(2026 kılavuzu -> 2025 verisi). Dört kılavuz birleştirilerek program başına dört yıl çıkar.

  python scripts/parse_tablo4.py parse kilavuz.pdf ILK_SAYFA SON_SAYFA ham.json
      Tek kılavuzu ayrıştırır (sayfa numaraları 1'den; yalnız "TABLO-4." başlıklı sayfalar okunur). Yaklaşık 4-6 dk.
  python scripts/parse_tablo4.py build src/lib/bolum-data 2026=ham26.json 2025=ham25.json 2024=ham24.json 2023=ham23.json
      Ham dosyaları birleştirir; ilk anahtar (en yeni kılavuz) program listesini ve 2026 kontenjanını belirler.

Sayfa üzerine bindirilmiş damga yazısı büyük (>20 pt) Helvetica'dır; yalnız gövde boyutundaki karakterler okunur.
Sınırlar: bkz. AI_AGENT_RULES.md §1 (bölüm bulucu verisi).
"""
import datetime
import json
import os
import re
import sys

CODE = re.compile(r"^\d{9}$")
NUM = re.compile(r"^\d+$")
PUAN = re.compile(r"^\d{2,3}\.\d+$")
HEADING = re.compile(r"fakültesi|yüksekokulu|enstitüsü|konservatuvarı", re.IGNORECASE)
TURLER = ("SAY", "EA", "SÖZ", "DİL")

# Kılavuz yılı -> kaynak. "url": ÖSYM'nin kendi adresi; "arsiv": ÖSYM dosyasını kaldırdığı için kullanılan Internet Archive kopyası.
GUIDES = {
    2026: {
        "ad": "2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu (21 Temmuz 2026)",
        "url": "https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf",
    },
    2025: {
        "ad": "2025-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu (1 Ağustos 2025)",
        "url": "https://dokuman.osym.gov.tr/pdfdokuman/2025/YKS/TERC%C4%B0H/tkilavuz_01082025.pdf",
        "arsiv": "https://web.archive.org/web/20250804165408/https://dokuman.osym.gov.tr/pdfdokuman/2025/YKS/TERC%C4%B0H/tkilavuz_01082025.pdf",
    },
    2024: {
        "ad": "2024-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu (25 Temmuz 2024)",
        "url": "https://dokuman.osym.gov.tr/pdfdokuman/2024/YKS/TERCIH/tkilavuz_25072024d.pdf",
        "arsiv": "https://web.archive.org/web/20240726055749/https://dokuman.osym.gov.tr/pdfdokuman/2024/YKS/TERCIH/tkilavuz_25072024d.pdf",
    },
    2023: {
        "ad": "2023-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu (27 Temmuz 2023)",
        "url": "https://dokuman.osym.gov.tr/pdfdokuman/2023/YKS/TERCIH/kkilavuz27072023di.pdf",
        "arsiv": "https://web.archive.org/web/20230731100125/https://dokuman.osym.gov.tr/pdfdokuman/2023/YKS/TERCIH/kkilavuz27072023di.pdf",
    },
}


def header_info(words):
    """Başlıktaki (n) sütun numaralarının x aralıkları, sıra/puan sütun numaraları ve başlığın alt sınırı."""
    nums = [(w, int(re.fullmatch(r"\((\d+)\)", w["text"]).group(1))) for w in words if re.fullmatch(r"\((\d+)\)", w["text"]) and w["top"] < 70]
    cols = {n: (w["x0"], w["x1"]) for w, n in nums}

    def after(label):
        """label kelimesinin hemen sağındaki (n) numarası."""
        for lw in (w for w in words if w["top"] < 70 and w["text"] == label):
            cand = [(w["x0"], n) for w, n in nums if abs(w["top"] - lw["top"]) < 3 and w["x0"] > lw["x1"] - 1]
            if cand:
                return min(cand)[1]
        return None

    sira_n = after("SIRASI")
    puan_n = after("PUANI") or after("PUAN")
    bottom = max((w["bottom"] for w, _ in nums), default=0) + 1
    return cols, sira_n, puan_n, bottom


def parse(path, first, last):
    import pdfplumber

    out, uni, fak = [], None, None
    caps = []  # son satırdan beri biriken başlık satırları; üniversite adı birkaç satıra bölünebilir
    with pdfplumber.open(path) as pdf:
        for pi in range(first - 1, last):
            page = pdf.pages[pi]
            if "TABLO-4." not in (page.extract_text() or "")[:300]:
                continue
            pg = page.filter(lambda o: o.get("object_type") != "char" or o["size"] <= 20)
            words = pg.extract_words()
            cols, sira_n, puan_n, bottom = header_info(words)
            if not ({3, 4, 5} <= set(cols) and sira_n in cols and puan_n in cols):
                print(f"sayfa {pi + 1}: başlık çözülemedi", file=sys.stderr)
                continue
            x_name_max = cols[3][0] - 4
            sc, pc = cols[sira_n], cols[puan_n]
            lines = {}
            for w in words:
                if w["top"] >= bottom:
                    lines.setdefault(round(w["top"]), []).append(w)
            rows, pend = [], []
            for t in sorted(lines):
                ws = sorted(lines[t], key=lambda w: w["x0"])
                left = [w for w in ws if w["x1"] <= x_name_max]
                right = [w for w in ws if w["x0"] > x_name_max]
                if left and CODE.match(left[0]["text"]) and left[0]["x0"] < 50:
                    def cell(n, tol=6):
                        return [w["text"] for w in right if cols[n][0] - tol <= (w["x0"] + w["x1"]) / 2 <= cols[n][1] + tol]

                    sira = [w["text"] for w in right if sc[0] - 14 <= w["x1"] <= sc[1] + 4]
                    puan = [w["text"] for w in right if sc[1] + 2 <= w["x0"] <= pc[1] and PUAN.match(w["text"])]
                    rows.append(dict(
                        top=t, kod=left[0]["text"], uni=uni, fak=fak,
                        ad=[" ".join(w["text"] for w in left[1:])],
                        sure=(cell(3) or [None])[0], tur=(cell(4) or [None])[0],
                        kont=(cell(5) or [None])[0],
                        sira=sira[0] if sira and NUM.match(sira[0]) else None,
                        puan=puan[0] if puan and PUAN.match(puan[0]) else None,
                    ))
                elif left:
                    # uzun başlık satırı ad sütununun sağına taşabilir ("... ALACAKLAR (Devlet Üniversitesi)"): sağdaki sözcükler rakamsızsa hepsini al
                    words_ = [w for w in ws if w["text"] != "YÖKAK"] if right and not any(re.search(r"\d", w["text"]) for w in right) else left
                    text = " ".join(w["text"] for w in words_)
                    if not re.match(r"^(\d{4}-YKS\b|\d+$)", text):  # sayfa altbilgisi ve sayfa numarası
                        pend.append((t, text))
            # üst başlıklar ve devam satırları: yukarıdan aşağı sırayla işle
            ctx_uni, ctx_fak = uni, fak
            events = sorted([(r["top"], "row", r) for r in rows] + [(t, "txt", s) for t, s in pend], key=lambda e: e[0])
            for t, kind, v in events:
                if kind == "row":
                    v["uni"], v["fak"] = ctx_uni, ctx_fak
                    caps = []
                    continue
                s = v
                m = re.match(r"^(.*?)\s*\((Devlet|Vakıf)(?:\s+Üniversitesi\)?)?$", s)
                if m and (m.group(1) or caps):
                    # tür satırı tek başına ("(Devlet Üniversitesi)") veya şehirle ("(ANKARA) (Vakıf Üniversitesi)") gelebilir
                    ctx_uni, ctx_fak = {"ad": " ".join(caps + ([m.group(1).strip()] if m.group(1) else [])), "tur": m.group(2)}, None
                    caps = []
                elif s in ("Üniversitesi)", "Üniversitesi"):
                    continue
                elif (s.upper() == s and len(s) > 3) or HEADING.search(s):
                    ctx_fak = s
                    caps.append(s)
                else:
                    near = min(rows, key=lambda r: abs(r["top"] - t), default=None)
                    if near is not None:
                        near.setdefault("cont", []).append((t, s))
            uni, fak = ctx_uni, ctx_fak
            out.extend(rows)
    for r in out:
        parts = sorted(r.pop("cont", []) + [(r["top"], r["ad"][0])])
        r["ad"] = " ".join(s for _, s in parts if s).strip()
        r.pop("top")
    return out


def tr_title(text):
    """BÜYÜK HARFLİ ad -> Türkçe baş harfler büyük (İ/ı kuralıyla)."""
    low = text.replace("İ", "i").replace("I", "ı").lower()
    small = {"ve", "ile"}
    words = []
    for w in low.split(" "):
        if w in small:
            words.append(w)
        elif w[:1] == "(":
            words.append("(" + w[1:2].replace("i", "İ").upper() + w[2:])
        else:
            words.append(w[:1].replace("i", "İ").upper() + w[1:])
    return " ".join(words)


def scope_and_check(data, label):
    """Kapsam: Türkiye'deki devlet (kod 1xxx) ve vakıf (2xxx) üniversiteleri. KKTC (3xxx), yurt dışı (4xxx) ve bakanlıklar
    adına açılan programların başlık düzeni farklı ve genel yerleştirme dışı. Sonra bütünlük kontrolleri."""
    data = [r for r in data if r["kod"][0] in "12" and "ADINA" not in (r["uni"] or {}).get("ad", "")]
    assert all(r["uni"] for r in data), f"{label}: üniversitesiz satır"
    assert len({r["kod"] for r in data}) == len(data), f"{label}: yinelenen program kodu"
    # program kodunun ilk 4 hanesi üniversiteyi belirler: başlık atlanırsa iki üniversite karışır
    by_name, by_prefix = {}, {}
    for r in data:
        by_name.setdefault(r["uni"]["ad"], set()).add(r["kod"][:4])
        by_prefix.setdefault(r["kod"][:4], set()).add(r["uni"]["ad"])
    bad = [(n, sorted(x)) for n, x in by_name.items() if len(x) > 1] + [(x, sorted(n)) for x, n in by_prefix.items() if len(n) > 1]
    assert not bad, f"{label}: üniversite/kod öneki tutarsız: {bad[:4]}"
    counts = {}
    for r in data:
        counts[r["uni"]["ad"]] = counts.get(r["uni"]["ad"], 0) + 1
    assert max(counts.values()) < 700, f"{label}: bir üniversite çok fazla program topladı"
    # puan arttıkça sıra iyileşmeli: bozuk sütun/damga hatasını yakalar
    for tur in TURLER:
        xs = sorted(((float(r["puan"]), int(r["sira"])) for r in data if r["tur"] == tur and r["puan"] and r["sira"]), reverse=True)
        mx = 0
        for _, sira in xs:
            assert sira >= mx - 2000, f"{label} {tur}: puan/sıra tutarsız ({sira} < {mx})"
            mx = max(mx, sira)
    print(f"{label}: {len(data)} program, {len(by_name)} üniversite", file=sys.stderr)
    return data


def build(outdir, raws):
    """raws: {kılavuz yılı: ham satırlar}. En yeni kılavuz tabandır; veri yılı = kılavuz yılı - 1."""
    years = sorted(raws, reverse=True)
    scoped = {y: scope_and_check(raws[y], f"{y} kılavuzu") for y in years}
    base_year = years[0]
    hist_guides = years[1:]  # 2025, 2024, 2023 kılavuzları -> 2024, 2023, 2022 verisi
    by_kod = {y: {r["kod"]: r for r in scoped[y]} for y in hist_guides}
    os.makedirs(outdir, exist_ok=True)
    for tur in TURLER:
        rows = [r for r in scoped[base_year] if r["tur"] == tur and r["sira"] and r["puan"]]
        unis, idx = [], {}
        for r in rows:
            key = (r["uni"]["ad"], r["uni"]["tur"])
            if key not in idx:
                idx[key] = len(unis)
                unis.append([tr_title(key[0]), key[1]])
        rows.sort(key=lambda r: (int(r["sira"]), r["kod"]))
        out_rows, with_hist = [], 0
        for r in rows:
            hist = []
            for y in hist_guides:
                old = by_kod[y].get(r["kod"])
                ok = old and old["tur"] == tur and old["sira"] and old["puan"]
                hist.append([int(old["sira"]), float(old["puan"])] if ok else None)
            with_hist += any(hist)
            out_rows.append([r["kod"], idx[(r["uni"]["ad"], r["uni"]["tur"])], r["ad"], int(r["sure"]), int(r["kont"] or 0), int(r["sira"]), float(r["puan"]), hist])
        meta = {
            "tur": tur,
            "programlar": len(out_rows),
            "yil": base_year - 1,
            "gecmisYillar": [y - 1 for y in hist_guides],
            "kaynaklar": [dict(yil=y - 1, **GUIDES[y]) for y in years],
            "uretim": datetime.date.today().isoformat(),
        }
        out = {
            "meta": meta,
            "unis": unis,
            # [program kodu, üniversite sırası, ad, öğrenim süresi, {baz yıl+1} genel kontenjan, {baz yıl} başarı sırası, {baz yıl} en küçük puan,
            #  önceki yıllar: her biri [sıra, puan] veya null, meta.gecmisYillar sırasıyla]
            "rows": out_rows,
        }
        name = {"SAY": "say", "EA": "ea", "SÖZ": "soz", "DİL": "dil"}[tur]
        with open(os.path.join(outdir, f"{name}.json"), "w") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"{tur}: {len(out_rows)} program, {len(unis)} üniversite, geçmişi olan {with_hist}", file=sys.stderr)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "parse" and len(sys.argv) == 6:
        data = parse(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
        json.dump(data, open(sys.argv[5], "w"), ensure_ascii=False)
        print(len(data), "satır", file=sys.stderr)
    elif cmd == "build" and len(sys.argv) >= 4:
        raws = {}
        for arg in sys.argv[3:]:
            year, path = arg.split("=", 1)
            raws[int(year)] = json.load(open(path))
        build(sys.argv[2], raws)
    else:
        sys.exit(__doc__)
