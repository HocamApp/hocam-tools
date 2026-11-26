"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  BREAK_MINUTES_MAX,
  BREAK_MINUTES_MIN,
  DEFAULT_POMODORO_PRESETS,
  FOCUS_MINUTES_MAX,
  FOCUS_MINUTES_MIN,
  type PomodoroMode,
  type PomodoroPreset,
  type PomodoroSessionRecord,
  type PomodoroSummary,
  computeTodayMinutes,
  computeTotalMinutes,
  derivePresetTimers,
  formatClock,
  formatTotalWorked,
  parseMinutesInput,
  pomodoroCacheKey,
} from "@/lib/pomodoro";
import { mainUrl } from "@/lib/site";
import { btnPrimary, btnSecondary, inputCls, labelCls, resultAsideCls } from "@/lib/ui";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://web-production-22415.up.railway.app/api"
    : "http://localhost:8000/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
const AUTH_COOKIE_MODE = process.env.NEXT_PUBLIC_AUTH_MODE === "cookie";

type AuthUser = {
  id: string;
  email: string;
};

type ApiSummary = {
  total_minutes: number;
  total_hours: number;
  session_count: number;
  preset_timers: Array<{ label: string; focus_minutes: number; break_minutes: number }>;
  sessions: Array<{
    id: string;
    label: string;
    focus_minutes: number;
    break_minutes: number;
    completed_at: string;
  }>;
};

type FormErrors = {
  focus?: string;
  breakTime?: string;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length));
      } catch {
        return trimmed.slice(prefix.length);
      }
    }
  }
  return null;
}

function readCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("auth_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.id === "string" && typeof parsed.email === "string") {
      return { id: parsed.id, email: parsed.email };
    }
  } catch {
    return null;
  }
  return null;
}

function authHeaders(): HeadersInit {
  const token = AUTH_COOKIE_MODE ? null : readCookie("auth_token");
  return token ? { Authorization: `Token ${token}` } : {};
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { csrf_token?: string };
    return typeof data.csrf_token === "string" ? data.csrf_token : null;
  } catch {
    return null;
  }
}

function normalizeSummary(data: ApiSummary): PomodoroSummary {
  const sessions: PomodoroSessionRecord[] = (data.sessions ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    focusMinutes: s.focus_minutes,
    breakMinutes: s.break_minutes,
    completedAt: s.completed_at,
  }));
  const presetTimers: PomodoroPreset[] = (data.preset_timers ?? []).map((p) => ({
    label: p.label,
    focusMinutes: p.focus_minutes,
    breakMinutes: p.break_minutes,
  }));
  return {
    totalMinutes: data.total_minutes ?? computeTotalMinutes(sessions),
    totalHours: data.total_hours ?? Math.round((computeTotalMinutes(sessions) / 60) * 100) / 100,
    sessionCount: data.session_count ?? sessions.length,
    presetTimers: presetTimers.length > 0 ? presetTimers : derivePresetTimers(sessions),
    sessions,
  };
}

function readCachedSummary(userId: string): PomodoroSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(pomodoroCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PomodoroSummary>;
    if (!Array.isArray(parsed.sessions)) return null;
    const totalMinutes =
      typeof parsed.totalMinutes === "number"
        ? parsed.totalMinutes
        : computeTotalMinutes(parsed.sessions);
    return {
      totalMinutes,
      totalHours:
        typeof parsed.totalHours === "number"
          ? parsed.totalHours
          : Math.round((totalMinutes / 60) * 100) / 100,
      sessionCount:
        typeof parsed.sessionCount === "number" ? parsed.sessionCount : parsed.sessions.length,
      presetTimers: Array.isArray(parsed.presetTimers)
        ? parsed.presetTimers
        : derivePresetTimers(parsed.sessions),
      sessions: parsed.sessions,
    };
  } catch {
    return null;
  }
}

function writeCachedSummary(userId: string, summary: PomodoroSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(pomodoroCacheKey(userId), JSON.stringify(summary));
  } catch {
    // Depolama kotası dolarsa sessizce devam et.
  }
}

function playGentleChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.46);
    });
  } catch {
    // Tarayıcı ses izni yoksa sessiz kal.
  }
}

function formatCompletedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export function PomodoroTool() {
  const baseId = useId();
  const focusErrId = `${baseId}-focus-err`;
  const breakErrId = `${baseId}-break-err`;
  const timerRegionRef = useRef<HTMLDivElement>(null);
  const originalTitleRef = useRef<string>("");
  const endAtMsRef = useRef<number | null>(null);

  const [labelInput, setLabelInput] = useState("TYT Matematik");
  const [focusInput, setFocusInput] = useState("25");
  const [breakInput, setBreakInput] = useState("5");
  const [activeLabel, setActiveLabel] = useState("TYT Matematik");
  const [activeFocusMinutes, setActiveFocusMinutes] = useState(25);
  const [activeBreakMinutes, setActiveBreakMinutes] = useState(5);

  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const secondsLeftRef = useRef(secondsLeft);
  secondsLeftRef.current = secondsLeft;
  const [isRunning, setIsRunning] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState<PomodoroSessionRecord[]>([]);
  const [presetTimers, setPresetTimers] = useState<PomodoroPreset[]>([]);
  const [totalMinutesOverride, setTotalMinutesOverride] = useState<number | null>(null);
  const [sessionCountOverride, setSessionCountOverride] = useState<number | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const loadAccountHistory = useCallback(async () => {
    const cachedUser = readCachedUser();
    const hasCookieToken = Boolean(readCookie("auth_token"));
    if (!cachedUser && !hasCookieToken) {
      setAuthUser(null);
      setAuthChecked(true);
      return;
    }

    if (cachedUser) {
      setAuthUser(cachedUser);
      const localSummary = readCachedSummary(cachedUser.id);
      if (localSummary) {
        setSessions(localSummary.sessions);
        setPresetTimers(localSummary.presetTimers);
        setTotalMinutesOverride(localSummary.totalMinutes);
        setSessionCountOverride(localSummary.sessionCount);
      }
    }

    try {
      const meRes = await fetch(`${API_BASE_URL}/auth/me/`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!meRes.ok) {
        setAuthUser(null);
        setAuthChecked(true);
        return;
      }
      const meData = (await meRes.json()) as { id?: string; email?: string };
      if (typeof meData.id !== "string" || typeof meData.email !== "string") {
        setAuthUser(null);
        setAuthChecked(true);
        return;
      }
      const verifiedUser: AuthUser = { id: meData.id, email: meData.email };
      setAuthUser(verifiedUser);

      const historyRes = await fetch(`${API_BASE_URL}/schedule/pomodoro/`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (historyRes.ok) {
        const summary = normalizeSummary((await historyRes.json()) as ApiSummary);
        setSessions(summary.sessions);
        setPresetTimers(summary.presetTimers);
        setTotalMinutesOverride(summary.totalMinutes);
        setSessionCountOverride(summary.sessionCount);
        writeCachedSummary(verifiedUser.id, summary);
      }
    } catch {
      // Ağ hatasında mevcut önbellekle devam et.
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    originalTitleRef.current = document.title;
    loadAccountHistory();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "auth_user") {
        loadAccountHistory();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [loadAccountHistory]);

  const recordCompletedFocus = useCallback(
    async (completedLabel: string, focusMin: number, breakMin: number) => {
      const cleanLabel = completedLabel.trim();
      const optimisticRecord: PomodoroSessionRecord = {
        id: `local-${Date.now()}`,
        label: cleanLabel,
        focusMinutes: focusMin,
        breakMinutes: breakMin,
        completedAt: new Date().toISOString(),
      };

      setSessions((prev) => {
        const nextSessions = [optimisticRecord, ...prev].slice(0, 50);
        const nextPresets = derivePresetTimers(nextSessions);
        setPresetTimers(nextPresets);
        if (authUser) {
          const nextTotal = (totalMinutesOverride ?? computeTotalMinutes(prev)) + focusMin;
          const nextCount = (sessionCountOverride ?? prev.length) + 1;
          setTotalMinutesOverride(nextTotal);
          setSessionCountOverride(nextCount);
          writeCachedSummary(authUser.id, {
            totalMinutes: nextTotal,
            totalHours: Math.round((nextTotal / 60) * 100) / 100,
            sessionCount: nextCount,
            presetTimers: nextPresets,
            sessions: nextSessions,
          });
        }
        return nextSessions;
      });

      if (!authUser) {
        setStatusMessage(
          `${focusMin} dakikalık odak oturumu tamamlandı. Hesabına giriş yaparsan bu süre kalıcı olarak kaydedilir.`,
        );
        return;
      }

      setSyncNotice(null);
      try {
        const csrfToken = await fetchCsrfToken();
        const res = await fetch(`${API_BASE_URL}/schedule/pomodoro/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          },
          body: JSON.stringify({
            label: cleanLabel,
            focus_minutes: focusMin,
            break_minutes: breakMin,
          }),
        });
        if (!res.ok) {
          setSyncNotice(
            "Oturum cihazında gösteriliyor ama sunucuya kaydedilemedi. Bağlantını kontrol edip sayfayı yenileyebilirsin.",
          );
          return;
        }
        const summary = normalizeSummary((await res.json()) as ApiSummary);
        setSessions(summary.sessions);
        setPresetTimers(summary.presetTimers);
        setTotalMinutesOverride(summary.totalMinutes);
        setSessionCountOverride(summary.sessionCount);
        writeCachedSummary(authUser.id, summary);
        setStatusMessage(`${focusMin} dakikalık odak oturumu hesabına kaydedildi.`);
      } catch {
        setSyncNotice(
          "Oturum bu cihazda tutuldu ama sunucuya ulaşılamadı. İnternet bağlantın geri geldiğinde tekrar dene.",
        );
      }
    },
    [authUser, sessionCountOverride, totalMinutesOverride],
  );

  useEffect(() => {
    if (!isRunning) {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
      return;
    }

    if (endAtMsRef.current === null) {
      endAtMsRef.current = Date.now() + secondsLeftRef.current * 1000;
    }

    const tick = () => {
      const target = endAtMsRef.current;
      if (target === null) return;
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      setSecondsLeft(remaining);
      const modeName = mode === "focus" ? "Odak" : "Mola";
      document.title = `${formatClock(remaining)} · ${modeName} | Hocam`;

      if (remaining <= 0) {
        endAtMsRef.current = null;
        setIsRunning(false);
        playGentleChime();

        if (mode === "focus") {
          void recordCompletedFocus(activeLabel, activeFocusMinutes, activeBreakMinutes);
          if (activeBreakMinutes > 0) {
            setMode("break");
            setSecondsLeft(activeBreakMinutes * 60);
          } else {
            setSecondsLeft(activeFocusMinutes * 60);
          }
        } else {
          setStatusMessage("Mola bitti. Hazırsan yeni odak blokunu başlatabilirsin.");
          setMode("focus");
          setSecondsLeft(activeFocusMinutes * 60);
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [
    isRunning,
    mode,
    activeLabel,
    activeFocusMinutes,
    activeBreakMinutes,
    recordCompletedFocus,
  ]);

  function applyTimerConfig(nextLabel: string, nextFocus: number, nextBreak: number, nextMode: PomodoroMode = "focus") {
    endAtMsRef.current = null;
    setIsRunning(false);
    setErrors({});
    setStatusMessage(null);
    setLabelInput(nextLabel);
    setFocusInput(String(nextFocus));
    setBreakInput(String(nextBreak));
    setActiveLabel(nextLabel.trim());
    setActiveFocusMinutes(nextFocus);
    setActiveBreakMinutes(nextBreak);
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? nextFocus : Math.max(1, nextBreak)) * 60);
    requestAnimationFrame(() => timerRegionRef.current?.focus());
  }

  function handleSetupSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedFocus = parseMinutesInput(focusInput, FOCUS_MINUTES_MIN, FOCUS_MINUTES_MAX);
    const parsedBreak = parseMinutesInput(breakInput, BREAK_MINUTES_MIN, BREAK_MINUTES_MAX);
    const nextErrors: FormErrors = {};
    if (parsedFocus === null) {
      nextErrors.focus = `Odak süresi ${FOCUS_MINUTES_MIN} ile ${FOCUS_MINUTES_MAX} dakika arasında tam sayı olmalı.`;
    }
    if (parsedBreak === null) {
      nextErrors.breakTime = `Mola süresi ${BREAK_MINUTES_MIN} ile ${BREAK_MINUTES_MAX} dakika arasında tam sayı olmalı.`;
    }
    if (nextErrors.focus || nextErrors.breakTime || parsedFocus === null || parsedBreak === null) {
      setErrors(nextErrors);
      return;
    }

    const cleanLabel = labelInput.trim() || "Genel odak";
    applyTimerConfig(cleanLabel, parsedFocus, parsedBreak, "focus");
    setStatusMessage(`${cleanLabel} için ${parsedFocus} dk odak, ${parsedBreak} dk mola sayacı kuruldu.`);
  }

  function handleSwitchMode(nextMode: PomodoroMode) {
    if (nextMode === "break" && activeBreakMinutes === 0) {
      setStatusMessage("Bu sayaçta mola süresi 0 dk ayarlı. Mola için süreyi en az 1 dk yap.");
      return;
    }
    endAtMsRef.current = null;
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? activeFocusMinutes : activeBreakMinutes) * 60);
  }

  function handleToggleRun() {
    if (isRunning) {
      endAtMsRef.current = null;
      setIsRunning(false);
      return;
    }
    const baseSeconds = secondsLeft > 0 ? secondsLeft : (mode === "focus" ? activeFocusMinutes : activeBreakMinutes) * 60;
    endAtMsRef.current = Date.now() + baseSeconds * 1000;
    setStatusMessage(null);
    setIsRunning(true);
  }

  function handleReset() {
    endAtMsRef.current = null;
    setIsRunning(false);
    setSecondsLeft((mode === "focus" ? activeFocusMinutes : activeBreakMinutes) * 60);
    setStatusMessage(null);
  }

  function handleCompleteAndSave() {
    endAtMsRef.current = null;
    setIsRunning(false);
    if (mode !== "focus") {
      setMode("focus");
      setSecondsLeft(activeFocusMinutes * 60);
      return;
    }
    void recordCompletedFocus(activeLabel || "Genel odak", activeFocusMinutes, activeBreakMinutes);
    if (activeBreakMinutes > 0) {
      setMode("break");
      setSecondsLeft(activeBreakMinutes * 60);
    } else {
      setSecondsLeft(activeFocusMinutes * 60);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    const nextSessions = sessions.filter((s) => s.id !== sessionId);
    const nextPresets = derivePresetTimers(nextSessions);
    setSessions(nextSessions);
    setPresetTimers(nextPresets);

    if (authUser) {
      const nextTotal = Math.max(0, (totalMinutesOverride ?? computeTotalMinutes(sessions)) - target.focusMinutes);
      const nextCount = Math.max(0, (sessionCountOverride ?? sessions.length) - 1);
      setTotalMinutesOverride(nextTotal);
      setSessionCountOverride(nextCount);
      writeCachedSummary(authUser.id, {
        totalMinutes: nextTotal,
        totalHours: Math.round((nextTotal / 60) * 100) / 100,
        sessionCount: nextCount,
        presetTimers: nextPresets,
        sessions: nextSessions,
      });

      if (!sessionId.startsWith("local-")) {
        try {
          const csrfToken = await fetchCsrfToken();
          await fetch(`${API_BASE_URL}/schedule/pomodoro/${sessionId}/`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              ...authHeaders(),
              ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            },
          });
        } catch {
          setSyncNotice("Kayıt bu ekrandan kaldırıldı, ancak sunucuyla eşzamanlanamadı.");
        }
      }
    }
  }

  const totalPhaseSeconds = Math.max(1, (mode === "focus" ? activeFocusMinutes : Math.max(1, activeBreakMinutes)) * 60);
  const progressPct = Math.min(100, Math.max(0, Math.round(((totalPhaseSeconds - secondsLeft) / totalPhaseSeconds) * 100)));

  const totalMinutes = totalMinutesOverride ?? computeTotalMinutes(sessions);
  const sessionCount = sessionCountOverride ?? sessions.length;
  const totalWorked = useMemo(() => formatTotalWorked(totalMinutes), [totalMinutes]);
  const todayWorked = useMemo(() => formatTotalWorked(computeTodayMinutes(sessions)), [sessions]);
  const rememberedPresets = useMemo(
    () => (presetTimers.length > 0 ? presetTimers : derivePresetTimers(sessions)),
    [presetTimers, sessions],
  );

  return (
    <div className="space-y-8">
      {authChecked && !authUser && (
        <section
          aria-label="Hesap oturumu bilgisi"
          className="rounded-2xl border border-line bg-pink-pale/60 p-5"
        >
          <p className="text-base font-bold text-ink">
            Eski sayaçlarını ve toplam çalışma saatini kaydetmek ister misin
          </p>
          <p className="mt-1 text-sm text-ink">
            Giriş yaptığında kurduğun sayaçlar ve tamamladığın oturumlar hesabında saklanır, toplam kaç saat çalıştığını her cihazdan takip edebilirsin.
          </p>
          <a
            href={mainUrl("/login", "pomodoro-sayaci")}
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-pink-deep px-5 py-2 text-sm font-bold text-white hover:bg-ink"
          >
            Giriş yap
          </a>
        </section>
      )}

      {(authUser || sessionCount > 0) && (
        <section
          aria-label="Toplam çalışma özeti"
          className="rounded-2xl bg-band p-6 text-on-band"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">
              {authUser ? "HESAP TAKİBİ AÇIK" : "BU OTURUM ÖZETİ"}
            </span>
            {authUser && <span className="text-xs text-on-band/80">{authUser.email}</span>}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-on-band/80">Toplam çalışma süren</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{totalWorked.totalHoursDecimal}</p>
              <p className="mt-0.5 text-sm text-on-band/80">{totalWorked.humanReadable}</p>
            </div>
            <div>
              <p className="text-sm text-on-band/80">Tamamlanan oturum</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{sessionCount}</p>
              <p className="mt-0.5 text-sm text-on-band/80">odak bloku</p>
            </div>
            <div>
              <p className="text-sm text-on-band/80">Bugün çalışılan süre</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{todayWorked.humanReadable}</p>
              <p className="mt-0.5 text-sm text-on-band/80">{todayWorked.totalHoursDecimal}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
      <div className={resultAsideCls}>
      <section
        ref={timerRegionRef}
        tabIndex={-1}
        aria-label="Pomodoro kronometresi"
        className="rounded-2xl border border-line bg-surface p-6 focus:outline-none"
      >
        <div role="tablist" aria-label="Sayaç modu" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "focus"}
            onClick={() => handleSwitchMode("focus")}
            className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
              mode === "focus"
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            Odak süresi ({activeFocusMinutes} dk)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "break"}
            onClick={() => handleSwitchMode("break")}
            className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
              mode === "break"
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            Mola süresi ({activeBreakMinutes} dk)
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-ink-mid">
            {activeLabel || "Genel odak"} · {mode === "focus" ? "Odak bloku" : "Mola zamanı"}
          </p>
          <p
            aria-live="off"
            className="mt-2 font-sans text-6xl font-bold tracking-tight text-ink tabular-nums sm:text-7xl"
          >
            {formatClock(secondsLeft)}
          </p>

          <div
            role="progressbar"
            aria-label="Sayaç ilerlemesi"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mx-auto mt-5 h-3 w-full max-w-md overflow-hidden rounded-full bg-paper border border-line"
          >
            <div
              className={`h-full transition-all duration-300 ${mode === "focus" ? "bg-pink" : "bg-ink"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={handleToggleRun} className={btnPrimary}>
            {isRunning ? "Duraklat" : "Başlat"}
          </button>
          <button type="button" onClick={handleReset} className={btnSecondary}>
            Sıfırla
          </button>
          <button
            type="button"
            onClick={handleCompleteAndSave}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-mid bg-paper px-4 py-2 text-sm font-bold text-ink hover:bg-yellow-soft"
          >
            Oturumu tamamla ve kaydet
          </button>
        </div>

        {statusMessage && (
          <p role="status" className="mt-4 rounded-xl bg-yellow-soft px-4 py-3 text-sm font-medium text-ink">
            {statusMessage}
          </p>
        )}
        {syncNotice && (
          <p role="status" className="mt-3 rounded-xl border border-error/40 bg-paper px-4 py-3 text-sm text-error">
            Uyarı: {syncNotice}
          </p>
        )}
      </section>

      </div>

      <div className="space-y-8">
      <section aria-label="Hazır ve eski sayaçlar" className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Hazır şablonlar</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {DEFAULT_POMODORO_PRESETS.map((preset) => (
              <button
                key={`${preset.label}-${preset.focusMinutes}`}
                type="button"
                onClick={() =>
                  applyTimerConfig(preset.label, preset.focusMinutes, preset.breakMinutes, "focus")
                }
                className="min-h-11 rounded-xl border border-line bg-surface p-3 text-left hover:border-ink"
              >
                <span className="block text-sm font-bold text-ink">{preset.label}</span>
                <span className="mt-0.5 block text-xs text-ink-mid">
                  {preset.focusMinutes} dk odak · {preset.breakMinutes} dk mola
                </span>
              </button>
            ))}
          </div>
        </div>

        {authUser && rememberedPresets.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-ink">Eski sayaçların (tek tıkla kur)</h2>
            <p className="mt-1 text-sm text-ink-mid">
              Daha önce tamamladığın süreleri buradan tekrar açabilirsin.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {rememberedPresets.map((preset) => (
                <button
                  key={`${preset.label}-${preset.focusMinutes}-${preset.breakMinutes}`}
                  type="button"
                  onClick={() =>
                    applyTimerConfig(
                      preset.label || "Genel odak",
                      preset.focusMinutes,
                      preset.breakMinutes,
                      "focus",
                    )
                  }
                  className="min-h-11 rounded-xl border border-ink-mid bg-yellow-soft/60 p-3 text-left hover:border-ink hover:bg-yellow-soft"
                >
                  <span className="block text-sm font-bold text-ink">
                    {preset.label || "Genel odak"}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink">
                    {preset.focusMinutes} dk odak · {preset.breakMinutes} dk mola
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <form
        onSubmit={handleSetupSubmit}
        noValidate
        aria-label="Kendi sayacını kur"
        className="rounded-2xl border border-line bg-surface p-6"
      >
        <h2 className="text-xl font-bold text-ink">Kendi sayacını ayarla</h2>
        <p className="mt-1 text-sm text-ink-mid">
          Ders veya konu adını yaz, odak ve mola süreni seç.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor={`${baseId}-label`} className={labelCls}>
              Çalışma başlığı
            </label>
            <input
              id={`${baseId}-label`}
              type="text"
              maxLength={120}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Örn. AYT Türev"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor={`${baseId}-focus`} className={labelCls}>
              Odak süresi (dk)
            </label>
            <input
              id={`${baseId}-focus`}
              type="text"
              inputMode="numeric"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              aria-invalid={Boolean(errors.focus)}
              aria-describedby={errors.focus ? focusErrId : undefined}
              className={inputCls}
            />
            {errors.focus && (
              <p id={focusErrId} className="mt-1 text-sm font-medium text-error">
                Hata: {errors.focus}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${baseId}-break`} className={labelCls}>
              Mola süresi (dk)
            </label>
            <input
              id={`${baseId}-break`}
              type="text"
              inputMode="numeric"
              value={breakInput}
              onChange={(e) => setBreakInput(e.target.value)}
              aria-invalid={Boolean(errors.breakTime)}
              aria-describedby={errors.breakTime ? breakErrId : undefined}
              className={inputCls}
            />
            {errors.breakTime && (
              <p id={breakErrId} className="mt-1 text-sm font-medium text-error">
                Hata: {errors.breakTime}
              </p>
            )}
          </div>
        </div>

        <button type="submit" className={`${btnPrimary} mt-5`}>
          Sayacı kur
        </button>
      </form>

      {sessions.length > 0 && (
        <section aria-label="Tamamlanan odak oturumları" className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">Tamamlanan oturumlar</h2>
          <ul className="mt-4 divide-y divide-line">
            {sessions.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-base font-bold text-ink">{item.label || "Genel odak"}</p>
                  <p className="text-sm text-ink-mid">
                    {item.focusMinutes} dk odak · {item.breakMinutes} dk mola ·{" "}
                    {formatCompletedAt(item.completedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyTimerConfig(
                        item.label || "Genel odak",
                        item.focusMinutes,
                        item.breakMinutes,
                        "focus",
                      )
                    }
                    className="inline-flex min-h-11 items-center rounded-lg border border-ink px-3 py-2 text-sm font-bold text-ink hover:bg-pink-pale"
                  >
                    Tekrar başlat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(item.id)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-line px-3 py-2 text-sm font-medium text-error hover:border-error"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>
      </div>
    </div>
  );
}
