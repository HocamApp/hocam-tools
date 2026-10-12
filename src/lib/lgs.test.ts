import assert from "node:assert/strict";
import test from "node:test";

import { LGS_CURVE, lgsRank, parseLgsPuan } from "./lgs";
import { LGS_2025_FULL_SCORE, LGS_2025_TAKERS, LGS_PAIRS } from "./lgs-data";

test("veri: puan >= 280 ve yüzdelik <= 40, yeterli nokta", () => {
  assert.ok(LGS_PAIRS.length > 80);
  for (const [p, y] of LGS_PAIRS) assert.ok(p >= 280 && p <= 500 && y > 0 && y <= 40);
});

test("eğri puan arttıkça yüzdelik azalır", () => {
  for (let i = 1; i < LGS_CURVE.length; i++) {
    assert.ok(LGS_CURVE[i][0] > LGS_CURVE[i - 1][0]);
    assert.ok(LGS_CURVE[i][1] <= LGS_CURVE[i - 1][1]);
  }
});

test("500 puan: 719 öğrenci → yaklaşık sıra 719", () => {
  const r = lgsRank(500);
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(Math.abs(r.percentile - (LGS_2025_FULL_SCORE / LGS_2025_TAKERS) * 100) < 1e-9);
    assert.ok(Math.abs(r.rank - LGS_2025_FULL_SCORE) < 1);
  }
});

test("bilinen noktalar: 494,5 ≈ %0,1; 400 ≈ %10-11; 350 ≈ %19-20", () => {
  const near = (puan: number, lo: number, hi: number) => {
    const r = lgsRank(puan);
    assert.ok(r.ok);
    if (r.ok) assert.ok(r.percentile >= lo && r.percentile <= hi, `${puan}: ${r.percentile}`);
  };
  near(494.5, 0.05, 0.3);
  near(400, 9.5, 11.5);
  near(350, 18.5, 21);
});

test("destek aralığı altı ve geçersiz girdi", () => {
  assert.deepEqual(lgsRank(200), { ok: false, reason: "below-range" });
  assert.equal(parseLgsPuan("432,5"), 432.5);
  for (const bad of ["", "abc", "501", "99", "-4"]) assert.equal(parseLgsPuan(bad), null, bad);
});

import { LGS_SUBJECTS, lgsPuanFromNets, normInv, type LgsAnswer } from "./lgs";

const answers = (fn: (q: number) => LgsAnswer) =>
  Object.fromEntries(LGS_SUBJECTS.map((s) => [s.id, fn(s.questions)])) as Record<(typeof LGS_SUBJECTS)[number]["id"], LgsAnswer>;

test("normInv bilinen değerler", () => {
  assert.ok(Math.abs(normInv(0.5)) < 1e-9);
  assert.ok(Math.abs(normInv(0.975) - 1.959964) < 1e-5);
  assert.ok(Math.abs(normInv(0.01) + 2.326348) < 1e-5);
});

test("tüm sorular doğru → 500; hiç doğru yok → 100'e yakın ve düşük", () => {
  assert.equal(lgsPuanFromNets(answers((q) => ({ correct: q, wrong: 0 }))), 500);
  assert.ok(lgsPuanFromNets(answers(() => ({ correct: 0, wrong: 0 }))) < 200);
});

test("net arttıkça puan artar; boş bırakmak yanlıştan iyidir", () => {
  const half = answers((q) => ({ correct: Math.round(q / 2), wrong: 0 }));
  const less = answers((q) => ({ correct: Math.round(q / 4), wrong: 0 }));
  assert.ok(lgsPuanFromNets(half) > lgsPuanFromNets(less));
  const blank = answers((q) => ({ correct: Math.round(q / 2), wrong: 0 }));
  const wrong = answers((q) => ({ correct: Math.round(q / 2), wrong: q - Math.round(q / 2) }));
  assert.ok(lgsPuanFromNets(blank) > lgsPuanFromNets(wrong));
});

test("kontrol: eşit dağılımlı 50/60/70 net, üçüncü taraf tablosuna (357/393/429) 15 puan içinde", () => {
  const equal = (total: number) =>
    answers((q) => ({ correct: (q * total) / 90, wrong: 0 })); // net = doğru; kesirli doğru yalnızca test içindir
  for (const [total, expected] of [[50, 357], [60, 393], [70, 429]] as const) {
    const p = lgsPuanFromNets(equal(total));
    assert.ok(Math.abs(p - expected) < 15, `${total} net: ${p} (beklenen ~${expected})`);
  }
});
