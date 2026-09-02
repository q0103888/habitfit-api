"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { addSet, deleteSet, getExerciseHistory, type Routine } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

// 대시보드/루틴/캘린더/운동세션에서 공통으로 쓰는 세트 기록 패널.
// 세트 목록+추가/삭제 폼에 더해, 지난 세션 최고 무게 참고와 신기록 알림을 붙임
export function SetPanel({ routine, onUpdate }: { routine: Routine; onUpdate: (routine: Routine) => void }) {
  const { t } = useLanguage();
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [lastBest, setLastBest] = useState<number | null>(null); // 지난 세션 최고 무게(참고용)
  const [allTimeMax, setAllTimeMax] = useState(0); // 신기록 판정 기준
  const [justPR, setJustPR] = useState(false);

  useEffect(() => {
    getExerciseHistory(routine.exerciseName).then((history) => {
      if (history.length === 0) return;
      setLastBest(history[history.length - 1].maxWeightKg);
      setAllTimeMax(Math.max(...history.map((h) => h.maxWeightKg)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.exerciseName]);

  async function handleAddSet(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weightInput);
    const reps = Number(repsInput);
    if (Number.isNaN(weightKg) || !reps) return;
    const updated = await addSet(routine.id, { weightKg, reps });
    onUpdate(updated);
    setJustPR(allTimeMax > 0 && weightKg > allTimeMax);
    setAllTimeMax((prev) => Math.max(prev, weightKg));
    setWeightInput("");
    setRepsInput("");
  }

  async function handleDeleteSet(setId: number) {
    onUpdate(await deleteSet(routine.id, setId));
  }

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3">
      {routine.sets.length === 0 && <p className="text-xs text-zinc-500">{t("common.noSetsYet")}</p>}
      <ul className="space-y-1.5">
        {routine.sets.map((set) => (
          <li key={set.id} className="flex items-center justify-between text-xs text-zinc-300">
            <span>{t("common.setLine", { n: set.setNumber, weight: set.weightKg, reps: set.reps })}</span>
            <button onClick={() => handleDeleteSet(set.id)} className="text-zinc-600 hover:text-rose-400">
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>

      {lastBest !== null && (
        <p className="mt-2 text-[11px] text-zinc-400">{t("session.suggestion", { weight: lastBest })}</p>
      )}
      {justPR && <p className="mt-1 text-[11px] font-semibold text-amber-400">{t("session.newRecord")}</p>}

      <form onSubmit={handleAddSet} className="mt-2 flex items-center gap-2">
        <input
          required
          type="number"
          step="0.5"
          placeholder={t("common.weightKgPlaceholder")}
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-zinc-600"
        />
        <input
          required
          type="number"
          placeholder={t("common.repsPlaceholder")}
          value={repsInput}
          onChange={(e) => setRepsInput(e.target.value)}
          className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="rounded-lg bg-lime-400 px-3 py-1 text-xs font-semibold text-black hover:bg-lime-300"
        >
          {t("common.addSet")}
        </button>
      </form>
    </div>
  );
}
