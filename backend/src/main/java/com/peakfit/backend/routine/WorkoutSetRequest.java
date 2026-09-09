package com.peakfit.backend.routine;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

// 세트 기록 추가 API로 들어오는 요청 body.
// 일반 운동은 weightKg/reps만(맨몸운동 등을 고려해 무게는 0도 허용), 유산소 운동은 durationMin만 채워서 보냄.
// 어느 쪽인지는 RoutineService.addSet()에서 durationMin 존재 여부로 판단
public record WorkoutSetRequest(
        @PositiveOrZero Double weightKg, @Positive Integer reps, @Positive Integer durationMin) {}
