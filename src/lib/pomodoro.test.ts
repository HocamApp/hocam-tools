import assert from "node:assert/strict";
import test from "node:test";

import {
  BREAK_MINUTES_MAX,
  BREAK_MINUTES_MIN,
  FOCUS_MINUTES_MAX,
  FOCUS_MINUTES_MIN,
  computeTodayMinutes,
  computeTotalMinutes,
  derivePresetTimers,
  formatClock,
  formatTotalWorked,
  parseMinutesInput,
  pomodoroCacheKey,
} from "./pomodoro";

test("parseMinutesInput: sınırlar, tam sayılar ve geçersiz girdiler", () => {
  assert.equal(parseMinutesInput("25", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), 25);
  assert.equal(parseMinutesInput("  180  ", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), 180);
  assert.equal(parseMinutesInput("0", BREAK_MINUTES_MIN, BREAK_MINUTES_MAX), 0);
  assert.equal(parseMinutesInput("0", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), null);
  assert.equal(parseMinutesInput("181", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), null);
  assert.equal(parseMinutesInput("25.5", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), null);
  assert.equal(parseMinutesInput("25,5", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), null);
  assert.equal(parseMinutesInput("-5", BREAK_MINUTES_MIN, BREAK_MINUTES_MAX), null);
  assert.equal(parseMinutesInput("", FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX), null);
});

test("formatClock: MM:SS biçimi ve sınırlar", () => {
  assert.equal(formatClock(1500), "25:00");
  assert.equal(formatClock(65), "01:05");
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(-10), "00:00");
  assert.equal(formatClock(180 * 60), "180:00");
});

test("computeTotalMinutes ve formatTotalWorked: toplam dakika ve Türkçe saat biçimi", () => {
  const total = computeTotalMinutes([
    { focusMinutes: 25 },
    { focusMinutes: 40 },
    { focusMinutes: 50 },
  ]);
  assert.equal(total, 115);

  const zero = formatTotalWorked(0);
  assert.equal(zero.totalHoursDecimal, "0 saat");
  assert.equal(zero.humanReadable, "0 dk");

  const ninety = formatTotalWorked(90);
  assert.equal(ninety.totalHoursDecimal, "1,5 saat");
  assert.equal(ninety.wholeHours, 1);
  assert.equal(ninety.remainingMinutes, 30);
  assert.equal(ninety.humanReadable, "1 saat 30 dk");

  const exact = formatTotalWorked(120);
  assert.equal(exact.totalHoursDecimal, "2 saat");
  assert.equal(exact.humanReadable, "2 saat");
});

test("computeTodayMinutes: İstanbul gününe göre bugünkü toplamı hesaplar", () => {
  const nowMs = Date.parse("2026-11-15T12:00:00+03:00");
  const todayMinutes = computeTodayMinutes(
    [
      {
        id: "1",
        label: "Matematik",
        focusMinutes: 40,
        breakMinutes: 10,
        completedAt: "2026-11-15T08:00:00+03:00",
      },
      {
        id: "2",
        label: "Gece tekrar",
        focusMinutes: 25,
        breakMinutes: 5,
        completedAt: "2026-11-14T22:00:00Z", // 2026-11-15 01:00 Istanbul
      },
      {
        id: "3",
        label: "Dün",
        focusMinutes: 50,
        breakMinutes: 10,
        completedAt: "2026-11-14T20:00:00Z", // 2026-11-14 23:00 Istanbul
      },
    ],
    nowMs,
  );
  assert.equal(todayMinutes, 65);
});

test("derivePresetTimers: sırayı korur, tekrarları eler ve sınırı uygular", () => {
  const presets = derivePresetTimers([
    {
      id: "1",
      label: " AYT Fizik ",
      focusMinutes: 45,
      breakMinutes: 10,
      completedAt: "2026-11-15T12:00:00+03:00",
    },
    {
      id: "2",
      label: "AYT Fizik",
      focusMinutes: 45,
      breakMinutes: 10,
      completedAt: "2026-11-15T11:00:00+03:00",
    },
    {
      id: "3",
      label: "Paragraf",
      focusMinutes: 25,
      breakMinutes: 5,
      completedAt: "2026-11-15T10:00:00+03:00",
    },
  ]);

  assert.deepEqual(presets, [
    { label: "AYT Fizik", focusMinutes: 45, breakMinutes: 10 },
    { label: "Paragraf", focusMinutes: 25, breakMinutes: 5 },
  ]);
  assert.equal(pomodoroCacheKey("abc-123"), "hocam:pomodoro:v1:abc-123");
});
