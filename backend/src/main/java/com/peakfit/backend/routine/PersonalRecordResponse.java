package com.peakfit.backend.routine;

import java.time.LocalDate;

// 특정 운동의 역대 개인 최고 기록.
// 일반 운동: maxWeightKg에 역대 최고 무게가 들어가고 totalDurationMin은 null
// 유산소 운동: totalDurationMin에 하루 최장 운동 시간(분)이 들어가고 maxWeightKg는 null
// 기록이 아예 없으면 hasRecord=false, 나머지 필드는 전부 null
public record PersonalRecordResponse(
        boolean hasRecord, LocalDate date, Double maxWeightKg, Integer totalDurationMin) {}
