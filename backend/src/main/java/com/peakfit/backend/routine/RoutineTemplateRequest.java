package com.peakfit.backend.routine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;

public record RoutineTemplateRequest(
        @NotBlank String bodyPart, @NotBlank String exerciseName, @NotNull DayOfWeek dayOfWeek) {}
