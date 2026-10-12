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
