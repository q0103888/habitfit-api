"use client";

import { useState, type FormEvent } from "react";
import { X, ChevronRight, Trash2 } from "lucide-react";
import { addSet, deleteSet, toggleRoutine, type Routine } from "@/lib/api";
import { bodyPartLabel } from "@/lib/constants";

// "루틴 시작하기" 클릭 시 뜨는 세션 모달 — 오늘 미완료 운동을 한 번에 하나씩 진행하며
// 세트 기록 → 완료 처리 → 다음 운동으로 넘어가는 흐름. 끝나면 요약을 보여줌
export function WorkoutSession({
  initialQueue,
  onUpdate,
  onClose,
}: {
  initialQueue: Routine[];
  onUpdate: (routine: Routine) => void;
  onClose: () => void;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [finished, setFinished] = useState(false);

  const current = queue[index];

  function applyUpdate(updated: Routine) {
    setQueue((prev) => prev.map((r, i) => (i === index ? updated : r)));
    onUpdate(updated);
  }

  async function handleAddSet(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weightInput);
    const reps = Number(repsInput);
    if (Number.isNaN(weightKg) || !reps) return;
    applyUpdate(await addSet(current.id, { weightKg, reps }));
    setWeightInput("");
    setRepsInput("");
  }

  async function handleDeleteSet(setId: number) {
    applyUpdate(await deleteSet(current.id, setId));
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
          <p className="text-2xl font-bold text-white">오늘 루틴 완료!</p>
          <p className="mt-4 text-sm text-zinc-400">
            운동 {queue.length}개 · 세트 {totalSets}개 · 총 볼륨 {totalVolume.toLocaleString()}kg
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-lime-400 py-3 text-sm font-bold text-black hover:bg-lime-300"
          >
            확인
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
          {bodyPartLabel(current.bodyPart)}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">{current.exerciseName}</h2>

        <ul className="mt-6 space-y-1.5">
          {current.sets.length === 0 && (
            <li className="text-sm text-zinc-500">아직 기록된 세트가 없어요.</li>
          )}
          {current.sets.map((set) => (
            <li key={set.id} className="flex items-center justify-between text-sm text-zinc-300">
              <span>
                {set.setNumber}세트 — {set.weightKg}kg x {set.reps}회
              </span>
              <button onClick={() => handleDeleteSet(set.id)} className="text-zinc-600 hover:text-rose-400">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddSet} className="mt-4 flex items-center gap-2">
          <input
            required
            type="number"
            step="0.5"
            placeholder="무게(kg)"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <input
            required
            type="number"
            placeholder="횟수"
            value={repsInput}
            onChange={(e) => setRepsInput(e.target.value)}
            className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            세트 추가
          </button>
        </form>

        <div className="mt-8 flex gap-3">
          <button
            onClick={goNext}
            className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5"
          >
            건너뛰기
          </button>
          <button
            onClick={handleCompleteAndNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 py-3 text-sm font-bold text-black hover:bg-lime-300"
          >
            완료하고 다음 <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
