export type PomodoroMode = "focus" | "break";

export type PomodoroPreset = {
  label: string;
  focusMinutes: number;
  breakMinutes: number;
};

export type PomodoroSessionRecord = {
  id: string;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
  completedAt: string;
};

export type PomodoroSummary = {
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
  presetTimers: PomodoroPreset[];
  sessions: PomodoroSessionRecord[];
};

export const FOCUS_MINUTES_MIN = 1;
export const FOCUS_MINUTES_MAX = 180;
export const BREAK_MINUTES_MIN = 0;
export const BREAK_MINUTES_MAX = 60;

export const DEFAULT_POMODORO_PRESETS: readonly PomodoroPreset[] = [
  { label: "Klasik Pomodoro", focusMinutes: 25, breakMinutes: 5 },
  { label: "Ders temposu", focusMinutes: 40, breakMinutes: 10 },
  { label: "Derin odak bloku", focusMinutes: 50, breakMinutes: 10 },
];

export function pomodoroCacheKey(userId: string): string {
  return `hocam:pomodoro:v1:${userId}`;
}

export function parseMinutesInput(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < min || value > max) return null;
  return value;
}

export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "00:00";
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function computeTotalMinutes(
  sessions: readonly Pick<PomodoroSessionRecord, "focusMinutes">[],
): number {
  return sessions.reduce((sum, item) => sum + Math.max(0, Math.round(item.focusMinutes)), 0);
}

const ISTANBUL_DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function istanbulDayKey(dateOrMs: Date | number): string {
  const date = typeof dateOrMs === "number" ? new Date(dateOrMs) : dateOrMs;
  return ISTANBUL_DAY_FORMATTER.format(date);
}

export function computeTodayMinutes(
  sessions: readonly PomodoroSessionRecord[],
  nowMs: number = Date.now(),
): number {
  const todayKey = istanbulDayKey(nowMs);
  return sessions.reduce((sum, item) => {
    const parsed = Date.parse(item.completedAt);
    if (Number.isNaN(parsed)) return sum;
    if (istanbulDayKey(parsed) !== todayKey) return sum;
    return sum + Math.max(0, Math.round(item.focusMinutes));
  }, 0);
}

export function formatTotalWorked(totalMinutes: number): {
  totalMinutes: number;
  totalHoursDecimal: string;
  wholeHours: number;
  remainingMinutes: number;
  humanReadable: string;
} {
  const safe = Number.isFinite(totalMinutes) ? Math.max(0, Math.round(totalMinutes)) : 0;
  const wholeHours = Math.floor(safe / 60);
  const remainingMinutes = safe % 60;
  const hours = safe / 60;
  const roundedTenths = Math.round(hours * 10) / 10;
  const hasFraction = Math.abs(roundedTenths - Math.round(roundedTenths)) > 0.001;
  const totalHoursDecimal = `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(roundedTenths)} saat`;

  let humanReadable: string;
  if (wholeHours === 0) {
    humanReadable = `${remainingMinutes} dk`;
  } else if (remainingMinutes === 0) {
    humanReadable = `${wholeHours} saat`;
  } else {
    humanReadable = `${wholeHours} saat ${remainingMinutes} dk`;
  }

  return {
    totalMinutes: safe,
    totalHoursDecimal,
    wholeHours,
    remainingMinutes,
    humanReadable,
  };
}

export function derivePresetTimers(
  sessions: readonly PomodoroSessionRecord[],
  maxCount = 6,
): PomodoroPreset[] {
  const presets: PomodoroPreset[] = [];
  const seen = new Set<string>();
  for (const session of sessions) {
    const label = session.label.trim();
    const key = `${label}\u0000${session.focusMinutes}\u0000${session.breakMinutes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    presets.push({
      label,
      focusMinutes: session.focusMinutes,
      breakMinutes: session.breakMinutes,
    });
    if (presets.length >= maxCount) break;
  }
  return presets;
}
