package com.peakfit.backend.routine;

import java.time.LocalDate;

// 통계 화면의 부위별 회복 상태용 — 그 부위를 마지막으로(완료 처리된 날 기준) 훈련한 날짜.
// 한 번도 훈련 기록이 없는 부위는 목록에 아예 안 나옴(프론트에서 "기록 없음"으로 처리)
public record BodyPartRecoveryPoint(String bodyPart, LocalDate lastTrainedDate) {}
