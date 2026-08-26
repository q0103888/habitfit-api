package com.peakfit.backend.bodyweight;

import java.time.LocalDate;

public record BodyWeightResponse(Long id, LocalDate recordedDate, double weightKg) {

    static BodyWeightResponse from(BodyWeightLog log) {
        return new BodyWeightResponse(log.getId(), log.getRecordedDate(), log.getWeightKg());
    }
}
