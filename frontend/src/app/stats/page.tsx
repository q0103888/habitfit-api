"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
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
// 화면 표시는 아래 BIG_THREE_LABEL_KEYS로 번역된 라벨을 따로 씀
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

  // 운동 카탈로그는 언어 전환 시 표시 이름(displayName)이 바뀌므로 locale이 바뀔 때마다 다시 불러옴
  useEffect(() => {
    getExercises(locale).then((list) => {
      setExercises(list);
      setSelectedExercise((prev) => prev || list.find((ex) => ex.bodyPart === BODY_PARTS[0].code)?.name || "");
    });
  }, [locale]);

  // 선택된 운동이 바뀔 때마다 그 운동의 무게 추이를 다시 불러옴
  useEffect(() => {
    if (!selectedExercise) return;
    getExerciseHistory(selectedExercise).then(setHistory);
  }, [selectedExercise]);

  const exercisesForPart = exercises.filter((ex) => ex.bodyPart === selectedBodyPart);

  // 부위를 바꾸면 운동 목록도 바뀌니, 운동 선택도 그 부위의 첫 항목으로 같이 리셋
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

  return (
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-white">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("stats.subtitle")}</p>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">{t("stats.bigThree")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {BIG_THREE.map((name, i) => (
                <div key={name} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold text-zinc-400">{t(BIG_THREE_LABEL_KEYS[i])}</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {bigThree[name] ? `${bigThree[name]}kg` : "-"}
                  </p>
                </div>
              ))}
              <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-4">
                <p className="text-xs font-semibold text-lime-400">{t("stats.bigThreeTotal")}</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {BIG_THREE.reduce((sum, name) => sum + (bigThree[name] ?? 0), 0)}kg
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">{t("stats.recoveryTitle")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {BODY_PARTS.map((part) => {
                const entry = recovery.find((r) => r.bodyPart === part.code);
                const days = entry ? daysSince(entry.lastTrainedDate) : null;
                const resting = days !== null && days < 2;
                return (
                  <div key={part.code} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs font-semibold text-zinc-400">{bodyPartLabel(part.code, t)}</p>
                    <p
                      className={`mt-2 text-sm font-bold ${
                        days === null ? "text-zinc-500" : resting ? "text-amber-400" : "text-lime-400"
                      }`}
                    >
                      {days === null ? t("recovery.noRecord") : resting ? t("recovery.resting") : t("recovery.ready")}
                    </p>
                    {days !== null && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {days === 0 ? t("recovery.today") : t("recovery.daysAgo", { n: days })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">{t("stats.bodyPartShare")}</h2>
            <div className="mt-6">
              <PieChart
                segments={bodyPartSummary.map((s) => ({
                  label: bodyPartLabel(s.bodyPart, t),
                  value: s.count,
                }))}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">{t("stats.weightChange")}</h2>
            <div className="mt-6">
              <LineChart
                points={bodyWeightLogs.map((log) => ({
                  label: shortDate(log.recordedDate),
                  value: log.weightKg,
                }))}
                unit="kg"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{t("stats.exerciseWeightChange")}</h2>
              <div className="flex gap-2">
                <select
                  value={selectedBodyPart}
                  onChange={(e) => handleBodyPartChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {BODY_PARTS.map((part) => (
                    <option key={part.code} value={part.code} className="bg-zinc-900">
                      {bodyPartLabel(part.code, t)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {exercisesForPart.map((ex) => (
                    <option key={ex.id} value={ex.name} className="bg-zinc-900">
                      {ex.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("stats.sessionMaxWeight")}
              </p>
              <LineChart
                points={history.map((h) => ({ label: shortDate(h.date), value: h.maxWeightKg }))}
                unit="kg"
              />
            </div>
            <div className="mt-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("stats.totalVolume")}
              </p>
              <LineChart
                points={history.map((h) => ({ label: shortDate(h.date), value: h.totalVolumeKg }))}
                unit="kg"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
