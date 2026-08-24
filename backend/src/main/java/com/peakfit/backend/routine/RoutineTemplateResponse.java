package com.peakfit.backend.routine;

import java.time.DayOfWeek;

public record RoutineTemplateResponse(
        Long id, String bodyPart, String exerciseName, DayOfWeek dayOfWeek) {

    static RoutineTemplateResponse from(RoutineTemplate template) {
        return new RoutineTemplateResponse(
                template.getId(), template.getBodyPart(), template.getExerciseName(), template.getDayOfWeek());
    }
}
