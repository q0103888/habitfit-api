package com.peakfit.backend.user;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 대시보드 로드 시 현재 주간 목표(일수) 조회
    @GetMapping("/weekly-goal")
    public ResponseEntity<WeeklyGoalResponse> getWeeklyGoal(Principal principal) {
        return ResponseEntity.ok(userService.getWeeklyGoal(principal.getName()));
    }

    // 목표 일수 변경(1~7)
    @PatchMapping("/weekly-goal")
    public ResponseEntity<WeeklyGoalResponse> updateWeeklyGoal(
            Principal principal, @Valid @RequestBody WeeklyGoalRequest request) {
        return ResponseEntity.ok(userService.updateWeeklyGoal(principal.getName(), request.weeklyGoalDays()));
    }
}
