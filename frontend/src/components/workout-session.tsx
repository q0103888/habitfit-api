"use client";

import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { toggleRoutine, type Routine, type Exercise } from "@/lib/api";
import { useLanguage, bodyPartLabel } from "@/lib/i18n";
import { SetPanel } from "@/components/set-panel";

// "루틴 시작하기" 클릭 시 뜨는 세션 모달 — 오늘 미완료 운동을 한 번에 하나씩 진행하며
// 세트 기록 → 완료 처리 → 다음 운동으로 넘어가는 흐름. 끝나면 요약을 보여줌
export function WorkoutSession({
  initialQueue,
  exercises,
  onUpdate,
  onClose,
}: {
  initialQueue: Routine[];
  exercises: Exercise[];
  onUpdate: (routine: Routine) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = queue[index];

  function applyUpdate(updated: Routine) {
    setQueue((prev) => prev.map((r, i) => (i === index ? updated : r)));
    onUpdate(updated);
  }

  function goNext() {
    if (index + 1 < queue.length) setIndex(index + 1);
    else setFinished(true);
  }

  async function handleCompleteAndNext() {
    applyUpdate(await toggleRoutine(current.id));
    goNext();
  }

  if (!current || finished) {
    const totalSets = queue.reduce((sum, r) => sum + r.sets.length, 0);
    const totalVolume = queue.reduce(
      (sum, r) => sum + r.sets.reduce((s, set) => s + set.weightKg * set.reps, 0),
      0,
    );
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-lime-400/30 bg-zinc-950 p-8 text-center">
          <p className="text-2xl font-bold text-white">{t("session.completeTitle")}</p>
          <p className="mt-4 text-sm text-zinc-400">
            {t("session.summary", {
              count: queue.length,
              sets: totalSets,
              volume: totalVolume.toLocaleString(),
            })}
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-black hover:bg-lime-300"
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            {index + 1} / {queue.length}
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 inline-block rounded-lg bg-lime-400/15 px-2 py-1 text-xs font-semibold text-lime-300">
          {bodyPartLabel(current.bodyPart, t)}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          {exercises.find((ex) => ex.name === current.exerciseName)?.displayName ?? current.exerciseName}
        </h2>

        <div className="mt-4">
          <SetPanel routine={current} onUpdate={applyUpdate} />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={goNext}
            className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5"
          >
            {t("session.skip")}
          </button>
          <button
            onClick={handleCompleteAndNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 text-sm font-bold text-black hover:bg-lime-300"
          >
            {t("session.completeNext")} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
