import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { BAND_LIMITS, bandOf, fold, matchPrograms, parseSira, poolScale, toDataset, type Program, TURLER } from "./bolum";

const P = (kod: string, ad: string, sira: number, uni = "Örnek Üniversitesi", uniTur = "Devlet"): Program => ({
  kod, uni, uniTur, ad, sure: 4, kont: 10, sira, puan: 300,
});

test("parseSira: nokta/boşluk ayracı, sınırlar ve geçersiz girdi", () => {
  assert.equal(parseSira("53.079"), 53079);
  assert.equal(parseSira(" 53 079 "), 53079);
  assert.equal(parseSira("1"), 1);
  for (const bad of ["", "0", "abc", "12,5", "-3", "3000001", "99999999"]) assert.equal(parseSira(bad), null, bad);
});

test("bandOf: sınır değerleri", () => {
  assert.equal(bandOf(85, 100), "rahat");
  assert.equal(bandOf(86, 100), "sinirda");
  assert.equal(bandOf(115, 100), "sinirda");
  assert.equal(bandOf(116, 100), "zor");
  assert.equal(bandOf(130, 100), "zor");
  assert.equal(bandOf(131, 100), null);
  assert.equal(BAND_LIMITS.zor, 1.3);
});

test("poolScale: 2026 havuzu küçükse çarpan > 1; DİL için 1", () => {
  assert.ok(Math.abs(poolScale("SAY") - 1291531 / 1135718) < 1e-9);
  assert.ok(poolScale("SAY") > 1);
  assert.equal(poolScale("DİL"), 1);
});

test("fold: Türkçe harfler ve büyük/küçük harf", () => {
  assert.equal(fold("İSTANBUL Üniversitesi"), "istanbul universitesi");
  assert.equal(fold("Işık Çağrı Şeker"), "isik cagri seker");
  assert.equal(fold("ığdır"), fold("IĞDIR"));
});

test("matchPrograms: bantlar, sıralama, süzgeçler", () => {
  const ps = [
    P("1", "Tıp", 100),
    P("2", "Hukuk", 1000),
    P("3", "Bilgisayar Mühendisliği", 900, "Başka Üniversitesi", "Vakıf"),
    P("4", "Psikoloji", 800),
    P("5", "Tarih", 500),
  ];
  const r = matchPrograms(ps, 900);
  assert.deepEqual(r.rahat.map((p) => p.kod), []);
  assert.deepEqual(r.sinirda.map((p) => p.kod), ["4", "3", "2"]); // 800, 900, 1000 (q 1,125 .. 0,9)
  assert.deepEqual(r.zor.map((p) => p.kod), []);
  assert.deepEqual(matchPrograms(ps, 600).zor.map((p) => p.kod), ["5"]); // q = 1,2
  assert.deepEqual(matchPrograms(ps, 600).rahat.map((p) => p.kod), ["4", "3", "2"]); // 600 ≤ 0,85 × 800
  assert.deepEqual(matchPrograms(ps, 50).rahat.map((p) => p.kod), ["1", "5", "4", "3", "2"]);
  assert.deepEqual(matchPrograms(ps, 900, { uniTur: "Vakıf" }).sinirda.map((p) => p.kod), ["3"]);
  assert.deepEqual(matchPrograms(ps, 900, { query: "muhendisligi baska" }).sinirda.map((p) => p.kod), ["3"]);
  assert.deepEqual(matchPrograms(ps, 900, { query: "yok böyle" }).sinirda, []);
  const odtu = [P("9", "Bilgisayar Mühendisliği", 900, "Orta Doğu Teknik Üniversitesi"), P("8", "Bilgisayar Mühendisliği", 900)];
  assert.deepEqual(matchPrograms(odtu, 900, { query: "bilgisayar ODTÜ" }).sinirda.map((p) => p.kod), ["9"]);
});

for (const tur of TURLER) {
  const file = { SAY: "say", EA: "ea", SÖZ: "soz", DİL: "dil" }[tur];
  test(`veri ${tur}: şema, sıralama ve puan/sıra tutarlılığı`, () => {
    const raw = JSON.parse(readFileSync(new URL(`./bolum-data/${file}.json`, import.meta.url), "utf8"));
    assert.equal(raw.meta.tur, tur);
    assert.equal(raw.meta.yil, 2025);
    assert.match(raw.meta.url, /^https:\/\/cdn\.osym\.gov\.tr\//);
    const { programs } = toDataset(raw);
    assert.equal(programs.length, raw.meta.programlar);
    assert.ok(programs.length > 400);
    const codes = new Set<string>();
    let prev = 0;
    for (const p of programs) {
      assert.match(p.kod, /^\d{9}$/);
      assert.ok(!codes.has(p.kod), `yinelenen kod ${p.kod}`);
      codes.add(p.kod);
      assert.ok(p.sira >= prev, "sıraya göre artan değil");
      prev = p.sira;
      assert.ok(p.uni.length > 5 && !/\d{4}-yks|kılavuz/i.test(p.uni) && !p.uni.startsWith("("), p.uni);
      assert.ok(p.ad.length > 2 && p.ad.length < 130, p.ad);
      assert.ok(["Devlet", "Vakıf"].includes(p.uniTur));
      assert.ok(p.puan > 100 && p.puan <= 560, `${p.kod} puan ${p.puan}`);
      assert.ok(p.sure >= 3 && p.sure <= 6);
    }
    // sıra arttıkça (kötüleştikçe) puan düşer: en iyi %10 ortalaması > en kötü %10 ortalaması
    const n = Math.floor(programs.length / 10);
    const mean = (xs: Program[]) => xs.reduce((s, p) => s + p.puan, 0) / xs.length;
    assert.ok(mean(programs.slice(0, n)) > mean(programs.slice(-n)) + 50);
  });
}

test("veri: bilinen satır (ÖSYM 2026 Kılavuzu Tablo 4, Abdullah Gül Bilgisayar Mühendisliği)", () => {
  const raw = JSON.parse(readFileSync(new URL("./bolum-data/say.json", import.meta.url), "utf8"));
  const p = toDataset(raw).programs.find((x) => x.kod === "106510077");
  assert.ok(p);
  assert.equal(p.sira, 53079);
  assert.equal(p.puan, 442.53227);
  assert.equal(p.uni, "Abdullah Gül Üniversitesi (Kayseri)");
  assert.equal(p.ad, "Bilgisayar Mühendisliği (İngilizce)");
});
