package com.peakfit.backend.routine;

import java.time.DayOfWeek;

// 반복 루틴 템플릿 API 응답 — RoutineTemplate 엔티티에서 user는 빼고 노출
public record RoutineTemplateResponse(
        Long id, String bodyPart, String exerciseName, DayOfWeek dayOfWeek) {

    static RoutineTemplateResponse from(RoutineTemplate template) {
        return new RoutineTemplateResponse(
                template.getId(), template.getBodyPart(), template.getExerciseName(), template.getDayOfWeek());
    }
}
