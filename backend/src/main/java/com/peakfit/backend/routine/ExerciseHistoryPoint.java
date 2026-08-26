package com.peakfit.backend.routine;

import java.time.LocalDate;

// 통계 화면의 무게 추이 그래프용.
// maxWeightKg = 그날 가장 무겁게 든 무게, totalVolumeKg = 그날 모든 세트의 (무게 x 횟수) 합
// (예: 60kg x 10회 + 65kg x 8회 = 1120kg) — 무게만 볼 때보다 실제 훈련량 변화를 더 잘 보여줌
public record ExerciseHistoryPoint(LocalDate date, double maxWeightKg, double totalVolumeKg, int totalSets) {}
