"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { MaterialIcon } from "@/components/material-icon";
import { LineChart } from "@/components/line-chart";
import { PieChart } from "@/components/pie-chart";
import {
  getBodyWeightLogs,
  getExercises,
  getExerciseHistory,
  getBodyPartSummary,
  getRecoveryStatus,
  type BodyWeightLog,
  type Exercise,
  type ExerciseHistoryPoint,
  type BodyPartSummaryPoint,
  type BodyPartRecoveryPoint,
} from "@/lib/api";
import { BODY_PARTS } from "@/lib/constants";
import { useLanguage, bodyPartLabel, type Key } from "@/lib/i18n";

// "2026-08-26" -> "08/26" — 그래프 x축 라벨용
function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

// 3대 운동 — 운동 카탈로그의 정확한(한국어) 이름과 일치해야 API 조회가 되므로, 이 값 자체는 고정.
const BIG_THREE = ["벤치프레스", "데드리프트", "스쿼트"];
const BIG_THREE_LABEL_KEYS: Key[] = ["bigThree.benchPress", "bigThree.deadlift", "bigThree.squat"];

export default function StatsPage() {
  return (
    <RequireAuth>
      <Stats />
    </RequireAuth>
  );
}

function Stats() {
  const { locale, t } = useLanguage();
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState(BODY_PARTS[0].code);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [bodyPartSummary, setBodyPartSummary] = useState<BodyPartSummaryPoint[]>([]);
  const [bigThree, setBigThree] = useState<Record<string, number>>({});
  const [recovery, setRecovery] = useState<BodyPartRecoveryPoint[]>([]);

  useEffect(() => {
    getBodyWeightLogs().then(setBodyWeightLogs);
    getBodyPartSummary().then(setBodyPartSummary);
    getRecoveryStatus().then(setRecovery);
    Promise.all(BIG_THREE.map((name) => getExerciseHistory(name))).then((results) => {
      const records: Record<string, number> = {};
      BIG_THREE.forEach((name, i) => {
        records[name] = results[i].reduce((max, p) => Math.max(max, p.maxWeightKg), 0);
      });
      setBigThree(records);
    });
  }, []);

  useEffect(() => {
    getExercises(locale).then((list) => {
      setExercises(list);
      setSelectedExercise((prev) => prev || list.find((ex) => ex.bodyPart === BODY_PARTS[0].code)?.name || "");
    });
  }, [locale]);

  useEffect(() => {
    if (!selectedExercise) return;
    getExerciseHistory(selectedExercise).then(setHistory);
  }, [selectedExercise]);

  const exercisesForPart = exercises.filter((ex) => ex.bodyPart === selectedBodyPart);
  const selectedExerciseLabel = exercises.find((ex) => ex.name === selectedExercise)?.displayName ?? selectedExercise;

  function handleBodyPartChange(part: string) {
    setSelectedBodyPart(part);
    setSelectedExercise(exercises.find((ex) => ex.bodyPart === part)?.name ?? "");
  }

  // 마지막 훈련일로부터 며칠 지났는지 — 48시간(2일) 기준으로 회복중/준비완료 판정
  function daysSince(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const then = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    then.setHours(0, 0, 0, 0);
    return Math.round((today.getTime() - then.getTime()) / 86400000);
  }

  const readyCount = recovery.filter((r) => daysSince(r.lastTrainedDate) >= 2).length;
  const bigThreeTotal = BIG_THREE.reduce((sum, name) => sum + (bigThree[name] ?? 0), 0);

  const latestWeight = bodyWeightLogs.at(-1);
  const firstWeight = bodyWeightLogs[0];
  const weightDelta = latestWeight && firstWeight ? latestWeight.weightKg - firstWeight.weightKg : null;

  // 현재 최고 중량(또는 시간)/역대 PR/최근 볼륨/시작 대비 증가량 — 전부 선택된 운동의 실제 history 배열에서 계산.
  // 유산소는 무게가 아니라 시간(분)이 기준이라 totalDurationMin 쪽을 봄
  const isCardioSelected = selectedBodyPart === "CARDIO";
  const latestPoint = history.at(-1);
  const firstPoint = history[0];
  const allTimeMax = isCardioSelected
    ? history.reduce((max, p) => Math.max(max, p.totalDurationMin ?? 0), 0)
    : history.reduce((max, p) => Math.max(max, p.maxWeightKg), 0);
  const maxDelta =
    latestPoint && firstPoint
      ? isCardioSelected
        ? (latestPoint.totalDurationMin ?? 0) - (firstPoint.totalDurationMin ?? 0)
        : latestPoint.maxWeightKg - firstPoint.maxWeightKg
      : null;

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="border-b border-white/[0.08] bg-surface-container-lowest/60 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-on-surface">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("stats.subtitle")}</p>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          {/* KPI 스트립 — 4개 다 이미 불러온 실제 데이터에서 계산 */}
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <article className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 shadow-md backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("stats.bigThreeTotal")}
                </span>
                <MaterialIcon name="military_tech" className="text-[18px] text-primary-container" />
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-on-surface">{bigThreeTotal}kg</p>
            </article>

            <article className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 shadow-md backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("stats.readyBodyParts")}
                </span>
                <MaterialIcon name="bolt" className="text-[18px] text-secondary" />
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-on-surface">
                {readyCount}/{BODY_PARTS.length}
              </p>
            </article>

            <article className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 shadow-md backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-tertiary/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("stats.currentWeight")}
                </span>
                <MaterialIcon name="monitor_weight" className="text-[18px] text-tertiary" />
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-on-surface">
                {latestWeight ? `${latestWeight.weightKg}kg` : "-"}
              </p>
              {weightDelta !== null && (
                <p className={`mt-1 text-xs font-semibold ${weightDelta <= 0 ? "text-tertiary" : "text-primary-container"}`}>
                  {weightDelta > 0 ? "+" : ""}
                  {weightDelta.toFixed(1)}kg
                </p>
              )}
            </article>

            <article className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 shadow-md backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("stats.weightLogCount", { n: bodyWeightLogs.length })}
                </span>
                <MaterialIcon name="event_available" className="text-[18px] text-primary-container" />
              </div>
              <p className="mt-3 font-mono text-2xl font-bold text-on-surface">{bodyWeightLogs.length}</p>
            </article>
          </section>

          {/* 몸무게 변화(라인) + 부위별 비중(도넛) — 8:4 듀얼 컬럼 */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <article className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl xl:col-span-8">
              <h2 className="text-base font-semibold text-on-surface">{t("stats.weightChange")}</h2>
              <div className="mt-6">
                <LineChart
                  points={bodyWeightLogs.map((log) => ({
                    label: shortDate(log.recordedDate),
                    value: log.weightKg,
                  }))}
                  unit="kg"
                />
              </div>
            </article>

            <article className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl xl:col-span-4">
              <h2 className="text-base font-semibold text-on-surface">{t("stats.bodyPartShare")}</h2>
              <div className="mt-6">
                <PieChart
                  segments={bodyPartSummary.map((s) => ({
                    label: bodyPartLabel(s.bodyPart, t),
                    value: s.count,
                  }))}
                />
              </div>
            </article>
          </section>

          {/* 3대 운동 최고 기록 */}
          <section className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl">
            <h2 className="text-base font-semibold text-on-surface">{t("stats.bigThree")}</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {BIG_THREE.map((name, i) => (
                <div key={name} className="rounded-xl bg-surface-container-lowest/60 p-4">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t(BIG_THREE_LABEL_KEYS[i])}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold text-on-surface">
                    {bigThree[name] ? `${bigThree[name]}kg` : "-"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 종목별 기록 추이 — 탭(부위/운동) + 듀얼 차트 + 진단 레일 */}
          <section className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <MaterialIcon name="monitoring" className="text-[20px] text-primary-container" />
                <h2 className="text-base font-semibold text-on-surface">{t("stats.deepDiveTitle")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {BODY_PARTS.map((part) => (
                  <button
                    key={part.code}
                    onClick={() => handleBodyPartChange(part.code)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedBodyPart === part.code
                        ? "bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(163,230,53,0.35)]"
                        : "border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]"
                    }`}
                  >
                    {bodyPartLabel(part.code, t)}
                  </button>
                ))}
              </div>
            </div>

            {/* 부위 안 운동 개수가 계속 늘어날 수 있어 필 버튼 대신 드롭다운으로 */}
            <div className="mt-4">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-surface-container-lowest/60 px-3 py-2 text-sm text-on-surface sm:w-auto"
              >
                {exercisesForPart.map((ex) => (
                  <option key={ex.id} value={ex.name} className="bg-surface-container">
                    {ex.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="flex flex-col gap-8 lg:col-span-9">
                {isCardioSelected ? (
                  <div>
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t("stats.sessionDuration")}
                    </p>
                    <LineChart
                      points={history.map((h) => ({ label: shortDate(h.date), value: h.totalDurationMin ?? 0 }))}
                      unit="분"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t("stats.sessionMaxWeight")}
                      </p>
                      <LineChart
                        points={history.map((h) => ({ label: shortDate(h.date), value: h.maxWeightKg }))}
                        unit="kg"
                      />
                    </div>
                    <div>
                      <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t("stats.totalVolume")}
                      </p>
                      <LineChart
                        points={history.map((h) => ({ label: shortDate(h.date), value: h.totalVolumeKg }))}
                        unit="kg"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 진단 레일 — 선택된 운동의 history 배열에서 계산한 실제 수치만 표시 */}
              <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest/60 p-5 lg:col-span-3">
                <p className="border-b border-white/[0.08] pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {selectedExerciseLabel || "-"}
                </p>
                {isCardioSelected ? (
                  <>
                    <div>
                      <p className="text-xs text-on-surface-variant">{t("stats.currentDuration")}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-on-surface">
                        {latestPoint ? `${latestPoint.totalDurationMin ?? 0}분` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">{t("stats.allTimePr")}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-primary-container">
                        {history.length ? `${allTimeMax}분` : "-"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-on-surface-variant">{t("stats.currentMax")}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-on-surface">
                        {latestPoint ? `${latestPoint.maxWeightKg}kg` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">{t("stats.allTimePr")}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-primary-container">
                        {history.length ? `${allTimeMax}kg` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">{t("stats.recentVolume")}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-on-surface">
                        {latestPoint ? `${latestPoint.totalVolumeKg}kg` : "-"}
                      </p>
                    </div>
                  </>
                )}
                {maxDelta !== null && (
                  <div>
                    <p className="text-xs text-on-surface-variant">{t("stats.sinceStart")}</p>
                    <p className={`mt-1 font-mono text-lg font-bold ${maxDelta >= 0 ? "text-secondary" : "text-error"}`}>
                      {maxDelta > 0 ? "+" : ""}
                      {maxDelta}
                      {isCardioSelected ? "분" : "kg"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 부위별 회복 상태 */}
          <section className="rounded-2xl bg-white/[0.04] p-6 shadow-md backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">{t("stats.recoveryTitle")}</h2>
              <span className="font-mono text-xs text-on-surface-variant">
                {readyCount}/{BODY_PARTS.length}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {BODY_PARTS.map((part) => {
                const entry = recovery.find((r) => r.bodyPart === part.code);
                const days = entry ? daysSince(entry.lastTrainedDate) : null;
                const resting = days !== null && days < 2;
                return (
                  <div key={part.code} className="rounded-xl bg-surface-container-lowest/60 p-4">
                    <p className="text-xs font-semibold text-on-surface-variant">{bodyPartLabel(part.code, t)}</p>
                    <p
                      className={`mt-2 text-sm font-bold ${
                        days === null ? "text-on-surface-variant" : resting ? "text-tertiary" : "text-primary-container"
                      }`}
                    >
                      {days === null ? t("recovery.noRecord") : resting ? t("recovery.resting") : t("recovery.ready")}
                    </p>
                    {days !== null && (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {days === 0 ? t("recovery.today") : t("recovery.daysAgo", { n: days })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
