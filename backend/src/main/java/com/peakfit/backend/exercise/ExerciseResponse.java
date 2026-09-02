package com.peakfit.backend.exercise;

// GET /api/exercises 응답. name은 내부 식별 키(한글, 루틴 생성 시 그대로 전송해야 함)이고
// displayName은 요청 locale에 맞춰 화면에 보여줄 이름(일본어 번역 없으면 name으로 폴백)
public record ExerciseResponse(Long id, String bodyPart, String name, String displayName) {

    static ExerciseResponse from(Exercise exercise, String locale) {
        String displayName =
                "ja".equals(locale) && exercise.getNameJa() != null ? exercise.getNameJa() : exercise.getName();
        return new ExerciseResponse(exercise.getId(), exercise.getBodyPart(), exercise.getName(), displayName);
    }
}
