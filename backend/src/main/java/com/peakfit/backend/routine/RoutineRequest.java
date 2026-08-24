package com.peakfit.backend.routine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

// 루틴 생성 API로 들어오는 요청 body
public record RoutineRequest(
        @NotBlank String bodyPart,
        @NotBlank String exerciseName,
        @NotNull LocalDate scheduledDate) {}
