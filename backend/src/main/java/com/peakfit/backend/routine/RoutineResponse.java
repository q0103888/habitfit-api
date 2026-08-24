package com.peakfit.backend.routine;

import java.time.LocalDate;

// 루틴 API 응답 — WorkoutRoutine 엔티티에서 user는 빼고 화면에 필요한 필드만 노출
public record RoutineResponse(
        Long id,
        String bodyPart,
        String exerciseName,
        LocalDate scheduledDate,
        boolean done,
        boolean fromTemplate) {

    static RoutineResponse from(WorkoutRoutine routine) {
        return new RoutineResponse(
                routine.getId(),
                routine.getBodyPart(),
                routine.getExerciseName(),
                routine.getScheduledDate(),
                routine.isDone(),
                routine.getTemplateId() != null);
    }
}
