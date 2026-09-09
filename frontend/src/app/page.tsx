"use client"; // 파일 맨 첫 줄에 추가

import { useEffect, useState, type FormEvent } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { WorkoutSession } from "@/components/workout-session";
import { SetPanel } from "@/components/set-panel";
import { MaterialIcon } from "@/components/material-icon";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, bodyPartLabel, weekdayLabels, type Key } from "@/lib/i18n";
import {
  getWeekRoutines,
  toggleRoutine,
  createRoutine,
  deleteRoutine,
  getStreak,
  getExercises,
  getBodyWeightLogs,
  recordBodyWeight,
  type Routine,
  type Exercise,
  type BodyWeightLog,
} from "@/lib/api";
import { BODY_PARTS, toDateStr, getMonday } from "@/lib/constants";

// 더미 팀 데이터 — 부위 코드/상태 코드로 저장해서 언어 전환 시 라벨만 다시 계산되게 함
const teamMembers = [
  { name: "박서준", bodyPart: "CHEST", status: "done" as const },
  { name: "김하늘", bodyPart: "LEG", status: "inProgress" as const },
  { name: "이도현", bodyPart: "BACK", status: "notDone" as const },
  { name: "정유진", bodyPart: "SHOULDER", status: "done" as const },
];

const avatarColors = [
  "bg-primary-container/15 text-primary-container",
  "bg-tertiary/15 text-tertiary",
  "bg-secondary/15 text-secondary",
  "bg-white/10 text-on-surface-variant",
];

const statusStyles: Record<string, string> = {
  done: "bg-primary-container/15 text-primary-container",
  inProgress: "bg-tertiary/15 text-tertiary",
  notDone: "bg-white/5 text-on-surface-variant",
};

