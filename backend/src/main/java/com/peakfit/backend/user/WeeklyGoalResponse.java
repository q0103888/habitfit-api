package com.peakfit.backend.user;

// 대시보드 "이번 주 목표" 카드용 — 목표 일수만 내려주면 진행률(실제 몇 일 했는지)은
// 프론트가 이미 들고 있는 이번 주 루틴 데이터에서 계산함(RoutineController의 /week API 재사용)
public record WeeklyGoalResponse(int weeklyGoalDays) {}
