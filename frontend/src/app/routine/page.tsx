"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { SetPanel } from "@/components/set-panel";
import { MaterialIcon } from "@/components/material-icon";
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
import { BODY_PARTS, toDateStr, getMonday } from "@/lib/constants";
import { useLanguage, bodyPartLabel, weekdayLabels } from "@/lib/i18n";

export default function RoutinePage() {
  return (
    <RequireAuth>
      <RoutineManager />
    </RequireAuth>
  );
}

// /routine 페이지 본체 — 이번 주 요일별 즉석 추가/체크/삭제와, 매주 반복되는 루틴 설정을 함께 관리
function RoutineManager() {
  const { t } = useLanguage();
  const [weekRoutines, setWeekRoutines] = useState<Routine[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // 0 = 이번 주, -1 = 지난주, +1 = 다음주 — getWeekRoutines(date)가 특정 날짜 기준 주간 조회를 지원해서 실제로 이동 가능
  const [weekOffset, setWeekOffset] = useState(0);

  const { locale } = useLanguage();

  const today = new Date();
  const todayStr = toDateStr(today);
  const weekStart = getMonday(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  useEffect(() => {
    getWeekRoutines(toDateStr(weekStart)).then(setWeekRoutines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  // 운동 카탈로그는 언어 전환 시 표시 이름(displayName)이 바뀌므로 locale이 바뀔 때마다 다시 불러옴
  useEffect(() => {
    getExercises(locale).then(setExercises);
  }, [locale]);

  // 루틴/템플릿에 저장된 exerciseName(내부 식별용 한글)을 현재 언어의 표시 이름으로 변환
  function exerciseDisplayName(name: string) {
    return exercises.find((ex) => ex.name === name)?.displayName ?? name;
  }

  async function handleToggle(id: number) {
    const updated = await toggleRoutine(id);
    setWeekRoutines((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDeleteRoutine(id: number) {
    await deleteRoutine(id);
    setWeekRoutines((prev) => prev.filter((r) => r.id !== id));
  }

  // 세트 기록 UI — 한 번에 하나의 루틴만 펼쳐서 보여줌 (SetPanel 컴포넌트가 실제 기록 로직을 담당)
  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);

  function handleRoutineUpdate(updated: Routine) {
    setWeekRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const weekDates = weekdayLabels(t).map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return { label, dateStr: toDateStr(date), date };
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
    getWeekRoutines(toDateStr(weekStart)).then(setWeekRoutines);
  }

  async function handleDeleteTemplate(id: number) {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    // 템플릿 삭제 시 오늘 이후 생성된 인스턴스도 서버에서 같이 지워지므로 다시 불러와서 반영
    getWeekRoutines(toDateStr(weekStart)).then(setWeekRoutines);
  }

  // 요일(월~일) 순으로 묶어서 표시 — 등록 순서로만 나열하면 요일이 뒤섞여서 읽기 어려움
  const labels = weekdayLabels(t);
  const templateGroups = WEEKDAYS.map((day, i) => ({
    day,
    label: labels[i],
    items: templates
      .filter((tpl) => tpl.dayOfWeek === day)
      .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)),
  })).filter((group) => group.items.length > 0);

  // 주간 KPI — 전부 weekRoutines(실제 데이터)에서 계산. 가짜 매크로사이클/RPE 지표는 없음
  const weeklyVolumeKg = weekRoutines.reduce(
    (sum, r) => sum + r.sets.reduce((s, set) => s + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
    0,
  );
  const weeklyDoneCount = weekRoutines.filter((r) => r.done).length;
  const weeklyGoalPct = weekRoutines.length ? Math.round((weeklyDoneCount / weekRoutines.length) * 100) : 0;

  function formatMonthDay(date: Date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="border-b border-white/[0.08] bg-surface-container-lowest/60 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-on-surface">{t("routine.title")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("routine.subtitle")}</p>
        </header>

        <main className="space-y-8 p-6 lg:p-8">
          {/* 헤드라인 + 주간 KPI 4종 (전부 실제 데이터) */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="relative overflow-hidden rounded-2xl border border-primary-container/20 bg-surface-container/60 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl xl:col-span-4">
              <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-primary-container/10 blur-3xl" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary-container">
                {t("routine.thisWeek")}
              </span>
              <h2 className="mt-1 text-xl font-black leading-tight text-on-surface">{t("routine.title")}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{t("routine.subtitle")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:col-span-8">
              <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low/80 p-4 shadow-md backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <MaterialIcon name="fitness_center" className="text-[18px] text-primary-container" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("dashboard.weeklyVolume")}
                  </span>
                </div>
                <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-on-surface">
                  {weeklyVolumeKg.toLocaleString()}
                  <span className="ml-1 text-xs text-on-surface-variant">KG</span>
                </span>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low/80 p-4 shadow-md backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <MaterialIcon name="check_circle" className="text-[18px] text-secondary" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("dashboard.todayDone")}
                  </span>
                </div>
                <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-on-surface">
                  {weeklyDoneCount}
                  <span className="text-sm text-on-surface-variant">/{weekRoutines.length}</span>
                </span>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low/80 p-4 shadow-md backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <MaterialIcon name="repeat" className="text-[18px] text-tertiary" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("routine.repeatSettings")}
                  </span>
                </div>
                <span className="mt-2 font-mono text-2xl font-bold tracking-tight text-on-surface">
                  {templates.length}
                </span>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low/80 p-4 shadow-md backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <MaterialIcon name="insights" className="text-[18px] text-primary-container" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("dashboard.weeklyGoalRate")}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full rounded-full bg-primary-container" style={{ width: `${weeklyGoalPct}%` }} />
                </div>
                <span className="mt-1 font-mono text-lg font-bold text-on-surface">{weeklyGoalPct}%</span>
              </div>
            </div>
          </section>

          {/* 7일 그리드 — 이전주/이번주/다음주 이동 실제 동작(getWeekRoutines가 날짜 파라미터 지원) */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-on-surface">{t("routine.thisWeek")}</span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 font-mono text-xs text-on-surface-variant">
                  {formatMonthDay(weekStart)} - {formatMonthDay(weekEnd)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <button
                  onClick={() => setWeekOffset((v) => v - 1)}
                  className="rounded-md bg-surface-container-high p-1 transition-colors hover:text-on-surface"
                >
                  <MaterialIcon name="chevron_left" className="text-[18px]" />
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="rounded-md bg-surface-container-high px-3 py-1 font-mono text-xs transition-colors hover:text-on-surface"
                >
                  {weekOffset === 0 ? t("routine.currentWeek") : t("routine.backToCurrentWeek")}
                </button>
                <button
                  onClick={() => setWeekOffset((v) => v + 1)}
                  className="rounded-md bg-surface-container-high p-1 transition-colors hover:text-on-surface"
                >
                  <MaterialIcon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {weekDates.map(({ label, dateStr }) => {
                const dayRoutines = weekRoutines.filter((r) => r.scheduledDate === dateStr);
                const isToday = dateStr === todayStr;
                const isDone = dayRoutines.length > 0 && dayRoutines.every((r) => r.done);
                const dayVolume = dayRoutines.reduce(
                  (sum, r) => sum + r.sets.reduce((s, set) => s + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
                  0,
                );
                const daySets = dayRoutines.reduce((sum, r) => sum + r.sets.length, 0);

                return (
                  <div
                    key={dateStr}
                    className={`flex flex-col gap-3 rounded-2xl p-4 shadow-md backdrop-blur-xl transition-all ${
                      isToday
                        ? "bg-surface-container-high/90 shadow-[0_0_30px_rgba(163,230,53,0.2)]"
                        : "bg-surface-container-low/70 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isToday ? "text-primary-container" : "text-on-surface"}`}>
                        {label}
                        {t("weekday.suffix")}
                        {isToday && ` · ${t("routine.todaySuffix")}`}
                      </span>
                      <button
                        onClick={() => setAddingDate(addingDate === dateStr ? null : dateStr)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]"
                      >
                        <MaterialIcon name="add" className="text-[14px]" />
                      </button>
                    </div>

                    {isToday ? (
                      <span className="w-fit rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-on-primary">
                        {t("routine.todaySuffix").toUpperCase()}
                      </span>
                    ) : dayRoutines.length === 0 ? (
                      <span className="w-fit rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                        REST
                      </span>
                    ) : isDone ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-secondary">
                        <MaterialIcon name="check_circle" className="text-[12px]" />
                        DONE
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] text-on-surface-variant">
                        SCHEDULED
                      </span>
                    )}

                    {addingDate === dateStr && (
                      <form
                        onSubmit={(e) => handleAddRoutine(e, dateStr)}
                        className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-2"
                      >
                        <select
                          value={newBodyPart}
                          onChange={(e) => handleNewBodyPartChange(e.target.value)}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-on-surface"
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
                          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-on-surface"
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
                          className="rounded-lg bg-primary-container py-1 text-xs font-semibold text-on-primary-container hover:brightness-110"
                        >
                          {t("common.add")}
                        </button>
                      </form>
                    )}

                    <div className="flex flex-col gap-1.5">
                      {dayRoutines.length === 0 && (
                        <p className="text-xs text-on-surface-variant">{t("routine.noRoutine")}</p>
                      )}
                      {dayRoutines.map((routine) => {
                        const isExpanded = expandedRoutineId === routine.id;
                        return (
                          <div key={routine.id} className="rounded-lg bg-surface-container p-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                              >
                                <span className="shrink-0 rounded bg-primary-container/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary-container">
                                  {bodyPartLabel(routine.bodyPart, t)}
                                </span>
                                <span className="truncate text-xs font-medium text-on-surface">
                                  {exerciseDisplayName(routine.exerciseName)}
                                </span>
                                {routine.fromTemplate && (
                                  <MaterialIcon name="repeat" className="shrink-0 text-[11px] text-on-surface-variant" />
                                )}
                                {routine.sets.length > 0 && (
                                  <span className="shrink-0 font-mono text-[10px] text-on-surface-variant">
                                    {t("common.setCount", { n: routine.sets.length })}
                                  </span>
                                )}
                                <MaterialIcon
                                  name={isExpanded ? "expand_less" : "expand_more"}
                                  className="shrink-0 text-[13px] text-on-surface-variant"
                                />
                              </button>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button onClick={() => handleToggle(routine.id)}>
                                  <MaterialIcon
                                    name="check_circle"
                                    className={`text-[16px] ${routine.done ? "text-primary-container" : "text-white/10"}`}
                                  />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoutine(routine.id)}
                                  className="text-on-surface-variant hover:text-error"
                                >
                                  <MaterialIcon name="delete" className="text-[14px]" />
                                </button>
                              </div>
                            </div>
                            {isExpanded && <SetPanel routine={routine} onUpdate={handleRoutineUpdate} />}
                          </div>
                        );
                      })}
                    </div>

                    {/* 요일별 실측 미니 지표 — 볼륨/세트수(전부 실제 계산값) */}
                    {dayRoutines.length > 0 && (
                      <div className="mt-auto flex flex-col gap-1 rounded-xl bg-surface-container-lowest/60 p-2 font-mono text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-on-surface-variant">VOLUME</span>
                          <span className="font-semibold text-primary-container">{dayVolume.toLocaleString()} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-on-surface-variant">TOTAL SETS</span>
                          <span className="text-on-surface">{daySets}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 반복 루틴 설정 */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <h2 className="text-base font-semibold text-on-surface">{t("routine.repeatSettings")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("routine.repeatDesc")}</p>

            <form onSubmit={handleAddTemplate} className="mt-4 flex flex-wrap items-end gap-2">
              <select
                value={newTemplateDay}
                onChange={(e) => setNewTemplateDay(e.target.value as (typeof WEEKDAYS)[number])}
                className="rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface"
              >
                {WEEKDAYS.map((day, i) => (
                  <option key={day} value={day} className="bg-surface-container">
                    {labels[i]}
                    {t("weekday.suffix")}
                  </option>
                ))}
              </select>
              <select
                value={newTemplateBodyPart}
                onChange={(e) => handleTemplateBodyPartChange(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface"
              >
                {BODY_PARTS.map((part) => (
                  <option key={part.code} value={part.code} className="bg-surface-container">
                    {bodyPartLabel(part.code, t)}
                  </option>
                ))}
              </select>
              <select
                required
                value={newTemplateExerciseName}
                onChange={(e) => setNewTemplateExerciseName(e.target.value)}
                className="min-w-[140px] flex-1 rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface"
              >
                <option value="" disabled className="bg-surface-container">
                  {t("common.selectExercise")}
                </option>
                {exercisesForTemplate.map((ex) => (
                  <option key={ex.id} value={ex.name} className="bg-surface-container">
                    {ex.displayName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container hover:brightness-110"
              >
                {t("routine.addRepeat")}
              </button>
            </form>

            {templateGroups.length === 0 && (
              <p className="mt-4 text-sm text-on-surface-variant">{t("routine.noRepeat")}</p>
            )}
            <div className="mt-4 space-y-4">
              {templateGroups.map((group) => (
                <div key={group.day}>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t("routine.weeklyLabel", { day: group.label })}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {group.items.map((template) => (
                      <li
                        key={template.id}
                        className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-primary-container/15 px-2 py-1 text-xs font-semibold text-primary-container">
                            {bodyPartLabel(template.bodyPart, t)}
                          </span>
                          <span className="text-sm text-on-surface">{exerciseDisplayName(template.exerciseName)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-on-surface-variant hover:text-error"
                        >
                          <MaterialIcon name="delete" className="text-[16px]" />
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
