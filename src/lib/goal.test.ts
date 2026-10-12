import assert from "node:assert/strict";
import test from "node:test";

import { biggestGap, computeGoal, parseNetValue } from "./goal";
import { TYT_SECTIONS } from "./net";

test("parseNetValue: boş null, virgül/nokta kabul, gerisi NaN", () => {
  assert.equal(parseNetValue(""), null);
  assert.equal(parseNetValue("28,5"), 28.5);
  assert.equal(parseNetValue("28.25"), 28.25);
  for (const bad of ["-1", "abc", "1,555", "1000"]) assert.ok(Number.isNaN(parseNetValue(bad)!), bad);
});

test("computeGoal: açık, toplamlar, hedefsiz bölüm plana girmez", () => {
  const r = computeGoal(TYT_SECTIONS, {
    turkce: { current: "25", target: "32" },
    matematik: { current: "10,5", target: "20" },
    fen: { current: "12", target: "" }, // hedef yok → atlanır
  });
  assert.equal(r.ok, true);
  assert.equal(r.rows.length, 2);
  assert.equal(r.totalGap, 7 + 9.5);
  assert.equal(r.totalCurrent, 35.5);
  assert.equal(r.totalTarget, 52);
  assert.equal(biggestGap(r.rows)?.section.id, "matematik");
});

test("hedef mevcuttan düşükse açık 0, en büyük açık null", () => {
  const r = computeGoal(TYT_SECTIONS, { turkce: { current: "35", target: "30" } });
  assert.equal(r.rows[0].gap, 0);
  assert.equal(biggestGap(r.rows), null);
});

test("hatalar: geçersiz ve soru sayısını aşan", () => {
  const r = computeGoal(TYT_SECTIONS, {
    turkce: { current: "x", target: "30" },
    sosyal: { current: "5", target: "21" },
  });
  assert.equal(r.ok, false);
  assert.equal(r.errors.turkce, "invalid");
  assert.equal(r.errors.sosyal, "over");
});
