package com.peakfit.backend.exercise;

// GET /api/exercises 응답 — Exercise 엔티티를 그대로 노출 (민감정보 없는 공유 카탈로그라 감출 필드 없음)
public record ExerciseResponse(Long id, String bodyPart, String name) {

    static ExerciseResponse from(Exercise exercise) {
        return new ExerciseResponse(exercise.getId(), exercise.getBodyPart(), exercise.getName());
    }
}
