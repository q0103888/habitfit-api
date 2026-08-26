package com.peakfit.backend.routine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;

// 반복 루틴 템플릿 생성 API로 들어오는 요청 body — 날짜가 아니라 요일(dayOfWeek)을 받음
public record RoutineTemplateRequest(
        @NotBlank String bodyPart, @NotBlank String exerciseName, @NotNull DayOfWeek dayOfWeek) {}
