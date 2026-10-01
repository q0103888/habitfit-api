package com.peakfit.backend.assistant;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.time.DayOfWeek;
import java.util.List;

// AI가 짠 루틴 — Claude structured output이 이 모양 그대로 채워서 돌려줌(수동 파싱 없음).
// 프론트가 미리보기로 보여주고, "적용"을 누르면 이 목록을 그대로 기존 반복 템플릿 API로 하나씩 등록함
public record RoutinePlanResponse(List<PlannedExercise> plan) {

    public record PlannedExercise(
            DayOfWeek dayOfWeek,
            @JsonPropertyDescription("부위 코드. CHEST/BACK/SHOULDER/LEG/ARM_ABS/CARDIO 중 하나") String bodyPart,
            @JsonPropertyDescription("반드시 프롬프트에 제공된 '사용 가능한 종목' 목록에 있는 이름 그대로") String exerciseName) {}
}
