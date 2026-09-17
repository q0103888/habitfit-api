"use client";

import { useEffect, useState, type FormEvent } from "react";
import { addSet, deleteSet, getExerciseHistory, type Routine } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { BodyPartIcon } from "@/components/body-part-icon";
import { MaterialIcon } from "@/components/material-icon";

// 대시보드/루틴/캘린더/운동세션에서 공통으로 쓰는 세트 기록 패널.
// 세트 목록+추가/삭제 폼에 더해, 지난 세션 최고 기록 참고와 신기록 알림을 붙임.
// 유산소(CARDIO)는 무게x횟수가 아니라 시간(분)이 기준이라 폼/기록 표시가 통째로 달라짐
export function SetPanel({ routine, onUpdate }: { routine: Routine; onUpdate: (routine: Routine) => void }) {
  const { t } = useLanguage();
  const isCardio = routine.bodyPart === "CARDIO";
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [lastBest, setLastBest] = useState<number | null>(null); // 지난 세션 최고 기록(무게 또는 시간, 참고용)
  const [allTimeMax, setAllTimeMax] = useState(0); // 신기록 판정 기준
  const [justPR, setJustPR] = useState(false);

  useEffect(() => {
    getExerciseHistory(routine.exerciseName).then((history) => {
      if (history.length === 0) return;
      if (isCardio) {
        setLastBest(history[history.length - 1].totalDurationMin ?? 0);
        setAllTimeMax(Math.max(...history.map((h) => h.totalDurationMin ?? 0)));
      } else {
        setLastBest(history[history.length - 1].maxWeightKg);
        setAllTimeMax(Math.max(...history.map((h) => h.maxWeightKg)));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.exerciseName, isCardio]);

  async function handleAddSet(e: FormEvent) {
    e.preventDefault();
    if (isCardio) {
      const durationMin = Number(durationInput);
      if (!durationMin) return;
      const updated = await addSet(routine.id, { durationMin });
      onUpdate(updated);
      setJustPR(allTimeMax > 0 && durationMin > allTimeMax);
      setAllTimeMax((prev) => Math.max(prev, durationMin));
      setDurationInput("");
      return;
    }
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
    <div className="mt-2 rounded-xl border border-white/[0.08] bg-surface-container-lowest/60 p-3">
      <BodyPartIcon bodyPart={routine.bodyPart} className="mb-3 h-12 w-12" />
      {routine.sets.length === 0 && <p className="text-xs text-on-surface-variant">{t("common.noSetsYet")}</p>}
      <ul className="space-y-1.5">
        {routine.sets.map((set) => (
          <li key={set.id} className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              {isCardio
                ? t("common.setLineDuration", { n: set.setNumber, duration: set.durationMin ?? 0 })
                : t("common.setLine", { n: set.setNumber, weight: set.weightKg ?? 0, reps: set.reps ?? 0 })}
            </span>
            <button onClick={() => handleDeleteSet(set.id)} className="text-on-surface-variant hover:text-error">
              <MaterialIcon name="delete" className="text-[14px]" />
            </button>
          </li>
        ))}
      </ul>

      {lastBest !== null && (
        <p className="mt-2 text-[11px] text-on-surface-variant">
          {isCardio
            ? t("session.suggestionDuration", { duration: lastBest })
            : t("session.suggestion", { weight: lastBest })}
        </p>
      )}
      {justPR && (
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-container/15 px-2 py-0.5 text-[11px] font-semibold text-primary-container">
          <MaterialIcon name="military_tech" className="text-[12px]" />
          {t("session.newRecord")}
        </p>
      )}

      {isCardio ? (
        <form onSubmit={handleAddSet} className="mt-2 flex items-center gap-2">
          <input
            required
            type="number"
            placeholder={t("common.durationMinPlaceholder")}
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            className="w-24 rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container hover:brightness-110"
          >
            {t("common.addSet")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddSet} className="mt-2 flex items-center gap-2">
          <input
            required
            type="number"
            step="0.5"
            placeholder={t("common.weightKgPlaceholder")}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-20 rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none"
          />
          <input
            required
            type="number"
            placeholder={t("common.repsPlaceholder")}
            value={repsInput}
            onChange={(e) => setRepsInput(e.target.value)}
            className="w-16 rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container hover:brightness-110"
          >
            {t("common.addSet")}
          </button>
        </form>
      )}
    </div>
  );
}
