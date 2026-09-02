"use client"; // 파일 맨 첫 줄에 추가

import {
  Bell,
  Search,
  Plus,
  Dumbbell,
  Flame,
  CheckCircle2,
  MessageCircle,
  UserPlus,
  Trash2,
  Repeat,
  Scale,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { WorkoutSession } from "@/components/workout-session";
import { SetPanel } from "@/components/set-panel";
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
  "bg-lime-400/15 text-lime-300",
  "bg-amber-400/15 text-amber-300",
  "bg-cyan-400/15 text-cyan-300",
  "bg-fuchsia-400/15 text-fuchsia-300",
];

const statusStyles: Record<string, string> = {
  done: "bg-lime-400/15 text-lime-300",
  inProgress: "bg-amber-400/15 text-amber-300",
  notDone: "bg-white/5 text-zinc-500",
};

function DayBar({
  day,
  pct,
  isToday,
}: {
  day: string;
  pct: number;
  isToday?: boolean;
}) {
  const filled = pct > 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-8 overflow-hidden rounded-full bg-white/5">
        {filled ? (
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-full ${
              isToday
                ? "bg-lime-400 shadow-[0_0_16px_-2px_rgba(163,230,53,0.8)]"
                : "bg-lime-400/50"
            }`}
            style={{ height: `${Math.max(pct, 10)}%` }}
          />
        ) : (
          <div
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 3px, transparent 3px, transparent 7px)",
            }}
          />
        )}
      </div>
      <span
        className={`text-xs ${
          isToday ? "font-semibold text-lime-400" : "text-zinc-500"
        }`}
      >
        {day}
      </span>
    </div>
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
  const [latestBodyWeight, setLatestBodyWeight] = useState<number | null>(null);

  useEffect(() => {
    getWeekRoutines().then(setWeekRoutines);
    getStreak().then((r) => setStreakDays(r.days));
    getBodyWeightLogs().then((logs) => {
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

  // weekRoutines(이번 주 전체)에서 오늘/요일별/주간달성률을 여기서 파생시킴 —
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

  return (
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-500">
            <Search size={16} />
            <span>{t("dashboard.searchPlaceholder")}</span>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10">
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <div className="flex items-center gap-3">
            {/* 아바타 원 안에는 이니셜(이름 첫 글자)만 — 문장이 들어가면 40x40px 원을 넘침 */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/15 text-sm font-semibold text-lime-300">
              {user?.firstName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-white">
                {user?.firstName}
                {t("dashboard.greetingSuffix")}
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          {/* Hero — 균일한 카드 격자 대신, 오늘의 동기부여 + 큰 스트릭 숫자를 전면에 내세움 */}
          <section className="relative overflow-hidden rounded-3xl border border-lime-400/20 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
                  {t("dashboard.kicker")}
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-white lg:text-5xl">
                  {user?.firstName}
                  {t("dashboard.greetingSuffix")},
                  <br className="hidden lg:block" />
                  {t("dashboard.heroTitle")}
                </h1>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-6xl font-black leading-none text-lime-400 drop-shadow-[0_0_25px_rgba(163,230,53,0.6)] lg:text-7xl">
                    {streakDays}
                  </span>
                  <span className="pb-2 text-lg font-medium text-zinc-400">
                    {t("dashboard.streakSuffix")}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/routine"
                  className="flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-bold text-black shadow-[0_0_25px_-6px_rgba(163,230,53,0.7)] hover:bg-lime-300"
                >
                  <Plus size={18} />
                  {t("dashboard.addRoutine")}
                </Link>
                <button className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-zinc-200 hover:bg-white/5">
                  <UserPlus size={18} />
                  {t("dashboard.inviteMember")}
                </button>
              </div>
            </div>
          </section>

          {/* 벤토 그리드 1행 — 큰 카드 하나 + 작은 숫자 카드 두 개를 세로로 쌓아 비대칭 리듬을 만듦 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:col-span-2">
              <h2 className="text-base font-semibold text-white">{t("dashboard.weeklyRecord")}</h2>
              <div className="mt-6 flex justify-between">
                {weekBars.map((d) => (
                  <DayBar key={d.day} {...d} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-1 flex-col justify-between rounded-3xl bg-lime-400 p-6 text-black shadow-[0_0_30px_-8px_rgba(163,230,53,0.7)]">
                <span className="text-xs font-bold uppercase tracking-wider text-black/70">
                  {t("dashboard.weeklyGoalRate")}
                </span>
                <span className="text-6xl font-black leading-none">{weeklyGoalPct}%</span>
                <span className="text-xs font-semibold text-black/70">
                  {t("dashboard.weeklyGoalHint")}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t("dashboard.todayDone")}
                </span>
                <span className="text-6xl font-black leading-none text-white">
                  {todayDoneCount}
                  <span className="text-2xl text-zinc-500">/{todayRoutines.length}</span>
                </span>
                <span className="text-xs font-semibold text-lime-400">{t("dashboard.almostThere")}</span>
              </div>
            </div>
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-base font-semibold text-white">{t("dashboard.todayReminder")}</h2>
              {nextRoutine ? (
                <>
                  <p className="mt-4 text-lg font-semibold leading-snug text-white">
                    {bodyPartLabel(nextRoutine.bodyPart, t)}, {exerciseDisplayName(nextRoutine.exerciseName)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {t("dashboard.remainingRoutines", { n: todayRoutines.length - todayDoneCount })}
                  </p>
                  <button
                    onClick={() => setSessionActive(true)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 text-sm font-semibold text-black shadow-[0_0_25px_-6px_rgba(163,230,53,0.7)] hover:bg-lime-300"
                  >
                    <Dumbbell size={16} />
                    {t("dashboard.startRoutine")}
                  </button>
                </>
              ) : (
                <p className="mt-4 text-lg font-semibold leading-snug text-white">
                  {todayRoutines.length === 0 ? t("dashboard.noRoutinesToday") : t("dashboard.allDoneToday")}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{t("dashboard.todayRoutines")}</h2>
                <button
                  onClick={() => setIsAdding((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5"
                >
                  <Plus size={14} />
                </button>
              </div>
              {isAdding && (
                <form
                  onSubmit={handleAdd}
                  className="mt-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <select
                    value={newBodyPart}
                    onChange={(e) => handleBodyPartChange(e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
                  >
                    {BODY_PARTS.map((part) => (
                      <option key={part.code} value={part.code} className="bg-zinc-900">
                        {bodyPartLabel(part.code, t)}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
                  >
                    <option value="" disabled className="bg-zinc-900">
                      {t("common.selectExercise")}
                    </option>
                    {exercisesForPart.map((ex) => (
                      <option key={ex.id} value={ex.name} className="bg-zinc-900">
                        {ex.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-lime-400 py-1.5 text-sm font-semibold text-black hover:bg-lime-300"
                  >
                    {t("common.add")}
                  </button>
                </form>
              )}
              <ul className="mt-4 space-y-3">
                {todayRoutines.length === 0 && (
                  <li className="text-sm text-zinc-500">{t("dashboard.noRoutinesToday")}</li>
                )}
                {todayRoutines.map((routine) => {
                  const isExpanded = expandedRoutineId === routine.id;
                  return (
                    <li key={routine.id} className="rounded-lg">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="shrink-0 rounded-lg bg-lime-400/15 px-2 py-1 text-xs font-semibold text-lime-300">
                            {bodyPartLabel(routine.bodyPart, t)}
                          </span>
                          <p className="truncate text-sm font-medium leading-tight text-white">
                            {exerciseDisplayName(routine.exerciseName)}
                          </p>
                          {routine.fromTemplate && (
                            <Repeat size={12} className="shrink-0 text-zinc-500" />
                          )}
                          {routine.sets.length > 0 && (
                            <span className="shrink-0 text-xs text-zinc-500">
                              {t("common.setCount", { n: routine.sets.length })}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp size={14} className="shrink-0 text-zinc-500" />
                          ) : (
                            <ChevronDown size={14} className="shrink-0 text-zinc-500" />
                          )}
                        </button>
                        <div className="flex shrink-0 items-center gap-3">
                          <button onClick={() => handleToggle(routine.id)}>
                            <CheckCircle2
                              size={20}
                              className={routine.done ? "text-lime-400" : "text-white/10"}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(routine.id)}
                            className="text-zinc-600 hover:text-rose-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <SetPanel routine={routine} onUpdate={handleRoutineUpdate} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">{t("dashboard.teamCollab")}</h2>
                <button className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5">
                  <UserPlus size={14} />
                  {t("dashboard.addMember")}
                </button>
              </div>
              <ul className="mt-4 space-y-4">
                {teamMembers.map((member, i) => (
                  <li
                    key={member.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {bodyPartLabel(member.bodyPart, t)} {t("common.routine")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[member.status]}`}
                      >
                        {t(`dashboard.status.${member.status}` as Key)}
                      </span>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5">
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-base font-semibold text-white">{t("dashboard.weeklyGoalDonut")}</h2>
              <div className="relative mx-auto mt-6 h-36 w-36">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(#a3e635 0% ${weeklyGoalPct}%, rgba(255,255,255,0.08) ${weeklyGoalPct}% 100%)`,
                  }}
                />
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-zinc-950">
                  <span className="text-2xl font-bold text-white">{weeklyGoalPct}%</span>
                  <span className="text-xs text-zinc-500">{t("dashboard.vsGoal")}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                  {t("dashboard.achieved")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  {t("dashboard.remaining")}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-lime-400/20 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-[0_0_40px_-15px_rgba(163,230,53,0.5)]">
              <div className="flex items-center gap-2 text-sm font-medium text-lime-400">
                <Flame size={18} />
                {t("dashboard.streakTitle")}
              </div>
              <p className="mt-4 text-5xl font-bold text-white">
                {streakDays}
                <span className="ml-1 text-lg font-medium text-zinc-400">{t("dashboard.streakDaySuffix")}</span>
              </p>
              <p className="mt-2 text-sm text-zinc-400">{t("dashboard.streakHint")}</p>
            </div>
          </div>

          {/* 몸무게 기록 — 나중에 통계 화면에서 이 데이터로 변화 그래프를 그릴 예정 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-lime-400" />
              <h2 className="text-base font-semibold text-white">{t("dashboard.bodyWeightRecord")}</h2>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="text-3xl font-bold text-white">
                {latestBodyWeight !== null ? `${latestBodyWeight}kg` : t("dashboard.noRecord")}
              </span>
              <form onSubmit={handleRecordWeight} className="flex items-center gap-2">
                <input
                  required
                  type="number"
                  step="0.1"
                  placeholder={t("dashboard.todayWeightPlaceholder")}
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  className="w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
                >
                  {t("common.record")}
                </button>
              </form>
            </div>
          </div>
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
