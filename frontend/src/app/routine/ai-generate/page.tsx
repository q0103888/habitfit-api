"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { MaterialIcon } from "@/components/material-icon";
import {
  generateRoutinePlan,
  createTemplate,
  getTemplates,
  deleteTemplate,
  getExercises,
  WEEKDAYS,
  type PlannedExercise,
  type Exercise,
  type RoutineTemplate,
} from "@/lib/api";
import { BODY_PARTS } from "@/lib/constants";
import { useLanguage, bodyPartLabel, weekdayLabels, type Key } from "@/lib/i18n";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

type DayConfig = { dayOfWeek: (typeof WEEKDAYS)[number]; bodyParts: string[] };

export default function AiRoutinePage() {
  return (
    <RequireAuth>
      <AiRoutineGenerator />
    </RequireAuth>
  );
}

// AI 루틴 자동 생성 화면 — 분할/부위/세션시간/숙련도를 정해서 AI에게 요일별 루틴을 짜달라고 요청.
// 결과는 바로 저장되지 않고 미리보기로만 뜨고, 종목별로 교체/삭제 가능. "적용"을 눌러야
// 기존 반복 루틴 템플릿 API(POST /api/routine-templates)로 실제 등록됨
function AiRoutineGenerator() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const labels = weekdayLabels(t);

  const [days, setDays] = useState<DayConfig[]>([{ dayOfWeek: "MONDAY", bodyParts: [] }]);
  const [sessionDurationMin, setSessionDurationMin] = useState(60);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("INTERMEDIATE");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plan, setPlan] = useState<PlannedExercise[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [error, setError] = useState("");
  // 적용하려는 요일에 이미 등록된 반복 템플릿이 있으면 여기 채워서 모달로 물어봄
  const [conflictingTemplates, setConflictingTemplates] = useState<RoutineTemplate[] | null>(null);

  useEffect(() => {
    getExercises(locale).then(setExercises);
  }, [locale]);

  function exerciseDisplayName(name: string) {
    return exercises.find((ex) => ex.name === name)?.displayName ?? name;
  }

  function addDay() {
    const used = new Set(days.map((d) => d.dayOfWeek));
    const next = WEEKDAYS.find((w) => !used.has(w)) ?? WEEKDAYS[0];
    setDays((prev) => [...prev, { dayOfWeek: next, bodyParts: [] }]);
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDayOfWeek(index: number, dayOfWeek: (typeof WEEKDAYS)[number]) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, dayOfWeek } : d)));
  }

  function toggleBodyPart(index: number, code: string) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === index
          ? {
              ...d,
              bodyParts: d.bodyParts.includes(code)
                ? d.bodyParts.filter((b) => b !== code)
                : [...d.bodyParts, code],
            }
          : d,
      ),
    );
  }

  async function handleGenerate() {
    setError("");
    setIsGenerating(true);
    try {
      const result = await generateRoutinePlan({ days, sessionDurationMin, level });
      setPlan(result.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  function removePlanItem(idx: number) {
    setPlan((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  }

  function changePlanItemExercise(idx: number, exerciseName: string) {
    setPlan((prev) => (prev ? prev.map((p, i) => (i === idx ? { ...p, exerciseName } : p)) : prev));
  }

  // 부위를 바꾸면 기존 종목명은 그 부위와 안 맞을 수 있으니, 새 부위의 첫 종목으로 같이 리셋
  function changePlanItemBodyPart(idx: number, bodyPart: string) {
    const firstExercise = exercises.find((ex) => ex.bodyPart === bodyPart)?.name ?? "";
    setPlan((prev) =>
      prev ? prev.map((p, i) => (i === idx ? { ...p, bodyPart, exerciseName: firstExercise } : p)) : prev,
    );
  }

  // 해당 요일에 새 종목 한 줄 추가 — 기본 부위는 그 요일에 설정해둔 첫 부위(없으면 전체 중 첫 부위)
  function addPlanItem(dayOfWeek: (typeof WEEKDAYS)[number]) {
    const dayConfig = days.find((d) => d.dayOfWeek === dayOfWeek);
    const bodyPart = dayConfig?.bodyParts[0] ?? BODY_PARTS[0].code;
    const exerciseName = exercises.find((ex) => ex.bodyPart === bodyPart)?.name ?? "";
    setPlan((prev) => [...(prev ?? []), { dayOfWeek, bodyPart, exerciseName }]);
  }

  // "적용" 누르면 먼저 이번 플랜이 건드리는 요일에 이미 등록된 반복 템플릿이 있는지 확인.
  // 겹치는 게 있으면 모달로 교체/같이두기를 묻고, 없으면 바로 적용
  async function handleApply() {
    if (!plan || plan.length === 0) return;
    setError("");
    setIsCheckingConflicts(true);
    try {
      const planDays = new Set(plan.map((p) => p.dayOfWeek));
      const existing = await getTemplates();
      const conflicts = existing.filter((tpl) => planDays.has(tpl.dayOfWeek));
      if (conflicts.length > 0) {
        setConflictingTemplates(conflicts);
      } else {
        await applyPlan([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCheckingConflicts(false);
    }
  }

  // templatesToDelete: "교체하기"를 고르면 겹치는 기존 템플릿들, "같이 두기"면 빈 배열
  async function applyPlan(templatesToDelete: RoutineTemplate[]) {
    if (!plan) return;
    setError("");
    setIsApplying(true);
    try {
      for (const tpl of templatesToDelete) {
        await deleteTemplate(tpl.id);
      }
      for (const item of plan) {
        await createTemplate({
          bodyPart: item.bodyPart,
          exerciseName: item.exerciseName,
          dayOfWeek: item.dayOfWeek,
        });
      }
      router.push("/routine");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsApplying(false);
      setConflictingTemplates(null);
    }
  }

  // 설정해둔 분할 요일 기준으로 그룹을 만듦(종목을 전부 지워도 그 요일 카드 자체는 남아서 다시 추가 가능)
  const groupedPlan = days.map((d) => ({
    day: d.dayOfWeek,
    label: labels[WEEKDAYS.indexOf(d.dayOfWeek)],
    items: (plan ?? []).filter((p) => p.dayOfWeek === d.dayOfWeek),
  }));

  const canGenerate = days.length > 0 && days.every((d) => d.bodyParts.length > 0);

  // 모달에 "월요일 3개" 식으로 보여주기 위한 요일별 집계
  const conflictsByDay = conflictingTemplates
    ? WEEKDAYS.map((w, i) => ({
        label: labels[i],
        count: conflictingTemplates.filter((tpl) => tpl.dayOfWeek === w).length,
      })).filter((g) => g.count > 0)
    : [];

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="border-b border-white/[0.08] bg-surface-container-lowest/60 py-4 pl-16 pr-6 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-on-surface">{t("aiRoutine.title")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("aiRoutine.subtitle")}</p>
        </header>

        <main className="space-y-8 p-6 lg:p-8">
          {/* 분할 설정 — 요일마다 어떤 부위를 할지 */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">{t("aiRoutine.splitTitle")}</h2>
              <button
                onClick={addDay}
                disabled={days.length >= 7}
                className="flex items-center gap-1 rounded-full border border-white/[0.14] px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-white/[0.06] disabled:opacity-40"
              >
                <MaterialIcon name="add" className="text-[14px]" />
                {t("aiRoutine.addDay")}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {days.map((day, idx) => (
                <div key={idx} className="rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary-container">
                        {t("aiRoutine.dayLabel", { n: idx + 1 })}
                      </span>
                      <select
                        value={day.dayOfWeek}
                        onChange={(e) => updateDayOfWeek(idx, e.target.value as (typeof WEEKDAYS)[number])}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-sm text-on-surface"
                      >
                        {WEEKDAYS.map((w, i) => (
                          <option key={w} value={w} className="bg-surface-container">
                            {labels[i]}
                            {t("weekday.suffix")}
                          </option>
                        ))}
                      </select>
                    </div>
                    {days.length > 1 && (
                      <button onClick={() => removeDay(idx)} className="text-on-surface-variant hover:text-error">
                        <MaterialIcon name="delete" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {BODY_PARTS.map((part) => {
                      const active = day.bodyParts.includes(part.code);
                      return (
                        <button
                          key={part.code}
                          onClick={() => toggleBodyPart(idx, part.code)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                            active
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-white/[0.04] text-on-surface-variant hover:bg-white/[0.08]"
                          }`}
                        >
                          {bodyPartLabel(part.code, t)}
                        </button>
                      );
                    })}
                  </div>
                  {day.bodyParts.length === 0 && (
                    <p className="mt-2 text-xs text-error">{t("aiRoutine.selectBodyParts")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 세션 시간 + 숙련도 */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {t("aiRoutine.sessionDuration")}
              </span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={5}
                  value={sessionDurationMin}
                  onChange={(e) => setSessionDurationMin(Number(e.target.value))}
                  className="w-24 rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface"
                />
                <span className="text-sm text-on-surface-variant">{t("aiRoutine.minutesUnit")}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {t("aiRoutine.level")}
              </span>
              <div className="mt-2 flex gap-2">
                {LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setLevel(lv)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      level === lv
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-lowest/60 text-on-surface-variant hover:bg-white/[0.06]"
                    }`}
                  >
                    {t(`aiRoutine.level.${lv}` as Key)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3.5 text-sm font-bold uppercase tracking-tight text-on-primary-container shadow-[0_0_24px_rgba(163,230,53,0.35)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MaterialIcon name="auto_awesome" className="text-[20px]" />
            {isGenerating ? t("aiRoutine.generating") : t("aiRoutine.generate")}
          </button>

          {/* 미리보기 — 요일별로 묶어서 보여줌, 종목별 교체/삭제 가능 */}
          {plan && (
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-on-surface">{t("aiRoutine.previewTitle")}</h2>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1 rounded-full border border-white/[0.14] px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-white/[0.06]"
                >
                  <MaterialIcon name="refresh" className="text-[14px]" />
                  {t("aiRoutine.regenerate")}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedPlan.map((group) => (
                  <div
                    key={group.day}
                    className="rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs font-bold text-primary-container">
                        {group.label}
                        {t("weekday.suffix")}
                      </p>
                      <button
                        onClick={() => addPlanItem(group.day)}
                        className="text-on-surface-variant hover:text-primary-container"
                      >
                        <MaterialIcon name="add_circle" className="text-[16px]" />
                      </button>
                    </div>
                    {group.items.length === 0 ? (
                      <p className="mt-2 text-xs text-on-surface-variant">{t("aiRoutine.previewEmpty")}</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {group.items.map((item) => {
                          const planIdx = plan.indexOf(item);
                          const exercisesForBodyPart = exercises.filter((ex) => ex.bodyPart === item.bodyPart);
                          return (
                            <li key={planIdx} className="flex items-center gap-1.5">
                              <select
                                value={item.bodyPart}
                                onChange={(e) => changePlanItemBodyPart(planIdx, e.target.value)}
                                className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-1.5 py-1 text-xs text-on-surface"
                              >
                                {BODY_PARTS.map((part) => (
                                  <option key={part.code} value={part.code} className="bg-surface-container">
                                    {bodyPartLabel(part.code, t)}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={item.exerciseName}
                                onChange={(e) => changePlanItemExercise(planIdx, e.target.value)}
                                className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs text-on-surface"
                              >
                                {!exercisesForBodyPart.some((ex) => ex.name === item.exerciseName) && (
                                  <option value={item.exerciseName} className="bg-surface-container">
                                    {exerciseDisplayName(item.exerciseName)}
                                  </option>
                                )}
                                {exercisesForBodyPart.map((ex) => (
                                  <option key={ex.id} value={ex.name} className="bg-surface-container">
                                    {ex.displayName}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => removePlanItem(planIdx)}
                                className="shrink-0 text-on-surface-variant hover:text-error"
                              >
                                <MaterialIcon name="close" className="text-[14px]" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleApply}
                disabled={isApplying || isCheckingConflicts || plan.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3 text-sm font-bold text-on-primary-container hover:brightness-110 disabled:opacity-50"
              >
                <MaterialIcon name="check" className="text-[18px]" />
                {isApplying ? t("aiRoutine.applying") : t("aiRoutine.apply")}
              </button>
            </section>
          )}
        </main>
      </div>

      {/* 적용하려는 요일에 기존 반복 템플릿이 있을 때만 뜨는 확인 모달 — 겹치는 요일만 대상으로 함 */}
      {conflictingTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-surface-container-lowest p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-on-surface">{t("aiRoutine.conflictTitle")}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">{t("aiRoutine.conflictDesc")}</p>
            <ul className="mt-3 space-y-1">
              {conflictsByDay.map((g) => (
                <li key={g.label} className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>
                    {g.label}
                    {t("weekday.suffix")}
                  </span>
                  <span className="font-mono">{t("aiRoutine.conflictCount", { n: g.count })}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => applyPlan(conflictingTemplates)}
                disabled={isApplying}
                className="rounded-xl bg-primary-container py-2.5 text-sm font-bold text-on-primary-container hover:brightness-110 disabled:opacity-50"
              >
                {t("aiRoutine.replaceExisting")}
              </button>
              <button
                onClick={() => applyPlan([])}
                disabled={isApplying}
                className="rounded-xl border border-white/[0.14] py-2.5 text-sm font-semibold text-on-surface hover:bg-white/[0.06] disabled:opacity-50"
              >
                {t("aiRoutine.keepBoth")}
              </button>
              <button
                onClick={() => setConflictingTemplates(null)}
                disabled={isApplying}
                className="py-2 text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-50"
              >
                {t("aiRoutine.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
