"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Repeat, ChevronDown, ChevronUp } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { SetPanel } from "@/components/set-panel";
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

// 월간 캘린더 — 날짜 칸을 눌러서 그날의 루틴을 아래 패널에서 바로 보고 편집함.
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
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-white">{t("calendar.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("calendar.subtitle")}</p>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="w-36 text-center text-base font-semibold text-white">
                  {t("calendar.monthLabel", { year, month: month + 1 })}
                </h2>
                <button
                  onClick={goNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={goToday}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5"
              >
                {t("calendar.today")}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-zinc-500">
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
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors ${
                          isSelected
                            ? "border-lime-400 bg-lime-400/10"
                            : isToday
                              ? "border-lime-400/40 bg-white/5"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                        } ${inMonth ? "" : "opacity-30"}`}
                      >
                        <span className={`text-xs ${isToday ? "font-bold text-lime-400" : "text-zinc-300"}`}>
                          {date.getDate()}
                        </span>
                        <span className="flex h-1.5 items-center gap-0.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              status === "done"
                                ? "bg-lime-400"
                                : status === "partial"
                                  ? "bg-amber-400"
                                  : "bg-transparent"
                            }`}
                          />
                          {hasWeight && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime-400" />
                {t("calendar.legendDone")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {t("calendar.legendPartial")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                {t("calendar.legendEmpty")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                {t("calendar.legendWeight")}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{selectedDate}</h2>
              <button
                onClick={() => setIsAdding((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5"
              >
                <Plus size={14} />
              </button>
            </div>

            {isAdding && (
              <form
                onSubmit={handleAddRoutine}
                className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
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
                  className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white"
                >
                  <option value="" disabled className="bg-zinc-900">
                    {t("common.selectExercise")}
                  </option>
                  {exercisesForNewRoutine.map((ex) => (
                    <option key={ex.id} value={ex.name} className="bg-zinc-900">
                      {ex.displayName}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-lime-400 px-4 py-1.5 text-sm font-semibold text-black hover:bg-lime-300"
                >
                  {t("common.add")}
                </button>
              </form>
            )}

            <ul className="mt-4 space-y-3">
              {selectedRoutines.length === 0 && (
                <li className="text-sm text-zinc-500">{t("routine.noRoutine")}</li>
              )}
              {selectedRoutines.map((routine) => {
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
                        {routine.fromTemplate && <Repeat size={12} className="shrink-0 text-zinc-500" />}
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

                    {isExpanded && <SetPanel routine={routine} onUpdate={handleRoutineUpdate} />}
                  </li>
                );
              })}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
