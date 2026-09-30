package com.peakfit.backend.user;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public WeeklyGoalResponse getWeeklyGoal(String email) {
        return new WeeklyGoalResponse(findUser(email).getWeeklyGoalDays());
    }

    @Transactional
    public WeeklyGoalResponse updateWeeklyGoal(String email, int weeklyGoalDays) {
        User user = findUser(email);
        user.setWeeklyGoalDays(weeklyGoalDays);
        return new WeeklyGoalResponse(user.getWeeklyGoalDays());
    }

    private User findUser(String email) {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
    }
}
