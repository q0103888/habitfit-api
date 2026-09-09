"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { SetPanel } from "@/components/set-panel";
import { MaterialIcon } from "@/components/material-icon";
import {
  getMonthRoutines,
  createRoutine,
  toggleRoutine,
  deleteRoutine,
  getExercises,
  getBodyWeightLogs,
  type Routine,
  type Exercise,
  type BodyWeightLog,
} from "@/lib/api";
import { BODY_PARTS, toDateStr, getMonday } from "@/lib/constants";
import { useLanguage, bodyPartLabel, weekdayLabels } from "@/lib/i18n";

export default function CalendarPage() {
  return (
    <RequireAuth>
      <CalendarView />
    </RequireAuth>
  );
}

// 월간 캘린더 — 날짜 칸을 눌러서 그날의 루틴을 우측(모바일에선 아래) 패널에서 바로 보고 편집함.
// 반복 템플릿은 그 달 전체 주에 대해 서버에서 미리 materialize되어 미래 날짜에도 표시됨
function CalendarView() {
  const { locale, t } = useLanguage();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));

  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth(); // 0-indexed

  useEffect(() => {
    getBodyWeightLogs().then(setBodyWeightLogs);
  }, []);

  useEffect(() => {
    getExercises(locale).then(setExercises);
  }, [locale]);

  useEffect(() => {
    getMonthRoutines(toDateStr(monthAnchor)).then(setRoutines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function exerciseDisplayName(name: string) {
    return exercises.find((ex) => ex.name === name)?.displayName ?? name;
  }

  function goPrevMonth() {
    setMonthAnchor(new Date(year, month - 1, 1));
  }
  function goNextMonth() {
    setMonthAnchor(new Date(year, month + 1, 1));
  }
  function goToday() {
    const today = new Date();
    setMonthAnchor(today);
    setSelectedDate(toDateStr(today));
  }

  // 이번 달이 걸쳐있는 주(월~일) 전체를 채우는 달력 그리드 날짜들 계산
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridStart = getMonday(firstOfMonth);
  const gridEnd = new Date(lastOfMonth);
  const lastDow = gridEnd.getDay(); // 0=일 ... 6=토
  gridEnd.setDate(gridEnd.getDate() + (lastDow === 0 ? 0 : 7 - lastDow));

  const cells: Date[] = [];
  for (const d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    cells.push(new Date(d));
  }
  const weeks: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const routinesByDate = new Map<string, Routine[]>();
  for (const r of routines) {
    const list = routinesByDate.get(r.scheduledDate) ?? [];
    list.push(r);
    routinesByDate.set(r.scheduledDate, list);
  }
  const bodyWeightDates = new Set(bodyWeightLogs.map((log) => log.recordedDate));

  function dayStatus(dateStr: string): "done" | "partial" | "empty" {
    const list = routinesByDate.get(dateStr) ?? [];
    if (list.length === 0) return "empty";
    return list.every((r) => r.done) ? "done" : "partial";
  }

  const todayStr = toDateStr(new Date());
  const selectedRoutines = routinesByDate.get(selectedDate) ?? [];
  const dayLabels = weekdayLabels(t);

  // 이번 달 KPI — routines(이번 달 조회분)에서 실제로 계산. 어드히어런스/매크로사이클 같은 가짜 지표는 없음
  const monthDoneCount = routines.filter((r) => r.done).length;
  const monthVolumeKg = routines.reduce(
    (sum, r) => sum + r.sets.reduce((s, set) => s + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
    0,
  );
  const monthWeightDays = [...bodyWeightDates].filter((d) => {
    const dt = new Date(d);
    return dt.getFullYear() === year && dt.getMonth() === month;
  }).length;
  const monthAdherencePct = routines.length ? Math.round((monthDoneCount / routines.length) * 100) : 0;

  // 선택된 날짜에 루틴 즉석 추가하는 폼
  const [isAdding, setIsAdding] = useState(false);
  const [newBodyPart, setNewBodyPart] = useState(BODY_PARTS[0].code);
  const [newExerciseName, setNewExerciseName] = useState("");
  const exercisesForNewRoutine = exercises.filter((ex) => ex.bodyPart === newBodyPart);

  useEffect(() => {
    if (exercises.length === 0 || newExerciseName) return;
    setNewExerciseName(exercises.find((ex) => ex.bodyPart === newBodyPart)?.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises]);

  function handleBodyPartChange(part: string) {
    setNewBodyPart(part);
    setNewExerciseName(exercises.find((ex) => ex.bodyPart === part)?.name ?? "");
  }

  async function handleAddRoutine(e: FormEvent) {
    e.preventDefault();
    const created = await createRoutine({
      bodyPart: newBodyPart,
      exerciseName: newExerciseName,
      scheduledDate: selectedDate,
    });
    setRoutines((prev) => [...prev, created]);
    setIsAdding(false);
  }

  async function handleToggle(id: number) {
    const updated = await toggleRoutine(id);
    setRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDelete(id: number) {
    await deleteRoutine(id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  }

  // 세트 기록 UI — SetPanel 컴포넌트가 실제 기록 로직을 담당
  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);

  function handleRoutineUpdate(updated: Routine) {
    setRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="border-b border-white/[0.08] bg-surface-container-lowest/60 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-on-surface">{t("calendar.title")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("calendar.subtitle")}</p>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          {/* 월간 이동 컨트롤 */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container/30 p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-1 rounded-xl bg-surface-container-lowest p-1 shadow-inner">
              <button
                onClick={goPrevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all hover:bg-surface-container hover:text-primary-container"
              >
                <MaterialIcon name="chevron_left" className="text-[20px]" />
              </button>
              <span className="px-4 text-base font-semibold tracking-tight text-on-surface">
                {t("calendar.monthLabel", { year, month: month + 1 })}
              </span>
              <button
                onClick={goNextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all hover:bg-surface-container hover:text-primary-container"
              >
                <MaterialIcon name="chevron_right" className="text-[20px]" />
              </button>
            </div>
            <button
              onClick={goToday}
              className="rounded-xl bg-surface-container-high px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-bright hover:text-primary-container"
            >
              {t("calendar.today")}
            </button>
          </section>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
            {/* 왼쪽: 월간 KPI + 캘린더 그리드 */}
            <div className="flex flex-col gap-4 xl:col-span-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex flex-col justify-between rounded-xl bg-surface-container/40 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{t("dashboard.todayDone")}</span>
                    <MaterialIcon name="check_circle" className="text-[16px] text-primary-container" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-on-surface">{monthDoneCount}</span>
                    <span className="text-sm text-on-surface-variant">/ {routines.length}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-surface-container/40 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{t("dashboard.weeklyVolume")}</span>
                    <MaterialIcon name="fitness_center" className="text-[16px] text-primary-container" />
                  </div>
                  <span className="mt-2 font-mono text-2xl font-bold text-on-surface">{monthVolumeKg.toLocaleString()}</span>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-surface-container/40 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{t("dashboard.bodyWeightRecord")}</span>
                    <MaterialIcon name="monitor_weight" className="text-[16px] text-tertiary" />
                  </div>
                  <span className="mt-2 font-mono text-2xl font-bold text-on-surface">{monthWeightDays}</span>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-surface-container/40 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{t("dashboard.weeklyGoalRate")}</span>
                    <MaterialIcon name="insights" className="text-[16px] text-primary-container" />
                  </div>
                  <span className="mt-2 font-mono text-2xl font-bold text-on-surface">{monthAdherencePct}%</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl">
                <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs font-semibold text-on-surface-variant">
                  {dayLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="mt-2 space-y-1.5">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-1.5">
                      {week.map((date) => {
                        const dateStr = toDateStr(date);
                        const inMonth = date.getMonth() === month;
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const status = dayStatus(dateStr);
                        const hasWeight = bodyWeightDates.has(dateStr);
                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
                              isSelected
                                ? "bg-primary-container/15 ring-1 ring-primary-container"
                                : isToday
                                  ? "bg-surface-container-high/80"
                                  : "bg-surface-container-low/50 hover:bg-surface-container-low"
                            } ${inMonth ? "" : "opacity-30"}`}
                          >
                            <span className={`font-mono text-xs ${isToday ? "font-bold text-primary-container" : "text-on-surface"}`}>
                              {date.getDate()}
                            </span>
                            <span className="flex h-1.5 items-center gap-0.5">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  status === "done"
                                    ? "bg-primary-container"
                                    : status === "partial"
                                      ? "bg-tertiary"
                                      : "bg-transparent"
                                }`}
                              />
                              {hasWeight && <span className="h-1.5 w-1.5 rounded-full bg-secondary" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-container" />
                    {t("calendar.legendDone")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-tertiary" />
                    {t("calendar.legendPartial")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/15" />
                    {t("calendar.legendEmpty")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-secondary" />
                    {t("calendar.legendWeight")}
                  </span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 선택한 날짜 상세 패널 */}
            <div className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl xl:col-span-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-base font-semibold text-on-surface">{selectedDate}</h2>
                <button
                  onClick={() => setIsAdding((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                </button>
              </div>

              {isAdding && (
                <form
                  onSubmit={handleAddRoutine}
                  className="mt-4 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-3"
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
                    {exercisesForNewRoutine.map((ex) => (
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

              <div className="mt-4 flex flex-col gap-2">
                {selectedRoutines.length === 0 && (
                  <p className="text-sm text-on-surface-variant">{t("routine.noRoutine")}</p>
                )}
                {selectedRoutines.map((routine) => {
                  const isExpanded = expandedRoutineId === routine.id;
                  return (
                    <div key={routine.id} className="rounded-lg bg-surface-container-low/50 p-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="shrink-0 rounded-md bg-primary-container/15 px-2 py-1 text-xs font-semibold text-primary-container">
                            {bodyPartLabel(routine.bodyPart, t)}
                          </span>
                          <p className="truncate text-sm font-medium leading-tight text-on-surface">
                            {exerciseDisplayName(routine.exerciseName)}
                          </p>
                          {routine.fromTemplate && (
                            <MaterialIcon name="repeat" className="shrink-0 text-[12px] text-on-surface-variant" />
                          )}
                          {routine.sets.length > 0 && (
                            <span className="shrink-0 font-mono text-xs text-on-surface-variant">
                              {t("common.setCount", { n: routine.sets.length })}
                            </span>
                          )}
                          <MaterialIcon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            className="shrink-0 text-[14px] text-on-surface-variant"
                          />
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          <button onClick={() => handleToggle(routine.id)}>
                            <MaterialIcon
                              name="check_circle"
                              className={`text-[18px] ${routine.done ? "text-primary-container" : "text-white/10"}`}
                            />
                          </button>
                          <button onClick={() => handleDelete(routine.id)} className="text-on-surface-variant hover:text-error">
                            <MaterialIcon name="delete" className="text-[16px]" />
                          </button>
                        </div>
                      </div>
                      {isExpanded && <SetPanel routine={routine} onUpdate={handleRoutineUpdate} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
