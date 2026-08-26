"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, CheckCircle2, Repeat } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import {
  getWeekRoutines,
  createRoutine,
  toggleRoutine,
  deleteRoutine,
  getTemplates,
  createTemplate,
  deleteTemplate,
  getExercises,
  WEEKDAYS,
  type Routine,
  type RoutineTemplate,
  type Exercise,
} from "@/lib/api";
import { BODY_PARTS, WEEKDAY_LABELS, bodyPartLabel, toDateStr, getMonday } from "@/lib/constants";

export default function RoutinePage() {
  return (
    <RequireAuth>
      <RoutineManager />
    </RequireAuth>
  );
}

// /routine 페이지 본체 — 이번 주 요일별 즉석 추가/체크/삭제와, 매주 반복되는 루틴 설정을 함께 관리
function RoutineManager() {
  const [weekRoutines, setWeekRoutines] = useState<Routine[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    getWeekRoutines().then(setWeekRoutines);
    getTemplates().then(setTemplates);
    getExercises().then(setExercises);
  }, []);

  async function handleToggle(id: number) {
    const updated = await toggleRoutine(id);
    setWeekRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDeleteRoutine(id: number) {
    await deleteRoutine(id);
    setWeekRoutines((prev) => prev.filter((r) => r.id !== id));
  }

  // 이번 주(월~일) 각 요일의 실제 날짜 계산
  const today = new Date();
  const todayStr = toDateStr(today);
  const weekStart = getMonday(today);
  const weekDates = WEEKDAY_LABELS.map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return { label, dateStr: toDateStr(date) };
  });

  // 특정 날짜에 루틴 추가하는 폼 — 열려있는 날짜만 dateStr로 기억
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [newBodyPart, setNewBodyPart] = useState(BODY_PARTS[0].code);
  const [newExerciseName, setNewExerciseName] = useState("");
  const exercisesForNewRoutine = exercises.filter((ex) => ex.bodyPart === newBodyPart);

  // 부위를 바꾸면 운동 목록도 바뀌니, 운동 선택도 그 부위의 첫 항목으로 같이 리셋
  function handleNewBodyPartChange(part: string) {
    setNewBodyPart(part);
    setNewExerciseName(exercises.find((ex) => ex.bodyPart === part)?.name ?? "");
  }

  useEffect(() => {
    if (exercises.length === 0 || newExerciseName) return;
    setNewExerciseName(exercises.find((ex) => ex.bodyPart === newBodyPart)?.name ?? "");
  }, [exercises]);

  async function handleAddRoutine(e: FormEvent, dateStr: string) {
    e.preventDefault();
    const created = await createRoutine({
      bodyPart: newBodyPart,
      exerciseName: newExerciseName,
      scheduledDate: dateStr,
    });
    setWeekRoutines((prev) => [...prev, created]);
    handleNewBodyPartChange(BODY_PARTS[0].code);
    setAddingDate(null);
  }

  // 반복 루틴(템플릿) 추가 폼
  const [newTemplateBodyPart, setNewTemplateBodyPart] = useState(BODY_PARTS[0].code);
  const [newTemplateExerciseName, setNewTemplateExerciseName] = useState("");
  const [newTemplateDay, setNewTemplateDay] = useState<(typeof WEEKDAYS)[number]>("MONDAY");
  const exercisesForTemplate = exercises.filter((ex) => ex.bodyPart === newTemplateBodyPart);

  // 부위를 바꾸면 운동 목록도 바뀌니, 운동 선택도 그 부위의 첫 항목으로 같이 리셋
  function handleTemplateBodyPartChange(part: string) {
    setNewTemplateBodyPart(part);
    setNewTemplateExerciseName(exercises.find((ex) => ex.bodyPart === part)?.name ?? "");
  }

  useEffect(() => {
    if (exercises.length === 0 || newTemplateExerciseName) return;
    setNewTemplateExerciseName(exercises.find((ex) => ex.bodyPart === newTemplateBodyPart)?.name ?? "");
  }, [exercises]);

  async function handleAddTemplate(e: FormEvent) {
    e.preventDefault();
    const created = await createTemplate({
      bodyPart: newTemplateBodyPart,
      exerciseName: newTemplateExerciseName,
      dayOfWeek: newTemplateDay,
    });
    setTemplates((prev) => [...prev, created]);
    handleTemplateBodyPartChange(BODY_PARTS[0].code);
    // 방금 추가한 템플릿이 이번 주 요일에 해당하면 바로 반영되게 다시 불러옴
    getWeekRoutines().then(setWeekRoutines);
  }

  async function handleDeleteTemplate(id: number) {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    // 템플릿 삭제 시 오늘 이후 생성된 인스턴스도 서버에서 같이 지워지므로 다시 불러와서 반영
    getWeekRoutines().then(setWeekRoutines);
  }

  // 요일(월~일) 순으로 묶어서 표시 — 등록 순서로만 나열하면 요일이 뒤섞여서 읽기 어려움
  const templateGroups = WEEKDAYS.map((day, i) => ({
    day,
    label: WEEKDAY_LABELS[i],
    items: templates
      .filter((t) => t.dayOfWeek === day)
      .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-white">루틴 관리</h1>
          <p className="mt-1 text-sm text-zinc-400">
            이번 주 루틴을 그때그때 추가하거나, 매주 반복되는 루틴을 설정해두세요.
          </p>
        </header>

        <main className="space-y-8 p-6 lg:p-8">
          <section>
            <h2 className="text-base font-semibold text-white">이번 주 루틴</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {weekDates.map(({ label, dateStr }) => {
                const dayRoutines = weekRoutines.filter((r) => r.scheduledDate === dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    className={`rounded-2xl border p-4 ${
                      isToday ? "border-lime-400/40 bg-lime-400/5" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isToday ? "text-lime-400" : "text-white"}`}>
                        {label}요일{isToday && " · 오늘"}
                      </span>
                      <button
                        onClick={() => setAddingDate(addingDate === dateStr ? null : dateStr)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:bg-white/5"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {addingDate === dateStr && (
                      <form
                        onSubmit={(e) => handleAddRoutine(e, dateStr)}
                        className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-2"
                      >
                        <select
                          value={newBodyPart}
                          onChange={(e) => handleNewBodyPartChange(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                        >
                          {BODY_PARTS.map((part) => (
                            <option key={part.code} value={part.code} className="bg-zinc-900">
                              {part.label}
                            </option>
                          ))}
                        </select>
                        <select
                          required
                          value={newExerciseName}
                          onChange={(e) => setNewExerciseName(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                        >
                          <option value="" disabled className="bg-zinc-900">
                            운동 선택
                          </option>
                          {exercisesForNewRoutine.map((ex) => (
                            <option key={ex.id} value={ex.name} className="bg-zinc-900">
                              {ex.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-lime-400 py-1 text-xs font-semibold text-black hover:bg-lime-300"
                        >
                          추가
                        </button>
                      </form>
                    )}

                    <ul className="mt-3 space-y-2">
                      {dayRoutines.length === 0 && (
                        <li className="text-xs text-zinc-600">루틴 없음</li>
                      )}
                      {dayRoutines.map((routine) => (
                        <li key={routine.id} className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="shrink-0 rounded bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-lime-300">
                              {bodyPartLabel(routine.bodyPart)}
                            </span>
                            <span className="truncate text-xs text-white">{routine.exerciseName}</span>
                            {routine.fromTemplate && (
                              <Repeat size={11} className="shrink-0 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button onClick={() => handleToggle(routine.id)}>
                              <CheckCircle2
                                size={16}
                                className={routine.done ? "text-lime-400" : "text-white/10"}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteRoutine(routine.id)}
                              className="text-zinc-600 hover:text-rose-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">반복 루틴 설정</h2>
            <p className="mt-1 text-sm text-zinc-400">
              여기서 등록하면 매주 그 요일에 자동으로 루틴이 채워져요.
            </p>

            <form onSubmit={handleAddTemplate} className="mt-4 flex flex-wrap items-end gap-2">
              <select
                value={newTemplateDay}
                onChange={(e) => setNewTemplateDay(e.target.value as (typeof WEEKDAYS)[number])}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {WEEKDAYS.map((day, i) => (
                  <option key={day} value={day} className="bg-zinc-900">
                    {WEEKDAY_LABELS[i]}요일
                  </option>
                ))}
              </select>
              <select
                value={newTemplateBodyPart}
                onChange={(e) => handleTemplateBodyPartChange(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {BODY_PARTS.map((part) => (
                  <option key={part.code} value={part.code} className="bg-zinc-900">
                    {part.label}
                  </option>
                ))}
              </select>
              <select
                required
                value={newTemplateExerciseName}
                onChange={(e) => setNewTemplateExerciseName(e.target.value)}
                className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="" disabled className="bg-zinc-900">
                  운동 선택
                </option>
                {exercisesForTemplate.map((ex) => (
                  <option key={ex.id} value={ex.name} className="bg-zinc-900">
                    {ex.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
              >
                반복 추가
              </button>
            </form>

            {templateGroups.length === 0 && (
              <p className="mt-4 text-sm text-zinc-500">등록된 반복 루틴이 없어요.</p>
            )}
            <div className="mt-4 space-y-4">
              {templateGroups.map((group) => (
                <div key={group.day}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    매주 {group.label}요일
                  </p>
                  <ul className="mt-2 space-y-2">
                    {group.items.map((template) => (
                      <li
                        key={template.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-lime-400/15 px-2 py-1 text-xs font-semibold text-lime-300">
                            {bodyPartLabel(template.bodyPart)}
                          </span>
                          <span className="text-sm text-white">{template.exerciseName}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-zinc-600 hover:text-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
