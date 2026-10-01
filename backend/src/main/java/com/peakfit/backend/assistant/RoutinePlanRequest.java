package com.peakfit.backend.assistant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.DayOfWeek;
import java.util.List;

// AI 루틴 자동 생성 요청 — "몇 분할, 분할마다 어떤 부위, 세션 길이, 숙련도"를 사용자가 정함
public record RoutinePlanRequest(
        @NotEmpty @Valid List<DaySplit> days,
        @Min(15) @Max(180) int sessionDurationMin,
        @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED") String level) {

    // 분할 하루치 — 그 요일에 어떤 부위(들)를 할지
    public record DaySplit(@NotNull DayOfWeek dayOfWeek, @NotEmpty List<String> bodyParts) {}
}
