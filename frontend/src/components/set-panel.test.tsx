import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SetPanel } from "./set-panel";
import { LanguageProvider } from "@/lib/i18n";
import type { Routine } from "@/lib/api";

// addSet/getExerciseHistory는 실제 API를 안 부르게 가짜로 대체.
// SetPanel의 "신기록 판정" 로직만 순수하게 검증하고 싶어서 네트워크는 전부 차단
vi.mock("@/lib/api", () => ({
  getExerciseHistory: vi.fn(),
  addSet: vi.fn(),
  deleteSet: vi.fn(),
}));

import { getExerciseHistory, addSet } from "@/lib/api";

function baseRoutine(): Routine {
  return {
    id: 1,
    bodyPart: "CHEST",
    exerciseName: "벤치프레스",
    scheduledDate: "2026-09-07",
    done: false,
    fromTemplate: false,
    sets: [],
  };
}

function renderPanel(routine: Routine, onUpdate = vi.fn()) {
  return render(
    <LanguageProvider>
      <SetPanel routine={routine} onUpdate={onUpdate} />
    </LanguageProvider>,
  );
}

describe("SetPanel 신기록(PR) 판정", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(getExerciseHistory).mockResolvedValue([
      { date: "2026-09-01", maxWeightKg: 60, totalVolumeKg: 600, totalSets: 3 },
    ]);
  });

  test("역대 최고 무게보다 무거운 무게를 기록하면 신기록 배지가 뜬다", async () => {
    const routine = baseRoutine();
    vi.mocked(addSet).mockResolvedValue({ ...routine, sets: [{ id: 1, setNumber: 1, weightKg: 65, reps: 8 }] });
    renderPanel(routine);

    // 지난 세션 최고 무게(60kg)를 히스토리에서 불러올 때까지 대기
    await screen.findByText("前回のベスト 60kg");

    fireEvent.change(screen.getByPlaceholderText("重量(kg)"), { target: { value: "65" } });
    fireEvent.change(screen.getByPlaceholderText("回数"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "セット追加" }));

    await waitFor(() => expect(screen.getByText("自己ベスト達成!")).toBeInTheDocument());
  });

  test("역대 최고 무게보다 가벼우면 신기록 배지가 안 뜬다", async () => {
    const routine = baseRoutine();
    vi.mocked(addSet).mockResolvedValue({ ...routine, sets: [{ id: 1, setNumber: 1, weightKg: 50, reps: 8 }] });
    renderPanel(routine);

    await screen.findByText("前回のベスト 60kg");

    fireEvent.change(screen.getByPlaceholderText("重量(kg)"), { target: { value: "50" } });
    fireEvent.change(screen.getByPlaceholderText("回数"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "セット追加" }));

    await waitFor(() => expect(addSet).toHaveBeenCalled());
    expect(screen.queryByText("自己ベスト達成!")).not.toBeInTheDocument();
  });
});
