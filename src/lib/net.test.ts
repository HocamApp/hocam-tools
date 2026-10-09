import assert from "node:assert/strict";
import test from "node:test";

import {
  AYT_FIELDS,
  TYT_SECTIONS,
  computeNet,
  formatNet,
  net,
  parseCount,
  weakestSection,
} from "./net";

const total = (sections: { questions: number }[]) =>
  sections.reduce((s, x) => s + x.questions, 0);

test("test soru toplamları ÖSYM dağılımıyla uyuşur", () => {
  assert.equal(total(TYT_SECTIONS), 120);
  for (const field of Object.values(AYT_FIELDS)) {
    assert.equal(total(field.sections), 80, field.label);
  }
});

test("net = doğru - yanlış/4", () => {
  assert.equal(net(30, 8), 28);
  assert.equal(net(0, 4), -1);
  assert.equal(net(10, 3), 9.25);
});

test("parseCount: boş 0, rakam kabul, gerisi null", () => {
  assert.equal(parseCount(""), 0);
  assert.equal(parseCount(" 12 "), 12);
  for (const bad of ["-1", "1.5", "1,5", "abc", "1000"]) {
    assert.equal(parseCount(bad), null, bad);
  }
});

test("computeNet: toplam, boş sayısı ve hatalı bölüm", () => {
  const ok = computeNet(TYT_SECTIONS, {
    turkce: { correct: "30", wrong: "8" },
    matematik: { correct: "20", wrong: "4" },
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.total, 28 + 19);
  assert.equal(ok.rows[0].empty, 2);
  // Girilmeyen bölüm 0 doğru / 0 yanlış sayılır, toplamı etkilemez.
  assert.equal(ok.rows.length, TYT_SECTIONS.length);

  const bad = computeNet(TYT_SECTIONS, {
    sosyal: { correct: "15", wrong: "6" },
    fen: { correct: "x", wrong: "" },
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.sosyal, "over");
  assert.equal(bad.errors.fen, "invalid");
});

test("weakestSection oran üzerinden seçer", () => {
  const r = computeNet(TYT_SECTIONS, {
    turkce: { correct: "30", wrong: "0" }, // 30/40 = 0.75
    sosyal: { correct: "5", wrong: "0" }, // 5/20 = 0.25
    matematik: { correct: "20", wrong: "0" }, // 0.5
    fen: { correct: "10", wrong: "0" }, // 0.5
  });
  assert.equal(weakestSection(r.rows)?.section.id, "sosyal");
});

test("formatNet Türkçe ondalık virgül kullanır", () => {
  assert.equal(formatNet(37.25), "37,25");
  assert.equal(formatNet(28), "28,00");
  assert.equal(formatNet(-1), "-1,00");
});
