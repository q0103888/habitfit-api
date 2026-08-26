package com.peakfit.backend.routine;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

// 세트 기록 추가 API로 들어오는 요청 body — 맨몸운동 등을 고려해 무게는 0도 허용
public record WorkoutSetRequest(@PositiveOrZero double weightKg, @Positive int reps) {}