// 이번 주 요일별 완료율(%)을 Stitch 스타일 그라디언트 막대그래프로 그림 — 데이터는 전부 실제 weekBars
function WeeklyBarChart({ bars }: { bars: { day: string; pct: number; isToday: boolean }[] }) {
  const width = 680;
  const barWidth = 46;
  const gap = (width - bars.length * barWidth) / (bars.length + 1);
  const baseline = 150;
  const maxBarHeight = 118;

  return (
    <svg viewBox={`0 0 ${width} 180`} className="h-48 w-full">
      <defs>
        <linearGradient id="barActiveGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a3e635" stopOpacity="1" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="barTodayGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ccff80" stopOpacity="1" />
          <stop offset="100%" stopColor="#ccff80" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {[30, 75, 120].map((y) => (
        <line key={y} x1={20} x2={width - 20} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
      ))}
      {bars.map((bar, i) => {
        const x = gap + i * (barWidth + gap);
        const h = bar.pct > 0 ? Math.max((bar.pct / 100) * maxBarHeight, 12) : 8;
        const y = baseline - h;
        return (
          <g key={bar.day}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={6}
              fill={bar.pct === 0 ? "rgba(255,255,255,0.06)" : bar.isToday ? "url(#barTodayGrad)" : "url(#barActiveGrad)"}
              stroke={bar.isToday ? "#a3e635" : "none"}
              strokeWidth={bar.isToday ? 1.5 : 0}
            />
            {bar.pct > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                fill={bar.isToday ? "#ccff80" : "#a3e635"}
                fontFamily="JetBrains Mono"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {bar.pct}%
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={168}
              fill={bar.isToday ? "#ccff80" : "#8c947c"}
              fontFamily="Inter"
              fontSize="12"
              fontWeight={bar.isToday ? 700 : 400}
              textAnchor="middle"
            >
              {bar.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 최근 몸무게 기록(최대 8개)으로 그리는 스파크라인 — 목업 곡선이 아니라 실제 getBodyWeightLogs() 값 사용
function WeightSparkline({ logs }: { logs: BodyWeightLog[] }) {
  const recent = logs.slice(-8);
  if (recent.length < 2) return null;

  const weights = recent.map((l) => l.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const w = 160;
  const h = 36;
  const points = recent.map((l, i) => {
    const x = (i / (recent.length - 1)) * w;
    const y = h - ((l.weightKg - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="weightGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4ae176" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4ae176" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#weightGrad)" points={`0,${h} ${points.join(" ")} ${w},${h}`} />
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke="#4ae176"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#4ae176" />
    </svg>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

// Home() 안에 중첩해서 정의하면 Home이 리렌더링될 때마다 Dashboard가
// "새로운 컴포넌트"로 취급돼서 매번 다시 마운트됨(깜빡임/상태 초기화 원인).
// 그래서 같은 파일이지만 Home과는 별개의(형제) 함수로 분리해서 정의함
function Dashboard() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [weekRoutines, setWeekRoutines] = useState<Routine[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [latestBodyWeight, setLatestBodyWeight] = useState<number | null>(null);

  useEffect(() => {
    getWeekRoutines().then(setWeekRoutines);
    getStreak().then((r) => setStreakDays(r.days));
    getBodyWeightLogs().then((logs) => {
      setBodyWeightLogs(logs);
      if (logs.length > 0) setLatestBodyWeight(logs[logs.length - 1].weightKg);
    });
  }, []);

  // 운동 카탈로그는 언어 전환 시 표시 이름(displayName)이 바뀌므로 locale이 바뀔 때마다 다시 불러옴
  useEffect(() => {
    getExercises(locale).then(setExercises);
  }, [locale]);

  // 루틴에 저장된 exerciseName(내부 식별용 한글)을 현재 언어의 표시 이름으로 변환
  function exerciseDisplayName(name: string) {
    return exercises.find((ex) => ex.name === name)?.displayName ?? name;
  }

  async function handleRecordWeight(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(bodyWeight);
    if (!parsed) return;
    const log = await recordBodyWeight(parsed);
    setLatestBodyWeight(log.weightKg);
    setBodyWeightLogs((prev) => [...prev.filter((l) => l.recordedDate !== log.recordedDate), log]);
    setBodyWeight("");
  }

  async function handleToggle(id: number) {
    const updated = await toggleRoutine(id);
    setWeekRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDelete(id: number) {
    await deleteRoutine(id);
    setWeekRoutines((prev) => prev.filter((r) => r.id !== id));
  }

  // 세트 기록 UI — 한 번에 하나의 루틴만 펼쳐서 보여줌 (SetPanel 컴포넌트가 실제 기록 로직을 담당)
  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newBodyPart, setNewBodyPart] = useState(BODY_PARTS[0].code);
  const [newExerciseName, setNewExerciseName] = useState("");
  const exercisesForPart = exercises.filter((ex) => ex.bodyPart === newBodyPart);

  // 운동 목록이 로드되면 기본 선택값(첫 운동)을 채워둠
  useEffect(() => {
    if (exercises.length === 0) return;
    setNewExerciseName((prev) => prev || exercises.find((ex) => ex.bodyPart === newBodyPart)?.name || "");
  }, [exercises]);

  // 부위를 바꾸면 그 부위의 운동 목록도 바뀌니, 운동 선택도 첫 항목으로 같이 리셋
  function handleBodyPartChange(part: string) {
    setNewBodyPart(part);
    const first = exercises.find((ex) => ex.bodyPart === part);
    setNewExerciseName(first?.name ?? "");
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const created = await createRoutine({
      bodyPart: newBodyPart,
      exerciseName: newExerciseName,
      scheduledDate: toDateStr(new Date()),
    });
    setWeekRoutines((prev) => [...prev, created]);
    handleBodyPartChange(BODY_PARTS[0].code);
    setIsAdding(false);
  }

  // weekRoutines(이번 주 전체)에서 오늘/요일별/주간달성률/총 볼륨을 여기서 파생시킴 —
  // 서버에 여러 번 물어보는 대신 한 번 받아온 데이터를 화면별로 나눠 씀
  const today = new Date();
  const todayStr = toDateStr(today);
  const todayRoutines = weekRoutines.filter((r) => r.scheduledDate === todayStr);
  const todayDoneCount = todayRoutines.filter((r) => r.done).length;
  const nextRoutine = todayRoutines.find((r) => !r.done);

  // "루틴 시작하기" — 오늘 미완료 루틴을 순서대로 진행하는 세션 모달을 띄움
  const [sessionActive, setSessionActive] = useState(false);

  function handleRoutineUpdate(updated: Routine) {
    setWeekRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const weekStart = getMonday(today);
  const weekBars = weekdayLabels(t).map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = toDateStr(date);
    const dayRoutines = weekRoutines.filter((r) => r.scheduledDate === dateStr);
    const doneCount = dayRoutines.filter((r) => r.done).length;
    return {
      day: label,
      pct: dayRoutines.length ? Math.round((doneCount / dayRoutines.length) * 100) : 0,
      isToday: dateStr === todayStr,
    };
  });

  const weeklyGoalPct = weekRoutines.length
    ? Math.round((weekRoutines.filter((r) => r.done).length / weekRoutines.length) * 100)
    : 0;

  // 이번 주 전체 세트의 무게 x 횟수 합 — Stitch의 "Gross Volume" 카드에 해당하는 실제 지표
  const weeklyVolumeKg = weekRoutines.reduce(
    (sum, r) => sum + r.sets.reduce((setSum, s) => setSum + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
    0,
  );

  const todayDonePct = todayRoutines.length ? Math.round((todayDoneCount / todayRoutines.length) * 100) : 0;

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />

      {/* Main column */}
      <div className="relative z-10 min-w-0 flex-1">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-white/[0.08] bg-surface-container-lowest/60 px-6 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-on-surface-variant">
            <MaterialIcon name="search" className="text-[18px]" />
            <span>{t("dashboard.searchPlaceholder")}</span>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-on-surface-variant hover:bg-white/[0.08]">
            <MaterialIcon name="notifications" className="text-[20px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-container/30 bg-primary-container/15 text-sm font-semibold text-primary-container">
              {user?.firstName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-on-surface">
                {user?.firstName}
                {t("dashboard.greetingSuffix")}
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          {/* KPI 레일 — Stitch: 히어로(4) + 지표 카드 3개(8) */}
          <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
            {/* 히어로: 인사말 + 스트릭 + 액션 버튼 */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-primary-container/20 bg-surface-container/60 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl xl:col-span-4">
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-primary-container/10 blur-3xl" />
              <div className="flex flex-col gap-1">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-container">
                  {t("dashboard.kicker")}
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-on-surface">
                  {user?.firstName}
                  {t("dashboard.greetingSuffix")}, {t("dashboard.heroTitle")}
                </h1>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-mono text-5xl font-black leading-none text-primary-container drop-shadow-[0_0_25px_rgba(163,230,53,0.6)]">
                    {streakDays}
                  </span>
                  <span className="pb-1 text-sm font-medium text-on-surface-variant">
                    {t("dashboard.streakSuffix")}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <a
                  href="/routine"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary-container px-4 py-2.5 text-xs font-bold text-on-primary-container shadow-[0_0_20px_-4px_rgba(163,230,53,0.7)] hover:brightness-110"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                  {t("dashboard.addRoutine")}
                </a>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/[0.14] px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-white/[0.06]">
                  <MaterialIcon name="person_add" className="text-[16px]" />
                  {t("dashboard.inviteMember")}
                </button>
              </div>
            </div>

            {/* 지표 3종: 몸무게(스파크라인), 이번 주 총 볼륨, 오늘 완료율 — 전부 실제 데이터 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:col-span-8">
              <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("dashboard.bodyWeightRecord")}
                </span>
                <div className="my-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold tracking-tight text-on-surface">
                      {latestBodyWeight ?? "–"}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">KG</span>
                  </div>
                </div>
                <div className="h-8 w-full">
                  <WeightSparkline logs={bodyWeightLogs} />
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("dashboard.weeklyVolume")}
                </span>
                <div className="my-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-bold tracking-tight text-primary-container">
                      {weeklyVolumeKg.toLocaleString()}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">KG</span>
                  </div>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{t("dashboard.weeklyVolumeHint")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="flex h-full flex-col justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("dashboard.todayDone")}
                  </span>
                  <div className="my-1.5 font-mono text-3xl font-bold text-on-surface">
                    {todayDoneCount}
                    <span className="text-lg text-on-surface-variant">/{todayRoutines.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-primary-container">{t("dashboard.almostThere")}</p>
                </div>
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#a3e635"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - todayDonePct / 100)}
                    />
                  </svg>
                  <span className="absolute font-mono text-sm font-bold text-on-surface">{todayDonePct}%</span>
                </div>
              </div>
            </div>
          </section>

          {/* 중앙 분석 그리드 — 주간 막대그래프(8) + 목표 도넛/세션 시작 CTA(4) */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-8">
              <h2 className="text-base font-semibold text-on-surface">{t("dashboard.weeklyRecord")}</h2>
              <WeeklyBarChart bars={weekBars} />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-4">
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
                <span className="self-start font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("dashboard.weeklyGoalRate")}
                </span>
                <div className="relative my-2 flex h-32 w-32 items-center justify-center">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#a3e635"
                      strokeWidth="9"
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_10px_rgba(163,230,53,0.4)]"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - weeklyGoalPct / 100)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-2xl font-bold text-on-surface">{weeklyGoalPct}%</span>
                  </div>
                </div>
                <p className="text-center text-xs text-on-surface-variant">{t("dashboard.weeklyGoalHint")}</p>
              </div>

              <button
                onClick={() => setSessionActive(true)}
                disabled={!nextRoutine}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-container py-3.5 text-sm font-bold uppercase tracking-tight text-on-primary-container shadow-[0_0_24px_rgba(163,230,53,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(163,230,53,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <MaterialIcon name="play_circle" className="text-[22px]" />
                {t("dashboard.startRoutine")}
              </button>
            </div>
          </section>

          {/* 오늘의 체크리스트 + 부가 카드(연속 달성일 / 몸무게 기록 입력) */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl xl:col-span-7">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary-container">
                    {t("dashboard.todayReminder")}
                  </span>
                  <h3 className="mt-0.5 text-base font-semibold text-on-surface">{t("dashboard.todayRoutines")}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-secondary/15 px-2 py-1 font-mono text-xs font-bold text-secondary">
                    {t("common.setCount", { n: todayDoneCount })} / {todayRoutines.length}
                  </span>
                  <button
                    onClick={() => setIsAdding((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]"
                  >
                    <MaterialIcon name="add" className="text-[16px]" />
                  </button>
                </div>
              </div>

              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary-container transition-all duration-500"
                  style={{ width: `${todayDonePct}%` }}
                />
              </div>

              {isAdding && (
                <form
                  onSubmit={handleAdd}
                  className="mb-3 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-3"
                >
                  <select
                    value={newBodyPart}
                    onChange={(e) => handleBodyPartChange(e.target.value)}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-on-surface"
                  >
                    {BODY_PARTS.map((part) => (
                      <option key={part.code} value={part.code} className="bg-surface-container">
                        {bodyPartLabel(part.code, t)}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-sm text-on-surface"
                  >
                    <option value="" disabled className="bg-surface-container">
                      {t("common.selectExercise")}
                    </option>
                    {exercisesForPart.map((ex) => (
                      <option key={ex.id} value={ex.name} className="bg-surface-container">
                        {ex.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-container py-1.5 text-sm font-semibold text-on-primary-container hover:brightness-110"
                  >
                    {t("common.add")}
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-1.5">
                {todayRoutines.length === 0 && (
                  <p className="text-sm text-on-surface-variant">{t("dashboard.noRoutinesToday")}</p>
                )}
                {todayRoutines.map((routine) => {
                  const isExpanded = expandedRoutineId === routine.id;
                  return (
                    <div
                      key={routine.id}
                      className="rounded-lg bg-surface-container-low/50 p-3 transition-all hover:bg-surface-container-high/40"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(routine.id);
                            }}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                              routine.done ? "bg-primary-container text-on-primary-container" : "bg-white/10 text-transparent"
                            }`}
                          >
                            <MaterialIcon name="check" className="text-[16px]" />
                          </button>
                          <span className="shrink-0 rounded-md bg-primary-container/15 px-2 py-1 text-xs font-semibold text-primary-container">
                            {bodyPartLabel(routine.bodyPart, t)}
                          </span>
                          <p className="truncate text-sm font-medium leading-tight text-on-surface">
                            {exerciseDisplayName(routine.exerciseName)}
                          </p>
                          {routine.fromTemplate && (
                            <MaterialIcon name="repeat" className="shrink-0 text-[14px] text-on-surface-variant" />
                          )}
                          {routine.sets.length > 0 && (
                            <span className="shrink-0 font-mono text-xs text-on-surface-variant">
                              {t("common.setCount", { n: routine.sets.length })}
                            </span>
                          )}
                          <MaterialIcon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            className="shrink-0 text-[16px] text-on-surface-variant"
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(routine.id)}
                          className="shrink-0 text-on-surface-variant hover:text-error"
                        >
                          <MaterialIcon name="delete" className="text-[18px]" />
                        </button>
                      </div>

                      {isExpanded && <SetPanel routine={routine} onUpdate={handleRoutineUpdate} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6 xl:col-span-5">
              <div className="flex flex-col justify-between rounded-2xl border border-primary-container/20 bg-surface-container/60 p-6 shadow-[0_0_40px_-15px_rgba(163,230,53,0.5)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-primary-container">
                  <MaterialIcon name="local_fire_department" className="text-[18px]" />
                  {t("dashboard.streakTitle")}
                </div>
                <p className="mt-4 font-mono text-5xl font-bold text-on-surface">
                  {streakDays}
                  <span className="ml-1 text-lg font-medium text-on-surface-variant">{t("dashboard.streakDaySuffix")}</span>
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">{t("dashboard.streakHint")}</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="monitor_weight" className="text-[18px] text-primary-container" />
                  <h2 className="text-base font-semibold text-on-surface">{t("dashboard.bodyWeightRecord")}</h2>
                </div>
                <form onSubmit={handleRecordWeight} className="mt-4 flex items-center gap-2">
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder={t("dashboard.todayWeightPlaceholder")}
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    className="w-full min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container hover:brightness-110"
                  >
                    {t("common.record")}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* 팀 협업 (더미 데이터 — 팀 기능 자체는 아직 미구현) */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">{t("dashboard.teamCollab")}</h2>
              <button className="flex items-center gap-1 rounded-full border border-white/[0.14] px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-white/[0.06]">
                <MaterialIcon name="person_add" className="text-[14px]" />
                {t("dashboard.addMember")}
              </button>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {teamMembers.map((member, i) => (
                <li key={member.name} className="flex items-center justify-between rounded-xl bg-surface-container-lowest/50 p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        avatarColors[i % avatarColors.length]
                      }`}
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight text-on-surface">{member.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {bodyPartLabel(member.bodyPart, t)} {t("common.routine")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[member.status]}`}>
                      {t(`dashboard.status.${member.status}` as Key)}
                    </span>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]">
                      <MaterialIcon name="chat_bubble" className="text-[14px]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      {sessionActive && (
        <WorkoutSession
          initialQueue={todayRoutines.filter((r) => !r.done)}
          exercises={exercises}
          onUpdate={handleRoutineUpdate}
          onClose={() => setSessionActive(false)}
        />
      )}
    </div>
  );
}
