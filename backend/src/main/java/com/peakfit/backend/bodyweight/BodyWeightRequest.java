package com.peakfit.backend.bodyweight;

import jakarta.validation.constraints.Positive;

// 오늘의 몸무게 기록 요청 body
public record BodyWeightRequest(@Positive double weightKg) {}
