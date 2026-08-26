package com.peakfit.backend.routine;

// 통계 화면의 부위별 비중 도넛차트용 — 최근 30일간 그 부위 루틴을 몇 번 했는지
public record BodyPartSummaryPoint(String bodyPart, long count) {}
