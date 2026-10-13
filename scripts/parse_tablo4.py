"""ÖSYM Yükseköğretim Programları ve Kontenjanları Kılavuzu, Tablo 4 (lisans) -> JSON.

Geliştirici aracı; çalışma zamanında kullanılmaz. Gerekli: pip install pdfplumber.
Kullanım: python scripts/parse_tablo4.py kilavuz.pdf src/lib/bolum-data
Kılavuzda sayfa üzerine bindirilmiş Helvetica damga yazısı vardır; yalnız Calibri karakterler okunur.
"""
import json, re, sys
import pdfplumber

CODE = re.compile(r"^\d{9}$")
NUM = re.compile(r"^\d+$")
PUAN = re.compile(r"^\d{2,3}\.\d+$")
FIRST, LAST = 147, 550  # Tablo 4 sayfa aralığı (2026 kılavuzu; başka yıl için değiştir)


def is_data_page(text):
    return "TABLO-4." in text[:200]


def header_cols(words):
    """Başlık satırındaki (3)..(12) numaralarından sütun x aralıkları."""
    pos = {}
    for w in words:
        m = re.fullmatch(r"\((\d+)\)", w["text"])
        if m and w["top"] < 70:
            pos[int(m.group(1))] = (w["x0"], w["x1"])
    return pos


def parse(path):
    out, uni, fak = [], None, None
    caps = []  # son satırdan beri biriken BÜYÜK HARFLİ başlık satırları; üniversite adı birkaç satıra bölünebilir
    with pdfplumber.open(path) as pdf:
        for pi, page in enumerate(pdf.pages[FIRST:LAST]):
            raw = page.extract_text() or ""
            if not is_data_page(raw):
                continue
            pg = page.filter(lambda o: o.get("object_type") != "char" or "Calibri" in o.get("fontname", ""))
            words = pg.extract_words()
            cols = header_cols(words)
            if not {3, 4, 5, 11, 12} <= set(cols):
                print(f"page {pi+1+FIRST}: header not found", file=sys.stderr)
                continue
            x_name_max = cols[3][0] - 4
            lines = {}
            for w in words:
                if w["top"] < 58:
                    continue
                lines.setdefault(round(w["top"]), []).append(w)
            tops = sorted(lines)
            rows, pend = [], []
            for t in tops:
                ws = sorted(lines[t], key=lambda w: w["x0"])
                left = [w for w in ws if w["x1"] <= x_name_max]
                right = [w for w in ws if w["x0"] > x_name_max]
                if left and CODE.match(left[0]["text"]) and left[0]["x0"] < 50:
                    cell = lambda n, tol=6: [w["text"] for w in right if cols[n][0] - tol <= (w["x0"] + w["x1"]) / 2 <= cols[n][1] + tol]
                    sira = [w["text"] for w in right if cols[11][0] - 14 <= w["x1"] <= cols[11][1] + 4]
                    puan = [w["text"] for w in right if cols[11][1] + 2 <= w["x0"] <= cols[12][1] and PUAN.match(w["text"])]
                    rows.append(dict(
                        top=t, kod=left[0]["text"], uni=uni, fak=fak,
                        ad=[" ".join(w["text"] for w in left[1:])],
                        sure=(cell(3) or [None])[0], tur=(cell(4) or [None])[0],
                        kont=(cell(5) or [None])[0],
                        sira=sira[0] if sira and NUM.match(sira[0]) else None,
                        puan=puan[0] if puan and PUAN.match(puan[0]) else None,
                    ))
                elif left:
                    text = " ".join(w["text"] for w in left)
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
                elif (s.upper() == s and len(s) > 3) or re.search(r"FAKÜLTESİ|YÜKSEKOKULU|ENSTİTÜSÜ|KONSERVATUVARI", s):
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


def emit(data, outdir, meta):
    """Yalnız 2025 sırası ve puanı olan programlar; puan türü başına bir JSON dosyası, sıraya göre artan."""
    import os
    os.makedirs(outdir, exist_ok=True)
    for tur in ("SAY", "EA", "SÖZ", "DİL"):
        rows = [r for r in data if r["tur"] == tur and r["sira"] and r["puan"]]
        unis, idx = [], {}
        for r in rows:
            key = (r["uni"]["ad"], r["uni"]["tur"])
            if key not in idx:
                idx[key] = len(unis)
                unis.append([tr_title(key[0]), key[1]])
        rows.sort(key=lambda r: (int(r["sira"]), r["kod"]))
        out = {
            "meta": dict(meta, tur=tur, programlar=len(rows)),
            "unis": unis,
            # [program kodu, üniversite sırası, ad, öğrenim süresi, 2026 genel kontenjan, 2025 başarı sırası, 2025 en küçük puan]
            "rows": [[r["kod"], idx[(r["uni"]["ad"], r["uni"]["tur"])], r["ad"], int(r["sure"]), int(r["kont"] or 0), int(r["sira"]), float(r["puan"])] for r in rows],
        }
        name = {"SAY": "say", "EA": "ea", "SÖZ": "soz", "DİL": "dil"}[tur]
        with open(os.path.join(outdir, f"{name}.json"), "w") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(tur, len(rows), "program,", len(unis), "üniversite", file=sys.stderr)


if __name__ == "__main__":
    import datetime
    data = parse(sys.argv[1])
    print(len(data), "satır", file=sys.stderr)
    # Kapsam: Türkiye'deki devlet (kod 1xxx) ve vakıf (2xxx) üniversiteleri. KKTC (3xxx) ve yurt dışı (4xxx) bölümleri ile
    # bakanlıklar adına açılan programlar başlık düzeni farklı ve genel yerleştirme dışı olduğundan alınmaz.
    data = [r for r in data if r["kod"][0] in "12" and "ADINA" not in r["uni"]["ad"]]
    print(len(data), "satır kapsamda", file=sys.stderr)
    # program kodunun ilk 4 hanesi üniversiteyi belirler: başlık atlanırsa iki üniversite karışır
    by_name, by_prefix = {}, {}
    for r in data:
        by_name.setdefault(r["uni"]["ad"], set()).add(r["kod"][:4])
        by_prefix.setdefault(r["kod"][:4], set()).add(r["uni"]["ad"])
    bad = [(n, sorted(x)) for n, x in by_name.items() if len(x) > 1] + [(x, sorted(n)) for x, n in by_prefix.items() if len(n) > 1]
    assert not bad, f"üniversite/kod öneki tutarsız: {bad[:5]}"
    assert max(sum(1 for r in data if r["uni"]["ad"] == n) for n in by_name) < 700, "bir üniversite çok fazla program topladı"
    print(len(by_name), "üniversite", file=sys.stderr)
    # puan arttıkça sıra iyileşmeli: bozuk sütun/damga hatasını yakalar
    for tur in ("SAY", "EA", "SÖZ", "DİL"):
        xs = sorted(((float(r["puan"]), int(r["sira"])) for r in data if r["tur"] == tur and r["puan"] and r["sira"]), reverse=True)
        mx = 0
        for _, sira in xs:
            assert sira >= mx - 2000, f"{tur}: puan/sıra tutarsız ({sira} < {mx})"
            mx = max(mx, sira)
    emit(data, sys.argv[2], {
        "kaynak": "ÖSYM 2026-YKS Yükseköğretim Programları ve Kontenjanları Kılavuzu (21 Temmuz 2026), Tablo 4",
        "url": "https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/TERCIH/kontkilavuz_yktd21072026.pdf",
        "yil": 2025,
        "uretim": datetime.date.today().isoformat(),
    })
