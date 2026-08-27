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
  type BodyWeightLog,
  type Exercise,
  type ExerciseHistoryPoint,
  type BodyPartSummaryPoint,
} from "@/lib/api";
import { BODY_PARTS, bodyPartLabel } from "@/lib/constants";

// "2026-08-26" -> "08/26" — 그래프 x축 라벨용
function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

// 3대 운동 — 운동 카탈로그의 정확한 이름과 일치해야 기록 조회가 됨
const BIG_THREE = ["벤치프레스", "데드리프트", "스쿼트"];

export default function StatsPage() {
  return (
    <RequireAuth>
      <Stats />
    </RequireAuth>
  );
}

function Stats() {
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState(BODY_PARTS[0].code);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([]);
  const [bodyPartSummary, setBodyPartSummary] = useState<BodyPartSummaryPoint[]>([]);
  const [bigThree, setBigThree] = useState<Record<string, number>>({});

  useEffect(() => {
    getBodyWeightLogs().then(setBodyWeightLogs);
    getBodyPartSummary().then(setBodyPartSummary);
    getExercises().then((list) => {
      setExercises(list);
      setSelectedExercise(list.find((ex) => ex.bodyPart === BODY_PARTS[0].code)?.name ?? "");
    });
    Promise.all(BIG_THREE.map((name) => getExerciseHistory(name))).then((results) => {
      const records: Record<string, number> = {};
      BIG_THREE.forEach((name, i) => {
        records[name] = results[i].reduce((max, p) => Math.max(max, p.maxWeightKg), 0);
      });
      setBigThree(records);
    });
  }, []);

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

  return (
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-white">통계</h1>
          <p className="mt-1 text-sm text-zinc-400">몸무게와 운동별 무게 변화를 확인하세요.</p>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">3대 운동 최고 기록</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {BIG_THREE.map((name) => (
                <div key={name} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-semibold text-zinc-400">{name}</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {bigThree[name] ? `${bigThree[name]}kg` : "-"}
                  </p>
                </div>
              ))}
              <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-4">
                <p className="text-xs font-semibold text-lime-400">3대 합계</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {BIG_THREE.reduce((sum, name) => sum + (bigThree[name] ?? 0), 0)}kg
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">부위별 운동 비중 (최근 30일)</h2>
            <div className="mt-6">
              <PieChart
                segments={bodyPartSummary.map((s) => ({
                  label: bodyPartLabel(s.bodyPart),
                  value: s.count,
                }))}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-base font-semibold text-white">몸무게 변화</h2>
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
              <h2 className="text-base font-semibold text-white">운동별 무게 변화</h2>
              <div className="flex gap-2">
                <select
                  value={selectedBodyPart}
                  onChange={(e) => handleBodyPartChange(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {BODY_PARTS.map((part) => (
                    <option key={part.code} value={part.code} className="bg-zinc-900">
                      {part.label}
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
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                세션별 최고 무게
              </p>
              <LineChart
                points={history.map((h) => ({ label: shortDate(h.date), value: h.maxWeightKg }))}
                unit="kg"
              />
            </div>
            <div className="mt-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                총 볼륨 (무게 x 횟수 합)
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
