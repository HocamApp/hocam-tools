import assert from "node:assert/strict";
import test from "node:test";

import { computeObp, formatScore, parseDiploma } from "./obp";

test("parseDiploma: aralık ve biçim", () => {
  assert.equal(parseDiploma("85"), 85);
  assert.equal(parseDiploma("85,5"), 85.5);
  assert.equal(parseDiploma("85.25"), 85.25);
  for (const bad of ["", "49.99", "100.01", "abc", "85,555", "-80"]) {
    assert.equal(parseDiploma(bad), null, bad);
  }
});

test("uç değerler: 50 → 250 / 30, 100 → 500 / 60", () => {
  assert.deepEqual(computeObp(50, false), { obp: 250, contribution: 30 });
  assert.deepEqual(computeObp(100, false), { obp: 500, contribution: 60 });
});

test("kırık OBP katkıyı yarıya indirir", () => {
  assert.equal(computeObp(100, true).contribution, 30);
  assert.equal(computeObp(80, true).contribution, 24);
});

test("formatScore Türkçe ondalık", () => {
  assert.equal(formatScore(computeObp(85.5, false).contribution), "51,30");
});
