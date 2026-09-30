package com.peakfit.backend.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record WeeklyGoalRequest(@Min(1) @Max(7) int weeklyGoalDays) {}
