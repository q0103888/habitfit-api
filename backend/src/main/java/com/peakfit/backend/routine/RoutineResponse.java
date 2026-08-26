package com.peakfit.backend.routine;

import java.time.LocalDate;
import java.util.List;

// 루틴 API 응답 — WorkoutRoutine 엔티티에서 user는 빼고 화면에 필요한 필드만 노출.
// sets는 이 루틴에 기록된 세트 목록(몇 kg x 몇 회를 몇 세트 했는지)
public record RoutineResponse(
        Long id,
        String bodyPart,
        String exerciseName,
        LocalDate scheduledDate,
        boolean done,
        boolean fromTemplate,
        List<SetResponse> sets) {

    public record SetResponse(Long id, int setNumber, double weightKg, int reps) {

        static SetResponse from(WorkoutSet set) {
            return new SetResponse(set.getId(), set.getSetNumber(), set.getWeightKg(), set.getReps());
        }
    }

    static RoutineResponse from(WorkoutRoutine routine, List<WorkoutSet> sets) {
        return new RoutineResponse(
                routine.getId(),
                routine.getBodyPart(),
                routine.getExerciseName(),
                routine.getScheduledDate(),
                routine.isDone(),
                routine.getTemplateId() != null,
                sets.stream().map(SetResponse::from).toList());
    }
}
