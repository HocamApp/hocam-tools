import assert from "node:assert/strict";
import test from "node:test";

import {
  EXAM_SCHEDULES,
  computeCountdown,
  formatTrDecimal,
  parsePositiveInt,
  planConceptsUntilExam,
} from "./countdown";

test("EXAM_SCHEDULES resmî 2027 YKS ve LGS tarihlerini içerir", () => {
  assert.equal(EXAM_SCHEDULES.yks.primaryTargetIso, "2027-06-19T10:15:00+03:00");
  assert.equal(EXAM_SCHEDULES.yks.sessions.length, 3);
  assert.equal(EXAM_SCHEDULES.lgs.primaryTargetIso, "2027-06-13T09:30:00+03:00");
  assert.equal(EXAM_SCHEDULES.lgs.sessions.length, 2);
});

test("computeCountdown: gelecekteki tarih, tam hafta ve geçmiş tarih", () => {
  // 14 gün 2 saat 30 dakika 15 saniye kala
  const targetIso = "2027-06-19T10:15:00+03:00";
  const nowMs = Date.parse("2027-06-05T07:44:45+03:00");
  const breakdown = computeCountdown(nowMs, targetIso);

  assert.equal(breakdown.isPast, false);
  assert.equal(breakdown.days, 14);
  assert.equal(breakdown.hours, 2);
  assert.equal(breakdown.minutes, 30);
  assert.equal(breakdown.seconds, 15);
  assert.equal(breakdown.fullWeeks, 2);
  assert.equal(breakdown.remainingDaysAfterWeeks, 0);
  assert.ok(breakdown.weekendsLeft >= 2);

  const past = computeCountdown(Date.parse("2027-06-19T10:15:00+03:00"), targetIso);
  assert.equal(past.isPast, true);
  assert.equal(past.days, 0);
  assert.equal(past.totalSeconds, 0);
  assert.equal(past.weekendsLeft, 0);
});

test("parsePositiveInt: geçerli tam sayılar ve hatalı girdiler", () => {
  assert.equal(parsePositiveInt("18", 1, 300), 18);
  assert.equal(parsePositiveInt(" 1 ", 1, 300), 1);
  assert.equal(parsePositiveInt("0", 1, 300), null);
  assert.equal(parsePositiveInt("301", 1, 300), null);
  assert.equal(parsePositiveInt("12.5", 1, 300), null);
  assert.equal(parsePositiveInt("", 1, 300), null);
});

test("planConceptsUntilExam: doğrudan kalan gün üzerinden rahat, dengeli, yoğun ve kısa süre planı", () => {
  const fixedNow = Date.parse("2026-11-15T10:00:00+03:00");

  const rahat = planConceptsUntilExam({
    exam: "yks",
    conceptsLeft: 20,
    daysLeft: 210,
    studyDaysPerWeek: 6,
    nowMs: fixedNow,
  });
  assert.equal(rahat.daysLeft, 210);
  assert.equal(rahat.activeStudyDays, 180);
  assert.equal(rahat.hoursPerConcept, 4);
  assert.equal(rahat.paceLevel, "rahat");
  assert.equal(rahat.phases.length, 3);
  assert.deepEqual(
    rahat.phases.map((p) => p.durationDays),
    [189, 14, 7],
  );
  assert.ok(rahat.dailyPomodoros25 >= 1);

  const dengeli = planConceptsUntilExam({
    exam: "yks",
    conceptsLeft: 30,
    daysLeft: 70,
    studyDaysPerWeek: 7,
    nowMs: fixedNow,
  });
  assert.equal(dengeli.conceptsPerWeek, 3);
  assert.equal(dengeli.paceLevel, "dengeli");
  assert.deepEqual(
    dengeli.phases.map((p) => p.durationDays),
    [49, 14, 7],
  );

  const yogun = planConceptsUntilExam({
    exam: "lgs",
    conceptsLeft: 20,
    daysLeft: 20,
    studyDaysPerWeek: 6,
    nowMs: fixedNow,
  });
  assert.equal(yogun.hoursPerConcept, 3);
  assert.equal(yogun.paceLevel, "yogun");
  assert.equal(yogun.phases.length, 2);
  assert.deepEqual(
    yogun.phases.map((p) => p.durationDays),
    [13, 7],
  );

  const fiveDays = planConceptsUntilExam({
    exam: "yks",
    conceptsLeft: 5,
    daysLeft: 5,
    studyDaysPerWeek: 5,
    nowMs: fixedNow,
  });
  assert.equal(fiveDays.daysLeft, 5);
  assert.equal(fiveDays.phases.length, 1);
  assert.equal(fiveDays.phases[0].durationDays, 5);

  const oneDay = planConceptsUntilExam({
    exam: "lgs",
    conceptsLeft: 2,
    daysLeft: 0,
    studyDaysPerWeek: 7,
    nowMs: fixedNow,
  });
  assert.equal(oneDay.daysLeft, 1);
  assert.equal(oneDay.activeStudyDays, 1);
  assert.equal(oneDay.phases.length, 1);
  assert.equal(formatTrDecimal(2.34), "2,3");
});
