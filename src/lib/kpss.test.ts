import assert from "node:assert/strict";
import test from "node:test";

import { KPSS_TYPES, kpssEligible, kpssPuan } from "./kpss";

const P3 = KPSS_TYPES[2];

test("ağırlıklar 1'e toplanır", () => {
  for (const t of KPSS_TYPES) assert.ok(Math.abs(t.wGy + t.wGk - 1) < 1e-12);
});

test("tüm sorular doğru → 100", () => {
  assert.ok(Math.abs(kpssPuan(P3, 60, 60) - 100) < 1e-9);
});

test("ASP = X + S/2 noktasında puan 70 (resmî formülün tanımı)", () => {
  // P3: ASP = 54,74 ⇒ GY ve GK netleri 24,6 civarı (resmî ort/SS ile).
  const p = kpssPuan(P3, 24.6, 24.6);
  assert.ok(Math.abs(p - 70) < 0.5, String(p));
});

test("monoton: net arttıkça puan artar; GY ağırlığı P1'de daha yüksek", () => {
  assert.ok(kpssPuan(P3, 40, 40) > kpssPuan(P3, 30, 30));
  assert.ok(kpssPuan(P3, 40, 40) > 70);
  // GY güçlü, GK zayıf aday P1'de P2'den, P2'de P3'ten yüksek puan alır.
  const [p1, p2, p3] = KPSS_TYPES.map((t) => kpssPuan(t, 50, 20));
  assert.ok(p1 > p2 && p2 > p3);
});

test("puan hesaplama koşulu: her testte en az 1 net", () => {
  assert.equal(kpssEligible(0.75, 30), false);
  assert.equal(kpssEligible(1, 1), true);
});
