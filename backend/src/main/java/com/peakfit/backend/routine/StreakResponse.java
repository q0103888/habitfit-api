package com.peakfit.backend.routine;

// GET /api/routines/streak 응답 — RoutineService.calculateStreak()가 계산한 연속 달성일 수
public record StreakResponse(int days) {}
