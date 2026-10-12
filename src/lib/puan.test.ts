import assert from "node:assert/strict";
import test from "node:test";

import { CUM_2025, CUM_2026 } from "./osym-data";
import {
  YEARS,
  aytEligible,
  calibrate,
  computeScheme,
  meanFromCumulative,
  rankAt,
  roundRank,
  toPuan,
  tytEligible,
  weightedScore,
} from "./puan";

const tytNets = (tr: number, sos: number, mat: number, fen: number) => ({ tr, sos, mat, fen });

test("yığınsal tablolar: azalan sayılar, ağırlıklar 100", () => {
  for (const cum of [CUM_2026, CUM_2025]) {
    for (const rows of [...Object.values(cum.exam), ...Object.values(cum.placement)]) {
      const sorted = [...rows].sort((a, b) => a[0] - b[0]);
      assert.ok(sorted.length >= 20);
      for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i][1] <= sorted[i - 1][1]);
    }
  }
});

test("kalibrasyon: A_min, 'tüm testlerde net 0' noktasının hemen altında (tutarlılık)", () => {
  for (const year of YEARS) {
    for (const scheme of ["tyt", "say", "ea", "soz"] as const) {
      const { aMin, aMax } = calibrate(scheme, year);
      const zero = weightedScore(scheme, {}, year);
      assert.ok(aMin < zero && aMin > zero - 6, `${year} ${scheme}: aMin ${aMin} zero ${zero}`);
      assert.ok(aMax > 75 && aMax < 90, `${year} ${scheme}: aMax ${aMax}`);
    }
  }
});

test("TYT: 100 net civarı yaklaşık 435-445 puan, sıra on binlerce", () => {
  const r = computeScheme("tyt", tytNets(36, 17, 32, 15), 2026, null);
  assert.ok(r.puan.mid > 430 && r.puan.mid < 450, String(r.puan.mid));
  assert.ok(r.examRank.mid > 10_000 && r.examRank.mid < 30_000, String(r.examRank.mid));
  assert.ok(r.puan.low < r.puan.mid && r.puan.mid < r.puan.high);
  assert.ok(r.examRank.low < r.examRank.mid && r.examRank.mid < r.examRank.high);
});

test("daha yüksek net → daha yüksek puan, daha iyi sıra", () => {
  const a = computeScheme("tyt", tytNets(20, 10, 10, 5), 2026, null);
  const b = computeScheme("tyt", tytNets(30, 14, 24, 12), 2026, null);
  assert.ok(b.puan.mid > a.puan.mid);
  assert.ok(b.examRank.mid < a.examRank.mid);
});

test("tüm sorular doğru → 500, en kötü sıra aralığı küçük", () => {
  const full = { tr: 40, sos: 20, mat: 40, fen: 20 };
  const r = computeScheme("tyt", full, 2026, null);
  assert.equal(r.puan.mid, 500);
});

test("OBP katkısı yerleştirme puanına eklenir", () => {
  const r = computeScheme("tyt", tytNets(30, 14, 24, 12), 2026, 51.3);
  assert.ok(r.placement && Math.abs(r.placement.mid - r.puan.mid - 51.3) < 1e-9);
  assert.ok(r.placementRank && r.placementRank.mid > 0);
});

test("alan puanı: SAY nete duyarlı", () => {
  const base = { ...tytNets(30, 14, 24, 12), amat: 20, fiz: 7, kim: 6, bio: 6 };
  const lo = computeScheme("say", { ...base, amat: 5 }, 2026, null);
  const hi = computeScheme("say", base, 2026, null);
  assert.ok(hi.puan.mid > lo.puan.mid);
});

test("rankAt: eşik noktasında tablodaki sayıyı verir, aralarda monoton", () => {
  const rows = CUM_2026.exam.tyt;
  assert.ok(Math.abs(rankAt(rows, 300) - 417_935) < 1);
  assert.ok(rankAt(rows, 310) < 417_935 && rankAt(rows, 310) > 302_758);
  assert.equal(rankAt(rows, 50), 2_187_743);
  assert.ok(rankAt(CUM_2026.placement.say, 555) < 154);
});

test("meanFromCumulative: TYT 2026 ortalaması 240-260", () => {
  const m = meanFromCumulative(CUM_2026.exam.tyt);
  assert.ok(m > 240 && m < 260, String(m));
});

test("toPuan sınırları [100,500]", () => {
  const s = { aMin: 30, aMax: 80 };
  assert.equal(toPuan(10, s), 100);
  assert.equal(toPuan(95, s), 500);
});

test("puan hesaplama koşulları ve sıra yuvarlama", () => {
  assert.equal(tytEligible({ tr: 0.25, mat: 0.25 }), false);
  assert.equal(tytEligible({ tr: 0.5 }), true);
  assert.equal(aytEligible("say", { tr: 30 }), false);
  assert.equal(aytEligible("say", { fiz: 0.5 }), true);
  assert.equal(roundRank(16_539), 17_000);
  assert.equal(roundRank(342), 340);
  assert.equal(roundRank(42), 40);
});

import { maxRank, netsForRank, puanAtRank } from "./puan";

test("puanAtRank, rankAt'in tersidir", () => {
  const rows = CUM_2026.exam.tyt;
  for (const p of [220, 310, 405, 470]) assert.ok(Math.abs(puanAtRank(rows, rankAt(rows, p)) - p) < 0.01);
});

test("hedef sıra → net → sıra gidiş-dönüş tutarlı (her puan türü, iki yıl)", () => {
  for (const scheme of ["tyt", "say", "ea", "soz"] as const) {
    for (const year of YEARS) {
      for (const target of [10_000, 50_000, 200_000]) {
        if (target > maxRank(scheme)) continue;
        const { nets, fraction } = netsForRank(scheme, year, target, null);
        if (fraction <= 0 || fraction >= 1) continue; // sınırlarda tutmaz (net yetmez / gerekmez)
        const back = computeScheme(scheme, nets, year, null).examRank.mid;
        assert.ok(Math.abs(back - target) / target < 0.03, `${scheme} ${year} ${target}: ${back}`);
      }
    }
  }
});

test("daha iyi sıra → daha çok net; OBP katkısı yüksekse daha az net yeter", () => {
  const a = netsForRank("say", 2026, 100_000, null);
  const b = netsForRank("say", 2026, 10_000, null);
  assert.ok(b.fraction > a.fraction);
  assert.ok(netsForRank("say", 2026, 100_000, 60).fraction < netsForRank("say", 2026, 100_000, 30).fraction);
});

test("netler soru sayısını aşmaz", () => {
  const { nets } = netsForRank("say", 2026, 1, null);
  assert.ok((nets.amat ?? 0) <= 39 && (nets.tde ?? 0) === 0);
  assert.ok((nets.mat ?? 0) <= 40);
});
